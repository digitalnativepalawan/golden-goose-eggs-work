// ═══════════════════════════════════════════════════════
// KMZ / KML BULK IMPORT — Places & Businesses
//
// Lets an admin drop a .kmz (zipped) or .kml (plain) file and
// create many destinations at once, instead of typing them in
// one by one.
//
// No dependencies. A KMZ is just a ZIP containing doc.kml, so the
// archive is read directly and the entry is inflated with the
// browser's built-in DecompressionStream. The KML itself is parsed
// with the built-in DOMParser.
//
// Loaded after app.js (see index.html) so it can use the shared
// globals: sb, destinations, catStyle, escapeHtml, lucideSvg,
// renderAdminDest() and adminRequireWrite().
// ═══════════════════════════════════════════════════════

let kmzPanelOpen = false;
let kmzRows = [];        // parsed rows awaiting review
let kmzBusy = false;
let kmzMsg = '';
// When ticked, imported rows go straight to the public map instead of drafts.
let kmzPublishNow = false;

// San Vicente bounds — same box the single-place form uses.
const KMZ_BOUNDS = { minLat: 10.25, maxLat: 10.78, minLng: 118.95, maxLng: 119.45 };

/* ---------------------------------------------------------- helpers --- */

function kmzInSanVicente(lat, lng) {
  return lat >= KMZ_BOUNDS.minLat && lat <= KMZ_BOUNDS.maxLat &&
         lng >= KMZ_BOUNDS.minLng && lng <= KMZ_BOUNDS.maxLng;
}

function kmzStripHtml(value) {
  return String(value || '')
    // Block-level boundaries become spaces so words don't run together...
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, ' ')
    // ...but inline tags are simply dropped, so "</b>." stays "gem." not "gem .".
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Direct-child text only. Prevents a Placemark's <name> lookup from
// accidentally picking up a nested element's name.
function kmzChildText(node, tag) {
  for (let i = 0; i < node.childNodes.length; i++) {
    const c = node.childNodes[i];
    if (c.nodeType === 1 && (c.nodeName === tag || c.localName === tag)) {
      return c.textContent || '';
    }
  }
  return '';
}

// Cheap similarity for "same business, two exports" — word overlap, no library.
function kmzNameSimilarity(a, b) {
  const words = (v) =>
    String(v || '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
  const A = words(a);
  const B = words(b);
  if (!A.length || !B.length) return 0;
  const hit = A.filter((w) => B.includes(w)).length;
  return (2 * hit) / (A.length + B.length);
}

function kmzHaversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* ------------------------------------------------------- zip reading --- */

async function kmzInflateRaw(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser cannot unzip KMZ files. Export the file as KML instead and import that.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return await new Response(stream).text();
}

// Pull the first .kml entry out of a ZIP/KMZ.
async function kmzExtractKmlText(buffer) {
  const u8 = new Uint8Array(buffer);
  const dv = new DataView(buffer);

  // End of central directory: scan backwards (max 64 KB comment).
  let eocd = -1;
  const floor = Math.max(0, u8.length - 66000);
  for (let i = u8.length - 22; i >= floor; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('That file is not a KMZ/ZIP archive. If it is a .kml, import it directly.');

  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);

  for (let i = 0; i < count; i++) {
    if (p + 46 > u8.length || dv.getUint32(p, true) !== 0x02014b50) break;
    const method    = dv.getUint16(p + 10, true);
    const compSize  = dv.getUint32(p + 20, true);
    const nameLen   = dv.getUint16(p + 28, true);
    const extraLen  = dv.getUint16(p + 30, true);
    const commentLen= dv.getUint16(p + 32, true);
    const localOff  = dv.getUint32(p + 42, true);
    const name = new TextDecoder('utf-8').decode(u8.subarray(p + 46, p + 46 + nameLen));

    if (/\.kml$/i.test(name)) {
      const lNameLen  = dv.getUint16(localOff + 26, true);
      const lExtraLen = dv.getUint16(localOff + 28, true);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const data  = u8.subarray(start, start + compSize);
      if (method === 0) return new TextDecoder('utf-8').decode(data);
      if (method === 8) return await kmzInflateRaw(data);
      throw new Error('Unsupported compression inside the KMZ (method ' + method + ').');
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error('The KMZ did not contain a .kml file.');
}

/* ------------------------------------------------------- kml reading --- */

function kmzParseKml(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('The KML could not be parsed — the file may be malformed.');
  }

  const out = [];
  const placemarks = doc.getElementsByTagName('Placemark');

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    const name = (kmzChildText(pm, 'name') || '').trim() || 'Untitled place';
    const rawDesc = kmzChildText(pm, 'description');

    // Only Point placemarks are places. A Google Earth export carries the
    // barangay boundary polygons and the whole road network in the same file
    // (the San Vicente TRE export has 314 line strings against 106 real pins),
    // and taking the first vertex of a road would invent a business on it.
    const pointEl = pm.getElementsByTagName('Point')[0];
    if (!pointEl) continue;
    // KML order is longitude,latitude,altitude.
    const coordEl = pointEl.getElementsByTagName('coordinates')[0];
    if (!coordEl || !coordEl.textContent) continue;
    const first = coordEl.textContent.trim().split(/\s+/)[0];
    const parts = first.split(',');
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    if (!isFinite(lat) || !isFinite(lng)) continue;

    // Folder name is the best available category hint in a KMZ export.
    let folder = '';
    let parent = pm.parentNode;
    while (parent && parent.nodeType === 1) {
      if (parent.localName === 'Folder') { folder = (kmzChildText(parent, 'name') || '').trim(); break; }
      parent = parent.parentNode;
    }

    out.push({ name, lat, lng, folder, description: kmzStripHtml(rawDesc).slice(0, 700) });
  }
  return out;
}

// Category match, in priority order. The old version only looked for the
// category key or its label inside the text, so a folder named "Port_Barton_TREs"
// matched nothing and every business landed in the first category on the list.
// These rules read the words a Philippine establishment actually uses.
const KMZ_CATEGORY_RULES = [
  // Nightlife first: a "cocktail bar and restaurant" is a bar, not a canteen.
  ['nightlife', /cocktail|night ?club|videoke|karaoke|reggae/],
  ['stays', /accom|resort|hotel|guest ?house|\binn\b|cottage|lodge|pension|homestay|hostel|bed and breakfast|b&b|\brooms?\b|\bvilla\b|travellers? (inn|pad)|transient/],
  ['food', /resto|restaurant|eatery|grill|bistro|cafe|coffee|carinderia|kitchen|\bmenu\b|\bbar\b|\bfood\b|snack|bakery|dining/],
  ['waterfalls', /waterfall|\bfalls\b/],
  ['islands', /\bisland\b/],
  ['beaches', /\bbeach\b/],
  ['nature', /mangrove|forest|lagoon|spring|cave|reef/],
  ['sport', /surf|kite|paddle|dive|snorkel|freediv|\bsport\b/],
  ['adventure', /trek|hike|tour|adventure|camping|island hopping/],
  ['services', /spa|massage|laundry|salon|clinic|rental|travel and tours|\bshop\b|\bstore\b|money|atm|terminal|\bport\b/],
];

function kmzGuessCategory(row) {
  const keys = Object.keys(catStyle || {});
  if (!keys.length) return 'stays';
  const hay = (row.folder + ' ' + row.name + ' ' + row.description).toLowerCase().replace(/[_-]+/g, ' ');

  for (const [key, re] of KMZ_CATEGORY_RULES) {
    if (keys.includes(key) && re.test(hay)) return key;
  }
  // Then the old behaviour: a folder or name that literally says the category.
  for (const key of keys) {
    if (hay.includes(String(key).toLowerCase())) return key;
    const label = String((catStyle[key] || {}).label || '').toLowerCase();
    if (label && hay.includes(label)) return key;
    if (label && hay.includes(label.replace(/s$/, ''))) return key;
  }
  return keys.includes('stays') ? 'stays' : keys[0];
}

// ── Barangay from the folder / name / blurb ─────────────────────────────
// A TRE export groups pins by barangay folder ("Port_Barton_TREs"), which is a
// far better hint than "nearest place that happens to be mapped".
const KMZ_BARANGAY_HINTS = [
  ['Port Barton', ['port barton', 'portbarton']],
  ['Poblacion', ['poblacion', 'pob.']],
  ['New Agutaya', ['new agutaya', 'agutaya']],
  ['Sto. Niño', ['sto nino', 'santo nino', 'sto. niño', 'santo niño']],
  ['San Isidro', ['san isidro']],
  ['Alimanguan', ['alimanguan']],
  ['Binga', ['binga']],
  ['Kemdeng', ['kemdeng']],
  ['Caruray', ['caruray']],
  ['New Canipo', ['new canipo', 'canipo']],
];

function kmzGuessBarangay(row, near) {
  const hay = (row.folder + ' ' + row.name + ' ' + row.description).toLowerCase().replace(/[_-]+/g, ' ');
  for (const [barangay, hints] of KMZ_BARANGAY_HINTS) {
    if (hints.some((h) => hay.includes(h))) return barangay;
  }
  return near ? near.barangay || '' : '';
}

/* -------------------------------------------------------------- state --- */

function kmzLoadFiles(files) {
  const list = Array.from(files || []);
  if (!list.length) return;

  kmzBusy = true;
  kmzMsg = 'Reading ' + list.length + ' file' + (list.length === 1 ? '' : 's') + '…';
  renderAdminDest();

  let pending = list.length;
  const collected = [];

  list.forEach(file => {
    const finish = () => { if (--pending === 0) kmzFinish(collected, list); };
    // A .kml is already plain text.
    if (/\.kml$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = () => { try { collected.push(...kmzParseKml(String(reader.result))); } catch (e) { kmzMsg = file.name + ': ' + e.message; } finish(); };
      reader.onerror = () => { kmzMsg = 'Could not read ' + file.name; finish(); };
      reader.readAsText(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const kml = await kmzExtractKmlText(reader.result);
        collected.push(...kmzParseKml(kml));
      } catch (e) {
        kmzMsg = file.name + ': ' + e.message;
      }
      finish();
    };
    reader.onerror = () => { kmzMsg = 'Could not read ' + file.name; finish(); };
    reader.readAsArrayBuffer(file);
  });
}

function kmzFinish(collected, list) {
  kmzBusy = false;

  if (!collected.length) {
    kmzRows = [];
    if (!kmzMsg) kmzMsg = 'No placemarks with coordinates were found in ' + list.map(f => f.name).join(', ') + '.';
    renderAdminDest();
    return;
  }

  // Flag duplicates against what is already on the map, and mark
  // anything outside San Vicente so it starts unticked.
  const directory = (typeof window !== 'undefined' && typeof window.adminAllPlaces === 'function') ? window.adminAllPlaces() : (destinations || []);
  kmzRows = collected.map(row => {
    const near = (directory || []).find(d =>
      (String(d.name || '').toLowerCase() === row.name.toLowerCase()) ||
      (kmzHaversineM(row.lat, row.lng, Number(d.lat), Number(d.lng)) < 75)
    );
    const inArea = kmzInSanVicente(row.lat, row.lng);
    const category = kmzGuessCategory(row);
    const barangay = kmzGuessBarangay(row, near);
    const label = (catStyle && catStyle[category] && catStyle[category].label) || category;
    return {
      name: row.name,
      lat: row.lat,
      lng: row.lng,
      folder: row.folder,
      // A pin with no blurb still needs a sentence, or the card reads as a bug.
      description: row.description || (label + (barangay ? ' in ' + barangay : '') + '.'),
      category,
      barangay,
      duplicateOf: near ? near.name : '',
      inArea,
      include: inArea && !near,
    };
  });

  // Repeats inside the upload itself. Exports collect the same business twice
  // ("Malaika Bar and Restaurant" / "Malaika Cocktail and Restaurant" a few
  // metres apart) and the old check only compared against places already saved.
  const kmzNameKey = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const kept = [];
  kmzRows.forEach((r) => {
    if (!r.include) return;
    const twin = kept.find(
      (k) =>
        k.key === kmzNameKey(r.name) ||
        (kmzHaversineM(r.lat, r.lng, k.lat, k.lng) < 40 &&
          kmzNameSimilarity(k.name, r.name) >= 0.6),
    );
    if (twin) {
      r.duplicateOf = twin.name;
      r.dupInFile = true;
      r.include = false;
      return;
    }
    kept.push({ key: kmzNameKey(r.name), name: r.name, lat: r.lat, lng: r.lng });
  });

  const dupes = kmzRows.filter((r) => r.duplicateOf && !r.dupInFile).length;
  const inFile = kmzRows.filter((r) => r.dupInFile).length;
  const outside = kmzRows.filter((r) => !r.inArea).length;
  kmzMsg =
    kmzRows.length + ' placemark' + (kmzRows.length === 1 ? '' : 's') + ' parsed' +
    (dupes ? ' · ' + dupes + ' already on the map (unticked)' : '') +
    (inFile ? ' · ' + inFile + ' repeated inside the file (unticked)' : '') +
    (outside ? ' · ' + outside + ' outside San Vicente (unticked)' : '');
  renderAdminDest();
}

function adminKmzTogglePanel() {
  kmzPanelOpen = !kmzPanelOpen;
  renderAdminDest();
}

function adminKmzToggleRow(index) {
  const row = kmzRows[index];
  if (!row) return;
  row.include = !row.include;
  renderAdminDest();
}

function adminKmzSetAll(value) {
  kmzRows.forEach(r => { r.include = value && r.inArea ? true : (value ? r.include : false); });
  if (value) kmzRows.forEach(r => { if (r.inArea) r.include = true; });
  renderAdminDest();
}

function adminKmzUpdateRow(index, field, value) {
  const row = kmzRows[index];
  if (!row) return;
  row[field] = value;
}

function adminKmzClear() {
  kmzRows = [];
  kmzMsg = '';
  renderAdminDest();
}

/* ------------------------------------------------------------ import --- */

async function adminKmzImport() {
  if (!adminRequireWrite()) return;
  if (destinationsSource !== 'supabase') {
    alert('The database is not reachable, so nothing can be imported. Reconnect and try again.');
    return;
  }

  const chosen = kmzRows.filter(r => r.include);
  if (!chosen.length) { alert('Nothing is ticked for import.'); return; }

  const missing = chosen.filter(r => !r.category || !r.barangay);
  if (missing.length) {
    alert(missing.length + ' of the ticked rows still need a category and a barangay. Fill those in first.');
    return;
  }

  if (!confirm('Create ' + chosen.length + ' new draft listing' + (chosen.length === 1 ? '' : 's') + ' for review?')) return;

  kmzBusy = true;
  kmzMsg = 'Importing…';
  renderAdminDest();

  let created = 0;
  const failures = [];
  const directory = (typeof window !== 'undefined' && typeof window.adminAllPlaces === 'function') ? window.adminAllPlaces() : (destinations || []);
  let sortBase = (directory || []).length;
  const supportsStatus = typeof window !== 'undefined' && typeof window.adminPublishingEnabled === 'function' && window.adminPublishingEnabled();

  // Chunks keep a single bad row from failing the whole batch, while
  // still avoiding one round trip per placemark.
  for (let i = 0; i < chosen.length; i += 25) {
    const chunk = chosen.slice(i, i + 25).map((r, n) => {
      const row = {
        name: r.name,
        lat: Number(r.lat),
        lng: Number(r.lng),
        category: r.category,
        color: (catStyle[r.category] || {}).color || '#0ea5e9',
        barangay: r.barangay,
        description: r.description || '',
        tip: '',
        image: '',
        images: [],
        featured: false,
        sort_order: sortBase + i + n,
      };
      if (supportsStatus) row.status = kmzPublishNow ? 'published' : 'draft';
      return row;
    });

    const { data, error } = await sb.from('destinations').insert(chunk).select('id');
    if (error) failures.push(error.message);
    else created += (data || []).length;
  }

  kmzBusy = false;

  if (created) {
    await loadDataFromSupabase();
    rebuildMarkers();
  }

  if (failures.length) {
    kmzMsg = created + ' imported, ' + failures.length + ' batch(es) failed: ' + failures[0];
  } else {
    kmzRows = [];
    kmzMsg = created + ' listing' + (created === 1 ? '' : 's') + ' imported to Explore.';
  }
  renderAdminDest();
}

/* -------------------------------------------------------------- panel --- */

function adminKmzPanelHtml() {
  const ticked = kmzRows.filter(r => r.include).length;
  const catKeys = Object.keys(catStyle || {});
  const barangayOptions = ['', 'Alimanguan', 'San Isidro', 'Sto. Niño', 'New Agutaya', 'Poblacion',
    'Kemdeng', 'Port Barton', 'Caruray', 'Binga', 'New Canipo'];

  return `
    <div class="admin-data-note" style="margin-bottom:10px;">
      Import placemarks from a Google Earth / Maps export. KMZ and KML both work.
      Nothing is written until you review the rows and press Import.
    </div>
    <button class="admin-add-btn" style="margin-bottom:0;" onclick="document.getElementById('adfKmzFile').click()">
      ${lucideSvg('upload', 14)} Choose a .kmz or .kml file
    </button>
    <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:.8rem;cursor:pointer;">
      <input type="checkbox" ${kmzPublishNow ? 'checked' : ''} onchange="kmzPublishNow=this.checked">
      <span>Show them on the map straight away (skip draft)</span>
    </label>
    <input type="file" id="adfKmzFile" accept=".kmz,.kml,application/vnd.google-earth.kmz,application/vnd.google-earth.kml+xml"
           multiple style="display:none" onchange="kmzLoadFiles(this.files)">
    ${kmzMsg ? `<div class="admin-data-note" style="margin-top:10px;">${escapeHtml(kmzMsg)}</div>` : ''}
    ${kmzRows.length ? `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0;">
        <strong style="font-size:.78rem;">${kmzRows.length} parsed · ${ticked} ticked</strong>
        <button class="admin-mini-btn" onclick="adminKmzSetAll(true)">Tick all in-area</button>
        <button class="admin-mini-btn" onclick="adminKmzSetAll(false)">Untick all</button>
        <button class="admin-mini-btn" onclick="adminKmzClear()">Discard</button>
      </div>
      <div style="max-height:340px;overflow:auto;border:1px solid var(--line,#2a3441);border-radius:10px;">
        <table class="admin-table" style="width:100%;font-size:.72rem;">
          <thead>
            <tr>
              <th style="width:34px;"></th><th>Name</th><th>Lat</th><th>Lng</th>
              <th>Category</th><th>Barangay</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${kmzRows.map((r, i) => `
              <tr style="${r.inArea ? '' : 'opacity:.55;'}">
                <td><input type="checkbox" ${r.include ? 'checked' : ''} onchange="adminKmzToggleRow(${i})"></td>
                <td>
                  <span title="${escapeHtml(r.description || r.folder || '')}">${escapeHtml(r.name)}</span>
                  ${r.duplicateOf ? `<div style="opacity:.6;">${r.dupInFile ? 'repeat in file' : 'already on map'}: ${escapeHtml(r.duplicateOf)}</div>` : ''}
                  ${!r.inArea ? '<div style="opacity:.6;">outside San Vicente</div>' : ''}
                </td>
                <td>${r.lat.toFixed(4)}</td>
                <td>${r.lng.toFixed(4)}</td>
                <td>
                  <select onchange="adminKmzUpdateRow(${i},'category',this.value)">
                    ${catKeys.map(k => `<option value="${escapeHtml(k)}" ${k === r.category ? 'selected' : ''}>${escapeHtml((catStyle[k] || {}).label || k)}</option>`).join('')}
                  </select>
                </td>
                <td>
                  <select onchange="adminKmzUpdateRow(${i},'barangay',this.value)">
                    ${barangayOptions.map(b => `<option value="${escapeHtml(b)}" ${b === r.barangay ? 'selected' : ''}>${b || '— choose —'}</option>`).join('')}
                  </select>
                </td>
                <td><button class="admin-mini-btn danger" onclick="adminKmzDropRow(${i})">Remove</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <button class="admin-save-btn" style="margin-top:12px;" ${kmzBusy ? 'disabled' : ''} onclick="adminKmzImport()">
        ${lucideSvg('save', 14)} Import ${ticked} listing${ticked === 1 ? '' : 's'}
      </button>
    ` : ''}
  `;
}

function adminKmzDropRow(index) {
  kmzRows.splice(index, 1);
  renderAdminDest();
}
