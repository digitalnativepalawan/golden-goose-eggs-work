// TALA live-AI endpoint — proxies chat to OpenRouter with the server-side key.
// Answers are grounded with SANVIC's curated knowledge (destinations + Tala
// answers) fetched from Supabase via the service role. If the key is missing
// the route reports configured:false and the client falls back to keywords.
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const TALA_BASE_PROMPT = `You are TALA, the warm, friendly AI concierge for San Vicente, Palawan, Philippines. You help travelers discover food, tours, accommodations, beaches, sunsets, transport, waterfalls, and local events. Speak like a local guide — concise, helpful, conversational, and never robotic. Prefer the curated knowledge provided; if a question is outside your knowledge, say so honestly and suggest nearby alternatives. Keep replies friendly and under ~120 words unless the user asks for detail.`;

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const CACHE_TTL_MS = 60_000;
let knowledgeCache: { block: string; expiresAt: number } | null = null;

async function supabaseGet(path: string, serviceKey: string, baseUrl: string) {
  const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
  return res.json();
}

async function getKnowledgeBlock(serviceKey: string, baseUrl: string) {
  const now = Date.now();
  if (knowledgeCache && knowledgeCache.expiresAt > now) return knowledgeCache.block;
  let block = "";
  try {
    const talaRows = await supabaseGet(
      "tala_responses?select=keywords,response,category&order=sort_order.asc&limit=300",
      serviceKey,
      baseUrl,
    );
    const destRows = await supabaseGet(
      "destinations?select=name,category,description&order=sort_order.asc&limit=500",
      serviceKey,
      baseUrl,
    );
    const lines: string[] = [];
    if (Array.isArray(talaRows)) {
      for (const r of talaRows) {
        const kw = Array.isArray(r.keywords) ? r.keywords.join(", ") : r.keywords || "general";
        if (r.response && String(r.response).trim()) lines.push(`[${r.category || "general"}] ${kw} → ${r.response}`);
      }
    }
    if (Array.isArray(destRows)) {
      for (const d of destRows) {
        if (d.name) lines.push(`[destination ${d.category || ""}] ${d.name} — ${d.description || ""}`);
      }
    }
    block = lines.length ? `KNOWLEDGE BASE (authoritative SANVIC content — prefer this when relevant):\n${lines.join("\n")}` : "";
  } catch {
    return block;
  }
  knowledgeCache = { block, expiresAt: now + CACHE_TTL_MS };
  return block;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (part && typeof part === "object" && "text" in part ? String((part as { text: unknown }).text) : ""))
      .join("")
      .trim();
  }
  return "";
}

const chatWithOpenRouter = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as { messages: ChatMessage[]; model?: string })
  .handler(async ({ data }): Promise<Response> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return json({ ok: false, configured: false, error: "OpenRouter key not configured on the server." });
    }

    const baseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const knowledge = baseUrl && serviceKey ? await getKnowledgeBlock(serviceKey, baseUrl) : "";

    const lastUser = [...data.messages].reverse().find((m) => m.role === "user");
    if (!lastUser || !lastUser.content.trim()) {
      return json({ ok: false, error: "No user message provided." });
    }

    const systemPrompt = knowledge ? `${TALA_BASE_PROMPT}\n\n${knowledge}` : `${TALA_BASE_PROMPT}\n\n(No knowledge base loaded — answer generally but stay on-topic for a traveler.)`;

    const model = (data.model && String(data.model).trim()) || process.env.OPENROUTER_DEFAULT_MODEL || "google/gemini-2.5-flash";

    let orRes: globalThis.Response;
    try {
      orRes = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "SANVIC PH",
          "HTTP-Referer": "https://sanvic.ph",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, ...data.messages.slice(-20)],
          temperature: 0.6,
          max_tokens: 600,
        }),
      });
    } catch (err) {
      return json({ ok: false, configured: true, error: "OpenRouter unreachable: " + (err instanceof Error ? err.message : String(err)) });
    }

    if (!orRes.ok) {
      const text = await orRes.text().catch(() => "");
      return json({ ok: false, configured: true, error: `OpenRouter ${orRes.status}: ${text.slice(0, 300)}` });
    }

    const result = await orRes.json().catch(() => null);
    const reply = extractText(result && result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content);
    if (!reply) {
      return json({ ok: false, configured: true, error: "OpenRouter returned an empty reply." });
    }
    return json({ ok: true, configured: true, reply });
  });

export const Route = createFileRoute("/api/tala-chat")({
  server: {
    handlers: {
      GET: async () => {
        return json({
          ok: true,
          configured: !!process.env.OPENROUTER_API_KEY,
          model: process.env.OPENROUTER_DEFAULT_MODEL || "google/gemini-2.5-flash",
        });
      },
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { messages?: ChatMessage[]; model?: string };
        return chatWithOpenRouter({ data: { messages: body.messages ?? [], model: body.model } });
      },
    },
  },
});