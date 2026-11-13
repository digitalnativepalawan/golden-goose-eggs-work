// ═══════════════════════════════════════════════════════
// ADMIN PANEL — triple-tap the "SANVIC.PH" brand in the map header, or add
// ?admin=1 to the URL. No PIN, no sign-in, no read-only state:
// openAdminFromButton() opens the panel and every save is allowed.
// The database side is
// supabase/migrations/20261101090000_open_backoffice_writes.sql.
// ═══════════════════════════════════════════════════════
let brandClickCount = 0,
  brandClickTimer = null;
let adminTab = "dest";
let adminEditingDestId = null; // null = not editing, 'new' = creating, else id
let adminEditingTalaId = null;
let adminCanWrite = true;
let adminCollapsedCats = {}; // { [categoryKey]: true } when that group is collapsed
let adminNeedsWorkOnly = false; // show only listings that are missing details
let adminQuickPhotoTargetId = null;
let adminDeadCovers = new Set(); // listings whose saved photo link 404s (id, as string)

async function refreshAdminAccess() {
  adminCanWrite = true;
  renderAdminAccessBanner();
}

// Nothing to warn about any more. Kept as a function because ~40 save paths
// still call it as a guard.
function renderAdminAccessBanner() {
  /* Reads only — no element, nothing to draw. Kept so the save paths that
     call it stay unchanged. */
}

function adminRequireWrite() {
  return true;
}

// The primary Backoffice shortcut is the SANVIC.PH wordmark in the map header.
// It stays in a clear top-left slot without competing with map controls.
//
// Counted from pointerdown, not click. A phone can swallow clicks (double-tap
// zoom, slow taps on old Android) and then three taps never arrive as three
// clicks. pointerdown fires once per finger down, every time, on every device.
function adminBrandClick() {
  brandClickCount++;
  clearTimeout(brandClickTimer);
  brandClickTimer = setTimeout(() => {
    brandClickCount = 0;
  }, 900);
  if (brandClickCount >= 3) {
    brandClickCount = 0;
    if (typeof openAdminPanel === "function") openAdminPanel();
  }
}

// Delegated, so it survives anything that re-renders the header.
document.addEventListener(
  "pointerdown",
  function (e) {
    const brand = e.target && e.target.closest ? e.target.closest("#heroBrand") : null;
    if (brand) adminBrandClick();
  },
  { passive: true },
);

// Kept for anything still pointing at the removed gear button.
//
// No gate at all now: no 4-digit PIN, no Supabase sign-in. The panel opens and
// writes. Read the migration named at the top of this section for the database
// side of that decision.
function openAdminFromButton() {
  openAdminPanel();
  return false;
}

async function openAdminPanel() {
  if (!dataReady) await loadDataFromSupabase();
  await refreshAdminAccess();
  document.getElementById("adminPanelOverlay").classList.add("active");
  refreshAdminAiBadge();
  switchAdminTab(adminTab);
}

function refreshAdminAiBadge() {
  const b = document.getElementById("adminAiBadge");
  if (!b) return;
  b.classList.toggle("is-on", !!talaAiEnabled);
  b.innerHTML = `${lucideSvg("cpu", 12)} ${talaAiEnabled ? "AI on · " : "AI off · "}${escapeHtml(talaAiModel || "—")}`;
  b.title = talaAiEnabled
    ? "TALA answers use OpenRouter (live AI)"
    : "TALA uses curated keyword answers";
}

function closeAdminPanel() {
  document.getElementById("adminPanelOverlay").classList.remove("active");
  adminEditingDestId = null;
  adminEditingTalaId = null;
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.getElementById("adminTabDest").classList.toggle("active", tab === "dest");
  document.getElementById("adminTabTala").classList.toggle("active", tab === "tala");
  document.getElementById("adminTabTalaAi").classList.toggle("active", tab === "ai");
  document.getElementById("adminTabPulse").classList.toggle("active", tab === "pulse");
  document.getElementById("adminTabSite").classList.toggle("active", tab === "site");
  document.getElementById("adminTabToday").classList.toggle("active", tab === "today");
  document.getElementById("adminTabTribes").classList.toggle("active", tab === "tribes");
  document.getElementById("adminTabEvents").classList.toggle("active", tab === "events");
  document.getElementById("adminTabMySanvic").classList.toggle("active", tab === "mysanvic");
  document.getElementById("adminTabHunt").classList.toggle("active", tab === "hunt");
  adminEditingDestId = null;
  adminEditingTalaId = null;
  if (tab === "dest") renderAdminDest();
  else if (tab === "tala") renderAdminTala();
  else if (tab === "ai") renderAdminTalaAi();
  else if (tab === "site") renderAdminSite();
  else if (tab === "today") renderAdminToday();
  else if (tab === "tribes") renderAdminTribes();
  else if (tab === "events") renderAdminEvents();
  else if (tab === "mysanvic") renderAdminMySanvic();
  else if (tab === "hunt") renderAdminHunt();
  else renderAdminPulse();
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

// ───────────── DESTINATIONS ADMIN ─────────────

let destCatPanelOpen = false;
let editingDestCatId = null; // null = not editing, 'new' = creating, else id
let adminDestSearchQuery = "";

function adminPlaceIssues(d) {
  const issues = [];
  if (!String(d.name || "").trim()) issues.push("name");
  if (!Number.isFinite(Number(d.lat)) || !Number.isFinite(Number(d.lng))) issues.push("map pin");
  if (!String(d.category || "").trim()) issues.push("category");
  if (!String(d.barangay || "").trim()) issues.push("barangay");
  if (!String(d.description || "").trim()) issues.push("description");
  if (!String(d.image || "").trim() || adminDeadCovers.has(String(d.id)))
    issues.push("cover photo");
  return issues;
}
function adminFilterDestinations(value) {
  adminDestSearchQuery = String(value || "")
    .trim()
    .toLowerCase();
  renderAdminDest();
  const input = document.getElementById("adminDestSearch");
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}
function adminPreviewDest(id) {
  const d = destinations.find((x) => String(x.id) === String(id));
  if (!d) return;
  closeAdminPanel();
  if (map) {
    map.flyTo([d.lat, d.lng], 15, { duration: 1 });
  }
  openDest(d);
}

function adminToggleDestCatPanel() {
  destCatPanelOpen = !destCatPanelOpen;
  renderAdminDest();
}

function adminDestCatPanelHtml() {
  let html = `
    <div class="admin-field" style="font-size:.7rem;color:var(--white-dim);margin-bottom:10px;">
      These are the categories available when adding or editing a destination (Beaches, Islands, etc). Add your own, rename, or change the marker color. Deleting a category doesn't delete destinations already using it — they'll just show the category's key until you re-assign them.
    </div>
    <button class="admin-add-btn" onclick="adminNewDestCat()">+ Add category</button>`;

  if (editingDestCatId !== null) {
    html += adminDestCatFormHtml();
  }

  const keys = Object.keys(catStyle);
  if (!keys.length) {
    html += `<div class="admin-empty">No categories yet.</div>`;
  } else {
    html += keys
      .map((key) => {
        const c = catStyle[key];
        const ico = lucideSvg(c.icon || "map-pin", 14);
        return `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div onclick="adminEditDestCat('${escapeHtml(key)}')" style="flex:1;cursor:pointer;display:flex;align-items:center;gap:14px;">
            <span class="sv-cat-dot lg" style="--c:${escapeHtml(c.color || "#7FA8FF")}" aria-hidden="true"></span>
            <div>
              <div class="admin-cat-label">${escapeHtml(c.label)}</div>
              <div class="admin-cat-hex">${escapeHtml(String(c.color || "").toUpperCase())}</div>
            </div>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditDestCat('${escapeHtml(key)}')">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteDestCat('${escapeHtml(key)}')">Delete</button>
          </div>
        </div>
      </div>`;
      })
      .join("");
  }
  return html;
}

function adminDestCatFormHtml() {
  const isNew = editingDestCatId === "new";
  const c = isNew
    ? { key: "", label: "", color: "#0ea5e9", icon: "map-pin" }
    : { key: editingDestCatId, ...catStyle[editingDestCatId] };
  const currentIcon = c.icon || "map-pin";
  const iconGrid = ALL_ICON_KEYS.map((name) => {
    const sel = name === currentIcon ? " is-selected" : "";
    return `<button type="button" class="sv-icon-opt${sel}" data-icon="${name}" onclick="adminPickIcon('${name}')" aria-label="Icon ${name}">${lucideSvg(name, 18)}</button>`;
  }).join("");
  return `
    <div class="admin-edit-box">
      <div class="admin-field">
        <label>Key (lowercase, no spaces — used internally, can't be changed later)</label>
        <input id="dcfKey" value="${escapeHtml(c.key)}" placeholder="e.g. waterfalls" ${isNew ? "" : "disabled"}>
      </div>
      <div class="admin-field"><label>Label (shown to visitors)</label><input id="dcfLabel" value="${escapeHtml(c.label)}" placeholder="e.g. Waterfalls"></div>
      <div class="admin-field"><label>Marker color (hex)</label><input id="dcfColor" value="${escapeHtml(c.color)}" placeholder="#0ea5e9" oninput="adminRefreshIconPreview()"></div>
      <div class="admin-field">
        <label>Map icon</label>
        <div class="sv-icon-preview-row">
          <span id="dcfPreview" class="sv-pin-preview" style="--pin-color:${escapeHtml(c.color)}">${lucideSvg(currentIcon, 18)}</span>
          <span style="font-size:.72rem;color:var(--white-dim);">Preview · <span id="dcfIconName">${escapeHtml(currentIcon)}</span></span>
        </div>
        <input id="dcfIcon" type="hidden" value="${escapeHtml(currentIcon)}">
        <div class="sv-icon-grid">${iconGrid}</div>
      </div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveDestCat('${isNew ? "" : escapeHtml(c.key)}')">${isNew ? "Create" : "Save changes"}</button>
        <button class="admin-cancel-btn" onclick="editingDestCatId=null;renderAdminDest();">Cancel</button>
      </div>
    </div>`;
}

function adminPickIcon(name, targetId) {
  const t = targetId || "dcfIcon";
  const f = document.getElementById(t);
  if (!f) return;
  f.value = name;
  const scope = f.closest(".admin-edit-box") || document;
  scope
    .querySelectorAll(".sv-icon-opt")
    .forEach((b) => b.classList.toggle("is-selected", b.dataset.icon === name));
  if (t === "npfIcon") {
    const lbl = document.getElementById("npfIconName");
    if (lbl) lbl.textContent = name;
    const prev = document.getElementById("npfIconPreview");
    if (prev) prev.innerHTML = lucideSvg(name, 18);
    return;
  }
  const lbl = document.getElementById("dcfIconName");
  if (lbl) lbl.textContent = name;
  adminRefreshIconPreview();
}
function adminRefreshIconPreview() {
  const prev = document.getElementById("dcfPreview");
  if (!prev) return;
  const name = (document.getElementById("dcfIcon") || {}).value || "map-pin";
  const color = (document.getElementById("dcfColor") || {}).value || "#0ea5e9";
  prev.style.setProperty("--pin-color", color);
  prev.innerHTML = lucideSvg(name, 18);
}

function adminNewDestCat() {
  editingDestCatId = "new";
  renderAdminDest();
}
function adminEditDestCat(key) {
  editingDestCatId = key;
  renderAdminDest();
}

async function adminSaveDestCat(existingKey) {
  if (!adminRequireWrite()) return;
  const isNew = !existingKey;
  const key = document
    .getElementById("dcfKey")
    .value.trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  const label = document.getElementById("dcfLabel").value.trim();
  const color = document.getElementById("dcfColor").value.trim() || "#0ea5e9";
  const icon = (document.getElementById("dcfIcon").value || "map-pin").trim();
  if (!key || !label) {
    alert("Key and label are both required.");
    return;
  }
  if (isNew && catStyle[key]) {
    alert(`A category with the key "${key}" already exists.`);
    return;
  }

  try {
    if (isNew) {
      const sortOrder = Object.keys(catStyle).length;
      const { error } = await sb
        .from("destination_categories")
        .insert({ key, label, color, icon, sort_order: sortOrder });
      if (error) throw error;
    } else {
      const { error } = await sb
        .from("destination_categories")
        .update({ label, color, icon })
        .eq("key", existingKey);
      if (error) throw error;
    }
    await loadDataFromSupabase();
    editingDestCatId = null;
    renderAdminDest();
    rebuildMarkers(); // marker icons/colors depend on catStyle
  } catch (err) {
    alert("Save failed: " + (err.message || err));
  }
}

async function adminDeleteDestCat(key) {
  if (!adminRequireWrite()) return;
  const inUse = destinations.filter((d) => d.category === key).length;
  const warn = inUse
    ? ` ${inUse} destination${inUse === 1 ? "" : "s"} currently use this category and will show "${key}" until reassigned.`
    : "";
  if (!confirm(`Delete the "${catStyle[key]?.label || key}" category?${warn}`)) return;
  try {
    const { error } = await sb.from("destination_categories").delete().eq("key", key);
    if (error) throw error;
    await loadDataFromSupabase();
    renderAdminDest();
    rebuildMarkers();
  } catch (err) {
    alert("Delete failed: " + (err.message || err));
  }
}

let nearbyPanelOpen = false;
let editingNearbyId = null; // null = not editing, 'new' = creating, else id

function adminToggleNearbyPanel() {
  nearbyPanelOpen = !nearbyPanelOpen;
  renderAdminDest();
}

const NEARBY_CAT_LABELS = { food: "Food", shop: "Shop", service: "Service", stay: "Stay" };

function adminNearbyPanelHtml() {
  let html = `
    <div class="admin-field" style="font-size:.7rem;color:var(--white-dim);margin-bottom:10px;">
      Shown when a visitor taps "What's around me" on a destination — grouped by barangay, the same barangay set on that destination below. Add real food/shop/service spots so every barangay has something useful.
    </div>
    <button class="admin-add-btn" onclick="adminNewNearby()">+ Add place</button>`;

  if (editingNearbyId !== null) {
    html += adminNearbyFormHtml();
  }

  const barangays = Object.keys(nearbyPlacesByBarangay).sort();
  if (!barangays.length) {
    html += `<div class="admin-empty">No nearby places yet.</div>`;
  } else {
    barangays.forEach((b) => {
      const items = nearbyPlacesByBarangay[b];
      if (!items.length) return;
      html += `<div style="font-size:.68rem;color:var(--white-dim);text-transform:uppercase;letter-spacing:.05em;margin:14px 0 6px;">Brgy. ${escapeHtml(b)}</div>`;
      html += items
        .map(
          (p) => `
        <div class="admin-list-item">
          <div class="admin-list-item-head">
            <div onclick="adminEditNearby(${p.id})" style="flex:1;cursor:pointer;display:flex;align-items:center;gap:10px;">
              <span style="display:inline-flex;color:var(--ocean-teal-light)">${iconOrText(p.icon, 18)}</span>
              <div>
                <strong>${escapeHtml(p.name)}</strong> <span style="color:var(--white-dim);font-size:.68rem;">(${NEARBY_CAT_LABELS[p.cat] || p.cat})</span><br>
                <span>${escapeHtml(p.desc)}</span>
              </div>
            </div>
            <div class="admin-row-actions">
              <button class="admin-mini-btn" onclick="adminEditNearby(${p.id})">Edit</button>
              <button class="admin-mini-btn danger" onclick="adminDeleteNearby(${p.id})">Delete</button>
            </div>
          </div>
        </div>`,
        )
        .join("");
    });
  }
  return html;
}

function adminNearbyFormHtml() {
  const isNew = editingNearbyId === "new";
  let p = null;
  if (!isNew) {
    for (const b in nearbyPlacesByBarangay) {
      const found = nearbyPlacesByBarangay[b].find((x) => x.id === editingNearbyId);
      if (found) {
        p = { ...found, barangay: b };
        break;
      }
    }
  }
  p = p || { barangay: "", name: "", cat: "food", desc: "", dist: "", icon: "utensils" };
  const currentNearbyIcon =
    p.icon && (EXTRA_ICONS[p.icon] || LUCIDE_ICONS[p.icon]) ? p.icon : "utensils";
  const nearbyIconGrid = ALL_ICON_KEYS.map((name) => {
    const sel = name === currentNearbyIcon ? " is-selected" : "";
    return `<button type="button" class="sv-icon-opt${sel}" data-icon="${name}" onclick="adminPickIcon('${name}','npfIcon')" aria-label="Icon ${name}">${lucideSvg(name, 18)}</button>`;
  }).join("");
  return `
    <div class="admin-edit-box">
      <div class="admin-field">
        <label>Barangay (must match a destination's barangay exactly)</label>
        <input id="npfBarangay" list="npfBarangayList" value="${escapeHtml(p.barangay)}" placeholder="e.g. Poblacion">
        <datalist id="npfBarangayList">${Array.from(
          new Set([
            ...Object.keys(nearbyPlacesByBarangay),
            ...destinations.map((d) => d.barangay).filter(Boolean),
          ]),
        )
          .map((b) => `<option value="${escapeHtml(b)}">`)
          .join("")}</datalist>
      </div>
      <div class="admin-field"><label>Name</label><input id="npfName" value="${escapeHtml(p.name)}" placeholder="e.g. Mango Bar and Restaurant"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Category</label>
          <select id="npfCat">
            <option value="food" ${p.cat === "food" ? "selected" : ""}>Food</option>
            <option value="shop" ${p.cat === "shop" ? "selected" : ""}>Shop</option>
            <option value="service" ${p.cat === "service" ? "selected" : ""}>Service</option>
            <option value="stay" ${p.cat === "stay" ? "selected" : ""}>Stay</option>
          </select>
        </div>
        <div class="admin-field">
          <label>Icon</label>
          <input id="npfIcon" type="hidden" value="${escapeHtml(currentNearbyIcon)}">
          <div class="sv-icon-preview-row">
            <span id="npfIconPreview" class="sv-pin-preview" style="--pin-color:#0ea5e9">${lucideSvg(currentNearbyIcon, 18)}</span>
            <span style="font-size:.72rem;color:var(--white-dim);">Preview · <span id="npfIconName">${escapeHtml(currentNearbyIcon)}</span></span>
          </div>
          <div class="sv-icon-grid">${nearbyIconGrid}</div>
        </div>
      </div>
      <div class="admin-field"><label>Short description</label><input id="npfDesc" value="${escapeHtml(p.desc)}" placeholder="e.g. Grilled seafood, beachfront seating"></div>
      <div class="admin-field"><label>Distance / location label</label><input id="npfDist" value="${escapeHtml(p.dist)}" placeholder="e.g. Poblacion town, 5 min walk"></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveNearby(${isNew ? "'new'" : editingNearbyId})">${isNew ? "Create" : "Save changes"}</button>
        <button class="admin-cancel-btn" onclick="editingNearbyId=null;renderAdminDest();">Cancel</button>
      </div>
    </div>`;
}

function adminNewNearby() {
  editingNearbyId = "new";
  renderAdminDest();
}
function adminEditNearby(id) {
  editingNearbyId = id;
  renderAdminDest();
}

async function adminSaveNearby(id) {
  if (!adminRequireWrite()) return;
  const barangay = document.getElementById("npfBarangay").value.trim();
  const name = document.getElementById("npfName").value.trim();
  const cat = document.getElementById("npfCat").value;
  const icon = document.getElementById("npfIcon").value.trim() || "utensils";
  const desc = document.getElementById("npfDesc").value.trim();
  const dist = document.getElementById("npfDist").value.trim();
  if (!barangay || !name) {
    alert("Barangay and name are both required.");
    return;
  }

  try {
    if (id === "new") {
      const sortOrder = (nearbyPlacesByBarangay[barangay] || []).length;
      const { error } = await sb.from("nearby_places").insert({
        barangay,
        name,
        category: cat,
        description: desc,
        distance_label: dist,
        icon,
        sort_order: sortOrder,
      });
      if (error) throw error;
    } else {
      const { error } = await sb
        .from("nearby_places")
        .update({ barangay, name, category: cat, description: desc, distance_label: dist, icon })
        .eq("id", id);
      if (error) throw error;
    }
    await loadDataFromSupabase();
    editingNearbyId = null;
    renderAdminDest();
  } catch (err) {
    alert("Save failed: " + (err.message || err));
  }
}

async function adminDeleteNearby(id) {
  if (!adminRequireWrite()) return;
  if (!confirm("Delete this place?")) return;
  try {
    const { error } = await sb.from("nearby_places").delete().eq("id", id);
    if (error) throw error;
    await loadDataFromSupabase();
    renderAdminDest();
  } catch (err) {
    alert("Delete failed: " + (err.message || err));
  }
}

// ─── Directory: category groups + fast per-row actions ───────────────
// The directory used to be one flat list in database order, which stops being
// usable once there are 30+ places. It is now grouped by category (same order
// visitors see in Explore) and alphabetical inside each group.
//
// The single outstanding job in this data is photos: 25 of 33 listings have
// every field except a cover photo, which is the whole "needs details" count.
// So adding a photo is now one click on the row instead of Edit -> scroll ->
// upload -> Save.

function adminDestGroups(list) {
  const groups = new Map();
  (catOrder || []).forEach((k) => groups.set(k, []));
  list.forEach((d) => {
    const k = d.category || "__none";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(d);
  });
  const cmp = (a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "en", {
      sensitivity: "base",
      numeric: true,
    });
  const out = [];
  groups.forEach((items, k) => {
    if (!items.length) return;
    if (k === "__none" && groups.size > 1) return; // only show a "no category" bucket when it is the only one
    out.push({
      key: k,
      label: k === "__none" ? "No category" : (catStyle[k] && catStyle[k].label) || k,
      color: (catStyle[k] && catStyle[k].color) || "#64748b",
      items: items.slice().sort(cmp),
    });
  });
  return out;
}

function adminToggleCat(key) {
  adminCollapsedCats[key] = !adminCollapsedCats[key];
  renderAdminDest();
}

function adminSetAllCats(collapsed) {
  adminDestGroups(destinations).forEach((g) => {
    adminCollapsedCats[g.key] = !!collapsed;
  });
  renderAdminDest();
}

function adminToggleNeedsWork() {
  adminNeedsWorkOnly = !adminNeedsWorkOnly;
  renderAdminDest();
}

// One row: a thumbnail you can click to add a photo, the facts worth seeing at
// a glance, and the four actions that actually get used.
function adminDestRowHtml(d) {
  const issues = adminPlaceIssues(d);
  const extras = Array.isArray(d.images) ? d.images.length : 0;
  const cover = String(d.image || "").trim() || (extras ? d.images[0] : "");
  const stats = d.stats || {};
  const bits = [];
  if (d.barangay) bits.push(escapeHtml(d.barangay));
  if (stats.rating) bits.push(lucideSvg("star", 12) + " " + escapeHtml(String(stats.rating)));
  if (stats.travel) bits.push(escapeHtml(String(stats.travel)));
  if (stats.season) bits.push(escapeHtml(String(stats.season)));
  if (extras) bits.push("+" + extras + " photo" + (extras === 1 ? "" : "s"));
  const photoLabel = cover ? "Add another photo" : "Add a cover photo";
  return `
      <div class="admin-list-item admin-dest-row">
        <button type="button" class="admin-row-thumb" data-dest-id="${d.id}" onclick="adminQuickPhoto(${d.id})" aria-label="${photoLabel}">
          ${cover ? `<img src="${escapeHtml(cover)}" alt="" onerror="adminThumbBroken(this)">` : lucideSvg("camera", 18)}
          ${cover ? `<span class="admin-thumb-badge">${lucideSvg("camera", 10)}</span>` : ""}
        </button>
        <div class="admin-dest-main">
          <div class="admin-list-item-head">
            <div onclick="adminEditDest(${d.id})" class="admin-dest-open">
              <strong>${escapeHtml(d.name || "Untitled place")}</strong><span class="admin-feat-toggle ${d.featured ? "on" : ""}" onclick="event.stopPropagation();adminToggleFeatured(${d.id})" aria-label="${d.featured ? "Remove from featured" : "Feature in Explore"}">${lucideSvg("star", 12)}</span>${SanvicExplore.safeUrl(d.videoUrl) ? ` <span class="admin-feat-icon" aria-label="Has video">${lucideSvg("film", 12)}</span>` : ""}
              <span class="admin-row-meta">${bits.join(" &middot; ") || "no details yet"}</span>
              <div class="admin-quality ${issues.length ? "needs-work" : "ready"}">${issues.length ? "Needs: " + escapeHtml(issues.join(", ")) : "Ready for Explore"}</div>
            </div>
            <div class="admin-row-actions">
              <button class="admin-mini-btn${cover ? "" : " accent"}" onclick="adminQuickPhoto(${d.id})">+ Photo</button>
              <button class="admin-mini-btn" onclick="adminEditDest(${d.id})">Edit</button>
              <button class="admin-mini-btn" onclick="adminPreviewDest(${d.id})">View</button>
              <button class="admin-mini-btn danger" onclick="adminDeleteDest(${d.id})">Delete</button>
            </div>
          </div>
        </div>
      </div>`;
}

// A saved photo can still be a dead link (the object was removed from Storage).
// The row thumbnail is already loading that URL, so the browser tells us for
// free - no extra requests - and the row stops claiming it is complete.
function adminThumbBroken(img) {
  const thumb = img.closest(".admin-row-thumb");
  if (!thumb) return;
  const id = thumb.getAttribute("data-dest-id");
  if (id) adminDeadCovers.add(String(id));
  img.remove();
  const badge = thumb.querySelector(".admin-thumb-badge");
  if (badge) badge.remove();
  thumb.classList.add("is-broken");
  if (!thumb.querySelector(".admin-thumb-fallback"))
    thumb.insertAdjacentHTML(
      "afterbegin",
      `<span class="admin-thumb-fallback">${lucideSvg("camera", 18)}</span>`,
    );
  const chip = thumb.parentElement && thumb.parentElement.querySelector(".admin-quality");
  if (chip) {
    chip.className = "admin-quality needs-work";
    chip.textContent = "Needs: cover photo (the saved link is dead)";
  }
}

// Add or replace a photo without opening the editor. An existing cover is kept
// and the new photo joins the gallery behind it, matching how the editor treats
// the first gallery image as the cover.
function adminQuickPhoto(id) {
  if (!adminRequireWrite()) return;
  adminQuickPhotoTargetId = id;
  let input = document.getElementById("adminQuickPhotoInput");
  if (!input) {
    input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.id = "adminQuickPhotoInput";
    input.style.display = "none";
    input.addEventListener("change", () => adminQuickPhotoUpload(input.files && input.files[0]));
    document.body.appendChild(input);
  }
  input.value = "";
  input.click();
}

async function adminQuickPhotoUpload(file) {
  const id = adminQuickPhotoTargetId;
  adminQuickPhotoTargetId = null;
  if (!file || !id) return;
  let d = destinations.find((x) => String(x.id) === String(id));
  if (!d) {
    // Rare: the row is not in the in-memory list. Read it so the photo still
    // lands on the right record instead of the click doing nothing.
    const { data } = await sb
      .from("destinations")
      .select("id,name,image,images")
      .eq("id", id)
      .maybeSingle();
    if (!data) {
      alert("Could not find that place to add a photo to. Reload and try again.");
      return;
    }
    d = data;
  }
  const body = document.getElementById("adminBody");
  if (body)
    body.innerHTML = `<div class="admin-empty">Uploading photo for ${escapeHtml(d.name || "this place")}…</div>`;
  try {
    if (!file.type || !file.type.startsWith("image/")) throw new Error("that file is not an image");
    if (file.size > PULSE_IMAGE_MAX_INPUT_BYTES) throw new Error("that image is larger than 15 MB");
    const blob = await compressImageForUpload(file).catch(() => file);
    const path = `dest_${id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await sb.storage.from("destination-images").upload(path, blob, {
      cacheControl: "31536000",
      upsert: false,
      contentType: blob.type || "image/jpeg",
    });
    if (error) throw error;
    const { data } = sb.storage.from("destination-images").getPublicUrl(path);
    const url = data.publicUrl;
    // A row whose saved cover 404s must have that dead link replaced, not kept.
    const replaceCover = !String(d.image || "").trim() || adminDeadCovers.has(String(d.id));
    const patch = replaceCover
      ? { image: url }
      : { images: [...(Array.isArray(d.images) ? d.images : []), url] };
    const { error: saveErr } = await sb.from("destinations").update(patch).eq("id", d.id);
    if (saveErr) throw saveErr;
    adminDeadCovers.delete(String(d.id));
  } catch (err) {
    alert("Could not add that photo: " + (err.message || err));
  }
  await loadDataFromSupabase();
  renderAdminDest();
  rebuildMarkers();
}

async function adminToggleFeatured(id) {
  if (!adminRequireWrite()) return;
  const d = destinations.find((x) => String(x.id) === String(id));
  if (!d) return;
  const next = !d.featured;
  const { error } = await sb.from("destinations").update({ featured: next }).eq("id", d.id);
  if (error) {
    alert("Could not update Featured: " + error.message);
    return;
  }
  d.featured = next;
  renderAdminDest();
  rebuildMarkers();
}

function renderAdminDest() {
  const body = document.getElementById("adminBody");
  const incomplete = destinations.filter((d) => adminPlaceIssues(d).length).length;
  const q = adminDestSearchQuery;
  let visibleDestinations = destinations.filter(
    (d) =>
      !q ||
      [d.name, d.barangay, d.category, d.description].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q),
      ),
  );
  if (adminNeedsWorkOnly)
    visibleDestinations = visibleDestinations.filter((d) => adminPlaceIssues(d).length);
  const groups = adminDestGroups(visibleDestinations);

  let html = `
    <div class="admin-data-banner ${destinationsSource === "fallback" || !adminCanWrite ? "warning" : ""}">
      <strong>${destinationsSource === "supabase" ? "Live Supabase directory" : "Offline fallback data"}</strong>
      <span>${destinations.length} listing${destinations.length === 1 ? "" : "s"} · ${incomplete} need${incomplete === 1 ? "s" : ""} details · ${adminCanWrite ? "Admin writes enabled" : "Sign in as an assigned admin to save"}</span>
    </div>
    ${destinationsSource === "fallback" ? '<div class="admin-data-note">The database could not be reached, so these are built-in demo records. Reconnect before editing; saving fallback entries can create duplicates.</div>' : ""}
    <button class="admin-add-btn" style="margin-top:2px;" onclick="adminNewDest()">+ Add business or tourist place</button>
    <input class="admin-directory-search" id="adminDestSearch" value="${escapeHtml(adminDestSearchQuery)}" placeholder="Search name, barangay or category" oninput="adminFilterDestinations(this.value)">
    <div class="admin-dir-toolbar">
      <button type="button" onclick="adminSetAllCats(false)">Expand all</button>
      <button type="button" onclick="adminSetAllCats(true)">Collapse all</button>
      <button type="button" class="${adminNeedsWorkOnly ? "on" : ""}" onclick="adminToggleNeedsWork()">${adminNeedsWorkOnly ? "Showing incomplete only" : "Only show incomplete"} · ${incomplete}</button>
    </div>`;

  if (adminEditingDestId !== null) {
    html += adminDestFormHtml();
  }

  if (!visibleDestinations.length) {
    html += `<div class="admin-empty">${destinations.length ? (adminNeedsWorkOnly ? "Everything is complete — nothing needs details right now." : "No listings match that search.") : "No live listings yet. Add your first business or tourist place above."}</div>`;
  } else {
    html += groups
      .map((g) => {
        const collapsed = !!adminCollapsedCats[g.key];
        const needs = g.items.filter((d) => adminPlaceIssues(d).length).length;
        return `
    <div class="admin-cat-group">
      <div class="admin-cat-head" onclick="adminToggleCat(${JSON.stringify(g.key).replace(/"/g, "&quot;")})">
        <span class="admin-cat-dot" style="background:${escapeHtml(g.color)}"></span>
        <span class="admin-cat-name">${escapeHtml(g.label)}</span>
        <span class="admin-cat-note">${needs ? needs + " need details" : "all complete"}</span>
        <span class="admin-cat-count">${g.items.length}</span>
        <span class="admin-cat-chev">${lucideSvg(collapsed ? "chevron-right" : "chevron-down", 14)}</span>
      </div>
      ${collapsed ? "" : `<div class="admin-cat-body">${g.items.map(adminDestRowHtml).join("")}</div>`}
    </div>`;
      })
      .join("");
  }

  html += `
    <div class="admin-dir-tools-label">Directory tools</div>
    <div class="admin-section-toggle" onclick="adminToggleDestCatPanel()">
      <span>${lucideSvg("tag", 13)} Manage categories ${lucideSvg(destCatPanelOpen ? "chevron-down" : "chevron-right", 13)}</span>
      <span class="admin-section-count">${Object.keys(catStyle).length}</span>
    </div>
    <div id="adfCatPanel" style="display:${destCatPanelOpen ? "" : "none"}">
      ${adminDestCatPanelHtml()}
    </div>
    <div class="admin-section-toggle" onclick="adminToggleNearbyPanel()" style="margin-top:8px;">
      <span>${lucideSvg("map-pin", 13)} Manage "What's around me" ${lucideSvg(nearbyPanelOpen ? "chevron-down" : "chevron-right", 13)}</span>
      <span class="admin-section-count">${Object.values(nearbyPlacesByBarangay).reduce((n, arr) => n + arr.length, 0)}</span>
    </div>
    <div id="adfNearbyPanel" style="display:${nearbyPanelOpen ? "" : "none"}">
      ${adminNearbyPanelHtml()}
    </div>
    ${
      typeof adminKmzPanelHtml === "function"
        ? `
    <div class="admin-section-toggle" onclick="adminKmzTogglePanel()" style="margin-top:8px;">
      <span>${lucideSvg("upload", 13)} Import places from KMZ / KML ${lucideSvg(kmzPanelOpen ? "chevron-down" : "chevron-right", 13)}</span>
      <span class="admin-section-count">${kmzRows.length || ""}</span>
    </div>
    <div id="adfKmzPanel" style="display:${kmzPanelOpen ? "" : "none"}">
      ${adminKmzPanelHtml()}
    </div>`
        : ""
    }`;

  body.innerHTML = html;
}

function adminDestFormHtml() {
  const isNew = adminEditingDestId === "new";
  const d = isNew
    ? {
        name: "",
        lat: "",
        lng: "",
        category: "beaches",
        image: "",
        images: [],
        description: "",
        tip: "",
        color: "#0ea5e9",
        videoUrl: "",
        videoType: "",
        featured: false,
        barangay: "",
        googleBusinessUrl: "",
        stats: { rating: "", travel: "", temp: "", season: "" },
      }
    : destinations.find((x) => x.id === adminEditingDestId);
  if (!d) return "";
  // Initialize media gallery with existing images
  __mediaGallery = [];
  // Do not carry a cover link that is known to 404 into the gallery, otherwise
  // saving the form would write the dead URL straight back.
  if (d.image && !adminDeadCovers.has(String(d.id))) __mediaGallery.push(d.image);
  if (d.images && Array.isArray(d.images)) __mediaGallery.push(...d.images);
  return `
    <div class="admin-edit-box">
      <div class="admin-form-heading">${isNew ? "New listing" : "Edit listing"}</div>
      <div class="admin-form-help">Use this same form for beaches, attractions, accommodations, restaurants, tour operators, shops and local services. Saved records appear in Explore and on the map.</div>
      <div class="admin-toggle-row">
        <label for="adfFeatured">Featured in Explore</label>
        <input type="checkbox" id="adfFeatured" ${d.featured ? "checked" : ""}>
      </div>

      <div class="admin-form-section">1. Identity and location</div>
      <div class="admin-field"><label>Name *</label><input id="adfName" value="${escapeHtml(d.name)}" placeholder="Public business or place name"></div>

      <div class="admin-field">
        <label>Paste Google Maps link (fills name + lat/lng below)</label>
        <input id="adfMapsLink" placeholder="https://www.google.com/maps/place/..." oninput="adminParseMapsLink()">
        <div id="adfMapsLinkStatus" style="font-size:.68rem;color:var(--white-dim);margin-top:6px;">
          Works with full google.com/maps/... links. Shortened maps.app.goo.gl links need to be opened once first — then copy the expanded URL from the address bar.
        </div>
      </div>

      <div class="admin-grid-2">
        <div class="admin-field"><label>Latitude</label><input id="adfLat" value="${d.lat}"></div>
        <div class="admin-field"><label>Longitude</label><input id="adfLng" value="${d.lng}"></div>
      </div>
      <div class="admin-field">
        <label>Barangay *</label>
        <input id="adfBarangay" list="adfBarangayList" value="${escapeHtml(d.barangay || "")}" placeholder="e.g. Poblacion, Port Barton, Alimanguan...">
        <datalist id="adfBarangayList">${Array.from(
          new Set([...EXPLORE_AREAS.map((a) => a.k), ...Object.keys(nearbyPlacesByBarangay)]),
        )
          .map((b) => `<option value="${escapeHtml(b)}">`)
          .join("")}</datalist>
      </div>
      <div class="admin-field">
        <label>Google Business Profile URL (sightseeing, accommodation, cafe, tour office...)</label>
        <input id="adfGbp" value="${escapeHtml(d.googleBusinessUrl)}" placeholder="https://www.google.com/maps/place/... or https://maps.app.goo.gl/..." oninput="adminParseGbpLink()">
        <div id="adfGbpStatus" style="font-size:.68rem;color:var(--white-dim);margin-top:6px;">
          Paste the "Share" link from the business's Google profile. If coordinates can be read from it, they're filled in below.
        </div>
      </div>
      <div class="admin-field">
        <label>The Hunt — clue for this spot</label>
        <textarea id="adfClue" rows="3" placeholder="A riddle that hints at this place without naming it. Shown in place of the name until the visitor unlocks it on location.">${escapeHtml(d.clue || "")}</textarea>
        <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-weight:400">
          <input type="checkbox" id="adfHuntSpot" ${d.huntSpot ? "checked" : ""} style="width:auto;min-height:0">
          <span>Make this one of the hunting spots</span>
        </label>
        <div style="font-size:.68rem;color:var(--white-dim);margin-top:6px;">
          Hunting spots appear in The Hunt with their clue and unlock by GPS when the visitor is within 200&nbsp;m. Write the clue before switching this on.
        </div>
      </div>
      <div class="admin-field" style="margin-top:10px">
        <button type="button" class="admin-save-btn" id="adfAutoFillBtn" onclick="adminAutoFill()" style="min-height:44px">Auto-fill from OpenStreetMap &amp; Wikimedia (no API keys)</button>
        <div id="adfAutoStatus" style="font-size:.68rem;color:var(--white-dim);margin-top:8px;line-height:1.5"></div>
        <div id="adfAutoResults"></div>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Category</label>
          <select id="adfCat">
            ${Object.keys(catStyle)
              .map(
                (c) =>
                  `<option value="${c}" ${c === d.category ? "selected" : ""}>${catStyle[c].label}</option>`,
              )
              .join("")}
          </select>
        </div>
        <div class="admin-field"><label>Marker color</label><input id="adfColor" value="${escapeHtml(d.color)}"></div>
      </div>

      <div class="admin-form-section">2. Photos and visitor information</div>
      ${mediaGalleryHtml("adf", "dest")}
      ${mediaVideoHtml("adf", d.videoUrl, d.videoType)}

      <div class="admin-field">
        <label>Photo credit (shown under the photo)</label>
        <input id="adfCredit" value="${escapeHtml(d.imageCredit || "")}" placeholder="Photo: Jane Doe, Wikimedia Commons, CC BY 4.0">
        <div style="font-size:.66rem;color:var(--white-dim);margin-top:6px;line-height:1.55">
          Required when the photo is not yours. Wikimedia Commons photos are almost always CC BY or CC BY-SA, which allow commercial use only if the author and licence are shown. Leave blank for photos you took yourself.
        </div>
      </div>

      <div class="admin-field"><label>Description *</label><textarea id="adfDesc" rows="3" placeholder="What is this place, and why should someone visit or use it?">${escapeHtml(d.description)}</textarea></div>
      <div class="admin-field"><label>Local tip</label><textarea id="adfTip" rows="2" placeholder="Access, hours, fees, cash, road or weather advice">${escapeHtml(d.tip)}</textarea></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Rating</label><input id="adfRating" value="${escapeHtml(d.stats.rating)}"></div>
        <div class="admin-field"><label>Access / travel time</label><input id="adfTravel" value="${escapeHtml(d.stats.travel)}" placeholder="e.g. 15 min from Poblacion"></div>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Temp</label><input id="adfTemp" value="${escapeHtml(d.stats.temp)}"></div>
        <div class="admin-field"><label>Season</label><input id="adfSeason" value="${escapeHtml(d.stats.season)}"></div>
      </div>

      <div id="adpExtras" class="admin-extras">${adminPlaceExtrasHtml()}</div>

      <div class="admin-edit-actions">
        <button class="admin-save-btn" id="adfSaveBtn" onclick="adminSaveDest()">${isNew ? "Create listing" : "Save changes"}</button>
        <button class="admin-cancel-btn" onclick="adminEditingDestId=null;renderAdminDest();">Cancel</button>
      </div>
    </div>`;
}

// Superseded by the media gallery, which owns the video fields now
// (mediaVideoHtml / mediaUploadVideoIfNeeded). This used to reach for
// #adfVideoType and the two wrappers around it, none of which exist any more, so
// all it could do was throw. Kept as a guard for stale markup.
function adminToggleVideoFields() {
  return;
}

async function adminUploadImageNow() {
  // Superseded by the media gallery, which uploads, previews and removes
  // images without leaving the form. Kept only as a no-op guard so any cached
  // markup referencing it cannot throw.
  return;
}

function adminParseMapsLink() {
  const input = document.getElementById("adfMapsLink");
  const status = document.getElementById("adfMapsLinkStatus");
  const url = input.value.trim();
  if (!url) {
    status.textContent =
      "Tip: works with full google.com/maps/... links. Shortened maps.app.goo.gl links need to be opened once first — then copy the expanded URL from the address bar.";
    status.style.color = "var(--white-dim)";
    return;
  }
  if (/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)) {
    status.textContent =
      "That's a shortened link — open it in a browser tab first, then paste the expanded google.com/maps/... URL here. (Or just paste the short link in chat and ask to have it resolved.)";
    status.style.color = "#f59e0b";
    return;
  }
  const result = parseGoogleMapsUrl(url);
  if (result) {
    document.getElementById("adfLat").value = result.lat;
    document.getElementById("adfLng").value = result.lng;
    const nameField = document.getElementById("adfName");
    if (result.name && !nameField.value.trim()) nameField.value = result.name;
    status.textContent = `Found: ${result.lat}, ${result.lng}${result.name ? ' — "' + result.name + '"' : ""}. Filled in below.`;
    status.style.color = "#22c55e";
  } else {
    status.textContent =
      "Could not find coordinates in that link. Try copying the link again from the address bar after opening the place on Google Maps.";
    status.style.color = "#ef4444";
  }
}

function adminNewDest() {
  adminEditingDestId = "new";
  __adminDetails = null;
  __adminContacts = [];
  __adminLinks = [];
  __adminAmenities = new Set();
  __adminPayments = new Set();
  renderAdminDest();
  loadAmenityVocab().then(() => renderAdminPlaceExtras());
}
function adminEditDest(id) {
  adminEditingDestId = id;
  renderAdminDest();
  Promise.all([loadAmenityVocab(), adminFetchPlaceExtras(id)]).then(() => renderAdminPlaceExtras());
}

// Optional helper: a Google Business Profile URL is usually just a Google
// Maps place link — when it is, quietly fill in name/lat/lng as a convenience.
// The URL itself is always stored verbatim in the google_business_url column.
function adminParseGbpLink() {
  const status = document.getElementById("adfGbpStatus");
  const url = (document.getElementById("adfGbp").value || "").trim();
  if (!url) {
    status.textContent =
      "Paste the \"Share\" link from the business's Google profile. If coordinates can be read from it, they're filled in below.";
    status.style.color = "var(--white-dim)";
    return;
  }
  const result = parseGoogleMapsUrl(url);
  if (result) {
    const latEl = document.getElementById("adfLat");
    const lngEl = document.getElementById("adfLng");
    const nameEl = document.getElementById("adfName");
    if (latEl && lngEl) {
      if (!latEl.value) latEl.value = result.lat;
      if (!lngEl.value) lngEl.value = result.lng;
    }
    if (result.name && nameEl && !nameEl.value.trim()) nameEl.value = result.name;
    status.textContent =
      "Coordinates found and filled in. This URL will also be saved as the Google Business Profile link.";
    status.style.color = "#22c55e";
  } else {
    status.textContent =
      "Saved as-is. (Some profile share links are short URLs that can't be read client-side — that's fine.)";
    status.style.color = "#f59e0b";
  }
}

// ─── OPEN-SOURCE AUTO-FILL (no API keys) ───
// Pasted flow: admin pastes a Google Business link (or types a name),
// we resolve the place through OpenStreetMap (Nominatim + Overpass) for real
// data and recommend photos from Wikimedia Commons. All endpoints are open,
// keyless, CORS-enabled. Attribution required for OSM (ODbL) + Commons (CC).

function gbpNameFromUrl(url) {
  if (!url) return "";
  const m = url.match(/\/maps\/place\/([^/@]+)/);
  if (m) return decodeURIComponent(m[1].replace(/\+/g, " "));
  const q = url.match(/[?&]q=([^&]+)/);
  if (q && q[1] && !/^[\d.,]+$/.test(q[1].trim()))
    return decodeURIComponent(q[1].replace(/\+/g, " "));
  return "";
}

async function adminNominatim(q) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=1&q=" +
    encodeURIComponent(q + " San Vicente Palawan Philippines");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Nominatim HTTP " + res.status);
  const rows = await res.json();
  if (!rows || !rows.length) return null;
  // Rank by distance to San Vicente + prefer results that actually mention it.
  const center = { lat: 10.5, lon: 119.22 };
  const score = (r) =>
    Math.hypot(parseFloat(r.lat) - center.lat, parseFloat(r.lon) - center.lon) +
    (/san vicente/i.test(r.display_name) ? 0 : 2) +
    (/palawan/i.test(r.display_name) ? 0 : 1);
  rows.sort((a, b) => score(a) - score(b));
  const r = rows[0];
  return {
    lat: r.lat,
    lon: r.lon,
    displayName: r.display_name,
    shortName: r.display_name.split(",")[0].trim(),
    osmType: r.osm_type,
    osmId: r.osm_id,
  };
}

async function adminOsmTags(osmType, osmId) {
  const type = osmType === "relation" ? "relation" : osmType === "way" ? "way" : "node";
  const q = "[out:json];(" + type + "(" + osmId + "););out tags;";
  const res = await fetch("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(q));
  if (!res.ok) throw new Error("Overpass HTTP " + res.status);
  const j = await res.json();
  return (j.elements && j.elements[0] && j.elements[0].tags) || {};
}

// Ordered guesses: [osmtag, [values], [preferred destination category keys...]]
const OSM_CATEGORY_HINTS = [
  ["amenity", ["restaurant", "cafe", "bar", "fast_food", "pub", "food_court"], ["food"]],
  ["shop", ["travel_agency"], ["activity", "tours", "adventure"]],
  ["office", ["travel_agent", "travel_agency"], ["activity", "tours", "adventure"]],
  [
    "tourism",
    ["hotel", "guest_house", "hostel", "resort", "chalet", "motel", "apartment"],
    ["stays", "lodging", "hotel"],
  ],
  ["tourism", ["attraction", "viewpoint"], ["adventure", "nature", "services"]],
  ["tourism", ["museum", "gallery", "artwork"], ["services"]],
  ["leisure", ["beach_resort", "water_park"], ["stays", "adventure"]],
  ["natural", ["beach", "bay"], ["beaches", "nature"]],
  ["natural", ["island"], ["islands", "nature"]],
  ["amenity", ["atm", "bank", "pharmacy", "clinic"], ["service", "services"]],
  ["highway", ["bus_stop", "ferry_terminal"], ["transport"]],
];
function adminPickCategoryFromTags(tags) {
  const t = tags || {};
  const sel = document.getElementById("adfCat");
  if (!sel) return null;
  const pick = (bases) => {
    for (const b of bases)
      if (Array.from(sel.options).some((o) => o.value === b)) {
        sel.value = b;
        return b;
      }
    return null;
  };
  for (const [k, vals, bases] of OSM_CATEGORY_HINTS) {
    const v = String(t[k] || "").toLowerCase();
    if (vals.includes(v)) return pick(bases) || null;
  }
  return null;
}

function adminApplyOsmTags(tags, results) {
  const t = tags || {};
  const info = [];
  const website = t.website || t["contact:website"] || t["url:wikipedia"] || "";
  const phone = t.phone || t["contact:phone"] || t["phone:mobile"] || "";
  const hours = t.opening_hours || "";
  if (website)
    info.push(
      'Website: <a href="' +
        escapeHtml(website) +
        '" target="_blank" rel="noreferrer" style="color:var(--ocean-teal-light)">' +
        escapeHtml(website) +
        "</a>",
    );
  if (phone) info.push("Phone: " + escapeHtml(phone));
  if (hours) info.push("Hours: " + escapeHtml(hours));
  if (t["addr:housenumber"] || t["addr:street"])
    info.push(
      "Address: " +
        escapeHtml((t["addr:housenumber"] || "") + " " + (t["addr:street"] || "")) +
        ", San Vicente",
    );

  adminPickCategoryFromTags(t);

  const descEl = document.getElementById("adfDesc");
  if (descEl && !descEl.value.trim()) {
    const parts = [(t.name || "This spot") + " — located in San Vicente, Palawan."];
    const hoursStr = hours ? " Open " + hours + "." : "";
    const addrStr =
      t["addr:housenumber"] || t["addr:street"]
        ? " Found at " +
          ((t["addr:housenumber"] || "") + " " + (t["addr:street"] || "")).trim() +
          ", San Vicente."
        : "";
    if (hoursStr) parts.push(hoursStr);
    if (addrStr) parts.push(addrStr);
    descEl.value = parts.join("");
  }

  if (info.length) {
    results.insertAdjacentHTML(
      "beforeend",
      '<div style="border:1px solid var(--glass-border);border-radius:12px;background:rgba(255,255,255,.04);padding:10px 12px;margin-top:10px">' +
        '<div style="font-size:.64rem;letter-spacing:.08em;text-transform:uppercase;color:var(--white-dim);margin-bottom:6px">OpenStreetMap details (open-source)</div>' +
        info
          .map(
            (s) => '<div style="font-size:.75rem;color:var(--sand);margin:2px 0">' + s + "</div>",
          )
          .join("") +
        '<div style="font-size:.6rem;color:var(--white-dim);margin-top:6px">Data &copy; OpenStreetMap contributors (ODbL)</div>' +
        "</div>",
    );
  }
}

async function adminWikimediaSuggest(q, results) {
  const box = document.createElement("div");
  box.innerHTML =
    '<div style="font-size:.64rem;letter-spacing:.08em;text-transform:uppercase;color:var(--white-dim);margin:10px 0 6px">Wikimedia Commons photos — tap one to use it</div>' +
    '<div style="font-size:.6rem;color:var(--white-dim);margin-bottom:4px">Photos are CC-licensed by their authors — show attribution on the live site too.</div>' +
    '<div id="wikimediaThumbs" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:6px">Loading…</div>';
  results.appendChild(box);
  try {
    const url =
      "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
      "&gsrsearch=" +
      encodeURIComponent(q + " San Vicente Palawan") +
      "&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600&format=json&origin=*";
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const j = await res.json();
    const pages = (j.query && j.query.pages) || {};
    const photos = [];
    Object.keys(pages).forEach((k) => {
      const p = pages[k];
      const ii = p.imageinfo && p.imageinfo[0];
      if (ii && ii.thumburl)
        photos.push({
          thumb: ii.thumburl,
          url: ii.descriptionurl || ii.url || "",
          artist: (ii.extmetadata && ii.extmetadata.Artist && ii.extmetadata.Artist.value) || "",
          license:
            (ii.extmetadata &&
              ii.extmetadata.LicenseShortName &&
              ii.extmetadata.LicenseShortName.value) ||
            "",
        });
    });
    const grid = document.getElementById("wikimediaThumbs");
    if (!grid) return;
    if (!photos.length) {
      grid.innerHTML =
        '<div style="color:var(--white-dim);font-size:.7rem;grid-column:1/-1">No Commons photos found — upload your own instead.</div>';
      return;
    }
    window.__wmPhotos = photos;
    grid.innerHTML = photos
      .map(
        (ph, i) =>
          '<button type="button" onclick="adminPickWikimedia(' +
          i +
          ')" style="border:1px solid var(--glass-border);border-radius:8px;overflow:hidden;padding:0;background:rgba(255,255,255,.04);cursor:pointer">' +
          '<img src="' +
          ph.thumb +
          '" alt="" loading="lazy" style="width:100%;height:62px;object-fit:cover;display:block"></button>',
      )
      .join("");
  } catch (e) {
    const grid = document.getElementById("wikimediaThumbs");
    if (grid)
      grid.innerHTML =
        '<div style="color:var(--white-dim);font-size:.7rem;grid-column:1/-1">Wikimedia lookup failed (' +
        escapeHtml(e.message || e) +
        ")</div>";
  }
}

async function adminPickWikimedia(i) {
  const phs = window.__wmPhotos || [];
  const ph = phs[i];
  if (!ph || !ph.thumb) return;
  if (!adminRequireWrite()) return;

  const status = document.getElementById("adfAutoStatus");
  if (status) {
    status.textContent = "Copying that photo into your own storage…";
    status.style.color = "var(--white-dim)";
  }

  // The form has one image list - the media gallery - and its first entry is the
  // cover. This used to write to a #adfImage field that no longer exists, so
  // tapping a Commons photo did nothing at all.
  const artist = (ph.artist || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const licence = String(ph.license || "");
  // Only the CC BY family makes attribution a condition of use. A public-domain
  // or CC0 photo owes nothing, and writing "unknown author" underneath one is
  // both noise and a claim of an obligation the licence does not impose.
  const needsCredit = /^CC BY/i.test(licence);
  const credit = needsCredit
    ? "Photo: " +
      (artist || "unknown author") +
      ", Wikimedia Commons" +
      (licence ? ", " + licence : "")
    : "";

  let added = null,
    copyNote = "";
  try {
    // Copy it into the owner's own bucket. Hotlinking Commons works but the
    // owner cannot then manage or replace the file, and the licence credit
    // would point at somebody else's copy.
    const res = await fetch(ph.thumb, { mode: "cors" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const blob = await res.blob();
    const ext =
      (ph.thumb.split("?")[0].split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 4) || "jpg";
    const path =
      __mediaPrefix +
      "_wm_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 8) +
      "." +
      ext;
    const { error } = await sb.storage.from("destination-images").upload(path, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: blob.type || "image/jpeg",
    });
    if (error) throw error;
    const { data } = sb.storage.from("destination-images").getPublicUrl(path);
    if (!data || !data.publicUrl) throw new Error("no public URL returned");
    added = data.publicUrl;
  } catch (e) {
    // Losing the photo entirely would be worse than a hotlink, so fall back and
    // say plainly what happened.
    added = ph.thumb;
    copyNote =
      "Could not copy it into your storage (" +
      escapeHtml(e.message || String(e)) +
      "), so the Commons link was added directly. Replace it with your own upload whenever you like. ";
  }

  if (added) {
    __mediaGallery.push(added);
    mediaRefreshGrid("adf");
  }

  const creditInput = document.getElementById("adfCredit");
  if (creditInput) {
    creditInput.value = credit;
    creditInput.style.borderColor = credit ? "var(--ocean-teal-light)" : "";
    if (credit)
      setTimeout(() => {
        creditInput.style.borderColor = "";
      }, 1800);
  }

  if (status && added) {
    status.innerHTML =
      copyNote +
      "Added to the gallery. " +
      (needsCredit
        ? "The photo credit was filled in with <strong>" +
          escapeHtml(artist || "unknown author") +
          "</strong>" +
          (licence ? " (" + escapeHtml(licence) + ")" : "") +
          " — that credit is a condition of the licence, so please leave it in place."
        : "This photo is <strong>" +
          escapeHtml(licence || "freely licensed") +
          "</strong>, which does not require a credit, so the credit field was cleared.");
    status.style.color = copyNote ? "#f59e0b" : "#22c55e";
  }
}

async function adminAutoFill() {
  const status = document.getElementById("adfAutoStatus");
  const results = document.getElementById("adfAutoResults");
  status.style.color = "var(--white-dim)";
  results.innerHTML = "";
  const gbp = (document.getElementById("adfGbp").value || "").trim();
  let name = gbpNameFromUrl(gbp);
  const nameField = document.getElementById("adfName");
  if (!name && nameField && nameField.value.trim()) name = nameField.value.trim();
  name = (name || "").trim();
  if (!name) {
    status.textContent =
      "Type a location name first — or paste a Google Maps link with a /place/ name — so we can search OpenStreetMap.";
    status.style.color = "#ef4444";
    return;
  }
  status.textContent = 'Searching OpenStreetMap for "' + name + '"…';
  let r;
  try {
    r = await adminNominatim(name);
  } catch (e) {
    status.textContent =
      "OpenStreetMap lookup failed (" +
      escapeHtml(e.message || e) +
      "). You can still fill the fields manually.";
    status.style.color = "#ef4444";
    return;
  }
  if (!r) {
    status.textContent =
      'No matching place on OpenStreetMap for "' + name + '". Fill the fields manually.';
    status.style.color = "#f59e0b";
    return;
  }
  const latEl = document.getElementById("adfLat");
  const lngEl = document.getElementById("adfLng");
  if (latEl && !latEl.value) latEl.value = r.lat;
  if (lngEl && !lngEl.value) lngEl.value = r.lon;
  if (nameField && !nameField.value.trim() && r.shortName) nameField.value = r.shortName;
  status.innerHTML =
    "Matched: <strong>" + escapeHtml(r.displayName) + "</strong> (via OpenStreetMap / Nominatim).";
  status.style.color = "#22c55e";
  let tags = {};
  if (r.osmId) {
    try {
      tags = await adminOsmTags(r.osmType, r.osmId);
    } catch (e) {
      /* details are a bonus — coords already filled */
    }
  }
  adminApplyOsmTags(tags, results);
  adminWikimediaSuggest(name, results);
}

// Superseded by mediaUploadVideoIfNeeded(containerId), which the media gallery
// calls for every form. The old version read #adfVideoType, #adfVideoFile,
// #adfVideoUploadStatus and #adfVideoUploadedUrl — markup that no longer exists —
// and would have thrown before anything was uploaded. Kept as a guard.
async function adminUploadVideoIfNeeded() {
  return null;
}
