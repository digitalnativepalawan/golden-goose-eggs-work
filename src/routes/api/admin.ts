// SANVIC Admin API — server-only.
//
// Every action here runs with the service-role key, which bypasses Row Level
// Security. That key never leaves the server. The passcode is therefore only a
// convenience lock for the UI: even if it leaks, a caller still cannot reach
// the database without a valid signed session token.
//
// Auth model:
//   POST { action: "login", pin }        -> { token, expiresAt }
//   POST { action: <anything>, ... }     -> requires Authorization: Bearer <token>
//
// Replace the passcode with real user accounts before public launch.

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * The dev server and Node deploys do not automatically populate process.env
 * from .env, so read it here as a fallback. On platforms without a filesystem
 * (Workers) this is a no-op and the platform env vars are used instead.
 */
function ensureEnvLoaded() {
  if (process.env.ADMIN_PIN) return;
  try {
    for (const dir of [process.cwd(), join(process.cwd(), "..")]) {
      const file = join(dir, ".env");
      if (!existsSync(file)) continue;
      for (const raw of readFileSync(file, "utf8").split("\n")) {
        const line = raw.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq < 1) continue;
        const key = line.slice(0, eq).trim();
        if (process.env[key]) continue;
        process.env[key] = line
          .slice(eq + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
      }
      break;
    }
  } catch {
    /* no filesystem — rely on platform env vars */
  }
}

const SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "Cache-Control": "no-store" },
  });
}

/** Read a JSON body robustly: some runtimes consume the stream before .json(). */
async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function b64url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(payload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function issueToken() {
  const payload = b64url(JSON.stringify({ exp: Date.now() + SESSION_MS }));
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | null) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, mac] = parts;
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

function bearer(request: Request) {
  const h = request.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic table browser */
function admin() {
  return supabaseAdmin as unknown as {
    from(t: string): any;
    storage: any;
    rpc(n: string, p?: unknown): Promise<any>;
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const BLOCKED = new Set(["schema_migrations", "supabase_migrations"]);

async function handle(request: Request): Promise<Response> {
  ensureEnvLoaded();
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "";

  // ---- login -------------------------------------------------------------
  if (action === "login") {
    const body = (await readJson(request)) as { pin?: string };
    const expected = process.env.ADMIN_PIN || "";
    const given = String(body.pin ?? "");
    if (!expected) return json({ error: "ADMIN_PIN is not configured on the server." }, 500);
    const ok =
      given.length === expected.length &&
      timingSafeEqual(Buffer.from(given), Buffer.from(expected));
    if (!ok) return json({ error: "Incorrect passcode." }, 401);
    return json({ token: issueToken() });
  }

  // ---- everything below requires a session -------------------------------
  if (!verifyToken(bearer(request))) {
    return json({ error: "Not authorised." }, 401);
  }

  const db = admin();

  try {
    switch (action) {
      // ---- schema ------------------------------------------------------
      case "tables": {
        const { data: rows, error: metaErr } = await db.rpc("admin_list_tables");
        if (metaErr) {
          return json({
            tables: FALLBACK_TABLES,
            note: "Using the built-in table list; the admin_list_tables() helper is not installed.",
          });
        }
        return json({ tables: rows });
      }

      case "schema": {
        const table = url.searchParams.get("table") || "";
        const { data, error } = await db.rpc("admin_table_schema", { t: table });
        if (error) return json({ error: error.message }, 400);
        return json({ columns: data });
      }

      // ---- rows --------------------------------------------------------
      case "rows": {
        const table = url.searchParams.get("table") || "";
        if (BLOCKED.has(table)) return json({ error: "Table not permitted." }, 403);
        const limit = Math.min(Number(url.searchParams.get("limit") || 100), 1000);
        const offset = Number(url.searchParams.get("offset") || 0);
        const { data, error, count } = await db
          .from(table)
          .select("*", { count: "exact" })
          .range(offset, offset + limit - 1);
        if (error) return json({ error: error.message }, 400);
        return json({ rows: data ?? [], total: count ?? 0 });
      }

      case "insert": {
        const table = url.searchParams.get("table") || "";
        if (BLOCKED.has(table)) return json({ error: "Table not permitted." }, 403);
        const values = (await readJson(request));
        const { data, error } = await db.from(table).insert(values).select();
        if (error) return json({ error: error.message }, 400);
        return json({ row: data?.[0] ?? null });
      }

      case "update": {
        const table = url.searchParams.get("table") || "";
        if (BLOCKED.has(table)) return json({ error: "Table not permitted." }, 403);
        const payload = (await readJson(request));
        let q = db.from(table);
        for (const [k, v] of Object.entries(payload.match ?? {})) q = q.eq(k, v as never);
        const { data, error } = await q.update(payload.values ?? {}).select();
        if (error) return json({ error: error.message }, 400);
        return json({ rows: data ?? [] });
      }

      case "delete": {
        const table = url.searchParams.get("table") || "";
        if (BLOCKED.has(table)) return json({ error: "Table not permitted." }, 403);
        const payload = (await readJson(request));
        let q = db.from(table);
        for (const [k, v] of Object.entries(payload.match ?? {})) q = q.eq(k, v as never);
        const { error } = await q.delete();
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      // ---- storage -----------------------------------------------------
      case "media.list": {
        const bucket = url.searchParams.get("bucket") || "destination-images";
        const prefix = url.searchParams.get("prefix") || "";
        const { data, error } = await db.storage
          .from(bucket)
          .list(prefix, { limit: 1000 });
        if (error) return json({ error: error.message }, 400);
        const files = (data ?? [])
          .filter((f: { name?: string }) => !!f.name && f.name.indexOf(".co") !== 0)
          .map((f: { name: string; id?: string }) => ({
            name: f.name,
            size: f.id ?? null,
            url: `${process.env.SUPABASE_URL ?? ""}/storage/v1/object/public/${bucket}/${prefix}${f.name}`,
          }));
        return json({ bucket, files });
      }

      case "media.upload": {
        const bucket = url.searchParams.get("bucket") || "destination-images";
        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        if (!form || !(file instanceof File)) {
          return json({ error: "No file supplied." }, 400);
        }
        const path = url.searchParams.get("path") || file.name;
        const { error } = await db.storage.from(bucket).upload(path, file, {
          upsert: true,
          contentType: file.type || undefined,
        });
        if (error) return json({ error: error.message }, 400);
        return json({
          ok: true,
          path,
          url: `${process.env.SUPABASE_URL ?? ""}/storage/v1/object/public/${bucket}/${path}`,
        });
      }

      case "media.delete": {
        const bucket = url.searchParams.get("bucket") || "destination-images";
        const body = (await readJson(request));
        const paths = Array.isArray(body.paths) ? body.paths.filter(Boolean) : [];
        if (!paths.length) return json({ error: "No paths supplied." }, 400);
        const { error } = await db.storage.from(bucket).remove(paths);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, removed: paths.length });
      }

      default:
        return json({ error: `Unknown action: ${action || "(none)"}` }, 400);
    }
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
}

// Used when the admin_list_tables() SQL helper is not installed.
const FALLBACK_TABLES = [
  "destinations",
  "place_details",
  "place_contacts",
  "place_links",
  "amenities",
  "place_amenities",
  "nearby_places",
  "destination_categories",
  "pulse_posts",
  "pulse_comments",
  "pulse_likes",
  "pulse_categories",
  "tribes",
  "events",
  "notifications",
  "saved_places",
  "today_content",
  "my_sanvic_upcoming",
  "tala_responses",
  "tala_settings",
  "tala_suggestions",
  "hunt_settings",
  "hunt_rewards",
  "site_settings",
  "user_settings",
  "user_roles",
  "traveler_profiles",
];

export const Route = createFileRoute("/api/admin")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});