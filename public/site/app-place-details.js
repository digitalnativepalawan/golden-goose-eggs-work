// ═══════════════════════════════════════════════════════
// PLACE DETAILS — the practical half of a listing
// ═══════════════════════════════════════════════════════
// A listing used to be a name, a photo and a description. This is where the
// things a visitor actually needs go: where it is, how to reach it, what it
// costs, how to contact it, where else it lives online, and what it has.
// Stored in five small tables rather than forty columns on destinations.
let AMENITY_VOCAB = [];
let __adminDetails = null;
let __adminContacts = [];
let __adminLinks = [];
let __adminAmenities = new Set();
let __adminPayments = new Set();
const PAYMENT_OPTIONS = ["Cash", "GCash", "Maya", "Card", "Bank transfer"];
const CONTACT_KINDS = [
  ["phone", "Phone"],
  ["mobile", "Mobile"],
  ["whatsapp", "WhatsApp"],
  ["viber", "Viber"],
  ["email", "Email"],
  ["messenger", "Messenger"],
  ["other", "Other"],
];
const LINK_KINDS = [
  ["website", "Website"],
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
  ["google", "Google Profile"],
  ["booking", "Booking.com"],
  ["agoda", "Agoda"],
  ["airbnb", "Airbnb"],
  ["messenger", "Messenger"],
  ["other", "Other"],
];
const AMENITY_GROUP_ORDER = [
  "Room",
  "Facilities",
  "Food",
  "Activities",
  "Services",
  "Policies",
  "Access",
];

async function loadAmenityVocab() {
  if (AMENITY_VOCAB.length) return AMENITY_VOCAB;
  try {
    const { data, error } = await sb
      .from("amenities")
      .select("key,label,icon,grp,sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    AMENITY_VOCAB = data || [];
  } catch (err) {
    console.warn("[SANVIC] Amenity list failed to load:", err);
  }
  return AMENITY_VOCAB;
}

// Everything that hangs off one place, in a single request: all four child
// tables reference the place itself, so they come back together.
async function adminFetchPlaceExtras(id) {
  __adminDetails = null;
  __adminContacts = [];
  __adminLinks = [];
  __adminAmenities = new Set();
  __adminPayments = new Set();
  if (id === "new" || id == null) return;
  try {
    const { data, error } = await sb
      .from("destinations")
      .select("id,place_details(*),place_contacts(*),place_links(*),place_amenities(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return;
    __adminDetails =
      (data.place_details && data.place_details[0]) ||
      (Array.isArray(data.place_details) ? null : data.place_details) ||
      null;
    __adminContacts = (data.place_contacts || []).sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
    );
    __adminLinks = (data.place_links || []).sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
    );
    __adminAmenities = new Set((data.place_amenities || []).map((r) => r.amenity_key));
    __adminPayments = new Set((__adminDetails && __adminDetails.payment_methods) || []);
  } catch (err) {
    console.warn("[SANVIC] Place details failed to load:", err);
  }
}

function adminPlaceField(id, label, value, placeholder, hint) {
  return `<div class="admin-field"><label>${label}</label>
    <input id="${id}" value="${escapeHtml(value || "")}" placeholder="${escapeHtml(placeholder || "")}">
    ${hint ? `<div class="admin-hint">${hint}</div>` : ""}</div>`;
}

function adminContactsHtml() {
  return `<div class="admin-field"><label>Phones &amp; messages</label>
    <div class="admin-rows">
      ${__adminContacts
        .map(
          (c, i) => `
        <div class="admin-row">
          <select onchange="__adminContacts[${i}].kind=this.value" style="max-width:130px">
            ${CONTACT_KINDS.map(([k, l]) => `<option value="${k}"${c.kind === k ? " selected" : ""}>${l}</option>`).join("")}
          </select>
          <input value="${escapeHtml(c.value || "")}" placeholder="e.g. 0917 000 0000" oninput="__adminContacts[${i}].value=this.value">
          <input value="${escapeHtml(c.label || "")}" placeholder="Label (Front desk)" oninput="__adminContacts[${i}].label=this.value" style="max-width:150px">
          <button type="button" class="admin-row-x" onclick="adminRemoveContact(${i})" aria-label="Remove">${lucideSvg("trash-2", 14)}</button>
        </div>`,
        )
        .join("")}
    </div>
    <button type="button" class="admin-add-btn" onclick="adminAddContact()">+ Add contact</button>
  </div>`;
}
function adminAddContact() {
  __adminContacts.push({ kind: "phone", value: "", label: "" });
  renderAdminPlaceExtras();
}
function adminRemoveContact(i) {
  __adminContacts.splice(i, 1);
  renderAdminPlaceExtras();
}

function adminLinksHtml() {
  return `<div class="admin-field"><label>Online</label>
    <div class="admin-rows">
      ${__adminLinks
        .map(
          (l, i) => `
        <div class="admin-row">
          <select onchange="__adminLinks[${i}].kind=this.value" style="max-width:140px">
            ${LINK_KINDS.map(([k, lab]) => `<option value="${k}"${l.kind === k ? " selected" : ""}>${lab}</option>`).join("")}
          </select>
          <input value="${escapeHtml(l.url || "")}" placeholder="https://…" oninput="__adminLinks[${i}].url=this.value">
          <button type="button" class="admin-row-x" onclick="adminRemoveLink(${i})" aria-label="Remove">${lucideSvg("trash-2", 14)}</button>
        </div>`,
        )
        .join("")}
    </div>
    <button type="button" class="admin-add-btn" onclick="adminAddLink()">+ Add link</button>
  </div>`;
}
function adminAddLink() {
  __adminLinks.push({ kind: "facebook", url: "", label: "" });
  renderAdminPlaceExtras();
}
function adminRemoveLink(i) {
  __adminLinks.splice(i, 1);
  renderAdminPlaceExtras();
}

function adminAmenitiesHtml() {
  if (!AMENITY_VOCAB.length) {
    return `<div class="admin-field"><label>What it has</label><div class="admin-hint">Loading the amenity list…</div></div>`;
  }
  const groups = AMENITY_GROUP_ORDER.filter((g) => AMENITY_VOCAB.some((a) => a.grp === g));
  const others = AMENITY_VOCAB.filter((a) => AMENITY_GROUP_ORDER.indexOf(a.grp) < 0)
    .map((a) => a.grp)
    .filter((v, i, arr) => v && arr.indexOf(v) === i);
  return `<div class="admin-field"><label>What it has</label>
    ${groups
      .concat(others)
      .map(
        (g) => `
      <div class="admin-amenity-group">
        <div class="admin-amenity-title">${escapeHtml(g || "Other")}</div>
        <div class="admin-amenity-list">
          ${AMENITY_VOCAB.filter((a) => (a.grp || "Other") === (g || "Other"))
            .map(
              (a) => `
            <label class="admin-amenity">
              <input type="checkbox" ${__adminAmenities.has(a.key) ? "checked" : ""} onchange="adminToggleAmenity('${a.key}',this.checked)">
              <span>${a.icon ? lucideSvg(a.icon, 13) : ""} ${escapeHtml(a.label)}</span>
            </label>`,
            )
            .join("")}
        </div>
      </div>`,
      )
      .join("")}
    <div class="admin-hint">Tick what the place actually has. These become filterable later, so keep them honest.</div>
  </div>`;
}
function adminToggleAmenity(key, on) {
  if (on) __adminAmenities.add(key);
  else __adminAmenities.delete(key);
}

function adminPlaceExtrasHtml() {
  const d = __adminDetails || {};
  return `
    <div class="admin-group-title">Where it is and how to reach it</div>
    ${adminPlaceField("adpAddress", "Street address or landmark", d.address, "Sitio Marikit, Barangay Poblacion")}
    ${adminPlaceField("adpPlus", "Plus code (optional)", d.plus_code, "7Q34+XX San Vicente")}
    ${adminPlaceField("adpLandmark", "Nearest landmark", d.landmark, "Beside the church, 200 m past the port")}
    <div class="admin-field"><label>How to get there</label>
      <textarea id="adpHowTo" rows="2" placeholder="Tricycle from Poblacion, 15 minutes, ₱150. Boat from Port Barton in high season.">${escapeHtml(d.how_to_get || "")}</textarea></div>

    <div class="admin-group-title">Opening, prices and policy</div>
    ${adminPlaceField("adpHours", "Opening hours", d.hours, "Daily 7am to 9pm, closed Mondays")}
    ${adminPlaceField("adpBestTime", "Best time to go", d.best_time, "Low tide in the morning, sunset on the west side")}
    <div class="admin-grid-3">
      <div class="admin-field"><label>Price band</label>
        <select id="adpPriceRange">
          <option value=""${!d.price_range ? " selected" : ""}>—</option>
          ${["₱", "₱₱", "₱₱₱"].map((v) => `<option value="${v}"${d.price_range === v ? " selected" : ""}>${v}</option>`).join("")}
        </select></div>
      <div class="admin-field"><label>From price</label><input id="adpPriceFrom" value="${d.price_from != null ? escapeHtml(String(d.price_from)) : ""}" placeholder="2500"></div>
      <div class="admin-field"><label>Per</label>
        <select id="adpPriceUnit">
          ${["", "night", "person", "plate", "trip", "hour"].map((v) => `<option value="${v}"${(d.price_unit || "") === v ? " selected" : ""}>${v || "—"}</option>`).join("")}
        </select></div>
    </div>
    <div class="admin-grid-2">
      ${adminPlaceField("adpEntrance", "Entrance fee (if any)", d.entrance_fee, "₱50 per person, guides ₱500")}
      ${adminPlaceField("adpLanguages", "Languages spoken", (d.languages || []).join(", "), "English, Filipino, Cuyonon")}
    </div>
    <div class="admin-grid-2">
      ${adminPlaceField("adpCheckIn", "Check-in", d.check_in, "2pm")}
      ${adminPlaceField("adpCheckOut", "Check-out", d.check_out, "11am")}
    </div>
    <div class="admin-field"><label>Payment methods</label>
      <div class="admin-amenity-list">
        ${PAYMENT_OPTIONS.map(
          (p) => `
          <label class="admin-amenity">
            <input type="checkbox" ${__adminPayments.has(p) ? "checked" : ""} onchange="adminTogglePayment('${p}',this.checked)">
            <span>${escapeHtml(p)}</span>
          </label>`,
        ).join("")}
      </div>
    </div>
    <div class="admin-field"><label>House rules, deposit or cancellation policy</label>
      <textarea id="adpPolicies" rows="2" placeholder="50% deposit to hold a room. Free cancellation 7 days before. No loud music after 10pm.">${escapeHtml(d.policies || "")}</textarea></div>
    ${adminPlaceField("adpAccess", "Accessibility", d.accessibility, "Two ground floor rooms, step-free path to the restaurant")}

    <div class="admin-group-title">Contacts</div>
    ${adminContactsHtml()}

    <div class="admin-group-title">Links</div>
    ${adminLinksHtml()}

    <div class="admin-group-title">Facilities</div>
    ${adminAmenitiesHtml()}

    <div class="admin-group-title">Where this information came from</div>
    <div class="admin-grid-2">
      ${adminPlaceField("adpSource", "Source", d.source, "Owner, Google profile, OSM, local office")}
      ${adminPlaceField("adpVerifiedBy", "Checked by", d.verified_by, "Your name")}
    </div>
    <div class="admin-field">
      <label class="admin-amenity" style="width:auto;display:inline-flex">
        <input type="checkbox" id="adpVerified" ${d.verified_at ? "checked" : ""}>
        <span>Details confirmed with the property</span>
      </label>
      <div class="admin-hint">${d.verified_at ? "Last confirmed " + escapeHtml(String(d.verified_at).slice(0, 10)) + ". Unticking clears the date." : "Tourist information goes stale. Tick this when someone actually checked it."}</div>
    </div>`;
}
function adminTogglePayment(p, on) {
  if (on) __adminPayments.add(p);
  else __adminPayments.delete(p);
}
function renderAdminPlaceExtras() {
  const box = document.getElementById("adpExtras");
  if (box) box.innerHTML = adminPlaceExtrasHtml();
}

function adpText(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}
function adpChecked(id) {
  const el = document.getElementById(id);
  return !!(el && el.checked);
}

// Writes the practical block, then replaces the contact, link and amenity sets.
// Everything is keyed on place_id, so a replace is the simplest correct thing.
async function adminSavePlaceExtras(placeId) {
  if (!placeId) return;
  const priceFrom = parseFloat(adpText("adpPriceFrom"));
  const details = {
    place_id: placeId,
    address: adpText("adpAddress") || null,
    plus_code: adpText("adpPlus") || null,
    landmark: adpText("adpLandmark") || null,
    how_to_get: adpText("adpHowTo") || null,
    hours: adpText("adpHours") || null,
    best_time: adpText("adpBestTime") || null,
    price_range: adpText("adpPriceRange") || null,
    price_from: isNaN(priceFrom) ? null : priceFrom,
    price_unit: adpText("adpPriceUnit") || null,
    entrance_fee: adpText("adpEntrance") || null,
    check_in: adpText("adpCheckIn") || null,
    check_out: adpText("adpCheckOut") || null,
    payment_methods: [...__adminPayments],
    languages: adpText("adpLanguages")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    policies: adpText("adpPolicies") || null,
    accessibility: adpText("adpAccess") || null,
    source: adpText("adpSource") || null,
    verified_by: adpText("adpVerifiedBy") || null,
    verified_at: adpChecked("adpVerified")
      ? (__adminDetails && __adminDetails.verified_at) || new Date().toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };
  const { error: dErr } = await sb
    .from("place_details")
    .upsert(details, { onConflict: "place_id" });
  if (dErr) throw dErr;

  const contacts = __adminContacts
    .filter((c) => c.value)
    .map((c, i) => ({
      place_id: placeId,
      kind: c.kind || "phone",
      value: c.value,
      label: c.label || null,
      sort_order: i,
    }));
  await sb.from("place_contacts").delete().eq("place_id", placeId);
  if (contacts.length) {
    const { error } = await sb.from("place_contacts").insert(contacts);
    if (error) throw error;
  }

  const links = __adminLinks
    .filter((l) => l.url)
    .map((l, i) => ({
      place_id: placeId,
      kind: l.kind || "website",
      url: l.url,
      label: l.label || null,
      sort_order: i,
    }));
  await sb.from("place_links").delete().eq("place_id", placeId);
  if (links.length) {
    const { error } = await sb.from("place_links").insert(links);
    if (error) throw error;
  }

  const amen = [...__adminAmenities].map((k) => ({ place_id: placeId, amenity_key: k }));
  await sb.from("place_amenities").delete().eq("place_id", placeId);
  if (amen.length) {
    const { error } = await sb.from("place_amenities").insert(amen);
    if (error) throw error;
  }
}

async function adminSaveDest() {
  if (!adminRequireWrite()) return;
  const saveBtn = document.getElementById("adfSaveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const video = await mediaUploadVideoIfNeeded("adf");
    const images = __mediaGallery.slice();
    const coverImage = images.shift() || "";

    const payload = {
      name: document.getElementById("adfName").value.trim(),
      lat: parseFloat(document.getElementById("adfLat").value),
      lng: parseFloat(document.getElementById("adfLng").value),
      category: document.getElementById("adfCat").value,
      color: document.getElementById("adfColor").value.trim() || "#0ea5e9",
      image: coverImage,
      images: images,
      description: document.getElementById("adfDesc").value.trim(),
      tip: document.getElementById("adfTip").value.trim(),
      rating: document.getElementById("adfRating").value.trim(),
      travel: document.getElementById("adfTravel").value.trim(),
      temp: document.getElementById("adfTemp").value.trim(),
      season: document.getElementById("adfSeason").value.trim(),
      video_url: video.url || null,
      video_type: video.type || null,
      featured: document.getElementById("adfFeatured").checked,
      barangay: document.getElementById("adfBarangay").value.trim(),
      google_business_url: document.getElementById("adfGbp").value.trim() || null,
      image_credit: document.getElementById("adfCredit").value.trim() || null,
      clue: document.getElementById("adfClue").value.trim() || null,
      hunt_spot: document.getElementById("adfHuntSpot").checked,
    };
    if (
      !payload.name ||
      isNaN(payload.lat) ||
      isNaN(payload.lng) ||
      !payload.category ||
      !payload.barangay ||
      !payload.description
    ) {
      alert(
        "Complete the required fields: name, map coordinates, category, barangay, and description.",
      );
      saveBtn.disabled = false;
      saveBtn.textContent = adminEditingDestId === "new" ? "Create listing" : "Save changes";
      return;
    }
    const insideSanVicente =
      payload.lat >= 10.25 &&
      payload.lat <= 10.78 &&
      payload.lng >= 118.95 &&
      payload.lng <= 119.45;
    if (
      !insideSanVicente &&
      !confirm("These coordinates appear to be outside San Vicente. Save this listing anyway?")
    ) {
      saveBtn.disabled = false;
      saveBtn.textContent = adminEditingDestId === "new" ? "Create listing" : "Save changes";
      return;
    }

    let placeId = adminEditingDestId;
    if (adminEditingDestId === "new") {
      payload.sort_order = destinations.length;
      const { data, error } = await sb.from("destinations").insert(payload).select("id").single();
      if (error) throw error;
      placeId = data && data.id;
    } else {
      const { error } = await sb.from("destinations").update(payload).eq("id", adminEditingDestId);
      if (error) throw error;
    }
    // Then everything that hangs off the place: its practical block, its phones,
    // its links and the amenities it has.
    await adminSavePlaceExtras(placeId);
    await loadDataFromSupabase();
    adminEditingDestId = null;
    renderAdminDest();
    rebuildMarkers();
  } catch (err) {
    alert("Save failed: " + (err.message || err));
    saveBtn.disabled = false;
    saveBtn.textContent = adminEditingDestId === "new" ? "Create listing" : "Save changes";
  }
}

async function adminDeleteDest(id) {
  if (!adminRequireWrite()) return;
  if (!confirm("Delete this destination?")) return;
  try {
    const { error } = await sb.from("destinations").delete().eq("id", id);
    if (error) throw error;
    await loadDataFromSupabase();
    renderAdminDest();
    rebuildMarkers();
  } catch (err) {
    alert("Delete failed: " + (err.message || err));
  }
}

// ───────────── TALA ADMIN ─────────────

let talaFilterCat = "all";
let talaSearchQuery = "";
let talaSuggestionsOpen = false;
let editingSuggestionId = null;
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function talaContentLength(text) {
  const len = (text || "").length;
  if (len < 150) return { label: "Short", cls: "short" };
  if (len < 500) return { label: "Medium", cls: "medium" };
  return { label: "Long", cls: "long" };
}

function adminToggleSuggestionsPanel() {
  talaSuggestionsOpen = !talaSuggestionsOpen;
  renderAdminTala();
}

function adminSuggestionsPanelHtml() {
  let html = `
    <div class="admin-field" style="font-size:.7rem;color:var(--white-dim);margin-bottom:10px;">
      These are the tappable suggestion chips shown when Tala opens. Set a date range to make one seasonal (e.g. surf season Nov 1\u2013Mar 31) \u2014 leave it blank to always show.
    </div>
    <button class="admin-add-btn" onclick="adminNewSuggestion()">+ Add suggestion</button>`;

  if (editingSuggestionId !== null) {
    html += adminSuggestionFormHtml();
  }

  if (!talaSuggestions.length) {
    html += `<div class="admin-empty">No suggestions yet.</div>`;
  } else {
    html += talaSuggestions
      .map((s) => {
        const active = isSuggestionActiveToday(s);
        const rangeLabel =
          s.active_from_month && s.active_to_month
            ? `${MONTH_NAMES[s.active_from_month - 1]} ${s.active_from_day || 1} \u2013 ${MONTH_NAMES[s.active_to_month - 1]} ${s.active_to_day || 28}`
            : "Always shown";
        return `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div onclick="adminEditSuggestion(${s.id})" style="flex:1;cursor:pointer;">
            <div class="admin-tala-badges">
              <span class="admin-len-pill" style="${active ? "color:#5eead4;background:rgba(20,184,166,.14)" : ""}">${active ? "Active now" : "Not active now"}</span>
              <span class="admin-len-pill">${rangeLabel}</span>
            </div>
            <strong>${escapeHtml(s.text)}</strong>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditSuggestion(${s.id})">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteSuggestion(${s.id})">Delete</button>
          </div>
        </div>
      </div>`;
      })
      .join("");
  }
  return html;
}

function adminSuggestionFormHtml() {
  const isNew = editingSuggestionId === "new";
  const s = isNew
    ? {
        text: "",
        active_from_month: "",
        active_from_day: "",
        active_to_month: "",
        active_to_day: "",
      }
    : talaSuggestions.find((x) => x.id === editingSuggestionId);
  if (!s) return "";
  const monthOptions = (selected) =>
    `<option value="">\u2014</option>` +
    MONTH_NAMES.map(
      (m, i) => `<option value="${i + 1}" ${selected == i + 1 ? "selected" : ""}>${m}</option>`,
    ).join("");
  return `
    <div class="admin-edit-box">
      <div class="admin-field"><label>Suggestion text</label><input id="asfText" value="${escapeHtml(s.text)}" placeholder="e.g. Best beaches in San Vicente"></div>
      <div class="admin-field" style="font-size:.68rem;color:var(--white-dim);">Optional seasonal range (leave all on \u2014 for always-on)</div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>From month</label><select id="asfFromM">${monthOptions(s.active_from_month)}</select></div>
        <div class="admin-field"><label>From day</label><input id="asfFromD" type="number" min="1" max="31" value="${s.active_from_day || ""}"></div>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>To month</label><select id="asfToM">${monthOptions(s.active_to_month)}</select></div>
        <div class="admin-field"><label>To day</label><input id="asfToD" type="number" min="1" max="31" value="${s.active_to_day || ""}"></div>
      </div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveSuggestion()">${isNew ? "Create" : "Save changes"}</button>
        <button class="admin-cancel-btn" onclick="editingSuggestionId=null;renderAdminTala();">Cancel</button>
      </div>
    </div>`;
}

function adminNewSuggestion() {
  editingSuggestionId = "new";
  renderAdminTala();
}
function adminEditSuggestion(id) {
  editingSuggestionId = id;
  renderAdminTala();
}

async function adminSaveSuggestion() {
  if (!adminRequireWrite()) return;
  const text = document.getElementById("asfText").value.trim();
  if (!text) {
    alert("Suggestion text is required.");
    return;
  }

  const fromM = document.getElementById("asfFromM").value;
  const fromD = document.getElementById("asfFromD").value;
  const toM = document.getElementById("asfToM").value;
  const toD = document.getElementById("asfToD").value;

  const payload = {
    text,
    active_from_month: fromM ? parseInt(fromM) : null,
    active_from_day: fromD ? parseInt(fromD) : null,
    active_to_month: toM ? parseInt(toM) : null,
    active_to_day: toD ? parseInt(toD) : null,
  };

  try {
    if (editingSuggestionId === "new") {
      payload.sort_order = talaSuggestions.length;
      const { error } = await sb.from("tala_suggestions").insert(payload);
      if (error) throw error;
    } else {
      const { error } = await sb
        .from("tala_suggestions")
        .update(payload)
        .eq("id", editingSuggestionId);
      if (error) throw error;
    }
    await loadDataFromSupabase();
    editingSuggestionId = null;
    renderAdminTala();
  } catch (err) {
    alert("Save failed: " + (err.message || err));
  }
}

async function adminDeleteSuggestion(id) {
  if (!adminRequireWrite()) return;
  if (!confirm("Delete this suggestion?")) return;
  try {
    const { error } = await sb.from("tala_suggestions").delete().eq("id", id);
    if (error) throw error;
    await loadDataFromSupabase();
    renderAdminTala();
  } catch (err) {
    alert("Delete failed: " + (err.message || err));
  }
}

// ───────────── TALA AI ADMIN (OpenRouter) ─────────────

const TALA_AI_DEFAULT_MODEL = "google/gemini-2.5-flash";
const TALA_AI_FALLBACK_MODELS = {
  free: [
    "google/gemini-2.5-flash",
    "qwen/qwen3-30b-a3b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
  ],
  paid: [
    "openai/gpt-4o-mini",
    "openai/gpt-4.1-mini",
    "anthropic/claude-3-5-haiku",
    "google/gemini-2.5-pro",
    "deepseek/deepseek-chat",
  ],
};
let talaAiModelsCache = null;

async function fetchOpenRouterModels() {
  if (talaAiModelsCache) return talaAiModelsCache;
  const free = [],
    paid = [];
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models");
    if (r.ok) {
      const j = await r.json();
      (j.data || []).forEach((m) => {
        const cost = parseFloat(m.pricing && m.pricing.prompt);
        (cost === 0 ? free : paid).push(m.id);
      });
      free.sort();
      paid.sort();
    }
  } catch (e) {
    /* offline — use curated fallback below */
  }
  talaAiModelsCache = {
    free: free.length ? free : TALA_AI_FALLBACK_MODELS.free.slice(),
    paid: paid.length ? paid : TALA_AI_FALLBACK_MODELS.paid.slice(),
  };
  return talaAiModelsCache;
}

async function renderAdminTalaAi() {
  const body = document.getElementById("adminBody");
  body.innerHTML = `
    <div class="admin-field" style="font-size:.72rem;color:var(--white-dim);margin-bottom:12px;line-height:1.6;">
      Route Tala's answers to a live AI model through OpenRouter. The OpenRouter API key is kept <strong style="color:var(--white-soft)">on the server only</strong> (Vercel → Settings → Environment Variables → <code>OPENROUTER_API_KEY</code>), so it never reaches visitors' browsers. Pick a model, turn live answers on and hit <strong style="color:var(--white-soft)">Save</strong>. If the AI fails, Tala falls back to the keyword answers in the <strong style="color:var(--white-soft)">Tala Answers</strong> tab.
    </div>
    <div class="admin-edit-box">
      <div class="admin-field">
        <label>Server key</label>
        <div id="aiServerStatus" style="font-size:.72rem;color:var(--white-dim);min-height:14px;">Checking…</div>
      </div>
      <div class="admin-toggle-row">
        <label>Live AI answers enabled</label>
        <input type="checkbox" id="aiEnabledCb">
      </div>
      <div class="admin-field" style="margin-top:12px">
        <label>Model</label>
        <select id="aiModelSel"><option>Loading models…</option></select>
      </div>
      <div class="admin-field">
        <label>Custom model ID <span style="text-transform:none;letter-spacing:0;color:var(--white-dim)">(overrides dropdown, e.g. google/gemini-2.5-flash)</span></label>
        <input type="text" id="aiModelCustom" placeholder="OpenRouter model id">
      </div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveAiConfig()">${lucideSvg("save", 14)} Save AI config</button>
        <button class="admin-cancel-btn" onclick="adminTestAi()">${lucideSvg("zap", 12)} Test</button>
      </div>
      <div id="aiTestOut" style="font-size:.72rem;margin-top:8px;color:var(--white-dim);min-height:14px;"></div>
    </div>
    <div class="admin-empty" style="padding:14px 0">Free &amp; paid models load here from openrouter.ai…</div>`;

  document.getElementById("aiEnabledCb").checked = !!talaAiEnabled;
  document.getElementById("aiModelCustom").value = talaAiModel || "";
  refreshAiServerStatus();

  const models = await fetchOpenRouterModels();
  const sel = document.getElementById("aiModelSel");
  if (!sel) return;
  const cur = talaAiModel;
  let html = "";
  if (models.free.length) {
    html += `<optgroup label="Free models">`;
    models.free.forEach((id) => {
      html += `<option value="${escapeHtml(id)}" ${cur === id ? "selected" : ""}>${escapeHtml(id)}</option>`;
    });
    html += `</optgroup>`;
  }
  if (models.paid.length) {
    html += `<optgroup label="Paid models">`;
    models.paid.forEach((id) => {
      html += `<option value="${escapeHtml(id)}" ${cur === id ? "selected" : ""}>${escapeHtml(id)}</option>`;
    });
    html += `</optgroup>`;
  }
  sel.innerHTML =
    html ||
    '<option value="' +
      escapeHtml(TALA_AI_DEFAULT_MODEL) +
      '">' +
      escapeHtml(TALA_AI_DEFAULT_MODEL) +
      "</option>";
}

// Asks our server whether OPENROUTER_API_KEY is set. Never exposes the key.
async function refreshAiServerStatus() {
  const out = document.getElementById("aiServerStatus");
  if (!out) return;
  try {
    const r = await fetch(TALA_API_URL, { headers: { Accept: "application/json" } });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) {
      out.innerHTML = `<span style="color:#f87171">${lucideSvg("x", 12)} The Tala server endpoint isn't reachable here (HTTP ${r.status}). Live AI only works once <code>/api/tala-chat</code> is deployed.</span>`;
    } else if (j.configured) {
      out.innerHTML = `<span style="color:#5eead4">${lucideSvg("check", 12)} OpenRouter key is set on the server.</span>`;
    } else {
      out.innerHTML = `<span style="color:#fbbf24">${lucideSvg("x", 12)} No key on the server yet. Add <code>OPENROUTER_API_KEY</code> in Vercel → Settings → Environment Variables, then redeploy.</span>`;
    }
  } catch (e) {
    out.innerHTML = `<span style="color:#f87171">${lucideSvg("x", 12)} Can't reach the Tala server: ${escapeHtml(String((e && e.message) || e).slice(0, 200))}</span>`;
  }
}

async function adminSaveAiConfig() {
  if (!adminRequireWrite()) return;
  const sel = document.getElementById("aiModelSel");
  const custom = document.getElementById("aiModelCustom").value.trim();
  const model = custom || (sel && sel.value) || TALA_AI_DEFAULT_MODEL;
  const enabled = document.getElementById("aiEnabledCb").checked;
  const out = document.getElementById("aiTestOut");
  out.textContent = "Saving…";
  out.style.color = "var(--white-dim)";
  try {
    const { error } = await sb.from("tala_settings").upsert([
      { key: "ai_enabled", value: enabled ? "true" : "false" },
      { key: "ai_model", value: model },
    ]);
    if (error) throw error;
    talaAiEnabled = enabled;
    talaAiModel = model;
    refreshAdminAiBadge();
    out.innerHTML = `<span style="color:#5eead4">${lucideSvg("check", 12)} Saved.</span> Live AI ${enabled ? "on" : "off"} · ${escapeHtml(model)}`;
  } catch (err) {
    out.textContent = "Save failed: " + (err.message || err);
    out.style.color = "#f87171";
  }
}

// Sends one real question through the server with the chosen (possibly
// unsaved) model. The server only honours a model override for admins, so
// we pass the signed-in session token.
async function adminTestAi() {
  const sel = document.getElementById("aiModelSel");
  const custom = document.getElementById("aiModelCustom").value.trim();
  const model = custom || (sel && sel.value) || TALA_AI_DEFAULT_MODEL;
  const out = document.getElementById("aiTestOut");
  out.textContent = "Asking " + model + "…";
  out.style.color = "var(--white-dim)";
  try {
    const headers = { "Content-Type": "application/json" };
    try {
      const { data } = await sb.auth.getSession();
      if (data && data.session && data.session.access_token)
        headers.Authorization = "Bearer " + data.session.access_token;
    } catch (_) {}
    const r = await fetch(TALA_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: "Say hello as tala, the warm San Vicente travel concierge. Under 10 words.",
          },
        ],
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) {
      const used =
        j.model && j.model !== model
          ? ` <span style="color:#fbbf24">(answered by saved model ${escapeHtml(j.model)}; sign in as admin to test other models)</span>`
          : "";
      out.innerHTML = `<span style="color:#5eead4">${lucideSvg("check", 12)} Reply:</span> ${escapeHtml(String(j.reply).slice(0, 300))}${used}`;
    } else {
      out.innerHTML = `<span style="color:#f87171">${lucideSvg("x", 12)} ${escapeHtml(String((j && j.error) || "HTTP " + r.status).slice(0, 240))}</span>`;
    }
  } catch (err) {
    out.textContent = "Request failed: " + (err.message || err);
    out.style.color = "#f87171";
  }
}

// ───────────── SITE SETTINGS ADMIN (hero title/subtitle) ─────────────

function renderAdminSite() {
  const body = document.getElementById("adminBody");
  body.innerHTML = `
    <div class="admin-field" style="margin-top:4px;">
      <label>Hero title (shown over the map — basic HTML like &lt;br&gt; and &lt;em&gt; allowed)</label>
      <textarea id="adsHeroTitle" rows="2" onblur="adminSaveHeroTitle()">${escapeHtml(heroTitle)}</textarea>
    </div>
    <div class="admin-field">
      <label>Hero subtitle (optional, smaller line under the title)</label>
      <textarea id="adsHeroSubtitle" rows="2" onblur="adminSaveHeroSubtitle()">${escapeHtml(heroSubtitle)}</textarea>
    </div>
    <div class="admin-field" style="margin-top:18px;">
      <label>Loading screen subtext (the 2-line tagline under the SANVIC logo — use &lt;br&gt; for the line break)</label>
      <textarea id="adsSplashSubtext" rows="2" onblur="adminSaveSplashSubtext()">${escapeHtml(splashSubtext)}</textarea>
    </div>
    <div class="admin-field">
      <label>Loading screen footer (small caps text at the bottom of the loader)</label>
      <textarea id="adsSplashFooter" rows="1" onblur="adminSaveSplashFooter()">${escapeHtml(splashFooter)}</textarea>
    </div>
    <div class="admin-field" style="margin-top:18px;">
      <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
        <input type="checkbox" id="adsExploreFilters" onchange="adminSaveExploreFilters(this.checked)" ${exploreFiltersVisible ? "checked" : ""} style="margin-top:3px;width:18px;height:18px;accent-color:#14b8a6;flex-shrink:0;">
        <span>Explore map: show the search box and the “All barangays / Near me” row<br><span style="opacity:.62;font-size:.86em;">Off keeps Explore compact. Nothing is deleted — tick this and both come back for every visitor.</span></span>
      </label>
    </div>
    <div class="admin-empty" style="margin-top:6px;">Saves automatically when you click away from a field. Changes appear for every visitor.</div>`;
}

async function adminSaveExploreFilters(on) {
  if (!adminRequireWrite()) return;
  const value = on ? "true" : "false";
  try {
    const { error } = await sb.from("site_settings").upsert({ key: "explore_filters", value });
    if (error) throw error;
    exploreFiltersVisible = !!on;
    applyExploreFiltersVisibility();
  } catch (err) {
    alert("Save failed: " + (err.message || err));
    renderAdminSite();
  }
}

async function adminSaveHeroTitle() {
  if (!adminRequireWrite()) return;
  const val = document.getElementById("adsHeroTitle").value.trim();
  if (val === heroTitle) return;
  const finalVal = val || DEFAULT_HERO_TITLE;
  try {
    const { error } = await sb.from("site_settings").upsert({ key: "hero_title", value: finalVal });
    if (error) throw error;
    heroTitle = finalVal;
    applyHeroText();
  } catch (err) {
    alert("Save failed: " + (err.message || err));
  }
}

async function adminSaveHeroSubtitle() {
  if (!adminRequireWrite()) return;
  const val = document.getElementById("adsHeroSubtitle").value.trim();
  if (val === heroSubtitle) return;
  try {
    const { error } = await sb.from("site_settings").upsert({ key: "hero_subtitle", value: val });
    if (error) throw error;
    heroSubtitle = val;
    applyHeroText();
  } catch (err) {
    alert("Save failed: " + (err.message || err));
  }
}

async function adminSaveSplashSubtext() {
  if (!adminRequireWrite()) return;
  const val = document.getElementById("adsSplashSubtext").value.trim();
  if (val === splashSubtext) return;
  const finalVal = val || DEFAULT_SPLASH_SUBTEXT;
  try {
    const { error } = await sb
      .from("site_settings")
      .upsert({ key: "splash_subtext", value: finalVal });
    if (error) throw error;
    splashSubtext = finalVal;
    applySplashText();
  } catch (err) {
    alert("Save failed: " + (err.message || err));
  }
}

async function adminSaveSplashFooter() {
  if (!adminRequireWrite()) return;
  const val = document.getElementById("adsSplashFooter").value.trim();
  if (val === splashFooter) return;
  const finalVal = val || DEFAULT_SPLASH_FOOTER;
  try {
    const { error } = await sb
      .from("site_settings")
      .upsert({ key: "splash_footer", value: finalVal });
    if (error) throw error;
    splashFooter = finalVal;
    applySplashText();
  } catch (err) {
    alert("Save failed: " + (err.message || err));
  }
}

// ───────────── REUSABLE MEDIA UPLOAD ─────────────
// Shared by Destinations, Tribes, Events admin forms.
// Manages an array of image URLs + optional YouTube/uploaded video.
// ──────────────────────────────────────────────────

let __mediaGallery = []; // current image URLs being edited
let __mediaPrefix = "item"; // storage path prefix (dest_, tribe_, event_)
const PULSE_ADMIN_SAMPLE_MEDIA = [
  ["assets/pulse/island-boats-beach.jpg", "Long Beach boats"],
  ["assets/pulse/island-boats-aerial.jpg", "Island boats"],
  ["assets/pulse/kayak-lagoon.jpg", "Kayak lagoon"],
  ["assets/pulse/street-food-skewers.jpg", "Street food"],
  ["assets/pulse/bulalo-boodle.jpg", "Local meal"],
  ["assets/san-vicente-long-beach.jpg", "San Vicente beach"],
  ["assets/san-vicente-waterfalls.jpg", "Waterfalls"],
  ["assets/sample-stay-room.jpg", "Guesthouse room"],
  ["assets/sample-stay-amenities.jpg", "Lodging amenities"],
  ["assets/sample-palawan-food.jpg", "Local dishes"],
  ["assets/sample-palawan-cafe.jpg", "Cafe setting"],
  ["assets/sample-palawan-adventure.jpg", "Island activity"],
  ["assets/sample-palawan-local-stop.jpg", "Local shop"],
  ["assets/sample-palawan-viewpoint.jpg", "Coastal viewpoint"],
];

// One thumbnail, shared by every gallery in the Backoffice so the add / edit /
// delete affordances cannot drift apart. Index 0 is the cover — the hero photo
// of a destination, the thumbnail of a tribe — so every other thumb carries a
// star that moves it to the front.
function mediaThumbHtml(url, i, delCall, coverCall) {
  return `
    <div class="admin-media-thumb">
      <img src="${escT(url)}" alt="" onerror="this.parentElement.style.display='none'">
      ${
        i === 0
          ? '<span class="admin-media-cover-tag" >Cover</span>'
          : coverCall
            ? `<button class="admin-media-cover-btn" aria-label="Make this the cover" onclick="${coverCall}">${lucideSvg("star", 12)}</button>`
            : ""
      }
      <button class="admin-media-del" aria-label="Remove this image" onclick="${delCall}">${lucideSvg("x", 14)}</button>
    </div>`;
}

function mediaGalleryHtml(containerId, prefix) {
  __mediaPrefix = prefix || "item";
  __mediaActiveContainer = containerId;
  const imgs = (__mediaGallery || [])
    .map((url, i) =>
      mediaThumbHtml(
        url,
        i,
        `mediaRemoveImage(${i},'${containerId}')`,
        `mediaMakeCover(${i},'${containerId}')`,
      ),
    )
    .join("");
  return `
    <label>Photos — choose as many as you like, drag a batch in, or paste a screenshot</label>
    <p class="admin-hint">For accommodations, include rooms, bathrooms, views and amenities. For restaurants and cafés, include menu pages, dishes, drinks and dining areas. The first image is the cover; the rest appear in the photo gallery.</p>
    <div class="admin-media-grid" id="${containerId}Gallery"
         ondragover="event.preventDefault();this.classList.add('is-drag')"
         ondragleave="this.classList.remove('is-drag')"
         ondrop="mediaDrop(event,'${containerId}')">${imgs}
      <label class="admin-media-add">
        <input type="file" accept="image/*" multiple onchange="mediaUploadFile(this,'${containerId}')" hidden>
        <span>+</span><small>Add photos</small>
      </label>
    </div>
    <div class="admin-sample-picker" aria-label="Illustrative sample photos">
      <div class="admin-sample-picker-heading"><strong>Or use a sample photo</strong><span>Clearly illustrative · replace before launch</span></div>
      <div class="admin-sample-picker-list">${PULSE_ADMIN_SAMPLE_MEDIA.map(
        ([url, label]) =>
          `<button type="button" class="admin-sample-photo" onclick="legacyMediaAddSample('${containerId}','${url}')" aria-label="Add illustrative sample photo: ${label}"><img src="${url}" alt=""><span>${label}</span></button>`,
      ).join("")}</div>
    </div>
    <div class="admin-media-status" id="${containerId}MediaStatus"></div>
    <div style="display:flex;gap:6px;margin-top:6px;">
      <input id="${containerId}UrlInput" placeholder="Or paste image URL…" style="flex:1;padding:7px 10px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
      <button class="admin-mini-btn" onclick="mediaAddUrl('${containerId}')">Add URL</button>
    </div>`;
}

function mediaAddUrl(containerId) {
  const inp = document.getElementById(containerId + "UrlInput");
  const url = (inp.value || "").trim();
  if (!url) return;
  __mediaGallery.push(url);
  inp.value = "";
  mediaRefreshGrid(containerId);
}

function legacyMediaAddSample(containerId, url) {
  if (!PULSE_ADMIN_SAMPLE_MEDIA.some(([sample]) => sample === url)) {
    mediaSetStatus(containerId, "Choose a sample from the provided list.", true);
    return;
  }
  if (__mediaGallery.includes(url)) {
    mediaSetStatus(containerId, "That sample photo is already in this listing.", true);
    return;
  }
  __mediaGallery.push(url);
  const creditId =
    containerId === "atbf"
      ? "atbfCredit"
      : containerId === "aevf"
        ? "aevfCredit"
        : containerId === "adf"
          ? "adfCredit"
          : "";
  const credit = creditId && document.getElementById(creditId);
  if (credit && !credit.value.trim())
    credit.value = "Illustrative sample photo · replace before launch";
  mediaSetStatus(
    containerId,
    "Illustrative sample photo added. Replace it with a real photo before launch.",
  );
  mediaRefreshGrid(containerId);
}

// ── FAST PHOTO ADDING ─────────────────────────────────────────────────────
// Adding photos one at a time from a phone was the slowest part of listing a
// place. Now: pick as many as you like, drag a batch onto the grid, or paste a
// screenshot. They go up three at a time, and each phone photo is shrunk first,
// which is usually the difference between thirty seconds and three.
let __mediaActiveContainer = "";

function mediaSetStatus(containerId, text, isError) {
  const el = document.getElementById(containerId + "MediaStatus");
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("is-error", !!isError);
}

// Phone photos run 4-12 MB. Downscale to 2400px wide before sending. Anything
// already small, or anything the browser cannot decode, goes up untouched.
async function mediaShrinkImage(file) {
  try {
    if (!/^image\//.test(file.type || "") || file.type === "image/gif") return file;
    if (file.size < 400 * 1024) return file;
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2400 / bmp.width);
    if (scale === 1 && file.size < 1500 * 1024) return file;
    const w = Math.round(bmp.width * scale),
      h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch (e) {
    return file;
  }
}

function mediaDrop(ev, containerId) {
  ev.preventDefault();
  if (ev.currentTarget) ev.currentTarget.classList.remove("is-drag");
  const files = ev.dataTransfer ? ev.dataTransfer.files : null;
  if (files && files.length) mediaUploadFiles(files, containerId);
}

function mediaUploadFile(input, containerId) {
  const files = input && input.files ? [...input.files] : [];
  if (files.length) mediaUploadFiles(files, containerId);
  if (input) input.value = "";
}

async function mediaUploadFiles(files, containerId) {
  if (!adminRequireWrite()) return;
  const list = [...(files || [])].filter((f) => /^image\//.test(f.type || ""));
  if (!list.length) return;
  __mediaActiveContainer = containerId;
  const before = __mediaGallery.length;
  const queue = list.slice();
  let finished = 0,
    failed = 0;
  mediaSetStatus(containerId, `Uploading ${list.length} photo${list.length === 1 ? "" : "s"}…`);
  const uploadOne = async () => {
    while (queue.length) {
      const file = queue.shift();
      try {
        const small = await mediaShrinkImage(file);
        const ext =
          ((small.name || "").split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
          "jpg";
        const path =
          __mediaPrefix +
          "_" +
          Date.now() +
          "_" +
          Math.random().toString(36).slice(2, 8) +
          "." +
          ext;
        const { error } = await sb.storage.from("destination-images").upload(path, small, {
          cacheControl: "3600",
          upsert: false,
          contentType: small.type || "image/jpeg",
        });
        if (error) throw error;
        const { data } = sb.storage.from("destination-images").getPublicUrl(path);
        if (!data || !data.publicUrl) throw new Error("no public URL returned");
        __mediaGallery.push(data.publicUrl);
        mediaRefreshGrid(containerId);
      } catch (e) {
        failed++;
        console.warn("[SANVIC] Photo upload failed:", e);
      }
      finished++;
      mediaSetStatus(
        containerId,
        finished < list.length ? `Uploaded ${finished} of ${list.length}…` : "",
        false,
      );
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, list.length) }, uploadOne));
  const added = __mediaGallery.length - before;
  mediaSetStatus(
    containerId,
    failed
      ? `${added} added, ${failed} failed. Try those again.`
      : `${added} photo${added === 1 ? "" : "s"} added.`,
    failed > 0,
  );
}

// Paste straight into whichever listing is open.
document.addEventListener("paste", (e) => {
  const overlay = document.getElementById("adminPanelOverlay");
  if (!overlay || !overlay.classList.contains("active")) return;
  if (!__mediaActiveContainer) return;
  const files = e.clipboardData ? [...(e.clipboardData.files || [])] : [];
  const imgs = files.filter((f) => /^image\//.test(f.type || ""));
  if (!imgs.length) return;
  e.preventDefault();
  mediaUploadFiles(imgs, __mediaActiveContainer);
});

function mediaRemoveImage(idx, containerId) {
  __mediaGallery.splice(idx, 1);
  mediaRefreshGrid(containerId);
}

// Choosing the cover is a move, not a separate field: the first gallery image
// becomes destinations.image / tribes.thumb_url on save.
function mediaMakeCover(idx, containerId) {
  if (idx <= 0 || idx >= (__mediaGallery || []).length) return;
  const [url] = __mediaGallery.splice(idx, 1);
  __mediaGallery.unshift(url);
  mediaRefreshGrid(containerId);
}

function mediaRefreshGrid(containerId) {
  const grid = document.getElementById(containerId + "Gallery");
  if (!grid) return;
  const addBtn = grid.querySelector(".admin-media-add");
  const thumbs = (__mediaGallery || [])
    .map((url, i) =>
      mediaThumbHtml(
        url,
        i,
        `mediaRemoveImage(${i},'${containerId}')`,
        `mediaMakeCover(${i},'${containerId}')`,
      ),
    )
    .join("");
  grid.innerHTML =
    thumbs +
    (addBtn
      ? addBtn.outerHTML
      : `<label class="admin-media-add"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="mediaUploadFile(this,'${containerId}')" hidden><span>+</span></label>`);
}

function mediaVideoHtml(containerId, currentUrl, currentType) {
  const vType = currentType || "none";
  return `
    <div class="admin-field">
      <label>Video (shown instead of gallery when set)</label>
      <select id="${containerId}VideoType" onchange="document.getElementById('${containerId}YoutubeWrap').style.display=this.value==='youtube'?'':'none';document.getElementById('${containerId}UploadWrap').style.display=this.value==='upload'?'':'none';">
        <option value="none" ${vType === "none" ? "selected" : ""}>No video</option>
        <option value="youtube" ${vType === "youtube" ? "selected" : ""}>YouTube URL</option>
        <option value="upload" ${vType === "upload" ? "selected" : ""}>Upload from device</option>
      </select>
    </div>
    <div class="admin-field" id="${containerId}YoutubeWrap" style="display:${vType === "youtube" ? "" : "none"}">
      <label>YouTube URL</label>
      <input id="${containerId}YoutubeUrl" value="${vType === "youtube" ? escapeHtml(currentUrl || "") : ""}" placeholder="https://youtube.com/watch?v=…">
    </div>
    <div class="admin-field" id="${containerId}UploadWrap" style="display:${vType === "upload" ? "" : "none"}">
      <label>Video file (mp4/webm, up to 100MB)</label>
      <input type="file" id="${containerId}VideoFile" accept="video/mp4,video/webm,video/quicktime">
      ${vType === "upload" && currentUrl ? '<div style="font-size:.68rem;color:var(--white-dim);margin-top:4px;">Current: <a href="' + currentUrl + '" target="_blank" style="color:var(--ocean-teal-light)">view video</a></div>' : ""}
      <input type="hidden" id="${containerId}VideoUploadedUrl" value="${vType === "upload" ? escapeHtml(currentUrl || "") : ""}">
    </div>`;
}

async function mediaUploadVideoIfNeeded(containerId) {
  const type = document.getElementById(containerId + "VideoType");
  if (!type) return { url: null, type: null };
  const vType = type.value;
  if (vType === "youtube") {
    return {
      url: (document.getElementById(containerId + "YoutubeUrl") || {}).value || "",
      type: "youtube",
    };
  }
  if (vType === "upload") {
    const fileInput = document.getElementById(containerId + "VideoFile");
    const hiddenUrl = (document.getElementById(containerId + "VideoUploadedUrl") || {}).value || "";
    if (fileInput && fileInput.files[0]) {
      const file = fileInput.files[0];
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const path =
        __mediaPrefix +
        "_vid_" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2, 8) +
        "." +
        ext;
      const { error } = await sb.storage.from("destination-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "video/mp4",
      });
      if (error) throw error;
      const { data } = sb.storage.from("destination-images").getPublicUrl(path);
      return { url: data.publicUrl, type: "upload" };
    }
    return { url: hiddenUrl || null, type: hiddenUrl ? "upload" : null };
  }
  return { url: null, type: null };
}

// ───────────── TODAY ADMIN ─────────────
let adminTodayData = null;

async function loadTodayContent() {
  try {
    const { data, error } = await sb.from("today_content").select("key,data");
    if (error) throw error;
    if (data && data.length) {
      adminTodayData = {};
      data.forEach((r) => {
        adminTodayData[r.key] = r.data;
      });
    }
  } catch (e) {
    console.warn("[ADMIN] today_content load failed:", e);
  }
  if (!adminTodayData) adminTodayData = JSON.parse(JSON.stringify(TODAY_DATA));
}

// ───────────── TODAY ADMIN ─────────────
let __todayHappeningGalleries = {};
let __todayLocalGalleries = {};
let __todayNextHid = 0;
let __todayNextLid = 0;

function todayItemGalleryHtml(itemId, prefix, galleryMap, itemLabel, credit) {
  const imgs = (galleryMap[itemId] || [])
    .map((url, i) =>
      mediaThumbHtml(
        url,
        i,
        `todayRemoveItemImage('${itemId}',${i},'${prefix}')`,
        `todayMakeItemCover('${itemId}',${i},'${prefix}')`,
      ),
    )
    .join("");
  return `
    <label>Gallery images (tap + to upload from device, or paste a URL)</label>
    <div class="admin-media-grid" id="${prefix}${itemId}Gallery">${imgs}
      <label class="admin-media-add">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="todayUploadItemImage(this,'${itemId}','${prefix}')" hidden>
        <span>+</span>
      </label>
    </div>
    <div style="display:flex;gap:6px;margin-top:6px;">
      <input id="${prefix}${itemId}UrlInput" placeholder="Or paste image URL…" style="flex:1;padding:7px 10px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
      <button class="admin-mini-btn" onclick="todayAddItemImageUrl('${itemId}','${prefix}')">Add URL</button>
    </div>
    <label style="margin-top:8px;">Photo credit (only required for CC BY / CC BY-SA photos)</label>
    <input id="${prefix}${itemId}Credit" value="${escT(credit || "")}" placeholder="e.g. Photo: Jane Doe, Wikimedia Commons, CC BY 4.0 — leave empty for public domain or CC0" style="width:100%;padding:7px 10px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">`;
}

function todayAddItemImageUrl(itemId, prefix) {
  const inp = document.getElementById(prefix + itemId + "UrlInput");
  const url = (inp.value || "").trim();
  if (!url) return;
  if (prefix === "happening") {
    if (!__todayHappeningGalleries[itemId]) __todayHappeningGalleries[itemId] = [];
    __todayHappeningGalleries[itemId].push(url);
  } else {
    if (!__todayLocalGalleries[itemId]) __todayLocalGalleries[itemId] = [];
    __todayLocalGalleries[itemId].push(url);
  }
  inp.value = "";
  todayRefreshItemGallery(itemId, prefix);
}

async function todayUploadItemImage(input, itemId, prefix) {
  if (!adminRequireWrite()) {
    if (input) input.value = "";
    return;
  }
  const file = input.files[0];
  if (!file) return;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path =
    "today_" + prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8) + "." + ext;
  try {
    const { error } = await sb.storage.from("destination-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });
    if (error) throw error;
    const { data } = sb.storage.from("destination-images").getPublicUrl(path);
    if (data && data.publicUrl) {
      if (prefix === "happening") {
        if (!__todayHappeningGalleries[itemId]) __todayHappeningGalleries[itemId] = [];
        __todayHappeningGalleries[itemId].push(data.publicUrl);
      } else {
        if (!__todayLocalGalleries[itemId]) __todayLocalGalleries[itemId] = [];
        __todayLocalGalleries[itemId].push(data.publicUrl);
      }
      todayRefreshItemGallery(itemId, prefix);
    }
  } catch (e) {
    alert("Upload failed: " + e.message);
  }
  input.value = "";
}

function todayRemoveItemImage(itemId, idx, prefix) {
  if (prefix === "happening") {
    if (__todayHappeningGalleries[itemId]) __todayHappeningGalleries[itemId].splice(idx, 1);
  } else {
    if (__todayLocalGalleries[itemId]) __todayLocalGalleries[itemId].splice(idx, 1);
  }
  todayRefreshItemGallery(itemId, prefix);
}

// The first image in a Today item's gallery is the one the panel shows.
function todayMakeItemCover(itemId, idx, prefix) {
  const list = (prefix === "happening" ? __todayHappeningGalleries : __todayLocalGalleries)[itemId];
  if (!list || idx <= 0 || idx >= list.length) return;
  const [url] = list.splice(idx, 1);
  list.unshift(url);
  todayRefreshItemGallery(itemId, prefix);
}

function todayRefreshItemGallery(itemId, prefix) {
  const grid = document.getElementById(prefix + itemId + "Gallery");
  if (!grid) return;
  const galleryMap = prefix === "happening" ? __todayHappeningGalleries : __todayLocalGalleries;
  const imgs = (galleryMap[itemId] || [])
    .map((url, i) =>
      mediaThumbHtml(
        url,
        i,
        `todayRemoveItemImage('${itemId}',${i},'${prefix}')`,
        `todayMakeItemCover('${itemId}',${i},'${prefix}')`,
      ),
    )
    .join("");
  grid.innerHTML =
    imgs +
    `
    <label class="admin-media-add">
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="todayUploadItemImage(this,'${itemId}','${prefix}')" hidden>
      <span>+</span>
    </label>`;
}

function todayRemoveHappening(id) {
  delete __todayHappeningGalleries[id];
  const el = document.getElementById("happeningCard_" + id);
  if (el) el.remove();
}

function todayRemoveLocal(id) {
  delete __todayLocalGalleries[id];
  const el = document.getElementById("localCard_" + id);
  if (el) el.remove();
}

function todayBuildHappeningCard(id, e) {
  __todayHappeningGalleries[id] = e && e.images && Array.isArray(e.images) ? e.images.slice() : [];
  const title = e ? escapeHtml(e.title || "") : "";
  const place = e ? escapeHtml(e.place || "") : "";
  const time = e ? escapeHtml(e.time || "") : "";
  const dist = e ? escapeHtml(e.dist || "") : "";
  const vibe = e ? escapeHtml(e.vibe || "") : "";
  // The stable id is what a "Join" is stored against. Items saved before ids
  // existed get one derived from their own text, and it is written back on the
  // next save so it stops moving.
  const itemKey = todayItemKey(e, id);
  return `
    <div class="admin-list-item" id="happeningCard_${id}" data-itemid="${escT(itemKey)}">
      <div class="admin-list-item-head">
        <div style="flex:1;">
          <input id="hapTitle_${id}" value="${title}" placeholder="Title" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;margin-bottom:4px;">
          <div class="admin-grid-2" style="margin-top:4px;">
            <input id="hapPlace_${id}" value="${place}" placeholder="Place" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
            <input id="hapTime_${id}" value="${time}" placeholder="Time" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
          </div>
          <div class="admin-grid-2" style="margin-top:4px;">
            <input id="hapDist_${id}" value="${dist}" placeholder="Distance" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
            <input id="hapVibe_${id}" value="${vibe}" placeholder="Vibe" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
          </div>
        </div>
        <button class="admin-mini-btn danger" onclick="todayRemoveHappening('${id}')">${lucideSvg("x", 14)}</button>
      </div>
      <div style="padding:0 8px 8px;">${todayItemGalleryHtml(id, "happening", __todayHappeningGalleries, "event", e && e.imageCredit)}</div>
    </div>`;
}

function todayAddHappeningCard() {
  const id = "h_" + ++__todayNextHid;
  const div = document.createElement("div");
  div.innerHTML = todayBuildHappeningCard(id, null);
  document.getElementById("todayHappeningCards").appendChild(div.firstElementChild);
}

function todayBuildLocalCard(id, l) {
  __todayLocalGalleries[id] = l && l.images && Array.isArray(l.images) ? l.images.slice() : [];
  const badge = l ? escapeHtml(l.badge || "") : "";
  const biz = l ? escapeHtml(l.biz || "") : "";
  const text = l ? escapeHtml(l.text || "") : "";
  const meta = l ? escapeHtml(l.meta || "") : "";
  return `
    <div class="admin-list-item" id="localCard_${id}">
      <div class="admin-list-item-head">
        <div style="flex:1;">
          <div class="admin-grid-2">
            <input id="locBadge_${id}" value="${badge}" placeholder="Icon name (e.g. fish, martini, croissant)" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
            <input id="locBiz_${id}" value="${biz}" placeholder="Business name" style="padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;">
          </div>
          <input id="locText_${id}" value="${text}" placeholder="Tip text" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;margin-top:4px;">
          <input id="locMeta_${id}" value="${meta}" placeholder="Meta" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid var(--glass-border);background:var(--charcoal-input);color:var(--white-soft);font-size:.78rem;margin-top:4px;">
        </div>
        <button class="admin-mini-btn danger" onclick="todayRemoveLocal('${id}')">${lucideSvg("x", 14)}</button>
      </div>
      <div style="padding:0 8px 8px;">${todayItemGalleryHtml(id, "local", __todayLocalGalleries, "tip", l && l.imageCredit)}</div>
    </div>`;
}

function todayAddLocalCard() {
  const id = "l_" + ++__todayNextLid;
  const div = document.createElement("div");
  div.innerHTML = todayBuildLocalCard(id, null);
  document.getElementById("todayLocalCards").appendChild(div.firstElementChild);
}

async function renderAdminToday() {
  const body = document.getElementById("adminBody");
  body.innerHTML = '<div class="admin-empty">Loading…</div>';
  await loadTodayContent();
  const d = adminTodayData;
  const happening = d.happening || [];
  const joinable = d.joinable || [];
  const weather = d.weather || [];
  const locals = d.locals || [];
  const notices = d.notices || [];
  const path = (d.talaPick && d.talaPick.path) || [];

  __todayHappeningGalleries = {};
  __todayLocalGalleries = {};
  __todayNextHid = 0;
  __todayNextLid = 0;

  let happeningCardsHtml = "";
  happening.forEach((e, i) => {
    const id = "e" + i;
    happeningCardsHtml += todayBuildHappeningCard(id, e);
  });
  let localCardsHtml = "";
  locals.forEach((l, i) => {
    const id = "ll" + i;
    localCardsHtml += todayBuildLocalCard(id, l);
  });

  body.innerHTML = `
    <div class="admin-field">
      <label>Suggested day</label>
      <div style="font-size:.72rem;color:var(--white-dim);line-height:1.5;">
        The old TALA pick is gone. This block is now built for each visitor from the vibes they chose in the entry questionnaire, matched against the directory, so there is nothing to write here.
      </div>
    </div>
    <div class="admin-field">
      <label>Happening today</label>
      <div id="todayHappeningCards">${happeningCardsHtml}</div>
      <button class="admin-add-btn" onclick="todayAddHappeningCard()" style="margin-top:8px;">+ Add event</button>
    </div>
    <div class="admin-field">
      <label>Joinable today (one per line: Title | Detail | Crowd)</label>
      <textarea id="atJoinable" rows="3">${joinable.map((j) => [j.title, j.detail, j.crowd].join(" | ")).join("\n")}</textarea>
    </div>
    <div class="admin-field">
      <label>Weather verdicts (one per line: Icon | Label | Verdict — icon is a Lucide name, e.g. palmtree, waves, cloud-rain, droplets)</label>
      <textarea id="atWeather" rows="3">${weather.map((w) => [w.icon, w.label, w.verdict].join(" | ")).join("\n")}</textarea>
    </div>
    <div class="admin-field">
      <label>Local tips</label>
      <div id="todayLocalCards">${localCardsHtml}</div>
      <button class="admin-add-btn" onclick="todayAddLocalCard()" style="margin-top:8px;">+ Add tip</button>
    </div>
    <div class="admin-field">
      <label>Notices (one per line: Text)</label>
      <textarea id="atNotices" rows="2">${notices.map((n) => n.text).join("\n")}</textarea>
    </div>
    <div class="admin-edit-actions">
      <button class="admin-save-btn" onclick="adminSaveToday()">${lucideSvg("save", 14)} Save Today content</button>
      <span id="atStatus" style="font-size:.72rem;color:var(--white-dim);margin-left:8px;"></span>
    </div>`;
}

function parseLines(text, fieldCount) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((s) => s.trim());
      while (parts.length < fieldCount) parts.push("");
      return parts;
    });
}

function collectTodayHappeningItems() {
  const cards = document.querySelectorAll('[id^="happeningCard_"]');
  const items = [];
  cards.forEach((card) => {
    const id = card.id.replace("happeningCard_", "");
    const title = (document.getElementById("hapTitle_" + id) || {}).value || "";
    if (!title.trim()) return;
    const place = ((document.getElementById("hapPlace_" + id) || {}).value || "").trim();
    const time = ((document.getElementById("hapTime_" + id) || {}).value || "").trim();
    items.push({
      id: card.dataset.itemid || todayItemKey({ title: title.trim(), place, time }, items.length),
      title: title.trim(),
      place: place,
      time: time,
      dist: ((document.getElementById("hapDist_" + id) || {}).value || "").trim(),
      vibe: ((document.getElementById("hapVibe_" + id) || {}).value || "").trim(),
      imageCredit: (
        (document.getElementById("happening" + id + "Credit") || {}).value || ""
      ).trim(),
      images: (__todayHappeningGalleries[id] || []).slice(),
    });
  });
  return items;
}

function collectTodayLocalItems() {
  const cards = document.querySelectorAll('[id^="localCard_"]');
  const items = [];
  cards.forEach((card) => {
    const id = card.id.replace("localCard_", "");
    const text = (document.getElementById("locText_" + id) || {}).value || "";
    if (!text.trim()) return;
    items.push({
      badge: ((document.getElementById("locBadge_" + id) || {}).value || "").trim(),
      biz: ((document.getElementById("locBiz_" + id) || {}).value || "").trim(),
      text: text.trim(),
      meta: ((document.getElementById("locMeta_" + id) || {}).value || "").trim(),
      imageCredit: ((document.getElementById("local" + id + "Credit") || {}).value || "").trim(),
      images: (__todayLocalGalleries[id] || []).slice(),
    });
  });
  return items;
}

async function adminSaveToday() {
  if (!adminRequireWrite()) return;
  const status = document.getElementById("atStatus");
  status.textContent = "Saving…";
  try {
    const happening = collectTodayHappeningItems();
    const joinable = parseLines(document.getElementById("atJoinable").value, 3).map((p) => ({
      title: p[0],
      detail: p[1],
      crowd: parseInt(p[2]) || 0,
    }));
    const weather = parseLines(document.getElementById("atWeather").value, 3).map((p) => ({
      icon: p[0],
      label: p[1],
      verdict: p[2],
    }));
    const locals = collectTodayLocalItems();
    const notices = parseLines(document.getElementById("atNotices").value, 1).map((p) => ({
      text: p[0],
    }));

    const rows = [
      { key: "happening", data: happening },
      { key: "joinable", data: joinable },
      { key: "weather", data: weather },
      { key: "locals", data: locals },
      { key: "notices", data: notices },
    ];
    const { error } = await sb.from("today_content").upsert(rows, { onConflict: "key" });
    if (error) throw error;
    status.innerHTML =
      '<span style="color:#5eead4;display:inline-flex;align-items:center;gap:4px">' +
      lucideSvg("check", 12) +
      " Saved</span>";
    TODAY_DATA.happening = happening;
    TODAY_DATA.joinable = joinable;
    TODAY_DATA.weather = weather;
    TODAY_DATA.locals = locals;
    TODAY_DATA.notices = notices;
  } catch (err) {
    status.innerHTML = '<span style="color:#f87171">Failed: ' + escapeHtml(err.message) + "</span>";
  }
}

function adminLocalDateTimeValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function adminPulseNowFields(latId, lngId, startsAtId) {
  const latText = document.getElementById(latId).value.trim();
  const lngText = document.getElementById(lngId).value.trim();
  const startsText = document.getElementById(startsAtId).value;
  if (!!latText !== !!lngText)
    throw new Error("Enter both latitude and longitude, or leave both blank.");
  let lat = null;
  let lng = null;
  if (latText) {
    lat = Number(latText);
    lng = Number(lngText);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < 6.5 ||
      lat > 12.9 ||
      lng < 116.6 ||
      lng > 121
    )
      throw new Error("Location must be a valid point in the San Vicente area.");
  }
  let starts_at = null;
  if (startsText) {
    const date = new Date(startsText);
    if (!Number.isFinite(date.getTime())) throw new Error("Enter a valid start date and time.");
    starts_at = date.toISOString();
  }
  return { lat, lng, starts_at };
}
async function saveAdminPulseRow(table, id, payload) {
  const isNew = !id || id === "new";
  const save = (row) =>
    isNew ? sb.from(table).insert(row) : sb.from(table).update(row).eq("id", id);
  let result = await save(payload);
  if (
    result.error &&
    typeof isMissingPulseNowColumnError === "function" &&
    isMissingPulseNowColumnError(result.error)
  ) {
    const { lat, lng, starts_at, ...legacyPayload } = payload;
    result = await save(legacyPayload);
  }
  if (result.error) throw result.error;
}

async function renderAdminTribes() {
  const body = document.getElementById("adminBody");
  body.innerHTML = '<div class="admin-empty">Loading…</div>';
  let tribes = [];
  try {
    const { data, error } = await sb.from("tribes").select("*").order("sort_order");
    if (error) throw error;
    tribes = data || [];
  } catch (e) {
    body.innerHTML = `<div class="admin-empty">Load failed: ${escapeHtml(e.message)}</div>`;
    return;
  }

  let html = `<button class="admin-add-btn" onclick="adminEditTribe('new')">+ Add tribe</button>`;

  if (!tribes.length) {
    html += '<div class="admin-empty">No tribes yet. Add one above.</div>';
  } else {
    tribes.forEach((t) => {
      html += `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(t.title)}</strong><br>
            <span style="color:var(--white-dim);font-size:.7rem;">${escapeHtml(t.where_text || "")} · ${escapeHtml(t.when_text || "")}</span>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditTribe('${t.id}')">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteTribe('${t.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    });
  }
  body.innerHTML = html;
}

async function adminEditTribe(id) {
  const body = document.getElementById("adminBody");
  const isNew = id === "new";
  let t = {
    title: "",
    where_text: "",
    when_text: "",
    sub: "",
    thumb_url: "",
    joined: 0,
    extra: 0,
    cap: 0,
    spots: null,
    seats_open: null,
    sort_order: 0,
    images: [],
    video_url: null,
    video_type: null,
  };
  if (!isNew) {
    try {
      const { data } = await sb.from("tribes").select("*").eq("id", id).single();
      if (data) t = data;
    } catch (e) {
      alert("Load failed: " + e.message);
      return;
    }
  }
  // Initialize media gallery
  __mediaGallery = [];
  if (t.thumb_url) __mediaGallery.push(t.thumb_url);
  if (t.images && Array.isArray(t.images)) __mediaGallery.push(...t.images);
  body.innerHTML = `
    <div class="admin-edit-box">
      <div class="admin-field"><label>Title</label><input id="atbfTitle" value="${escapeHtml(t.title)}"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Where</label><input id="atbfWhere" value="${escapeHtml(t.where_text || "")}"></div>
        <div class="admin-field"><label>When</label><input id="atbfWhen" value="${escapeHtml(t.when_text || "")}"></div>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Map latitude</label><input id="atbfLat" type="number" step="any" value="${t.lat ?? ""}" placeholder="Optional"></div>
        <div class="admin-field"><label>Map longitude</label><input id="atbfLng" type="number" step="any" value="${t.lng ?? ""}" placeholder="Optional"></div>
      </div>
      <div class="admin-field"><label>Structured start time (for the map's live Now layer)</label><input id="atbfStartsAt" type="datetime-local" value="${adminLocalDateTimeValue(t.starts_at)}"></div>
      <div class="admin-field"><label>Subtitle</label><input id="atbfSub" value="${escapeHtml(t.sub || "")}"></div>
      <div class="admin-field">
        <label>Full text — this is what opens the tribe window</label>
        <textarea id="atbfDesc" rows="4" placeholder="What this tribe is doing, who should join, what to bring. Shown on the tribe window above its chat.">${escapeHtml(t.description || "")}</textarea>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Joined</label><input type="number" id="atbfJoined" value="${t.joined || 0}"></div>
        <div class="admin-field"><label>Extra (+N)</label><input type="number" id="atbfExtra" value="${t.extra || 0}"></div>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Capacity</label><input type="number" id="atbfCap" value="${t.cap || 0}"></div>
        <div class="admin-field"><label>Spots left</label><input type="number" id="atbfSpots" value="${t.spots || ""}"></div>
      </div>
      <div class="admin-field"><label>Tags (comma-separated)</label><input id="atbfTags" value="${(t.tags || []).join(", ")}"></div>
      ${mediaGalleryHtml("atbf", "tribe")}
      <div class="admin-field"><label>Photo credit</label><input id="atbfCredit" value="${escapeHtml(t.image_credit || "")}" placeholder="Photo: Name, Wikimedia Commons, CC BY 4.0"></div>
      ${mediaVideoHtml("atbf", t.video_url, t.video_type)}
      <div class="admin-field"><label>Sort order</label><input type="number" id="atbfSort" value="${t.sort_order || 0}"></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveTribe('${isNew ? "" : id}')">${isNew ? "Create" : "Save"}</button>
        <button class="admin-cancel-btn" onclick="renderAdminTribes()">Cancel</button>
      </div>
    </div>`;
}

async function adminSaveTribe(id) {
  if (!adminRequireWrite()) return;
  try {
    const video = await mediaUploadVideoIfNeeded("atbf");
    const images = __mediaGallery.slice();
    const thumbUrl = images.shift() || "";
    const pulseNowFields = adminPulseNowFields("atbfLat", "atbfLng", "atbfStartsAt");
    const payload = {
      ...pulseNowFields,
      title: document.getElementById("atbfTitle").value.trim(),
      where_text: document.getElementById("atbfWhere").value.trim(),
      when_text: document.getElementById("atbfWhen").value.trim(),
      sub: document.getElementById("atbfSub").value.trim(),
      description: document.getElementById("atbfDesc").value.trim() || null,
      thumb_url: thumbUrl,
      images: images,
      image_credit: document.getElementById("atbfCredit").value.trim() || null,
      video_url: video.url || null,
      video_type: video.type || null,
      joined: parseInt(document.getElementById("atbfJoined").value) || 0,
      extra: parseInt(document.getElementById("atbfExtra").value) || 0,
      cap: parseInt(document.getElementById("atbfCap").value) || 0,
      spots: document.getElementById("atbfSpots").value
        ? parseInt(document.getElementById("atbfSpots").value)
        : null,
      seats_open: document.getElementById("atbfSpots").value
        ? parseInt(document.getElementById("atbfSpots").value)
        : null,
      tags: document
        .getElementById("atbfTags")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sort_order: parseInt(document.getElementById("atbfSort").value) || 0,
    };
    if (!payload.title) {
      alert("Title is required.");
      return;
    }
    await saveAdminPulseRow("tribes", id, payload);
    renderAdminTribes();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

async function adminDeleteTribe(id) {
  if (!adminRequireWrite()) return;
  if (!confirm("Delete this tribe?")) return;
  try {
    await sb.from("tribes").delete().eq("id", id);
    renderAdminTribes();
  } catch (e) {
    alert("Delete failed: " + e.message);
  }
}

// ───────────── EVENTS ADMIN ─────────────

async function renderAdminEvents() {
  const body = document.getElementById("adminBody");
  body.innerHTML = '<div class="admin-empty">Loading…</div>';
  let events = [];
  try {
    const { data, error } = await sb.from("events").select("*").order("sort_order");
    if (error) throw error;
    events = data || [];
  } catch (e) {
    body.innerHTML = `<div class="admin-empty">Load failed: ${escapeHtml(e.message)}</div>`;
    return;
  }

  let html = `<button class="admin-add-btn" onclick="adminEditEvent('new')">+ Add event</button>`;

  if (!events.length) {
    html += '<div class="admin-empty">No events yet. Add one above.</div>';
  } else {
    events.forEach((ev) => {
      html += `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(ev.title)}</strong><br>
            <span style="color:var(--white-dim);font-size:.7rem;">${escapeHtml(ev.org || "")} · ${escapeHtml(ev.where_text || "")} · ${escapeHtml(ev.when_text || "")}</span>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditEvent('${ev.id}')">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteEvent('${ev.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    });
  }
  body.innerHTML = html;
}

async function adminEditEvent(id) {
  const body = document.getElementById("adminBody");
  const isNew = id === "new";
  let ev = {
    title: "",
    org: "",
    where_text: "",
    when_text: "",
    price: "",
    tags: [],
    sort_order: 0,
    images: [],
    video_url: null,
    video_type: null,
  };
  if (!isNew) {
    try {
      const { data } = await sb.from("events").select("*").eq("id", id).single();
      if (data) ev = data;
    } catch (e) {
      alert("Load failed: " + e.message);
      return;
    }
  }
  __mediaGallery = ev.images && Array.isArray(ev.images) ? ev.images.slice() : [];
  body.innerHTML = `
    <div class="admin-edit-box">
      <div class="admin-field"><label>Title</label><input id="aevfTitle" value="${escapeHtml(ev.title)}"></div>
      <div class="admin-field"><label>Organizer</label><input id="aevfOrg" value="${escapeHtml(ev.org || "")}"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Where</label><input id="aevfWhere" value="${escapeHtml(ev.where_text || "")}"></div>
        <div class="admin-field"><label>When</label><input id="aevfWhen" value="${escapeHtml(ev.when_text || "")}"></div>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Map latitude</label><input id="aevfLat" type="number" step="any" value="${ev.lat ?? ""}" placeholder="Optional"></div>
        <div class="admin-field"><label>Map longitude</label><input id="aevfLng" type="number" step="any" value="${ev.lng ?? ""}" placeholder="Optional"></div>
      </div>
      <div class="admin-field"><label>Structured start time (for the map's live Now layer)</label><input id="aevfStartsAt" type="datetime-local" value="${adminLocalDateTimeValue(ev.starts_at)}"></div>
      <div class="admin-field"><label>Price</label><input id="aevfPrice" value="${escapeHtml(ev.price || "")}"></div>
      <div class="admin-field">
        <label>Full description — this is what opens the event window</label>
        <textarea id="aevfDesc" rows="5" placeholder="What happens, who it is for, what to bring, why someone should come. The card only shows one line; this is the part that builds interest.">${escapeHtml(ev.description || "")}</textarea>
      </div>
      <div class="admin-field"><label>Tags (comma-separated)</label><input id="aevfTags" value="${(ev.tags || []).join(", ")}"></div>
      ${mediaGalleryHtml("aevf", "event")}
      <div class="admin-field"><label>Photo credit</label><input id="aevfCredit" value="${escapeHtml(ev.image_credit || "")}" placeholder="Photo: Name, Wikimedia Commons, CC BY 4.0"></div>
      ${mediaVideoHtml("aevf", ev.video_url, ev.video_type)}
      <div class="admin-field"><label>Sort order</label><input type="number" id="aevfSort" value="${ev.sort_order || 0}"></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveEvent('${isNew ? "" : id}')">${isNew ? "Create" : "Save"}</button>
        <button class="admin-cancel-btn" onclick="renderAdminEvents()">Cancel</button>
      </div>
    </div>`;
}

async function adminSaveEvent(id) {
  if (!adminRequireWrite()) return;
  try {
    const video = await mediaUploadVideoIfNeeded("aevf");
    const pulseNowFields = adminPulseNowFields("aevfLat", "aevfLng", "aevfStartsAt");
    const payload = {
      ...pulseNowFields,
      title: document.getElementById("aevfTitle").value.trim(),
      org: document.getElementById("aevfOrg").value.trim(),
      where_text: document.getElementById("aevfWhere").value.trim(),
      when_text: document.getElementById("aevfWhen").value.trim(),
      price: document.getElementById("aevfPrice").value.trim(),
      description: document.getElementById("aevfDesc").value.trim() || null,
      tags: document
        .getElementById("aevfTags")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      images: __mediaGallery.slice(),
      image_credit: document.getElementById("aevfCredit").value.trim() || null,
      video_url: video.url || null,
      video_type: video.type || null,
      sort_order: parseInt(document.getElementById("aevfSort").value) || 0,
    };
    if (!payload.title) {
      alert("Title is required.");
      return;
    }
    await saveAdminPulseRow("events", id, payload);
    renderAdminEvents();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

async function adminDeleteEvent(id) {
  if (!adminRequireWrite()) return;
  if (!confirm("Delete this event?")) return;
  try {
    await sb.from("events").delete().eq("id", id);
    renderAdminEvents();
  } catch (e) {
    alert("Delete failed: " + e.message);
  }
}

// ───────────── MYSANVIC ADMIN ─────────────

async function renderAdminMySanvic() {
  const body = document.getElementById("adminBody");
  body.innerHTML = '<div class="admin-empty">Loading…</div>';
  let upcoming = [];
  try {
    const { data, error } = await sb.from("my_sanvic_upcoming").select("*").order("sort_order");
    if (error) throw error;
    upcoming = data || [];
  } catch (e) {
    body.innerHTML = `<div class="admin-empty">Load failed: ${escapeHtml(e.message)}</div>`;
    return;
  }

  let html = `
    <div class="admin-field" style="font-size:.72rem;color:var(--white-dim);margin-bottom:12px;">
      Curate the "Upcoming" cards shown in My Sanvic. These are featured activities, events, or promotions you want visitors to see first.
    </div>
    <button class="admin-add-btn" onclick="adminEditUpcoming('new')">+ Add upcoming item</button>`;

  if (!upcoming.length) {
    html += '<div class="admin-empty">No upcoming items yet. Add one above.</div>';
  } else {
    upcoming.forEach((u) => {
      html += `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(u.title)}</strong><br>
            <span style="color:var(--white-dim);font-size:.7rem;">${escapeHtml(u.badge || "")} · ${escapeHtml(u.meta || "")}</span>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditUpcoming('${u.id}')">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteUpcoming('${u.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    });
  }
  body.innerHTML = html;
}

async function adminEditUpcoming(id) {
  const body = document.getElementById("adminBody");
  const isNew = id === "new";
  let u = {
    badge: "",
    badge_style: "solid",
    title: "",
    meta: "",
    cta: "View",
    action: "",
    action_id: "",
    sort_order: 0,
    images: [],
    video_url: null,
    video_type: null,
  };
  if (!isNew) {
    try {
      const { data } = await sb.from("my_sanvic_upcoming").select("*").eq("id", id).single();
      if (data) u = data;
    } catch (e) {
      alert("Load failed: " + e.message);
      return;
    }
  }
  __mediaGallery = u.images && Array.isArray(u.images) ? u.images.slice() : [];
  body.innerHTML = `
    <div class="admin-edit-box">
      <div class="admin-field"><label>Title</label><input id="amuTitle" value="${escapeHtml(u.title)}"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Badge text</label><input id="amuBadge" value="${escapeHtml(u.badge || "")}" placeholder="e.g. NEW, HOT, FREE"></div>
        <div class="admin-field"><label>Badge style</label>
          <select id="amuBadgeStyle">
            <option value="solid" ${u.badge_style === "solid" ? "selected" : ""}>Solid</option>
            <option value="soft" ${u.badge_style === "soft" ? "selected" : ""}>Soft</option>
          </select>
        </div>
      </div>
      <div class="admin-field"><label>Meta text</label><input id="amuMeta" value="${escapeHtml(u.meta || "")}" placeholder="e.g. Island Hopping · Tomorrow"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Button text</label><input id="amuCta" value="${escapeHtml(u.cta || "View")}"></div>
        <div class="admin-field"><label>Action type</label>
          <select id="amuAction">
            <option value="" ${!u.action ? "selected" : ""}>None</option>
            <option value="dest" ${u.action === "dest" ? "selected" : ""}>Open destination</option>
            <option value="tribe" ${u.action === "tribe" ? "selected" : ""}>Open tribe</option>
            <option value="event" ${u.action === "event" ? "selected" : ""}>Open event</option>
            <option value="url" ${u.action === "url" ? "selected" : ""}>Open URL</option>
          </select>
        </div>
      </div>
      <div class="admin-field"><label>Action ID / URL</label><input id="amuActionId" value="${escapeHtml(u.action_id || "")}" placeholder="Destination ID, tribe ID, or full URL"></div>
      ${mediaGalleryHtml("amu", "upcoming")}
      ${mediaVideoHtml("amu", u.video_url, u.video_type)}
      <div class="admin-field"><label>Sort order</label><input type="number" id="amuSort" value="${u.sort_order || 0}"></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveUpcoming('${isNew ? "" : id}')">${isNew ? "Create" : "Save"}</button>
        <button class="admin-cancel-btn" onclick="renderAdminMySanvic()">Cancel</button>
      </div>
    </div>`;
}

async function adminSaveUpcoming(id) {
  if (!adminRequireWrite()) return;
  const isNew = id === "new";
  try {
    const video = await mediaUploadVideoIfNeeded("amu");
    const payload = {
      badge: document.getElementById("amuBadge").value.trim(),
      badge_style: document.getElementById("amuBadgeStyle").value,
      title: document.getElementById("amuTitle").value.trim(),
      meta: document.getElementById("amuMeta").value.trim(),
      cta: document.getElementById("amuCta").value.trim() || "View",
      action: document.getElementById("amuAction").value,
      action_id: document.getElementById("amuActionId").value.trim(),
      images: __mediaGallery.slice(),
      video_url: video.url || null,
      video_type: video.type || null,
      sort_order: parseInt(document.getElementById("amuSort").value) || 0,
    };
    if (!payload.title) {
      alert("Title is required.");
      return;
    }
    if (isNew) {
      const { error } = await sb.from("my_sanvic_upcoming").insert(payload);
      if (error) throw error;
    } else {
      const { error } = await sb.from("my_sanvic_upcoming").update(payload).eq("id", id);
      if (error) throw error;
    }
    renderAdminMySanvic();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

async function adminDeleteUpcoming(id) {
  if (!adminRequireWrite()) return;
  if (!confirm("Delete this upcoming item?")) return;
  try {
    await sb.from("my_sanvic_upcoming").delete().eq("id", id);
    renderAdminMySanvic();
  } catch (e) {
    alert("Delete failed: " + e.message);
  }
}

// ───────────── HUNT ADMIN ─────────────

async function renderAdminHunt() {
  const body = document.getElementById("adminBody");
  body.innerHTML = '<div class="admin-empty">Loading…</div>';
  let rewards = [];
  let settings = {};
  let riddles = [];
  try {
    const [rewardsRes, settingsRes, riddlesRes] = await Promise.all([
      sb.from("hunt_rewards").select("*").order("sort_order"),
      sb.from("hunt_settings").select("*"),
      sb.from("hunt_riddles").select("*").order("sort_order"),
    ]);
    if (rewardsRes.error) throw rewardsRes.error;
    rewards = rewardsRes.data || [];
    (settingsRes.data || []).forEach((r) => {
      settings[r.key] = r.value;
    });
    // Riddles are optional here: if the table is missing, the rest of the tab
    // still works.
    if (!riddlesRes.error) riddles = riddlesRes.data || [];
  } catch (e) {
    body.innerHTML = `<div class="admin-empty">Load failed: ${escapeHtml(e.message)}</div>`;
    return;
  }

  const featuredDestId = settings.featured_dest_id || "";
  const pointsPerUnlock = settings.points_per_unlock || 100;
  const welcomeMsg = settings.welcome_msg || "";

  let html = `
    <div class="admin-field" style="font-size:.72rem;color:var(--white-dim);margin-bottom:12px;">
      Configure The Hunt experience. Set which destination is featured daily, reward items visitors can earn, and hunt settings.
    </div>
    <div class="admin-edit-box" style="margin-bottom:16px;">
      <div style="font-weight:600;margin-bottom:8px;font-size:.82rem;color:var(--white-soft);">Hunt Settings</div>
      <div class="admin-field"><label>Featured destination ID (today's hunt target)</label><input id="ahSettingsFeat" value="${escapeHtml(featuredDestId)}" placeholder="Destination ID from Destinations tab"></div>
      <div class="admin-field"><label>Points per unlock</label><input type="number" id="ahSettingsPoints" value="${pointsPerUnlock}"></div>
      <div class="admin-field"><label>Welcome message</label><textarea id="ahSettingsWelcome" rows="2">${escapeHtml(welcomeMsg)}</textarea></div>
      <button class="admin-save-btn" onclick="adminSaveHuntSettings()">Save settings</button>
    </div>

    <button class="admin-add-btn" onclick="adminEditReward('new')">+ Add reward</button>`;

  if (!rewards.length) {
    html += '<div class="admin-empty">No rewards yet. Add one above.</div>';
  } else {
    rewards.forEach((r) => {
      html += `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div style="flex:1;">
            <strong>${escapeHtml(r.title)}</strong><br>
            <span style="color:var(--white-dim);font-size:.7rem;">${escapeHtml(r.badge || "")} · ${r.points_required} pts · ${escapeHtml(r.subtitle || "")}</span>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditReward('${r.id}')">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteReward('${r.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    });
  }
  // ── Riddles ──────────────────────────────────────────────────────────────
  // Each riddle owns its verse, its answer coordinate and one photo.
  html += `
    <div class="admin-section-toggle" style="margin-top:20px;">
      <span>${lucideSvg("image", 13)} Riddles</span>
      <span class="admin-section-count">${riddles.length}</span>
    </div>
    <div class="admin-field" style="font-size:.72rem;color:var(--white-dim);margin:6px 0 10px;">
      The Hunt's riddles. The first photo on a riddle is the one shown on its card; with no photo the card shows a placeholder.
    </div>
    <button class="admin-add-btn" onclick="adminEditRiddle('new')">+ Add riddle</button>`;
  if (!riddles.length) {
    html += '<div class="admin-empty">No riddles yet. Add the first one above.</div>';
  } else {
    riddles.forEach((r) => {
      const img = r.image_url || "";
      html += `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          ${
            img
              ? `<img src="${escT(img)}" alt="" style="width:54px;height:54px;border-radius:9px;object-fit:cover;margin-right:10px;flex-shrink:0;" onerror="this.style.display='none'">`
              : ""
          }
          <div style="flex:1;min-width:0;">
            <strong>${escapeHtml(r.title || "Untitled riddle")}</strong><br>
            <span style="color:var(--white-dim);font-size:.7rem;">${r.active === false ? "Hidden · " : ""}${escapeHtml(r.difficulty || "no difficulty")} · ${img ? "has photo" : "no photo yet"}</span>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditRiddle('${r.id}')">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteRiddle('${r.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    });
  }
  body.innerHTML = html;
}

async function adminSaveHuntSettings() {
  if (!adminRequireWrite()) return;
  try {
    const rows = [
      { key: "featured_dest_id", value: document.getElementById("ahSettingsFeat").value.trim() },
      {
        key: "points_per_unlock",
        value: parseInt(document.getElementById("ahSettingsPoints").value) || 100,
      },
      { key: "welcome_msg", value: document.getElementById("ahSettingsWelcome").value.trim() },
    ];
    const { error } = await sb.from("hunt_settings").upsert(rows, { onConflict: "key" });
    if (error) throw error;
    alert("Settings saved!");
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

async function adminEditReward(id) {
  const body = document.getElementById("adminBody");
  const isNew = id === "new";
  let r = {
    title: "",
    subtitle: "",
    badge: "",
    dest_id: "",
    points_required: 100,
    sort_order: 0,
    images: [],
    video_url: null,
    video_type: null,
  };
  if (!isNew) {
    try {
      const { data } = await sb.from("hunt_rewards").select("*").eq("id", id).single();
      if (data) r = data;
    } catch (e) {
      alert("Load failed: " + e.message);
      return;
    }
  }
  __mediaGallery = r.images && Array.isArray(r.images) ? r.images.slice() : [];
  body.innerHTML = `
    <div class="admin-edit-box">
      <div class="admin-field"><label>Title</label><input id="ahrTitle" value="${escapeHtml(r.title)}"></div>
      <div class="admin-field"><label>Subtitle</label><input id="ahrSub" value="${escapeHtml(r.subtitle || "")}"></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Badge text</label><input id="ahrBadge" value="${escapeHtml(r.badge || "")}" placeholder="e.g. NEW, SOON"></div>
        <div class="admin-field"><label>Points required</label><input type="number" id="ahrPoints" value="${r.points_required || 100}"></div>
      </div>
      <div class="admin-field"><label>Destination ID (optional — link to a destination)</label><input id="ahrDest" value="${escapeHtml(r.dest_id || "")}"></div>
      ${mediaGalleryHtml("ahr", "reward")}
      ${mediaVideoHtml("ahr", r.video_url, r.video_type)}
      <div class="admin-field"><label>Sort order</label><input type="number" id="ahrSort" value="${r.sort_order || 0}"></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveReward('${isNew ? "" : id}')">${isNew ? "Create" : "Save"}</button>
        <button class="admin-cancel-btn" onclick="renderAdminHunt()">Cancel</button>
      </div>
    </div>`;
}

async function adminSaveReward(id) {
  if (!adminRequireWrite()) return;
  const isNew = id === "new";
  try {
    const video = await mediaUploadVideoIfNeeded("ahr");
    const payload = {
      title: document.getElementById("ahrTitle").value.trim(),
      subtitle: document.getElementById("ahrSub").value.trim(),
      badge: document.getElementById("ahrBadge").value.trim(),
      dest_id: document.getElementById("ahrDest").value.trim(),
      images: __mediaGallery.slice(),
      video_url: video.url || null,
      video_type: video.type || null,
      points_required: parseInt(document.getElementById("ahrPoints").value) || 100,
      sort_order: parseInt(document.getElementById("ahrSort").value) || 0,
    };
    if (!payload.title) {
      alert("Title is required.");
      return;
    }
    if (isNew) {
      const { error } = await sb.from("hunt_rewards").insert(payload);
      if (error) throw error;
    } else {
      const { error } = await sb.from("hunt_rewards").update(payload).eq("id", id);
      if (error) throw error;
    }
    renderAdminHunt();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

async function adminDeleteReward(id) {
  if (!adminRequireWrite()) return;
  if (!confirm("Delete this reward?")) return;
  try {
    await sb.from("hunt_rewards").delete().eq("id", id);
    renderAdminHunt();
  } catch (e) {
    alert("Delete failed: " + e.message);
  }
}

// ── RIDDLE EDITOR ────────────────────────────────────────────────────────
// hunt_riddles was read by the Hunt but never editable anywhere, so a photo
// could only be added by writing to the database by hand. This is the missing
// screen: verse, answer coordinate, hint, one photo, on/off.
function adminSlug(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function adminEditRiddle(id) {
  const body = document.getElementById("adminBody");
  const isNew = id === "new";
  let r = {
    title: "",
    verse: "",
    hint: "",
    difficulty: "",
    lat: "",
    lng: "",
    image_url: "",
    active: true,
    sort_order: 0,
  };
  if (!isNew) {
    const { data, error } = await sb.from("hunt_riddles").select("*").eq("id", id).single();
    if (error || !data) {
      alert("Could not load that riddle: " + (error ? error.message : "not found"));
      return;
    }
    r = data;
  }
  __mediaGallery = r.image_url ? [r.image_url] : [];
  body.innerHTML = `
    <div class="admin-edit-box">
      <div class="admin-field"><label>Title</label><input id="ahrdTitle" value="${escapeHtml(r.title || "")}" placeholder="The Wild Way Back"></div>
      <div class="admin-field"><label>Verse — the riddle itself</label><textarea id="ahrdVerse" rows="7" placeholder="Not far from Poblacion's busy heart…">${escapeHtml(r.verse || "")}</textarea></div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Difficulty</label><input id="ahrdDiff" value="${escapeHtml(r.difficulty || "")}" placeholder="Easy / Medium / Hard"></div>
        <div class="admin-field"><label>Sort order</label><input type="number" id="ahrdSort" value="${Number(r.sort_order) || 0}"></div>
      </div>
      <div class="admin-grid-2">
        <div class="admin-field"><label>Latitude — where the answer is</label><input id="ahrdLat" type="number" step="any" value="${r.lat != null ? r.lat : ""}" placeholder="10.5286"></div>
        <div class="admin-field"><label>Longitude — where the answer is</label><input id="ahrdLng" type="number" step="any" value="${r.lng != null ? r.lng : ""}" placeholder="119.2364"></div>
      </div>
      <div class="admin-field"><label>Hint (optional)</label><input id="ahrdHint" value="${escapeHtml(r.hint || "")}"></div>
      <label class="admin-toggle-row" for="ahrdActive"><span>Show this riddle in The Hunt</span><input type="checkbox" id="ahrdActive"${r.active === false ? "" : " checked"}></label>
      <div style="margin-top:12px;">${mediaGalleryHtml("ahrd", "riddle")}</div>
      <div class="admin-field" style="font-size:.72rem;color:var(--white-dim);">The first photo is the one used on the riddle card. One is enough; extra photos are ignored.</div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveRiddle('${isNew ? "" : id}')">${isNew ? "Create riddle" : "Save riddle"}</button>
        <button class="admin-cancel-btn" onclick="renderAdminHunt()">Cancel</button>
      </div>
    </div>`;
}

async function adminSaveRiddle(id) {
  if (!adminRequireWrite()) return;
  const isNew = id === "new";
  const title = document.getElementById("ahrdTitle").value.trim();
  const verse = document.getElementById("ahrdVerse").value.trim();
  const lat = parseFloat(document.getElementById("ahrdLat").value);
  const lng = parseFloat(document.getElementById("ahrdLng").value);
  if (!title) return alert("Give the riddle a title.");
  if (!verse) return alert("The riddle needs its verse.");
  if (!isFinite(lat) || !isFinite(lng))
    return alert("Add the latitude and longitude of the answer.");
  const payload = {
    title,
    verse,
    lat,
    lng,
    difficulty: document.getElementById("ahrdDiff").value.trim() || null,
    hint: document.getElementById("ahrdHint").value.trim() || null,
    image_url: (__mediaGallery && __mediaGallery[0]) || null,
    active: document.getElementById("ahrdActive").checked,
    sort_order: parseInt(document.getElementById("ahrdSort").value, 10) || 0,
  };
  try {
    if (isNew) {
      // The slug keys saved progress on a device, so it must be unique and then
      // never change.
      payload.slug = (adminSlug(title) || "riddle") + "-" + Date.now().toString(36).slice(-5);
      const { error } = await sb.from("hunt_riddles").insert(payload);
      if (error) throw error;
    } else {
      const { error } = await sb.from("hunt_riddles").update(payload).eq("id", id);
      if (error) throw error;
    }
    adminRefreshHuntRiddles();
    renderAdminHunt();
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

// Drop the cached copy so The Hunt reads the riddles again the next time it opens.
function adminRefreshHuntRiddles() {
  try {
    huntRiddlesLoaded = false;
    HUNT_RIDDLES = [];
    if (typeof renderHunt === "function") renderHunt();
  } catch (_) {
    /* The Hunt is not on screen */
  }
}

async function adminDeleteRiddle(id) {
  if (!adminRequireWrite()) return;
  if (!confirm("Delete this riddle? Visitors lose any progress on it.")) return;
  try {
    const { error } = await sb.from("hunt_riddles").delete().eq("id", id);
    if (error) throw error;
    adminRefreshHuntRiddles();
    renderAdminHunt();
  } catch (e) {
    alert("Delete failed: " + e.message);
  }
}

// ───────────── TALA ADMIN ─────────────

function renderAdminTala() {
  const body = document.getElementById("adminBody");
  let html = `
    <div class="admin-section-toggle" onclick="adminToggleSuggestionsPanel()">
      <span>${lucideSvg("zap", 13)} Quick suggestion chips ${lucideSvg(talaSuggestionsOpen ? "chevron-down" : "chevron-right", 13)}</span>
      <span class="admin-section-count">${talaSuggestions.length}</span>
    </div>
    <div id="adfSuggestionsPanel" style="display:${talaSuggestionsOpen ? "" : "none"}">
      ${adminSuggestionsPanelHtml()}
    </div>

    <div class="admin-field" style="margin-top:16px;">
      <label>Fallback response (used when nothing matches)</label>
      <textarea id="adfDefaultR" rows="3" onblur="adminSaveDefaultResponse()">${escapeHtml(defaultR)}</textarea>
    </div>
    <div class="admin-grid-2" style="margin-bottom:14px;">
      <button class="admin-add-btn" style="margin-bottom:0;" onclick="adminNewTala()">+ Add response</button>
      <button class="admin-add-btn" style="margin-bottom:0;" onclick="document.getElementById('adfBulkFile').click()">${lucideSvg("upload", 13)} Upload .txt files</button>
    </div>
    <input type="file" id="adfBulkFile" accept=".txt,text/plain" multiple style="display:none" onchange="adminHandleBulkFiles(event)">
    <div id="adfBulkQueue"></div>`;

  if (adminEditingTalaId !== null) {
    html += adminTalaFormHtml();
  }

  // Filter tabs + search
  const counts = {
    all: aiData.length,
    personality: aiData.filter((i) => (i.cat || "knowledge") === "personality").length,
    knowledge: aiData.filter((i) => (i.cat || "knowledge") === "knowledge").length,
  };
  html += `
    <div class="admin-tala-filters">
      <button class="admin-cat-tab ${talaFilterCat === "all" ? "active" : ""}" onclick="adminSetTalaFilter('all')">All <span>${counts.all}</span></button>
      <button class="admin-cat-tab personality ${talaFilterCat === "personality" ? "active" : ""}" onclick="adminSetTalaFilter('personality')">Personality <span>${counts.personality}</span></button>
      <button class="admin-cat-tab knowledge ${talaFilterCat === "knowledge" ? "active" : ""}" onclick="adminSetTalaFilter('knowledge')">Knowledge <span>${counts.knowledge}</span></button>
    </div>
    <input class="admin-tala-search" placeholder="Search keywords or content..." value="${escapeHtml(talaSearchQuery)}" oninput="adminSetTalaSearch(this.value)">`;

  // Apply filter + search
  let items = aiData;
  if (talaFilterCat !== "all")
    items = items.filter((i) => (i.cat || "knowledge") === talaFilterCat);
  if (talaSearchQuery.trim()) {
    const q = talaSearchQuery.trim().toLowerCase();
    items = items.filter(
      (i) => i.kw.join(" ").toLowerCase().includes(q) || (i.r || "").toLowerCase().includes(q),
    );
  }

  if (!items.length) {
    html += `<div class="admin-empty">${aiData.length ? "No matches for this filter/search." : "No responses yet."}</div>`;
  } else {
    html += items
      .map((item) => {
        const cat = item.cat || "knowledge";
        const len = talaContentLength(item.r);
        return `
      <div class="admin-list-item">
        <div class="admin-list-item-head">
          <div onclick="adminEditTala(${item.id})" style="flex:1;cursor:pointer;">
            <div class="admin-tala-badges">
              <span class="admin-cat-pill ${cat}">${cat === "personality" ? "Personality" : "Knowledge"}</span>
              <span class="admin-len-pill ${len.cls}">${len.label}</span>
            </div>
            <strong>${escapeHtml(item.kw.join(", "))}</strong>
          </div>
          <div class="admin-row-actions">
            <button class="admin-mini-btn" onclick="adminEditTala(${item.id})">Edit</button>
            <button class="admin-mini-btn danger" onclick="adminDeleteTala(${item.id})">Delete</button>
          </div>
        </div>
      </div>`;
      })
      .join("");
  }
  body.innerHTML = html;
}

function adminSetTalaFilter(cat) {
  talaFilterCat = cat;
  renderAdminTala();
}

function adminSetTalaSearch(val) {
  talaSearchQuery = val;
  // Re-render just the list portion would be ideal, but re-running the
  // full render is simple and fast enough at this data size. Preserve
  // focus by not fully replacing the search input itself on every key.
  const body = document.getElementById("adminBody");
  const scrollPos = body.scrollTop;
  renderAdminTala();
  body.scrollTop = scrollPos;
  const input = document.querySelector(".admin-tala-search");
  if (input) {
    input.focus();
    input.setSelectionRange(val.length, val.length);
  }
}

function adminTalaFormHtml() {
  const isNew = adminEditingTalaId === "new";
  const item = isNew
    ? { kw: [], r: "", cat: "knowledge" }
    : aiData.find((x) => x.id === adminEditingTalaId);
  if (!item) return "";
  const cat = item.cat || "knowledge";
  return `
    <div class="admin-edit-box">
      <div class="admin-field">
        <label>Category</label>
        <select id="atfCat">
          <option value="knowledge" ${cat === "knowledge" ? "selected" : ""}>Knowledge (facts about San Vicente)</option>
          <option value="personality" ${cat === "personality" ? "selected" : ""}>Personality (how Tala talks/acts)</option>
        </select>
      </div>
      <div class="admin-field"><label>Keywords (comma-separated)</label><input id="atfKw" value="${escapeHtml(item.kw.join(", "))}"></div>
      <div class="admin-field"><label>Response (HTML allowed, e.g. &lt;strong&gt;, &lt;br&gt;)</label><textarea id="atfResp" rows="5">${escapeHtml(item.r)}</textarea></div>
      <div class="admin-edit-actions">
        <button class="admin-save-btn" onclick="adminSaveTala()">${isNew ? "Create" : "Save changes"}</button>
        <button class="admin-cancel-btn" onclick="adminEditingTalaId=null;renderAdminTala();">Cancel</button>
      </div>
    </div>`;
}

function adminNewTala() {
  adminEditingTalaId = "new";
  renderAdminTala();
}

// ───────────── BULK .TXT UPLOAD ─────────────
// Reads each selected .txt file, shows it in a queue with an editable
// keyword field (pre-filled from the filename), and lets the admin
// save them all into tala_responses in one batch. Each file becomes
// one response entry — the full file content is the response, and the
// keywords typed in are what triggers it. No auto-parsing of arbitrary
// prose into multiple entries, since that's not reliable; this keeps
// the one unavoidable manual step (deciding trigger words) but removes
// everything else.
let bulkQueue = []; // { id, filename, content, keywords }
let bulkIdCounter = 0;

function guessKeywordsFromFilename(filename) {
  return filename
    .replace(/\.txt$/i, "")
    .replace(/^\d+[_\-\s]*/, "") // strip leading numbers like "01_"
    .replace(/[_\-]+/g, " ")
    .trim();
}

function adminHandleBulkFiles(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  let pending = files.length;
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      bulkQueue.push({
        id: ++bulkIdCounter,
        filename: file.name,
        content: e.target.result,
        keywords: guessKeywordsFromFilename(file.name),
      });
      pending--;
      if (pending === 0) renderBulkQueue();
    };
    reader.onerror = () => {
      pending--;
      if (pending === 0) renderBulkQueue();
    };
    reader.readAsText(file);
  });

  event.target.value = ""; // allow re-selecting the same file later
}

function renderBulkQueue() {
  const container = document.getElementById("adfBulkQueue");
  if (!container) return;
  if (!bulkQueue.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="admin-edit-box">
      <div class="admin-field" style="margin-bottom:8px;">
        <label>${bulkQueue.length} file${bulkQueue.length > 1 ? "s" : ""} ready — set category + trigger keywords for each, then save</label>
      </div>
      ${bulkQueue
        .map(
          (item) => `
        <div class="admin-list-item" style="margin-bottom:10px;">
          <div style="font-size:.8rem;color:var(--white-soft);font-weight:500;margin-bottom:6px;">
            ${lucideSvg("file-text", 13)} ${escapeHtml(item.filename)} <span style="color:var(--white-dim);font-size:.68rem;">(${item.content.length.toLocaleString()} chars)</span>
          </div>
          <div class="admin-field" style="margin-bottom:6px;">
            <label>Category</label>
            <select onchange="bulkQueue.find(x=>x.id===${item.id}).category=this.value">
              <option value="knowledge" ${item.category !== "personality" ? "selected" : ""}>Knowledge (facts about San Vicente)</option>
              <option value="personality" ${item.category === "personality" ? "selected" : ""}>Personality (how Tala talks/acts)</option>
            </select>
          </div>
          <div class="admin-field" style="margin-bottom:6px;">
            <label>Trigger keywords (comma-separated — words a visitor might type that should bring up this content)</label>
            <input value="${escapeHtml(item.keywords)}" oninput="bulkQueue.find(x=>x.id===${item.id}).keywords=this.value">
          </div>
          <button class="admin-mini-btn danger" onclick="bulkQueue=bulkQueue.filter(x=>x.id!==${item.id});renderBulkQueue();">Remove from queue</button>
        </div>`,
        )
        .join("")}
      <div class="admin-edit-actions">
        <button class="admin-save-btn" id="adfBulkSaveBtn" onclick="adminSaveBulkQueue()">Save all ${bulkQueue.length} to Tala</button>
        <button class="admin-cancel-btn" onclick="bulkQueue=[];renderBulkQueue();">Cancel</button>
      </div>
    </div>`;
}

async function adminSaveBulkQueue() {
  if (!adminRequireWrite()) return;
  const saveBtn = document.getElementById("adfBulkSaveBtn");
  const invalid = bulkQueue.filter((item) => !item.keywords.trim());
  if (invalid.length) {
    alert(`Please add at least one keyword for: ${invalid.map((i) => i.filename).join(", ")}`);
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  try {
    const rows = bulkQueue.map((item, i) => ({
      keywords: item.keywords
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      response: escapeHtml(item.content).replace(/\n/g, "<br>"),
      category: item.category || "knowledge",
      sort_order: aiData.length + i,
    }));
    const { error } = await sb.from("tala_responses").insert(rows);
    if (error) throw error;

    bulkQueue = [];
    await loadDataFromSupabase();
    renderAdminTala();
  } catch (err) {
    alert("Bulk save failed: " + (err.message || err));
    saveBtn.disabled = false;
    saveBtn.textContent = `Save all ${bulkQueue.length} to Tala`;
  }
}
function adminEditTala(id) {
  adminEditingTalaId = id;
  renderAdminTala();
}

async function adminSaveTala() {
  if (!adminRequireWrite()) return;
  const kw = document
    .getElementById("atfKw")
    .value.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const r = document.getElementById("atfResp").value.trim();
  const cat = document.getElementById("atfCat").value;
  if (!kw.length || !r) {
    alert("At least one keyword and a response are required.");
    return;
  }
  try {
    if (adminEditingTalaId === "new") {
      const { error } = await sb
        .from("tala_responses")
        .insert({ keywords: kw, response: r, category: cat, sort_order: aiData.length });
      if (error) throw error;
    } else {
      const { error } = await sb
        .from("tala_responses")
        .update({ keywords: kw, response: r, category: cat })
        .eq("id", adminEditingTalaId);
      if (error) throw error;
    }
    await loadDataFromSupabase();
    adminEditingTalaId = null;
    renderAdminTala();
  } catch (err) {
    alert("Save failed: " + (err.message || err));
  }
}

async function adminDeleteTala(id) {
  if (!adminRequireWrite()) return;
  if (!confirm("Delete this response?")) return;
  try {
    const { error } = await sb.from("tala_responses").delete().eq("id", id);
    if (error) throw error;
    await loadDataFromSupabase();
    renderAdminTala();
  } catch (err) {
    alert("Delete failed: " + (err.message || err));
  }
}

async function adminSaveDefaultResponse() {
  if (!adminRequireWrite()) return;
  const val = document.getElementById("adfDefaultR").value.trim();
  if (!val || val === defaultR) return;
  try {
    const { error } = await sb
      .from("tala_settings")
      .upsert({ key: "default_response", value: val });
    if (error) throw error;
    defaultR = val;
  } catch (err) {
    alert("Save failed: " + (err.message || err));
  }
}

// ───────────── RESET TO DEFAULTS ─────────────

async function adminResetDefaults() {
  if (!adminRequireWrite()) return;
  if (
    !confirm(
      "This will erase ALL destinations, categories, and tala responses in Supabase and replace them with the original built-in defaults. Continue?",
    )
  )
    return;
  try {
    await sb.from("destinations").delete().neq("id", -1);
    await sb.from("tala_responses").delete().neq("id", -1);
    await sb.from("destination_categories").delete().neq("id", -1);

    const destRows = DEFAULT_DESTINATIONS.map((d, i) => ({
      name: d.name,
      lat: d.lat,
      lng: d.lng,
      category: d.category,
      image: d.image,
      images: d.images || [],
      description: d.description,
      tip: d.tip,
      color: d.color,
      sort_order: i,
      rating: d.stats.rating,
      travel: d.stats.travel,
      temp: d.stats.temp,
      season: d.stats.season,
    }));
    const talaRows = DEFAULT_TALA_DATA.map((t, i) => ({
      keywords: t.kw,
      response: t.r,
      sort_order: i,
    }));
    const catRows = Object.keys(DEFAULT_CAT_STYLE).map((key, i) => ({
      key,
      label: DEFAULT_CAT_STYLE[key].label,
      color: DEFAULT_CAT_STYLE[key].color,
      icon: DEFAULT_CAT_STYLE[key].icon,
      sort_order: i,
    }));

    await sb.from("destinations").insert(destRows);
    await sb.from("tala_responses").insert(talaRows);
    await sb.from("destination_categories").insert(catRows);
    await sb
      .from("tala_settings")
      .upsert({ key: "default_response", value: DEFAULT_FALLBACK_RESPONSE });

    await loadDataFromSupabase();
    rebuildMarkers();
    if (adminTab === "dest") renderAdminDest();
    else renderAdminTala();
    alert("Reset complete.");
  } catch (err) {
    alert("Reset failed: " + (err.message || err));
  }
}
