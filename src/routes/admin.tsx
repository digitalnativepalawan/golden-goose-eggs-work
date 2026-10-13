import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KmzPanel } from "@/components/admin/kmz-panel";
import { call, type Token } from "@/lib/admin-helpers";

/**
 * SANVIC admin.
 *
 * The passcode only unlocks this screen. All reads and writes go to /api/admin,
 * which holds the service-role key server-side, so nothing privileged is ever
 * shipped to the browser.
 */

const BUCKETS = ["destination-images", "destination-videos", "media", "traveler-experiences"] as const;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "SANVIC Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: Admin,
});

function Admin() {
  const [token, setToken] = useState<Token>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"data" | "media" | "kmz">("data");
  const [refreshKey, setRefreshKey] = useState(0);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const { token } = await call(null, "login", {}, {
        method: "POST",
        body: JSON.stringify({ pin }),
      });
      setToken(token);
      sessionStorage.setItem("sanvic_admin_token", token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("sanvic_admin_token");
    if (saved) setToken(saved);
  }, []);

  function signOut() {
    sessionStorage.removeItem("sanvic_admin_token");
    setToken(null);
    setPin("");
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060a10] px-4">
        <form onSubmit={unlock} className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-lg font-semibold text-white">SANVIC Admin</h1>
          <p className="mt-1 text-xs text-white/50">Authorised staff only.</p>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Passcode"
            className="mt-5 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/40"
          />
          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-emerald-400 px-3 py-2 text-sm font-medium text-[#06281f] hover:bg-emerald-300"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a10] text-slate-200">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-white">SANVIC Admin</span>
          <nav className="flex gap-1 text-xs">
            {([
              ["data", "Data"],
              ["media", "Media"],
              ["kmz", "KMZ Import"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`rounded px-3 py-1.5 ${tab === id ? "bg-white/15 text-white" : "text-white/60 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs text-white/50 hover:text-white">View site</a>
          <button onClick={signOut} className="rounded border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5">
            Lock
          </button>
        </div>
      </header>

      {tab === "data" && <DataPanel key={`data-${refreshKey}`} token={token} />}
      {tab === "media" && <MediaPanel token={token} />}
      {tab === "kmz" && (
        <KmzPanel token={token} onDone={() => setRefreshKey((k) => k + 1)} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- data --- */

function DataPanel({ token }: { token: string }) {
  const [tables, setTables] = useState<string[]>([]);
  const [table, setTable] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const loadTables = useCallback(async () => {
    try {
      const res = await call(token, "tables");
      const list = (res.tables ?? []).map((t: { name?: string; tablename?: string }) => t.name ?? t.tablename).filter(Boolean);
      setTables(list);
      if (list.length && !table) setTable(list[0]);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to list tables");
    }
  }, [token, table]);

  const loadRows = useCallback(async () => {
    if (!table) return;
    setBusy(true);
    try {
      const res = await call(token, "rows", { table, limit: "200" });
      setRows(res.rows ?? []);
      setTotal(res.total ?? 0);
      setMsg("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load rows");
    } finally {
      setBusy(false);
    }
  }, [token, table]);

  useEffect(() => { void loadTables(); }, [loadTables]);
  useEffect(() => { void loadRows(); }, [loadRows]);

  async function save(pk: Record<string, unknown>, values: Record<string, unknown>) {
    try {
      await call(token, "update", { table }, { method: "POST", body: JSON.stringify({ match: pk, values }) });
      setMsg("Saved.");
      void loadRows();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function remove(pk: Record<string, unknown>) {
    if (!window.confirm(`Delete this row from ${table}? This cannot be undone.`)) return;
    try {
      await call(token, "delete", { table }, { method: "POST", body: JSON.stringify({ match: pk }) });
      setMsg("Deleted.");
      void loadRows();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const cols = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [rows]);

  return (
    <div className="p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        <select
          value={table}
          onChange={(e) => setTable(e.target.value)}
          className="rounded border border-white/15 bg-black/40 px-3 py-2 text-white"
        >
          {tables.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => void loadRows()} className="rounded border border-white/15 px-3 py-2 hover:bg-white/5">
          {busy ? "Loading…" : "Refresh"}
        </button>
        <span className="text-white/50">{total} rows</span>
        {msg && <span className="text-emerald-300">{msg}</span>}
      </div>

      <div className="overflow-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-white/5 text-left text-white/70">
            <tr>
              {cols.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">{c}</th>)}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <RowEditor
                key={i}
                row={r}
                cols={cols}
                onSave={save}
                onDelete={remove}
              />
            ))}
            {!rows.length && (
              <tr><td colSpan={cols.length + 1} className="px-3 py-6 text-center text-white/40">No rows.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length >= 200 && <p className="mt-2 text-xs text-white/40">Showing the first 200 rows.</p>}
    </div>
  );
}

function RowEditor({
  row, cols, onSave, onDelete,
}: {
  row: Record<string, unknown>;
  cols: string[];
  onSave: (pk: Record<string, unknown>, values: Record<string, unknown>) => void;
  onDelete: (pk: Record<string, unknown>) => void;
}) {
  const [draft, setDraft] = useState<Record<string, unknown>>(row);
  const [editing, setEditing] = useState(false);

  const pkKey = cols.find((c) => c === "id") ?? cols[0];
  const pk = { [pkKey]: row[pkKey] };

  return (
    <tr className="border-t border-white/5 align-top hover:bg-white/[0.02]">
      {cols.map((c) => {
        const v = draft[c];
        const display = v === null || v === undefined ? ""
          : typeof v === "object" ? JSON.stringify(v)
          : String(v);
        return (
          <td key={c} className="max-w-[280px] px-3 py-1.5 align-top">
            {editing ? (
              <input
                value={display}
                onChange={(e) => {
                  let next: unknown = e.target.value;
                  const original = row[c];
                  if (typeof original === "number") next = Number(e.target.value);
                  else if (typeof original === "boolean") next = e.target.value === "true";
                  setDraft((d) => ({ ...d, [c]: next }));
                }}
                className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-white/40"
              />
            ) : (
              <span className="line-clamp-2 break-words text-white/75">{display || <em className="text-white/25">null</em>}</span>
            )}
          </td>
        );
      })}
      <td className="whitespace-nowrap px-3 py-1.5">
        {editing ? (
          <span className="flex gap-1">
            <button onClick={() => { onSave(pk, draft); setEditing(false); }} className="rounded bg-emerald-400/90 px-2 py-1 text-[11px] text-[#06281f]">Save</button>
            <button onClick={() => { setDraft(row); setEditing(false); }} className="rounded border border-white/15 px-2 py-1 text-[11px]">Cancel</button>
          </span>
        ) : (
          <span className="flex gap-1">
            <button onClick={() => setEditing(true)} className="rounded border border-white/15 px-2 py-1 text-[11px] hover:bg-white/5">Edit</button>
            <button onClick={() => onDelete(pk)} className="rounded border border-red-400/30 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/10">Del</button>
          </span>
        )}
      </td>
    </tr>
  );
}

/* --------------------------------------------------------------- media --- */

function MediaPanel({ token }: { token: string }) {
  const [bucket, setBucket] = useState<string>(BUCKETS[0]);
  const [files, setFiles] = useState<{ name: string; size: number | null; url: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await call(token, "media.list", { bucket });
      setFiles(res.files ?? []);
      setMsg("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to list files");
    } finally {
      setBusy(false);
    }
  }, [token, bucket]);

  useEffect(() => { void load(); }, [load]);

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    setMsg(`Uploading ${list.length} file(s)…`);
    for (const file of Array.from(list)) {
      try {
        const form = new FormData();
        form.append("file", file);
        const qs = new URLSearchParams({ action: "media.upload", bucket }).toString();
        const res = await fetch(`/api/admin?${qs}`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          body: form,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Upload failed (${res.status})`);
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Upload failed");
        return;
      }
    }
    setMsg("Upload complete.");
    void load();
  }

  async function remove(name: string) {
    if (!window.confirm(`Delete ${name}? Files in use on the site will break.`)) return;
    try {
      await call(token, "media.delete", { bucket }, { method: "POST", body: JSON.stringify({ paths: [name] }) });
      setMsg("Deleted.");
      void load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const kb = (n: number | null) => (n == null ? "—" : n > 1_000_000 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

  return (
    <div className="p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        <select value={bucket} onChange={(e) => setBucket(e.target.value)} className="rounded border border-white/15 bg-black/40 px-3 py-2 text-white">
          {BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <label className="cursor-pointer rounded border border-white/15 px-3 py-2 hover:bg-white/5">
          Upload files
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => void upload(e.target.files)} />
        </label>
        <button onClick={() => void load()} className="rounded border border-white/15 px-3 py-2 hover:bg-white/5">
          {busy ? "Loading…" : "Refresh"}
        </button>
        <span className="text-white/50">{files.length} files</span>
        {msg && <span className="text-emerald-300">{msg}</span>}
      </div>

      <div className="overflow-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-white/5 text-left text-white/70">
            <tr><th className="px-3 py-2 font-medium">File</th><th className="px-3 py-2 font-medium">Size</th><th className="px-3 py-2 font-medium">Link</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.name} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="max-w-[420px] break-all px-3 py-1.5 text-white/80">{f.name}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-white/50">{kb(f.size)}</td>
                <td className="px-3 py-1.5">
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-emerald-300 hover:underline">open</a>
                </td>
                <td className="px-3 py-1.5">
                  <button onClick={() => void remove(f.name)} className="rounded border border-red-400/30 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/10">Delete</button>
                </td>
              </tr>
            ))}
            {!files.length && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-white/40">
                {busy ? "Loading…" : "This bucket is empty."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}