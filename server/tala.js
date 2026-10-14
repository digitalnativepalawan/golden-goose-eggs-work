// ═══════════════════════════════════════════════════════════════════════
// TALA live-AI: server-side OpenRouter proxy (shared implementation)
// ═══════════════════════════════════════════════════════════════════════
// Used by:
//   • api/tala-chat.js                  (Vercel Function, production)
//   • src/routes/api/tala-chat.ts       (TanStack Start route, `npm run dev`)
//
// Security model
//   • The OpenRouter key lives ONLY in the server env var OPENROUTER_API_KEY.
//     It is never stored in the database and never sent to the browser.
//   • The system prompt and knowledge base are built here, so the endpoint
//     cannot be used as a free general-purpose LLM proxy.
//   • The model is the one an admin saved in tala_settings.ai_model. A caller
//     can only pick a different model (the Backoffice "Test" button) if they
//     send a valid Supabase session for a user with the admin role.
//   • Live AI only answers when tala_settings.ai_enabled = 'true'.
//   • Input is size-capped, cross-site browser calls are refused, and each
//     server instance rate-limits per IP. ALSO set a monthly credit limit on
//     the key at openrouter.ai/settings/keys, the only hard spend cap.
//
// Env vars
//   OPENROUTER_API_KEY        required for live AI
//   OPENROUTER_DEFAULT_MODEL  optional, used when no model is saved
//   SUPABASE_URL              optional, defaults to the SANVIC project
//   SUPABASE_PUBLISHABLE_KEY  optional, defaults to the public SANVIC key
//   TALA_ALLOWED_ORIGINS      optional, comma list of extra allowed origins
//   TALA_RATE_LIMIT           optional, requests per IP per 10 min (default 30)
// ═══════════════════════════════════════════════════════════════════════

// Public values (already shipped in public/site/supabase-config.js).
const DEFAULT_SUPABASE_URL = "https://khbtdhvoghdlicgicidgkc.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jpdZ1_YxYDRsaGpvlcSbrg_tcJ8tAVX";
const FALLBACK_MODEL = "google/gemini-2.5-flash";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 1500;
const MAX_BODY_BYTES = 32_000;
const KNOWLEDGE_TTL_MS = 60_000;
const SETTINGS_TTL_MS = 15_000;
const RATE_WINDOW_MS = 10 * 60_000;

const TALA_BASE_PROMPT = `You are TALA, the warm, friendly local concierge for San Vicente, Palawan, Philippines. You help travelers with beaches, islands, waterfalls, food, stays, transport, sunsets, events and hidden gems. Speak like a local guide: concise, helpful, conversational, never robotic. Use the knowledge base below first; it is vetted by the tourism office. If you don't know something, say so kindly and suggest asking at the San Vicente tourism office. Only help with travel in and around San Vicente / Palawan; politely decline unrelated tasks. Keep replies under about 120 words unless the traveler asks for detail.`;

let knowledgeCache = null; // { block, expiresAt }
let settingsCache = null; // { enabled, model, expiresAt }
const rateBuckets = new Map(); // ip -> number[] (timestamps)

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function supabaseConfig(env) {
  return {
    url: (env.SUPABASE_URL || env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/+$/, ""),
    key:
      env.SUPABASE_PUBLISHABLE_KEY ||
      env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  };
}

async function supabaseGet(env, path, userToken) {
  const { url, key } = supabaseConfig(env);
  const headers = { apikey: key, Accept: "application/json" };
  // Publishable keys (sb_publishable_…) are not JWTs; only send a bearer for a real user session.
  if (userToken) headers.Authorization = `Bearer ${userToken}`;
  const res = await fetch(`${url}/rest/v1/${path}`, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
  return res.json();
}

async function getSettings(env) {
  const now = Date.now();
  if (settingsCache && settingsCache.expiresAt > now) return settingsCache;
  let enabled = false;
  let model = "";
  try {
    const rows = await supabaseGet(
      env,
      "tala_settings?select=key,value&key=in.(ai_enabled,ai_model)",
    );
    for (const r of Array.isArray(rows) ? rows : []) {
      if (r.key === "ai_enabled") enabled = r.value === "true";
      if (r.key === "ai_model" && r.value) model = String(r.value).trim();
    }
  } catch {
    // Treat unreadable settings as "off" rather than guessing.
  }
  settingsCache = { enabled, model, expiresAt: now + SETTINGS_TTL_MS };
  return settingsCache;
}

async function getKnowledgeBlock(env) {
  const now = Date.now();
  if (knowledgeCache && knowledgeCache.expiresAt > now) return knowledgeCache.block;
  const lines = [];
  try {
    const [dests, answers] = await Promise.all([
      supabaseGet(
        env,
        "destinations?select=name,category,barangay,description,tip&order=sort_order.asc&limit=400",
      ),
      supabaseGet(
        env,
        "tala_responses?select=keywords,response,category&order=sort_order.asc&limit=300",
      ),
    ]);
    for (const d of Array.isArray(dests) ? dests : []) {
      if (!d.name) continue;
      const where = d.barangay ? ` (${d.barangay})` : "";
      const tip = d.tip ? ` Tip: ${d.tip}` : "";
      lines.push(`[${d.category || "place"}] ${d.name}${where}: ${d.description || ""}${tip}`);
    }
    for (const r of Array.isArray(answers) ? answers : []) {
      if (!r.response || !String(r.response).trim()) continue;
      const kw = Array.isArray(r.keywords) ? r.keywords.join(", ") : r.keywords || "general";
      lines.push(`Q about ${kw} → ${r.response}`);
    }
  } catch {
    // Knowledge is best-effort; Tala still answers generally without it.
  }
  // Cap the prompt size so a huge table can't blow up token spend.
  const block = lines.join("\n").slice(0, 24_000);
  knowledgeCache = { block, expiresAt: now + KNOWLEDGE_TTL_MS };
  return block;
}

async function isAdmin(env, request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  // Supabase session tokens are JWTs; ignore anything else (e.g. the publishable key).
  if (!token || token.split(".").length !== 3) return false;
  try {
    // RLS on user_roles only returns the caller's own rows, so a non-empty
    // result proves this session belongs to an admin.
    const rows = await supabaseGet(env, "user_roles?select=role&role=eq.admin&limit=1", token);
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function rateLimited(env, ip) {
  const limit = Math.max(1, parseInt(env.TALA_RATE_LIMIT || "30", 10) || 30);
  const now = Date.now();
  const hits = (rateBuckets.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= limit) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  if (rateBuckets.size > 5000) {
    // Keep memory bounded on long-lived instances.
    for (const [k, v] of rateBuckets)
      if (!v.length || now - v[v.length - 1] > RATE_WINDOW_MS) rateBuckets.delete(k);
  }
  return false;
}

function originAllowed(env, request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin GETs and server-to-server calls
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  if (originHost === host) return true;
  const extra = (env.TALA_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return extra.includes(origin.replace(/\/+$/, ""));
}

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    )
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_CHARS) }))
    .filter((m) => m.content)
    .slice(-MAX_MESSAGES);
}

function extractText(content) {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (part && typeof part === "object" && "text" in part ? String(part.text) : ""))
      .join("")
      .trim();
  }
  return "";
}

async function handleStatus(env) {
  const settings = await getSettings(env);
  return json({
    ok: true,
    configured: !!env.OPENROUTER_API_KEY,
    enabled: settings.enabled,
    model: settings.model || env.OPENROUTER_DEFAULT_MODEL || FALLBACK_MODEL,
  });
}

async function handleChat(request, env) {
  if (!originAllowed(env, request)) return json({ ok: false, error: "Origin not allowed." }, 403);

  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return json(
      { ok: false, configured: false, error: "OPENROUTER_API_KEY is not set on the server." },
      503,
    );
  }

  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) return json({ ok: false, error: "Request too large." }, 413);
  const text = await request.text().catch(() => "");
  if (text.length > MAX_BODY_BYTES) return json({ ok: false, error: "Request too large." }, 413);
  let body;
  try {
    body = JSON.parse(text || "{}");
  } catch {
    return json({ ok: false, error: "Invalid JSON." }, 400);
  }

  const messages = cleanMessages(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ ok: false, error: "No user message provided." }, 400);
  }

  const settings = await getSettings(env);
  const requestedModel = typeof body.model === "string" ? body.model.trim().slice(0, 120) : "";
  const savedModel = settings.model || env.OPENROUTER_DEFAULT_MODEL || FALLBACK_MODEL;
  const wantsOverride = !!requestedModel && requestedModel !== savedModel;
  const admin = wantsOverride || !settings.enabled ? await isAdmin(env, request) : false;

  if (!settings.enabled && !admin) {
    return json(
      { ok: false, configured: true, enabled: false, error: "Live AI is turned off." },
      409,
    );
  }
  if (!admin && rateLimited(env, clientIp(request))) {
    return json(
      { ok: false, configured: true, error: "Too many questions; please wait a few minutes." },
      429,
      {
        "retry-after": "120",
      },
    );
  }

  const model = wantsOverride && admin ? requestedModel : savedModel;
  const knowledge = await getKnowledgeBlock(env);
  const systemPrompt = knowledge
    ? `${TALA_BASE_PROMPT}\n\nKNOWLEDGE BASE:\n${knowledge}`
    : `${TALA_BASE_PROMPT}\n\n(No knowledge base loaded; answer generally but stay on-topic for a traveler.)`;

  let orRes;
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
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.6,
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    return json(
      {
        ok: false,
        configured: true,
        model,
        error: "OpenRouter unreachable: " + (err?.message || String(err)),
      },
      502,
    );
  }

  const result = await orRes.json().catch(() => null);
  if (!orRes.ok) {
    const msg = result?.error?.message || `HTTP ${orRes.status}`;
    return json(
      { ok: false, configured: true, model, error: `OpenRouter: ${String(msg).slice(0, 300)}` },
      502,
    );
  }
  const reply = extractText(result?.choices?.[0]?.message?.content);
  if (!reply)
    return json(
      { ok: false, configured: true, model, error: "OpenRouter returned an empty reply." },
      502,
    );
  return json({ ok: true, configured: true, model, reply });
}

/**
 * Handle GET (status) and POST (chat) for /api/tala-chat.
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 * @returns {Promise<Response>}
 */
export async function handleTalaRequest(request, env) {
  try {
    if (request.method === "GET") return await handleStatus(env);
    if (request.method === "POST") return await handleChat(request, env);
    return json({ ok: false, error: "Method not allowed." }, 405, { allow: "GET, POST" });
  } catch (err) {
    return json({ ok: false, error: "Tala server error: " + (err?.message || String(err)) }, 500);
  }
}

// Exposed for unit tests only.
export const __test = {
  cleanMessages,
  originAllowed,
  resetCaches() {
    knowledgeCache = null;
    settingsCache = null;
    rateBuckets.clear();
  },
};
