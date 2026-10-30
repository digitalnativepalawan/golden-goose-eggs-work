import { useCallback, useMemo, useRef, useState } from "react";
import { parseKmz, type KmzLocation } from "@/lib/kmz-parser";
import { call } from "@/lib/admin-helpers";

/**
 * KMZ import — reads Google Earth / QGIS .kmz exports, extracts point
 * placemarks, infers barangay and category, and bulk-imports them into
 * `destinations` as drafts for review.
 */

const CATEGORIES = ["beaches", "islands", "adventure", "culture", "stays", "food"] as const;

const BARANGAYS = [
  "Alimanguan", "Binga", "Caruray", "Kemdeng", "New Agutaya", "New Canipo",
  "Poblacion", "Port Barton", "San Isidro", "Sto. Nino", "Unassigned",
];

type Draft = KmzLocation & { selected: boolean; category: string; barangay: string; name: string };

export function KmzPanel({ token, onDone }: { token: string; onDone: () => void }) {
  const [busy, setBusy] = useState("");
  const [docName, setDocName] = useState("");
  const [stats, setStats] = useState({ total: 0, ignored: 0 });
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [filter, setFilter] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async (file: File) => {
    setBusy("Reading file…");
    try {
      const result = parseKmz(new Uint8Array(await file.arrayBuffer()));
      setDocName(result.documentName);
      setStats({ total: result.totalPlacemarks, ignored: result.ignoredCount });
      setDrafts(
        result.locations.map((loc) => ({
          ...loc,
          selected: true,
          category: loc.type,
          name: loc.name,
        })),
      );
      setBusy("");
    } catch (err) {
      setBusy("");
      setDrafts([]);
      alert(err instanceof Error ? err.message : "Could not read that KMZ file.");
    }
  }, []);

  const selected = useMemo(() => drafts.filter((d) => d.selected), [drafts]);

  const patch = (index: number, values: Partial<Draft>) =>
    setDrafts((all) => all.map((d, i) => (i === index ? { ...d, ...values } : d)));

  function setAll(next: boolean) {
    setDrafts((all) => all.map((d) => ({ ...d, selected: next })));
  }

  async function runImport() {
    if (!selected.length) return;
    if (
      !window.confirm(
        `Import ${selected.length} place(s) into destinations?\n\nThey are saved as drafts and will not appear on the public site until you publish them.`,
      )
    ) {
      return;
    }
    setBusy(`Importing ${selected.length} place(s)…`);
    try {
      for (let i = 0; i < selected.length; i += 50) {
        const batch = selected.slice(i, i + 50).map((d) => ({
          name: d.name,
          category: d.category,
          barangay: d.barangay,
          lat: d.latitude,
          lng: d.longitude,
          description: d.description,
          status: "draft",
          featured: false,
          color: categoryColor(d.category),
        }));
        try {
          await call(token, "insert", { table: "destinations" }, {
            method: "POST",
            body: JSON.stringify(batch),
          });
        } catch (err) {
          // Before the publishing migration is applied, `status` is not a
          // column. Preserve the importer on older databases.
          const message = err instanceof Error ? err.message : String(err);
          if (!/status|schema cache|column/i.test(message)) throw err;
          const legacyBatch = batch.map(({ status: _status, ...row }) => row);
          await call(token, "insert", { table: "destinations" }, {
            method: "POST",
            body: JSON.stringify(legacyBatch),
          });
        }
        setBusy(`Imported ${Math.min(i + 50, selected.length)} / ${selected.length}…`);
      }
      setBusy(`Done — ${selected.length} place(s) imported as drafts.`);
      onDone();
      window.setTimeout(() => { setDrafts([]); setDocName(""); setBusy(""); }, 1200);
    } catch (err) {
      setBusy("");
      alert(err instanceof Error ? err.message : "Import failed.");
    }
  }

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return drafts;
    return drafts.filter((d) => `${d.name} ${d.barangay} ${d.category}`.toLowerCase().includes(q));
  }, [drafts, filter]);

  if (!drafts.length) {
    return (
      <div className="p-5">
        <div className="mb-4 text-xs text-white/50">
          Import places from a Google Earth or QGIS <code className="text-white/70">.kmz</code> export.
          Coordinates, names, folder names and descriptions are read automatically; barangay and category are inferred
          and can be corrected before import.
        </div>
        <label className="inline-block cursor-pointer rounded border border-white/15 px-3 py-2 text-xs hover:bg-white/5">
          {busy || "Choose a .kmz file"}
          <input
            ref={fileRef}
            type="file"
            accept=".kmz"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void load(file);
              e.target.value = "";
            }}
          />
        </label>
        {busy && <span className="ml-3 text-xs text-emerald-300">{busy}</span>}
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-medium text-white">{docName}</span>
        <span className="text-white/50">
          {stats.total} placemarks · {drafts.length} usable · {stats.ignored} skipped
        </span>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          className="rounded border border-white/15 bg-black/40 px-2 py-1 text-white outline-none focus:border-white/40"
        />
        <button onClick={() => setAll(true)} className="rounded border border-white/15 px-2 py-1 hover:bg-white/5">All</button>
        <button onClick={() => setAll(false)} className="rounded border border-white/15 px-2 py-1 hover:bg-white/5">None</button>
        <button
          onClick={() => void runImport()}
          className="rounded bg-emerald-400/90 px-3 py-1.5 font-medium text-[#06281f] hover:bg-emerald-300"
        >
          Import {selected.length}
        </button>
        <button onClick={() => { setDrafts([]); setDocName(""); }} className="rounded border border-white/15 px-2 py-1 hover:bg-white/5">
          Cancel
        </button>
        {busy && <span className="text-emerald-300">{busy}</span>}
      </div>

      <div className="overflow-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-[#0d1620] text-left text-white/70">
            <tr>
              <th className="w-8 px-2 py-2" />
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Barangay</th>
              <th className="px-3 py-2 font-medium">Lat / Lng</th>
              <th className="px-3 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => {
              const index = drafts.indexOf(d);
              return (
                <tr key={`${d.name}-${index}`} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-2 py-1.5">
                    <input
                      type="checkbox"
                      checked={d.selected}
                      onChange={(e) => patch(index, { selected: e.target.checked })}
                    />
                  </td>
                  <td className="max-w-[260px] px-3 py-1.5">
                    <input
                      value={d.name}
                      onChange={(e) => patch(index, { name: e.target.value })}
                      className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-white outline-none focus:border-white/40"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      value={d.category}
                      onChange={(e) => patch(index, { category: e.target.value })}
                      className="rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      value={d.barangay}
                      onChange={(e) => patch(index, { barangay: e.target.value })}
                      className="rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
                    >
                      {[...new Set([d.barangay, ...BARANGAYS])].map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-white/60">
                    {d.latitude.toFixed(5)}, {d.longitude.toFixed(5)}
                  </td>
                  <td className="px-3 py-1.5 text-amber-300/80">
                    {d.warnings.length ? d.warnings.join(" ") : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Marker colour per category, matching the public map. */
function categoryColor(category: string): string {
  switch (category) {
    case "beaches": return "#38bdf8";
    case "islands": return "#a78bfa";
    case "stays": return "#f472b6";
    case "food": return "#fbbf24";
    case "culture": return "#34d399";
    default: return "#fb7185";
  }
}