// ═══════════════════════════════════════════════════════
// NO ACCOUNTS, NO SIGN-IN
//
// There used to be a full Supabase Auth stack here: magic link,
// email+password, Google/Apple, a session listener, a 4-digit
// admin PIN, a sign-in sheet and a "read-only" banner on the
// Backoffice. All of it is gone.
//
// Who someone is now comes from the device: personId() / personGet()
// (a name, kept in localStorage, asked once when they join a tribe
// or an event). Nothing else is required to use the site, and the
// Backoffice opens and writes without a credential of any kind.
//
// The database side of that is
// supabase/migrations/<open backoffice writes>.sql, which grants
// anon the write policies the admin role used to hold.
// ═══════════════════════════════════════════════════════
function isLoggedIn() {
  return false;
}
function initAuth() {
  /* no accounts */
}
function updateAuthUI() {
  /* no accounts */
}

// ═══════════════════════════════════════════════════════
// TRAVELER DASHBOARD
// ═══════════════════════════════════════════════════════
let dashSection = "overview";

function openDashboard(section) {
  closeAllPanels();
  document.getElementById("dashboardPanel").classList.add("open");
  renderDashProfileCard();
  selectDashSection(section || "overview");
}

function closeDashboard() {
  document.getElementById("dashboardPanel").classList.remove("open");
}

const DASH_GUEST_AVATAR =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>';

function renderDashProfileCard() {
  const nameEl = document.getElementById("dashUserName");
  const subEl = document.getElementById("dashUserSub");
  const avatarWrap = document.getElementById("dashUserAvatarWrap");
  if (!nameEl || !avatarWrap) return;

  const name = personName();
  if (name) {
    nameEl.textContent = `Hello, ${name}`;
    subEl.textContent = "Welcome back to San Vicente";
    avatarWrap.innerHTML = `<span>${escapeHtml(name.slice(0, 1).toUpperCase())}</span>`;
  } else {
    avatarWrap.innerHTML = DASH_GUEST_AVATAR;
    nameEl.textContent = "Welcome, Explorer";
    subEl.textContent = "Your saves and plans stay on this device";
  }
}

function selectDashSection(section) {
  dashSection = section;
  document
    .querySelectorAll(".dash-nav-item")
    .forEach((b) => b.classList.toggle("active", b.dataset.section === section));
  const body = document.getElementById("dashSectionBody");
  body.innerHTML = `<div class="dash-empty-state">Loading...</div>`;

  switch (section) {
    case "overview":
      renderDashOverview();
      break;
    case "saved":
      renderDashSaved();
      break;
    case "activity":
      renderDashActivity();
      break;
    case "settings":
      renderDashSettings();
      break;
  }
}

async function renderDashOverview() {
  const body = document.getElementById("dashSectionBody");
  const owner = saveOwner();
  try {
    const { data: saved } = await sb.from("saved_places").select("id").eq(owner.col, owner.val);
    const plans =
      (typeof myTribes !== "undefined" ? myTribes.size : 0) +
      (typeof myEvents !== "undefined" ? myEvents.size : 0);
    body.innerHTML = `
      <div class="dash-section-title">Overview</div>
      <div class="admin-grid-2" style="margin-bottom:14px;">
        <div class="dash-empty-state" style="padding:18px;">
          <div style="font-size:1.4rem;color:var(--ocean-teal-light);font-weight:600;">${(saved || []).length}</div>
          <div style="font-size:.7rem;margin-top:4px;">Saved places</div>
        </div>
        <div class="dash-empty-state" style="padding:18px;">
          <div style="font-size:1.4rem;color:var(--ocean-teal-light);font-weight:600;">${plans}</div>
          <div style="font-size:.7rem;margin-top:4px;">Tribes &amp; events</div>
        </div>
      </div>
      <div class="dash-empty-state">Everything here stays on this device. No account, no email.</div>`;
  } catch (err) {
    body.innerHTML = `<div class="dash-empty-state">Couldn't load your overview right now.</div>`;
  }
}

async function renderDashSaved() {
  const body = document.getElementById("dashSectionBody");
  const owner = saveOwner();
  const heading = `<div class="dash-section-title">Saved Places</div>`;
  try {
    const { data, error } = await sb
      .from("saved_places")
      .select("id, destination_id, destinations(name, image, category)")
      .eq(owner.col, owner.val)
      .order("created_at", { ascending: false });
    if (error) throw error;

    if (!data || !data.length) {
      body.innerHTML =
        heading +
        `<div class="dash-empty-state">You haven't saved any places yet. Tap the bookmark on a place to save it here.</div>`;
      return;
    }

    body.innerHTML =
      heading +
      data
        .map((row) => {
          const d = row.destinations;
          if (!d) return "";
          return `
      <div class="around-card" style="margin-bottom:10px;cursor:pointer;" onclick="closeDashboard();openDestinationById(${row.destination_id})">
        <img src="${d.image}" alt="" style="width:50px;height:50px;border-radius:10px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">
        <div class="around-card-body">
          <div class="around-card-name">${escapeHtml(d.name)}</div>
          <div class="around-card-meta">${escapeHtml(catStyle[d.category]?.label || d.category)}</div>
        </div>
      </div>`;
        })
        .join("");
  } catch (err) {
    body.innerHTML =
      heading + `<div class="dash-empty-state">Couldn't load saved places right now.</div>`;
  }
}

async function renderDashActivity() {
  const body = document.getElementById("dashSectionBody");
  const heading = `<div class="dash-section-title">Activity</div>`;
  const me = personId();
  const rows = [];
  try {
    const [tm, ei] = await Promise.all([
      sb.from("tribe_members").select("tribe_id").eq("device_id", me),
      sb.from("event_interest").select("event_id").eq("device_id", me),
    ]);
    if (tm && tm.error) throw tm.error;
    if (ei && ei.error) throw ei.error;

    const tribeIds = [...new Set(((tm && tm.data) || []).map((r) => String(r.tribe_id)))];
    const eventIds = [...new Set(((ei && ei.data) || []).map((r) => String(r.event_id)))];

    let tribeTitles = {},
      eventTitles = {};
    if (tribeIds.length) {
      const { data } = await sb.from("tribes").select("id, title").in("id", tribeIds);
      (data || []).forEach((t) => {
        tribeTitles[String(t.id)] = t.title;
      });
    }
    if (eventIds.length) {
      const { data } = await sb.from("events").select("id, title").in("id", eventIds);
      (data || []).forEach((e) => {
        eventTitles[String(e.id)] = e.title;
      });
    }

    tribeIds.forEach((id) =>
      rows.push({ icon: "users", label: tribeTitles[id] || "Tribe", meta: "Tribe you joined" }),
    );
    eventIds.forEach((id) =>
      rows.push({
        icon: "calendar",
        label: eventTitles[id] || "Event",
        meta: "Event you are going to",
      }),
    );
  } catch (err) {
    body.innerHTML =
      heading + `<div class="dash-empty-state">Couldn't load activity right now.</div>`;
    return;
  }

  if (!rows.length) {
    body.innerHTML =
      heading +
      `<div class="dash-empty-state">Join a tribe or an event and it shows up here.</div>`;
    return;
  }

  body.innerHTML =
    heading +
    rows
      .map(
        (r) => `
      <div class="around-card" style="margin-bottom:10px;">
        <div class="around-card-icon">${lucideSvg(r.icon, 18)}</div>
        <div class="around-card-body">
          <div class="around-card-name">${escapeHtml(r.label)}</div>
          <div class="around-card-meta">${escapeHtml(r.meta)}</div>
        </div>
      </div>`,
      )
      .join("");
}

async function renderDashSettings() {
  const body = document.getElementById("dashSectionBody");
  body.innerHTML = `
    <div class="dash-section-title">Settings</div>
    <div class="admin-field"><label>What should we call you</label><input id="dashSettingsName" maxlength="40" value="${escapeHtml(personName())}"></div>
    <div class="dash-empty-state" style="margin-top:12px;">Kept on this device only. No email, no password.</div>
    <button class="admin-save-btn" style="margin-top:12px;" onclick="saveDashSettings()">Save name</button>`;
}

async function saveDashSettings() {
  const el = document.getElementById("dashSettingsName");
  const name = ((el && el.value) || "").trim();
  if (!name) {
    toast("Enter a name first.");
    return;
  }
  personSave(name, null);
  renderDashProfileCard();
  toast("Saved.");
}

// ─── Save / unsave a place ───
// Every save belongs to the device, using the same anonymous id Pulse likes and
// tribe joins use. There are no accounts, so there is nothing to sign in to.
function saveOwner() {
  const id = personId();
  return { col: "device_id", val: id, row: { device_id: id } };
}

async function toggleSavePlace(destinationId, btnEl) {
  const owner = saveOwner();
  try {
    const { data: existing } = await sb
      .from("saved_places")
      .select("id")
      .eq(owner.col, owner.val)
      .eq("destination_id", destinationId)
      .maybeSingle();
    if (existing) {
      const { error } = await sb.from("saved_places").delete().eq("id", existing.id);
      if (error) throw error;
      if (btnEl) btnEl.classList.remove("saved");
      toast("Removed from saved places.");
    } else {
      const { error } = await sb
        .from("saved_places")
        .insert({ ...owner.row, destination_id: destinationId });
      if (error && error.code !== "23505") throw error;
      if (btnEl) btnEl.classList.add("saved");
      toast(isLoggedIn() ? "Saved to your places." : "Saved on this device.");
    }
  } catch (err) {
    console.warn("[SANVIC] Save failed:", err);
    toast("Could not update saved places just now.");
  }
}

function handleDestSaveClick() {
  if (!currentDest) return;
  toggleSavePlace(currentDest.id, document.getElementById("deSaveBtn"));
}

async function refreshDestSaveButton(destinationId) {
  const btn = document.getElementById("deSaveBtn");
  if (!btn) return;
  btn.classList.remove("saved");
  const owner = saveOwner();
  try {
    const { data } = await sb
      .from("saved_places")
      .select("id")
      .eq(owner.col, owner.val)
      .eq("destination_id", destinationId)
      .maybeSingle();
    if (data) btn.classList.add("saved");
  } catch (err) {
    // fail silently — save state is a nice-to-have, not critical path
  }
}

function destRowToObj(row) {
  return {
    id: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    category: row.category,
    image: row.image,
    images: row.images || [],
    description: row.description,
    tip: row.tip,
    color: row.color || "#0ea5e9",
    videoUrl: row.video_url || "",
    videoType: row.video_type || "",
    featured: !!row.featured,
    googleBusinessUrl: row.google_business_url || "",
    imageCredit: row.image_credit || "",
    clue: row.clue || "",
    huntSpot: !!row.hunt_spot,
    barangay: row.barangay || "",
    stats: { rating: row.rating, travel: row.travel, temp: row.temp, season: row.season },
  };
}

const DEFAULT_SUGGESTIONS = [
  { id: 1, text: "Best beaches in San Vicente" },
  { id: 2, text: "Where should I stay?" },
  { id: 3, text: "Best time to visit" },
  { id: 4, text: "Budget guide" },
  { id: 5, text: "Local hidden gems" },
];

let talaSuggestions = [];

// True if today's month/day falls within [fromM/fromD, toM/toD], inclusive,
// handling ranges that wrap across the new year (e.g. Nov 1 -> Mar 31).
// A suggestion with no range set is always active.
function isSuggestionActiveToday(s) {
  if (s.active_from_month == null || s.active_to_month == null) return true;
  const now = new Date();
  const todayKey = (now.getMonth() + 1) * 100 + now.getDate();
  const fromKey = s.active_from_month * 100 + (s.active_from_day || 1);
  const toKey = s.active_to_month * 100 + (s.active_to_day || 28);
  if (fromKey <= toKey) {
    return todayKey >= fromKey && todayKey <= toKey;
  } else {
    // wraps across new year, e.g. Nov 1 -> Mar 31
    return todayKey >= fromKey || todayKey <= toKey;
  }
}

async function loadDataFromSupabase() {
  let directoryLoaded = false;
  try {
    const [
      destRes,
      talaRes,
      settingsRes,
      sugRes,
      siteRes,
      catRes,
      nearbyRes,
      aiSettingsRes,
      todayRes,
      tribesRes,
      eventsRes,
      upcomingRes,
      huntRewardsRes,
      huntSettingsRes,
      joinTribeRes,
      joinEventRes,
      joinTodayRes,
    ] = await Promise.all(
      [
        sb.from("destinations").select("*").order("sort_order", { ascending: true }),
        sb.from("tala_responses").select("*").order("sort_order", { ascending: true }),
        sb.from("tala_settings").select("*").eq("key", "default_response").maybeSingle(),
        sb.from("tala_suggestions").select("*").order("sort_order", { ascending: true }),
        sb
          .from("site_settings")
          .select("*")
          .in("key", [
            "hero_title",
            "hero_subtitle",
            "splash_subtext",
            "splash_footer",
            "explore_filters",
          ]),
        sb.from("destination_categories").select("*").order("sort_order", { ascending: true }),
        sb.from("nearby_places").select("*").order("sort_order", { ascending: true }),
        sb.from("tala_settings").select("key,value").in("key", ["ai_enabled", "ai_model"]),
        sb.from("today_content").select("key,data"),
        sb.from("tribes").select("*").order("sort_order", { ascending: true }),
        sb.from("events").select("*").order("sort_order", { ascending: true }),
        sb.from("my_sanvic_upcoming").select("*").order("sort_order", { ascending: true }),
        sb.from("hunt_rewards").select("*").order("sort_order", { ascending: true }),
        sb.from("hunt_settings").select("*"),
        sb.from("tribe_members").select("tribe_id,device_id,display_name"),
        sb.from("event_interest").select("event_id,device_id,display_name"),
        sb.from("today_interest").select("item_id,device_id,display_name"),
      ].map((request) => Promise.resolve(request).catch((error) => ({ data: null, error }))),
    );

    if (destRes.error) throw destRes.error;
    // An optional assistant-table failure must not replace the live directory.

    if (aiSettingsRes && aiSettingsRes.data) {
      aiSettingsRes.data.forEach((r) => {
        if (r.key === "ai_enabled") talaAiEnabled = r.value === "true";
        if (r.key === "ai_model" && r.value) talaAiModel = r.value;
      });
    }

    destinations = Array.isArray(destRes.data) ? destRes.data.map(destRowToObj) : [];
    destinationsSource = "supabase";
    directoryLoaded = true;
    aiData =
      talaRes.data && talaRes.data.length
        ? talaRes.data.map((r) => ({
            id: r.id,
            kw: r.keywords,
            r: r.response,
            cat: r.category || "knowledge",
          }))
        : DEFAULT_TALA_DATA;
    defaultR =
      settingsRes.data && settingsRes.data.value
        ? settingsRes.data.value
        : DEFAULT_FALLBACK_RESPONSE;
    talaSuggestions =
      sugRes && sugRes.data && sugRes.data.length ? sugRes.data : DEFAULT_SUGGESTIONS;
    applyCategoriesFromRows(catRes && catRes.data);
    applyNearbyPlacesFromRows(nearbyRes && nearbyRes.data);

    const siteRows = siteRes && siteRes.data ? siteRes.data : [];
    const titleRow = siteRows.find((r) => r.key === "hero_title");
    const subRow = siteRows.find((r) => r.key === "hero_subtitle");
    const splashSubRow = siteRows.find((r) => r.key === "splash_subtext");
    const splashFootRow = siteRows.find((r) => r.key === "splash_footer");
    heroTitle = titleRow && titleRow.value ? titleRow.value : DEFAULT_HERO_TITLE;
    heroSubtitle = subRow && subRow.value != null ? subRow.value : DEFAULT_HERO_SUBTITLE;
    splashSubtext =
      splashSubRow && splashSubRow.value != null ? splashSubRow.value : DEFAULT_SPLASH_SUBTEXT;
    splashFooter =
      splashFootRow && splashFootRow.value != null ? splashFootRow.value : DEFAULT_SPLASH_FOOTER;
    // Optional Explore search + barangay row: only shown when the Backoffice
    // switch is on. Anything else (missing row, old data) keeps it hidden.
    const filtersRow = siteRows.find((r) => r.key === "explore_filters");
    exploreFiltersVisible = !!(filtersRow && String(filtersRow.value).toLowerCase() === "true");
    applyExploreFiltersVisibility();

    // Load Today content from DB. An answered query wins, including "no rows":
    // a card with nothing in it is better than a packaged status report about
    // an ATM that was never checked. Samples stand in only when the request
    // failed (offline demo) or when SHOW_SAMPLES_WHEN_DB_IS_EMPTY is flipped on.
    if (todayRes && !todayRes.error && Array.isArray(todayRes.data)) {
      const todayByKey = {};
      todayRes.data.forEach((r) => {
        if (r && r.key) todayByKey[r.key] = r.data;
      });
      const target = {
        tala_pick: "talaPick",
        happening: "happening",
        joinable: "joinable",
        weather: "weather",
        locals: "locals",
        notices: "notices",
      };
      Object.keys(target).forEach((key) => {
        if (todayByKey[key] !== undefined) TODAY_DATA[target[key]] = todayByKey[key];
        else if (!SHOW_SAMPLES_WHEN_DB_IS_EMPTY && TODAY_LIVE_KEYS.indexOf(key) >= 0)
          TODAY_DATA[target[key]] = [];
      });
    }
    // On a failed query nothing changes: that is offline demo mode, where the
    // whole app (destinations included) is running on packaged content. The line
    // we do not cross is mixing the two — real database, invented neighbours.

    // Load tribes from DB. An answered query replaces the samples even when it
    // answers "none" — see SHOW_SAMPLES_WHEN_DB_IS_EMPTY at the top of this file.
    if (
      tribesRes &&
      !tribesRes.error &&
      Array.isArray(tribesRes.data) &&
      (tribesRes.data.length || !SHOW_SAMPLES_WHEN_DB_IS_EMPTY)
    ) {
      PULSE_TRIBES.length = 0;
      tribesRes.data.forEach((t) => {
        PULSE_TRIBES.push({
          id: t.id,
          title: t.title,
          where: t.where_text,
          when: t.when_text,
          sub: t.sub,
          thumb: t.thumb_url,
          images: t.images || [],
          joined: t.joined,
          extra: t.extra,
          cap: t.cap,
          tags: t.tags || [],
          spots: t.spots,
          seatsOpen: t.seats_open,
          warn: t.spots > 0,
          videoUrl: t.video_url || "",
          videoType: t.video_type || "",
          imageCredit: t.image_credit || "",
          description: t.description || "",
          by: t.display_name || "",
        });
      });
      MYSV_TRIBES.length = 0;
      tribesRes.data.forEach((t) => {
        MYSV_TRIBES.push({
          id: t.id,
          title: t.title,
          meta: t.where_text + " • " + t.when_text,
          more: t.extra,
          grad: "linear-gradient(135deg,#f97316,#7c2d12)",
          thumb: t.thumb_url,
          images: t.images || [],
          credit: t.image_credit || "",
        });
      });
    }

    // Load events from DB. Same rule as tribes: the answer wins, even when empty.
    if (
      eventsRes &&
      !eventsRes.error &&
      Array.isArray(eventsRes.data) &&
      (eventsRes.data.length || !SHOW_SAMPLES_WHEN_DB_IS_EMPTY)
    ) {
      PULSE_EVENTS.length = 0;
      eventsRes.data.forEach((ev) => {
        PULSE_EVENTS.push({
          id: ev.id,
          title: ev.title,
          org: ev.org,
          where: ev.where_text,
          when: ev.when_text,
          price: ev.price,
          tags: ev.tags || [],
          images: ev.images || [],
          videoUrl: ev.video_url || "",
          videoType: ev.video_type || "",
          imageCredit: ev.image_credit || "",
          description: ev.description || "",
        });
      });
      MYSV_EVENTS.length = 0;
      eventsRes.data.forEach((ev) => {
        MYSV_EVENTS.push({
          id: ev.id,
          title: ev.title,
          meta: ev.where_text + " • " + ev.when_text,
          more: 0,
          grad: "linear-gradient(135deg,#a78bfa,#1e1b4b)",
          images: ev.images || [],
          credit: ev.image_credit || "",
        });
      });
    }

    // Load upcoming items from DB
    if (upcomingRes && upcomingRes.data && upcomingRes.data.length) {
      MYSV_UPCOMING.length = 0;
      upcomingRes.data.forEach((u) => {
        MYSV_UPCOMING.push({
          id: u.id,
          title: u.title,
          badge: u.badge,
          badgeStyle: u.badge_style || "solid",
          meta: u.meta,
          cta: u.cta || "View",
          action: u.action || "",
          actionId: u.action_id || "",
          images: u.images || [],
          videoUrl: u.video_url || "",
          videoType: u.video_type || "",
          grad: "linear-gradient(135deg,#0ea5e9,#0c4a6e)",
        });
      });
    }

    // Load hunt settings + rewards
    if (huntSettingsRes && huntSettingsRes.data) {
      huntSettingsRes.data.forEach((r) => {
        HUNT_SETTINGS[r.key] = r.value;
      });
    }
    if (huntRewardsRes && huntRewardsRes.data && huntRewardsRes.data.length) {
      HUNT_REWARDS.length = 0;
      huntRewardsRes.data.forEach((r) => {
        HUNT_REWARDS.push({
          id: r.id,
          title: r.title,
          subtitle: r.subtitle || "",
          badge: r.badge || "",
          destId: r.dest_id || "",
          pointsRequired: r.points_required || 100,
          images: r.images || [],
          videoUrl: r.video_url || "",
          videoType: r.video_type || "",
          grad: "linear-gradient(135deg,#0ea5e9,#0c4a6e)",
        });
      });
    }

    // Who has joined what. Anonymous device identity — no email, no account.
    applyJoinRows(joinTribeRes && joinTribeRes.data, joinEventRes && joinEventRes.data);
    applyTodayInterestRows(joinTodayRes && joinTodayRes.data);
  } catch (err) {
    console.warn("[SANVIC] Supabase load failed, using built-in defaults:", err);
    if (!directoryLoaded) {
      destinations = DEFAULT_DESTINATIONS;
      destinationsSource = "fallback";
    }
    aiData = DEFAULT_TALA_DATA;
    defaultR = DEFAULT_FALLBACK_RESPONSE;
    talaSuggestions = DEFAULT_SUGGESTIONS;
    talaAiEnabled = false;
    talaAiModel = "";
    heroTitle = DEFAULT_HERO_TITLE;
    heroSubtitle = DEFAULT_HERO_SUBTITLE;
    splashSubtext = DEFAULT_SPLASH_SUBTEXT;
    splashFooter = DEFAULT_SPLASH_FOOTER;
    applyCategoriesFromRows(null); // falls through to keeping current catStyle (defaults on first load)
    applyNearbyPlacesFromRows(null);
  }
  applyHeroText();
  applySplashText();
  window.destinations = destinations;
  dataReady = true;
  if (document.getElementById("exploreSheet")?.classList.contains("open")) renderExploreContent();
}

function applyHeroText() {
  const titleEl = document.getElementById("heroHeadline");
  const subEl = document.getElementById("heroSubtitle");
  if (titleEl) titleEl.innerHTML = heroTitle;
  if (subEl) subEl.innerHTML = heroSubtitle;
}

function applySplashText() {
  const tagEl = document.getElementById("splashTagline");
  const footEl = document.getElementById("splashFooter");
  if (tagEl) tagEl.innerHTML = splashSubtext;
  if (footEl) footEl.innerHTML = splashFooter;
}

// The built-in taxonomy, in the order visitors meet it in Explore and in the
// Trails. Kept in step with the destination_categories rows in Supabase, which
// win at runtime. The palette is the partner's, at the values from his second
// sheet, so the categories read as one family. Useful Stops covers the
// practical places — sari-sari, h24, vulcanizers, small fuel stops.
const DEFAULT_CAT_STYLE = {
  beaches: { label: "Beaches", color: "#E6D39B", icon: "waves" },
  islands: { label: "Islands", color: "#6FD3E8", icon: "palmtree" },
  nature: { label: "Natural Spots", color: "#7DFFB3", icon: "trees" },
  adventure: { label: "Adventure Locations", color: "#FF7A5C", icon: "compass" },
  stays: { label: "Accommodations", color: "#4DE1C1", icon: "bed-double" },
  waterfalls: { label: "Waterfalls", color: "#7FE3D0", icon: "droplets" },
  food: { label: "Resto Bar", color: "#FFB357", icon: "utensils-crossed" },
  services: { label: "Services", color: "#7FA8FF", icon: "landmark" },
  stops: { label: "Useful Stops", color: "#D4FF72", icon: "shopping-bag" },
  sport: { label: "Sport", color: "#FFC46B", icon: "medal" },
  nightlife: { label: "Nightlife", color: "#B98CFF", icon: "music" },
};

// Inlined Lucide SVG inner-content for the curated icon set admins can
// pick from. Keep this in sync with the picker list below. Rendered into
// a <svg viewBox="0 0 24 24" stroke="currentColor"...> wrapper.
const EXTRA_ICONS = {
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
  film: '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/><path d="M2 7h5"/><path d="M2 17h5"/><path d="M17 7h5"/><path d="M17 17h5"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  "file-text":
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v7"/><path d="M7 3v4a2 2 0 0 0 2 2h6"/>',
  "refresh-cw":
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "sparkles-ai":
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M20 15h2M2 9h2M20 9h2M9 2v2M9 20v2"/>',
  key: '<path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
};
// ── Additional Lucide icons ────────────────────────────────────────────
// Inlined from lucide-static (Lucide — ISC licence, the same project the
// curated set above comes from) so that no emoji is used as a UI icon.
// Fetched from https://cdn.jsdelivr.net/npm/lucide-static/icons/<name>.svg
// and stripped to the inner shape markup, matching the format above.
const LUCIDE_MORE_ICONS = {
  "chevron-left": '<path d="m15 18-6-6 6-6" />',
  banknote:
    '<rect width="20" height="12" x="2" y="6" rx="2" /> <circle cx="12" cy="12" r="2" /> <path d="M6 12h.01M18 12h.01" />',
  pizza:
    '<path d="m12 14-1 1" /> <path d="m13.75 18.25-1.25 1.42" /> <path d="M17.775 5.654a15.68 15.68 0 0 0-12.121 12.12" /> <path d="M18.8 9.3a1 1 0 0 0 2.1 7.7" /> <path d="M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z" />',
  shirt:
    '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />',
  gauge: '<path d="m12 14 4-4" /> <path d="M3.34 19a10 10 0 1 1 17.32 0" />',
  signal:
    '<path d="M2 20h.01" /> <path d="M7 20v-4" /> <path d="M12 20v-8" /> <path d="M17 20V8" /> <path d="M22 4v16" />',
  moon: '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />',
  "moon-star":
    '<path d="M18 5h4" /> <path d="M20 3v4" /> <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />',
  sunset:
    '<path d="M12 10V2" /> <path d="m4.93 10.93 1.41 1.41" /> <path d="M2 18h2" /> <path d="M20 18h2" /> <path d="m19.07 10.93-1.41 1.41" /> <path d="M22 22H2" /> <path d="m16 6-4 4-4-4" /> <path d="M16 18a4 4 0 0 0-8 0" />',
  sunrise:
    '<path d="M12 2v8" /> <path d="m4.93 10.93 1.41 1.41" /> <path d="M2 18h2" /> <path d="M20 18h2" /> <path d="m19.07 10.93-1.41 1.41" /> <path d="M22 22H2" /> <path d="m8 6 4-4 4 4" /> <path d="M16 18a4 4 0 0 0-8 0" />',
  "cloud-sun":
    '<path d="M12 2v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="M20 12h2" /> <path d="m19.07 4.93-1.41 1.41" /> <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" /> <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />',
  "cloud-rain":
    '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /> <path d="M16 14v6" /> <path d="M8 14v6" /> <path d="M12 16v6" />',
  wind: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2" /> <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" /> <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />',
  clock: '<circle cx="12" cy="12" r="10" /> <path d="M12 6v6l4 2" />',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <path d="M16 3.128a4 4 0 0 1 0 7.744" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <circle cx="9" cy="7" r="4" />',
  "party-popper":
    '<path d="M5.8 11.3 2 22l10.7-3.79" /> <path d="M4 3h.01" /> <path d="M22 8h.01" /> <path d="M15 2h.01" /> <path d="M22 20h.01" /> <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" /> <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" /> <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" /> <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />',
  calendar:
    '<path d="M8 2v3" /> <path d="M16 2v3" /> <rect x="3" y="3" width="18" height="18" rx="2" /> <path d="M3 9h18" />',
  "calendar-days":
    '<path d="M8 2v3" /> <path d="M16 2v3" /> <rect x="3" y="3" width="18" height="18" rx="2" /> <path d="M3 9h18" /> <path d="M8 13h.01" /> <path d="M12 13h.01" /> <path d="M16 13h.01" /> <path d="M8 17h.01" /> <path d="M12 17h.01" /> <path d="M16 17h.01" />',
  target:
    '<circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="6" /> <circle cx="12" cy="12" r="2" />',
  trophy:
    '<path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" /> <path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" /> <path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" /> <path d="M4 22h16" /> <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" /> <path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" />',
  gift: '<path d="M12 7v14" /> <path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" /> <path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" /> <rect x="3" y="7" width="18" height="4" rx="1" />',
  "chart-column":
    '<path d="M3 3v16a2 2 0 0 0 2 2h16" /> <path d="M18 17V9" /> <path d="M13 17V5" /> <path d="M8 17v-3" />',
  map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" /> <path d="M15 5.764v15" /> <path d="M9 3.236v15" />',
  luggage:
    '<path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2" /> <path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14" /> <path d="M10 20h4" /> <circle cx="16" cy="20" r="2" /> <circle cx="8" cy="20" r="2" />',
  backpack:
    '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /> <path d="M8 10h8" /> <path d="M8 18h8" /> <path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" /> <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />',
  medal:
    '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" /> <path d="M11 12 5.12 2.2" /> <path d="m13 12 5.88-9.8" /> <path d="M8 7h8" /> <circle cx="12" cy="17" r="5" /> <path d="M12 18v-2h-.5" />',
  "shopping-cart":
    '<path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18" /> <path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25" /> <circle cx="18" cy="20" r="2" /> <circle cx="8" cy="20" r="2" />',
  sailboat:
    '<path d="M10 2v15" /> <path d="M7 22a4 4 0 0 1-4-4 1 1 0 0 1 1-1h16a1 1 0 0 1 1 1 4 4 0 0 1-4 4z" /> <path d="M9.159 2.46a1 1 0 0 1 1.521-.193l9.977 8.98A1 1 0 0 1 20 13H4a1 1 0 0 1-.824-1.567z" />',
  croissant:
    '<path d="M10.2 18H4.774a1.5 1.5 0 0 1-1.352-.97 11 11 0 0 1 .132-6.487" /> <path d="M18 10.2V4.774a1.5 1.5 0 0 0-.97-1.352 11 11 0 0 0-6.486.132" /> <path d="M18 5a4 3 0 0 1 4 3 2 2 0 0 1-2 2 10 10 0 0 0-5.139 1.42" /> <path d="M5 18a3 4 0 0 0 3 4 2 2 0 0 0 2-2 10 10 0 0 1 1.42-5.14" /> <path d="M8.709 2.554a10 10 0 0 0-6.155 6.155 1.5 1.5 0 0 0 .676 1.626l9.807 5.42a2 2 0 0 0 2.718-2.718l-5.42-9.807a1.5 1.5 0 0 0-1.626-.676" />',
  martini:
    '<path d="M12 12 4.207 4.207A.707.707 0 0 1 4.707 3h14.586a.707.707 0 0 1 .5 1.207z" /> <path d="M12 12v10" /> <path d="M7 22h10" />',
  "eye-off":
    '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /> <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /> <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /> <path d="m2 2 20 20" />',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /> <circle cx="12" cy="12" r="3" />',
  crown:
    '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" /> <path d="M5 21h14" />',
  "triangle-alert":
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" />',
  "arrow-right": '<path d="M5 12h14" /> <path d="m12 5 7 7-7 7" />',
  "arrow-left": '<path d="m12 19-7-7 7-7" /> <path d="M19 12H5" />',
  "arrow-up-left": '<path d="M7 17V7h10" /> <path d="M17 17 7 7" />',
  "arrow-up-right": '<path d="M7 7h10v10" /> <path d="M7 17 17 7" />',
  "chevron-down": '<path d="m6 9 6 6 6-6" />',
  upload:
    '<path d="M12 3v12" /> <path d="m17 8-5-5-5 5" /> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />',
  info: '<circle cx="12" cy="12" r="10" /> <path d="M12 16v-4" /> <path d="M12 8h.01" />',
  plus: '<path d="M5 12h14" /> <path d="M12 5v14" />',
  "external-link":
    '<path d="M15 3h6v6" /> <path d="M10 14 21 3" /> <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />',
  navigation: '<polygon points="3 11 22 2 13 21 11 13 3 11" />',
  route:
    '<circle cx="6" cy="19" r="3" /> <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /> <circle cx="18" cy="5" r="3" />',
  flame:
    '<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />',
  mic: '<path d="M12 19v3" /> <path d="M19 10v2a7 7 0 0 1-14 0v-2" /> <rect x="9" y="2" width="6" height="13" rx="3" />',
  beef: '<path d="M16.4 13.7A6.5 6.5 0 1 0 6.28 6.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3" /> <path d="m18.5 6 1.754 3.5a6.48 6.48 0 0 1-1.854 8.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5" /> <circle cx="12.5" cy="8.5" r="2.5" />',
  ticket:
    '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /> <path d="M13 5v2" /> <path d="M13 17v2" /> <path d="M13 11v2" />',
  pencil:
    '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /> <path d="m15 5 4 4" />',
  "trash-2":
    '<path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />',
  image:
    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2" /> <circle cx="9" cy="9" r="2" /> <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /> <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
  "circle-check": '<circle cx="12" cy="12" r="10" /> <path d="m16 9-5.5 5.5L8 12" />',
  "badge-check":
    '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /> <path d="m16 9-5.5 5.5L8 12" />',
  list: '<path d="M3 5h.01" /> <path d="M3 12h.01" /> <path d="M3 19h.01" /> <path d="M8 5h13" /> <path d="M8 12h13" /> <path d="M8 19h13" />',
  "layout-dashboard":
    '<rect width="7" height="9" x="3" y="3" rx="1" /> <rect width="7" height="5" x="14" y="3" rx="1" /> <rect width="7" height="9" x="14" y="12" rx="1" /> <rect width="7" height="5" x="3" y="16" rx="1" />',
  rice: '<path d="M11.248 3c.273.1.808.53.747 1.36-.05.83-.938 1.2-.989 2.02-.06.78.333 1.24.727 1.62" /> <path d="M16.252 3c.268.1.794.53.745 1.36-.06.83-.923 1.2-.993 2.02-.05.78.338 1.24.725 1.62" /> <path d="M19.5 12 22 6" /> <path d="M4 12a1 1 0 00-.99 1.133A9 9 0 0012 21a9 9 0 008.99-7.867A1 1 0 0020 12z" /> <path d="M6.252 3c.268.1.794.53.745 1.36-.06.83-.923 1.2-.993 2.02-.05.78.338 1.24.735 1.62" /> <path d="M7 21h10" />',
  "utensils-crossed":
    '<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" /> <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" /> <path d="m2.1 21.8 6.4-6.3" /> <path d="m19 5-7 7" />',
  scooter:
    '<path d="M21 4h-3.5l2 11.05" /> <path d="M6.95 17h5.142c.523 0 .95-.406 1.063-.916a6.5 6.5 0 0 1 5.345-5.009" /> <circle cx="19.5" cy="17.5" r="2.5" /> <circle cx="4.5" cy="17.5" r="2.5" />',
  thermometer: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />',
  origami:
    '<path d="M12 12V4a1 1 0 0 1 1-1h6.297a1 1 0 0 1 .651 1.759l-4.696 4.025" /> <path d="m12 21-7.414-7.414A2 2 0 0 1 4 12.172V6.415a1.002 1.002 0 0 1 1.707-.707L20 20.009" /> <path d="m12.214 3.381 8.414 14.966a1 1 0 0 1-.167 1.199l-1.168 1.163a1 1 0 0 1-.706.291H6.351a1 1 0 0 1-.625-.219L3.25 18.8a1 1 0 0 1 .631-1.781l4.165.027" />',
  // Added for the entry questionnaire's vibe picker and the local/visiting
  // choice, which used to show emoji. Same source and format as above.
  hamburger:
    '<path d="M12 16H4a2 2 0 1 1 0-4h16a2 2 0 1 1 0 4h-4.25" /> <path d="M5 12a2 2 0 0 1-2-2 9 7 0 0 1 18 0 2 2 0 0 1-2 2" /> <path d="M5 16a2 2 0 0 0-2 2 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 2 2 0 0 0-2-2q0 0 0 0" /> <path d="m6.67 12 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2" />',
  "book-open":
    '<path d="M12 5v16" /> <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />',
  turtle:
    '<path d="m12 10 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a8 8 0 1 0-16 0v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3l2-4h4Z" /> <path d="M4.82 7.9 8 10" /> <path d="M15.18 7.9 12 10" /> <path d="M16.93 10H20a2 2 0 0 1 0 4H2" />',
  "shopping-basket":
    '<path d="m15 11-1 9" /> <path d="m19 11-4-7" /> <path d="M2 11h20" /> <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" /> <path d="M4.5 15.5h15" /> <path d="m5 11 4-7" /> <path d="m9 11 1 9" />',
  smile:
    '<path d="M15 10V9" /> <path d="M16.472 15a6 6 0 01-8.943 0" /> <path d="M9 10V9" /> <circle cx="12" cy="12" r="10" />',
  house:
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
  // Added for the place contact block: a listing needs a phone, a mailbox and a
  // message icon or it cannot show how to reach anybody.
  phone:
    '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />',
  mail: '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /> <rect x="2" y="4" width="20" height="16" rx="2" />',
  "message-circle":
    '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />',
};
Object.assign(EXTRA_ICONS, LUCIDE_MORE_ICONS);

const LUCIDE_ICONS = JSON.parse(
  '{"anchor": "<path d=\\"M12 6v16\\" /> <path d=\\"m19 13 2-1a9 9 0 0 1-18 0l2 1\\" /> <path d=\\"M9 11h6\\" /> <circle cx=\\"12\\" cy=\\"4\\" r=\\"2\\" />", "bed-double": "<path d=\\"M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8\\" /> <path d=\\"M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4\\" /> <path d=\\"M12 4v6\\" /> <path d=\\"M2 18h20\\" />", "bike": "<circle cx=\\"18.5\\" cy=\\"17.5\\" r=\\"3.5\\" /> <circle cx=\\"5.5\\" cy=\\"17.5\\" r=\\"3.5\\" /> <circle cx=\\"15\\" cy=\\"5\\" r=\\"1\\" /> <path d=\\"M12 17.5V14l-3-3 4-3 2 3h2\\" />", "camera": "<path d=\\"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z\\" /> <circle cx=\\"12\\" cy=\\"13\\" r=\\"3\\" />", "car": "<path d=\\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\\" /> <circle cx=\\"7\\" cy=\\"17\\" r=\\"2\\" /> <path d=\\"M9 17h6\\" /> <circle cx=\\"17\\" cy=\\"17\\" r=\\"2\\" />", "coffee": "<path d=\\"M10 2v2\\" /> <path d=\\"M14 2v2\\" /> <path d=\\"M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1\\" /> <path d=\\"M6 2v2\\" />", "compass": "<circle cx=\\"12\\" cy=\\"12\\" r=\\"10\\" /> <path d=\\"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z\\" />", "droplets": "<path d=\\"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z\\" /> <path d=\\"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97\\" />", "fish": "<path d=\\"M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z\\" /> <path d=\\"M18 12v.5\\" /> <path d=\\"M16 17.93a9.77 9.77 0 0 1 0-11.86\\" /> <path d=\\"M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33\\" /> <path d=\\"M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4\\" /> <path d=\\"m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98\\" />", "flower-2": "<path d=\\"M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1\\" /> <circle cx=\\"12\\" cy=\\"8\\" r=\\"2\\" /> <path d=\\"M12 10v12\\" /> <path d=\\"M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z\\" /> <path d=\\"M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z\\" />", "footprints": "<path d=\\"M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z\\" /> <path d=\\"M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z\\" /> <path d=\\"M16 17h4\\" /> <path d=\\"M4 13h4\\" />", "gem": "<path d=\\"M10.5 3 8 9l4 13 4-13-2.5-6\\" /> <path d=\\"M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z\\" /> <path d=\\"M2 9h20\\" />", "heart": "<path d=\\"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5\\" />", "landmark": "<path d=\\"M10 18v-7\\" /> <path d=\\"M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z\\" /> <path d=\\"M14 18v-7\\" /> <path d=\\"M18 18v-7\\" /> <path d=\\"M3 22h18\\" /> <path d=\\"M6 18v-7\\" />", "map-pin": "<path d=\\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\\" /> <circle cx=\\"12\\" cy=\\"10\\" r=\\"3\\" />", "mountain": "<path d=\\"m8 3 4 8 5-5 5 15H2L8 3z\\" />", "music": "<path d=\\"M9 18V5l12-2v13\\" /> <circle cx=\\"6\\" cy=\\"18\\" r=\\"3\\" /> <circle cx=\\"18\\" cy=\\"16\\" r=\\"3\\" />", "palmtree": "<path d=\\"M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4\\" /> <path d=\\"M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3\\" /> <path d=\\"M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35\\" /> <path d=\\"M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14\\" />", "plane": "<path d=\\"M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z\\" />", "ship": "<path d=\\"M12 10.189V14\\" /> <path d=\\"M12 2v3\\" /> <path d=\\"M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6\\" /> <path d=\\"M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76\\" /> <path d=\\"M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1\\" />", "shopping-bag": "<path d=\\"M16 10a4 4 0 0 1-8 0\\" /> <path d=\\"M3.103 6.034h17.794\\" /> <path d=\\"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z\\" />", "sparkles": "<path d=\\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\\" /> <path d=\\"M20 2v4\\" /> <path d=\\"M22 4h-4\\" /> <circle cx=\\"4\\" cy=\\"20\\" r=\\"2\\" />", "star": "<path d=\\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\\" />", "sun": "<circle cx=\\"12\\" cy=\\"12\\" r=\\"4\\" /> <path d=\\"M12 2v2\\" /> <path d=\\"M12 20v2\\" /> <path d=\\"m4.93 4.93 1.41 1.41\\" /> <path d=\\"m17.66 17.66 1.41 1.41\\" /> <path d=\\"M2 12h2\\" /> <path d=\\"M20 12h2\\" /> <path d=\\"m6.34 17.66-1.41 1.41\\" /> <path d=\\"m19.07 4.93-1.41 1.41\\" />", "tent": "<path d=\\"M3.5 21 14 3\\" /> <path d=\\"M20.5 21 10 3\\" /> <path d=\\"M15.5 21 12 15l-3.5 6\\" /> <path d=\\"M2 21h20\\" />", "trees": "<path d=\\"M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z\\" /> <path d=\\"M7 16v6\\" /> <path d=\\"M13 19v3\\" /> <path d=\\"M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5\\" />", "umbrella": "<path d=\\"M12 13v7a2 2 0 0 0 4 0\\" /> <path d=\\"M12 2v2\\" /> <path d=\\"M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z\\" />", "utensils": "<path d=\\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\\" /> <path d=\\"M7 2v20\\" /> <path d=\\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\\" />", "waves": "<path d=\\"M2 12q2.5 2 5 0t5 0 5 0 5 0\\" /> <path d=\\"M2 19q2.5 2 5 0t5 0 5 0 5 0\\" /> <path d=\\"M2 5q2.5 2 5 0t5 0 5 0 5 0\\" />", "wine": "<path d=\\"M8 22h8\\" /> <path d=\\"M7 10h10\\" /> <path d=\\"M12 15v7\\" /> <path d=\\"M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z\\" />"}',
);
const LUCIDE_ICON_KEYS = Object.keys(LUCIDE_ICONS);
// Everything an admin can pick: the curated set plus the icons added later.
const ALL_ICON_KEYS = Array.from(new Set([...LUCIDE_ICON_KEYS, ...Object.keys(EXTRA_ICONS)]));
function lucideSvg(name, size) {
  const inner = EXTRA_ICONS[name] || LUCIDE_ICONS[name] || LUCIDE_ICONS["map-pin"];
  const s = size || 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="lucide" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

// Renders an admin-entered icon value. A Lucide name ("palmtree") becomes an
// icon; anything else — a legacy emoji, say — is shown as text, so rows saved
// before the icon set existed keep working.
function iconOrText(value, size) {
  const v = String(value == null ? "" : value).trim();
  if (!v) return "";
  if (EXTRA_ICONS[v] || LUCIDE_ICONS[v]) return lucideSvg(v, size || 16);
  return escT(v);
}

// Converts a "#rrggbb" hex color into the soft translucent background
// chip color used throughout (12% opacity), matching the look every
// existing category already has.
function hexToBg(hex, alpha) {
  alpha = alpha == null ? 0.12 : alpha;
  const h = (hex || "#0ea5e9").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Mutable — repopulated from destination_categories in Supabase every
// time data loads. Starts with the built-in defaults so nothing is
// ever blank before the first load finishes.
let catStyle = {};
Object.keys(DEFAULT_CAT_STYLE).forEach((k) => {
  const d = DEFAULT_CAT_STYLE[k];
  catStyle[k] = { label: d.label, color: d.color, bg: hexToBg(d.color), icon: d.icon || "map-pin" };
});

// Display order for categories, mirroring destination_categories.sort_order.
// The admin directory groups by this so Beaches/Islands/Nature lead, the same
// order visitors see in Explore, instead of whatever order rows came back in.
let catOrder = Object.keys(DEFAULT_CAT_STYLE);

function applyCategoriesFromRows(rows) {
  if (!rows || !rows.length) return; // keep defaults if the table is empty/unreachable
  const next = {};
  rows.forEach((r) => {
    next[r.key] = {
      label: r.label,
      color: r.color || "#0ea5e9",
      bg: hexToBg(r.color),
      icon: r.icon || "map-pin",
    };
  });
  catStyle = next;
  catOrder = rows.map((r) => r.key);
}

// ─── AI ───
function getAI(input) {
  const l = input
    .toLowerCase()
    .replace(/[?.!,]/g, "")
    .trim();
  for (const d of destinations) {
    if (l.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(l))
      return {
        reply: `<strong>${d.name}</strong><br><br>${d.description}<br><br>${d.tip}`,
        dest: d,
      };
  }
  let best = null,
    bestS = 0;
  for (const item of aiData)
    for (const k of item.kw)
      if (l.includes(k) && k.length > bestS) {
        bestS = k.length;
        best = item.r;
      }
  return { reply: best || defaultR, dest: null };
}

// Live AI answer via our own server endpoint (/api/tala-chat). The server
// holds the OpenRouter key (env OPENROUTER_API_KEY), builds the prompt from
// the live destinations + Tala answers, and uses the model saved in
// tala_settings. The browser never sees the key. Any failure (endpoint
// missing, key not set, AI off, rate limit) falls back to curated answers.
const TALA_API_URL = "/api/tala-chat";
const TALA_HISTORY_MAX = 10;
let talaHistory = []; // recent {role, content} turns, for follow-up questions

async function getAILive(input) {
  const destMatch = getAI(input).dest;
  const messages = talaHistory.concat([{ role: "user", content: input }]).slice(-TALA_HISTORY_MAX);
  const res = await fetch(TALA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok || !j.reply) {
    throw new Error((j && j.error) || "HTTP " + res.status);
  }
  const reply = String(j.reply).trim();
  talaHistory = messages.concat([{ role: "assistant", content: reply }]).slice(-TALA_HISTORY_MAX);
  return { reply: talaFormatAiReply(reply), dest: destMatch };
}

// Model output is untrusted text: escape it, then allow only **bold** and
// line breaks, so a reply can never inject markup into the page.
function talaFormatAiReply(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function answerTala(t) {
  if (talaAiEnabled) {
    document.getElementById("tshStatus").textContent = "tala is thinking…";
    getAILive(t)
      .then((obj) => {
        const { reply, dest } = obj;
        if (dest && typeof openDest === "function") {
          openDest(dest);
          openTalaSheet();
        }
        markTalaIdle();
        addMsg("bot", reply);
        speak(reply);
      })
      .catch((err) => {
        console.warn("[TALA] live AI unavailable, using curated answers:", err);
        markTalaIdle();
        const fallback = getAI(t);
        addMsg("bot", fallback.reply);
        speak(fallback.reply);
      });
  } else {
    const r = getAI(t);
    if (r.dest && typeof openDest === "function") openDest(r.dest);
    setTimeout(() => {
      addMsg("bot", r.reply);
      speak(r.reply);
    }, 140);
  }
}
function markTalaIdle() {
  const st = document.getElementById("tshStatus");
  if (st && st.textContent === "tala is thinking…") st.textContent = "Your Palawan concierge";
}

// ─── MAP ───
let map,
  mapReady = false;
// True while Form a Tribe is waiting for a tap on the map. Declared up here with
// the rest of the map state so the marker code below can read it safely.
let mapPickActive = false;
const markersByCat = {};
let allMarkers = [];
// Individual place markers are staged by zoom so the map remains legible.
const PIN_VISIBLE_ZOOM = 13; // barangay overview first; beach/island POIs appear at 13
const SANVICENTE_CENTER = [10.5, 119.22]; // municipality anchor + default view target
let activeMarkerSet = []; // tracks whichever markers are "supposed" to be on the map right now (all, or a filtered category)
let areaLabelMarker = null; // far-zoom "San Vicente" card that stands in for the pin cloud
let placeClusterMarkers = [];

// Category colors are configured in the directory taxonomy (the defaults use
// sand for beaches, aqua for islands, coral for adventure, etc.). Keep the map,
// category chips and Layers legend on that same palette.
function categoryMarkerColor(key) {
  const configured =
    (catStyle[key] && catStyle[key].color) ||
    (DEFAULT_CAT_STYLE[key] && DEFAULT_CAT_STYLE[key].color) ||
    "#7FA8FF";
  return /^#[0-9a-f]{6}$/i.test(configured) ? configured : "#7FA8FF";
}

// Which places carry the map. Two sources, both admin-owned:
//   1. destinations.featured — the businesses that pay to be found;
//   2. the first two places by sort_order in every category — the landmarks and
//      anchor businesses the team curated to the top.
// These stay visible from 10km out, so a visitor at regional zoom sees the town,
// the resorts and the landmarks instead of an empty green coastline.
function keyPlaceIds() {
  const ids = new Set();
  (Array.isArray(destinations) ? destinations : []).forEach((d) => {
    if (d && d.featured) ids.add(String(d.id));
  });
  const byCategory = {};
  (Array.isArray(destinations) ? destinations : []).forEach((d) => {
    if (!d) return;
    const k = String(d.category || "other");
    (byCategory[k] = byCategory[k] || []).push(d);
  });
  Object.keys(byCategory).forEach((k) => {
    byCategory[k]
      .slice()
      .sort((a, b) => orderOf(a) - orderOf(b))
      .slice(0, 2)
      .forEach((d) => ids.add(String(d.id)));
  });
  return ids;
}
function orderOf(d) {
  const n = Number(d && d.sort_order);
  return Number.isFinite(n) ? n : 9999;
}

function rebuildMarkers() {
  if (!map) return;
  allMarkers.forEach((m) => map.removeLayer(m));
  allMarkers = [];
  for (const k in markersByCat) delete markersByCat[k];
  const keyIds = keyPlaceIds();
  destinations.forEach((d) => {
    if (!SanvicExplore.hasCoordinates(d)) return;
    if (!markersByCat[d.category]) markersByCat[d.category] = [];
    const color = categoryMarkerColor(d.category);
    // The marker is the partner's neon dot: a disc in the category colour with a
    // small white centre and a slight glow. It carried a category icon before,
    // which is what he kept pointing at — no glyph goes in the pin now.
    const html = `<span class="place-pin" style="--pin-color:${color}"></span>`;
    const m = L.marker([d.lat, d.lng], {
      title: d.name,
      alt: d.name,
      keyboard: true,
      icon: L.divIcon({
        className: "place-marker" + (keyIds.has(String(d.id)) ? " is-key" : ""),
        html,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      }),
    });
    const label = document.createElement("span");
    label.textContent = d.name;
    m.bindTooltip(label, { direction: "top", offset: [0, -11] });
    m._d = d;
    m._key = keyIds.has(String(d.id));
    m.on("click", () => {
      if (mapPickActive) {
        pickFromMarker(d);
        return;
      }
      openDest(d);
    });
    markersByCat[d.category].push(m);
    allMarkers.push(m);
  });
  activeMarkerSet = allMarkers;
  // Places moved, so the barangay dots may need to move with them.
  buildBarangayMarkers();
  applyPinVisibility();
  renderDiscoverList(document.querySelector(".discover-cat.active")?.dataset.cat || "all");
  if (document.body.classList.contains("explore-open")) syncExploreMap();
}

function mapMarkerGroup(marker) {
  const key = String(marker._d?.category || "").toLowerCase();
  const label = String(catStyle[key]?.label || "").toLowerCase();
  const text = key + " " + label;
  if (/beach|island/.test(text)) return "coast";
  if (/stay|accommodation|hotel|resort|lodge/.test(text)) return "stays";
  if (/food|restaurant|resto|dining|cafe|bar/.test(text)) return "food";
  return "other";
}
function markerVisibleAtZoom(marker, zoom) {
  // While a meeting point is being picked every pin is a target, so nothing is
  // hidden: tapping any business or landmark on the map is a valid answer.
  if (mapPickActive) return true;
  // Key places never drop off the map: from 10km out they are the only pins a
  // visitor sees, and that is the point — "at this distance I don't see nothing,
  // we should see the main businesses and the main landmarks already."
  if (marker && marker._key) return zoom >= 10;
  const group = mapMarkerGroup(marker);
  if (zoom >= 15) return true;
  if (zoom >= 14) return group === "coast" || group === "stays" || group === "food";
  if (zoom >= 13) return group === "coast";
  return false;
}
function updatePlaceClusterLayer() {
  if (!map) return;
  placeClusterMarkers.forEach((m) => {
    if (map.hasLayer(m)) map.removeLayer(m);
  });
  placeClusterMarkers = [];
  const zoom = map.getZoom();
  if (zoom < 14 || zoom >= 15) return;
  const eligible = activeMarkerSet.filter(
    (m) => ["food", "stays"].includes(mapMarkerGroup(m)) && markerVisibleAtZoom(m, zoom),
  );
  const points = eligible.map((marker) => ({
    marker,
    point: map.project(marker.getLatLng(), zoom),
    group: mapMarkerGroup(marker),
  }));
  const used = new Set();
  points.forEach((item) => {
    if (used.has(item.marker)) return;
    const members = points.filter(
      (other) =>
        !used.has(other.marker) &&
        other.group === item.group &&
        Math.hypot(other.point.x - item.point.x, other.point.y - item.point.y) < 34,
    );
    if (members.length < 2) return;
    members.forEach((x) => {
      used.add(x.marker);
      if (map.hasLayer(x.marker)) map.removeLayer(x.marker);
    });
    const lat = members.reduce((sum, x) => sum + x.marker.getLatLng().lat, 0) / members.length;
    const lng = members.reduce((sum, x) => sum + x.marker.getLatLng().lng, 0) / members.length;
    const label = item.group === "food" ? "food and drink" : "places to stay";
    const names = members.map((x) => x.marker._d.name).join(", ");
    const icon = L.divIcon({
      className: "place-cluster-icon",
      html: `<span class="place-cluster-badge" aria-label="${members.length} ${label}">${members.length}</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    const cluster = L.marker([lat, lng], {
      icon,
      keyboard: true,
      title: `${members.length} nearby ${label}: ${names}`,
      zIndexOffset: 1200,
    });
    cluster.on("click", () =>
      map.flyTo([lat, lng], Math.min(18, map.getZoom() + 2), { duration: 0.55 }),
    );
    cluster.addTo(map);
    placeClusterMarkers.push(cluster);
  });
}
window.updatePlaceClusterLayer = updatePlaceClusterLayer;
function updateBarangayMarkerVisibility(zoom) {
  if (!map || !barangayMarkerLayer) return;
  const show = barangayVisible && zoom >= 9 && zoom < 13;
  if (show && !map.hasLayer(barangayMarkerLayer)) barangayMarkerLayer.addTo(map);
  if (!show && map.hasLayer(barangayMarkerLayer)) map.removeLayer(barangayMarkerLayer);
}

function applyPinVisibility() {
  if (!map) return;
  const zoom = map.getZoom();
  const container = map.getContainer();
  if (container) container.classList.toggle("zoom-far", zoom <= 11);
  setAreaLabel(zoom < 9);
  updateBarangayMarkerVisibility(zoom);
  allMarkers.forEach((marker) => {
    if (map.hasLayer(marker)) map.removeLayer(marker);
  });
  const visible = activeMarkerSet.filter((marker) => markerVisibleAtZoom(marker, zoom));
  visible.forEach((marker) => marker.addTo(map));
  updatePlaceClusterLayer();
}

// ─── FAR-ZOOM AREA LABEL ───
// Stands in for the pin cloud at regional zoom: one tappable card naming the
// municipality. Tapping it flies in far enough for the individual pins to return.
function areaLabelIcon() {
  return L.divIcon({
    className: "area-label-marker",
    html: areaLabelHtml(),
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}
function areaLabelHtml() {
  const n = allMarkers.length;
  return (
    '<span class="sv-area-label">' +
    '<span class="sv-area-dot" aria-hidden="true"></span>' +
    '<span class="sv-area-text">' +
    '<span class="sv-area-kicker">Palawan</span>' +
    '<span class="sv-area-name">San Vicente</span>' +
    '<span class="sv-area-sub">' +
    n +
    " place" +
    (n === 1 ? "" : "s") +
    " to explore</span>" +
    "</span>" +
    '<span class="sv-area-cta" aria-hidden="true">' +
    lucideSvg("compass", 13) +
    "</span>" +
    "</span>"
  );
}
function setAreaLabel(show) {
  if (!map) return;
  if (!show) {
    if (areaLabelMarker && map.hasLayer(areaLabelMarker)) map.removeLayer(areaLabelMarker);
    return;
  }
  if (!areaLabelMarker) {
    areaLabelMarker = L.marker(SANVICENTE_CENTER, { icon: areaLabelIcon() });
    areaLabelMarker.on("click", zoomToSanVicente);
  } else {
    areaLabelMarker.setIcon(areaLabelIcon()); // rebuild so the place count stays current
  }
  if (!map.hasLayer(areaLabelMarker)) areaLabelMarker.addTo(map);
  const el = areaLabelMarker.getElement();
  if (el) {
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "San Vicente, Palawan — zoom in to see places");
  }
}
function zoomToSanVicente() {
  if (!map) return;
  const animate = !reducedMotion();
  if (activeMarkerSet.length && activeMarkerSet.length < allMarkers.length) {
    map.flyToBounds(L.featureGroup(activeMarkerSet).getBounds().pad(0.25), {
      duration: 0.9,
      maxZoom: 15,
      animate,
    });
  } else {
    map.flyTo(SANVICENTE_CENTER, PIN_VISIBLE_ZOOM, { duration: 0.9, animate });
  }
}

// ─── "MY LOCATION" ───
// One-shot getCurrentPosition() on tap — no watchPosition/continuous
// tracking, so it costs nothing while the visitor isn't actively asking
// "where am I". Re-tapping the button gets a fresh fix.
let userLocationMarker = null,
  userLocationAccuracyCircle = null;

function mapNotice(message) {
  const el = document.getElementById("mapStatus");
  el.textContent = message;
  el.hidden = !message;
}
function locateUser(nearby = false) {
  if (!navigator.geolocation) {
    mapNotice("Location is not available on this device. Search by barangay instead.");
    return;
  }
  if (!map) {
    mapNotice("The map is still loading. You can search for a place meanwhile.");
    return;
  }
  if (!document.body.classList.contains("explore-open")) dockNav("discover");
  if (currentDest) closeDestSheet(false);
  if (!exploreIsSide()) setExploreSnap(1);
  const btn = document.getElementById("locateMeBtn");
  btn.disabled = true;
  btn.classList.add("locating");
  btn.setAttribute("aria-busy", "true");
  mapNotice("Finding your location…");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      btn.disabled = false;
      btn.classList.remove("locating");
      btn.setAttribute("aria-busy", "false");
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      if (lat < 6.5 || lat > 12.9 || lng < 116.6 || lng > 121) {
        mapNotice("You are outside Palawan. Choose a barangay to explore San Vicente.");
        return;
      }
      if (userLocationMarker) map.removeLayer(userLocationMarker);
      if (userLocationAccuracyCircle) map.removeLayer(userLocationAccuracyCircle);
      userLocationAccuracyCircle = L.circle([lat, lng], {
        radius: accuracy,
        color: "#0d9488",
        weight: 1,
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(map);
      userLocationMarker = L.marker([lat, lng], {
        title: "Your location",
        icon: L.divIcon({
          className: "user-location",
          html: "<span></span>",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
        zIndexOffset: 1100,
      }).addTo(map);
      exploreState.nearby = !!nearby;
      renderExploreContent();
      syncExploreMap();
      map.setView([lat, lng], 14, { animate: !reducedMotion() });
      mapNotice(
        nearby
          ? "Places sorted by straight-line distance, not travel time."
          : "Your location is shown. Accuracy about " + Math.round(accuracy) + " m.",
      );
    },
    (err) => {
      btn.disabled = false;
      btn.classList.remove("locating");
      btn.setAttribute("aria-busy", "false");
      mapNotice(
        err.code === 1
          ? "Location permission is off. Enable it in your browser, or search by barangay."
          : "We could not locate you. Try again or search by barangay.",
      );
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
  );
}
function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
let barangayLayer = null;
let barangayMarkerLayer = null;
let barangayVisible = true;
async function initMap() {
  if (mapReady) return;
  mapReady = true;
  if (!dataReady) await loadDataFromSupabase();
  if (typeof L === "undefined") {
    mapNotice(
      "The map could not load. You can still browse the directory. Reload when your connection returns.",
    );
    return;
  }
  // 18, not 19: past that there is no imagery anywhere in this municipality, and
  // the map was letting people zoom into artwork that does not exist.
  map = L.map("map", {
    center: [10.5, 119.22],
    zoom: 11,
    minZoom: 8,
    maxZoom: 18,
    zoomControl: false,
    attributionControl: true,
    maxBounds: [
      [6.5, 116.6],
      [12.9, 121.0],
    ],
    maxBoundsViscosity: 1,
    worldCopyJump: false,
  });
  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
  window._mS = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution,
    maxZoom: 19,
    maxNativeZoom: 19,
  });
  window._mTerrain = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    attribution:
      attribution +
      ', SRTM | Style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxNativeZoom: 17,
    maxZoom: 19,
    subdomains: "abc",
  });
  // Esri World Imagery has no detail past ~z17 along this coast, and instead of a
  // 404 it answers with a grey "Map data not yet available" tile. Leaflet drew
  // that tile happily, so zooming past 17 on satellite — or on street/terrain,
  // which inherit the map's own ceiling — filled the screen with grey boxes.
  // maxNativeZoom tells Leaflet the truth: fetch z17 and scale it up, which stays
  // sharp enough to navigate by and never shows the placeholder.
  window._mSatellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri — Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      maxZoom: 19,
      maxNativeZoom: 17,
    },
  );
  [window._mS, window._mTerrain, window._mSatellite].forEach((layer) => {
    let errors = 0;
    layer.on("tileerror", () => {
      if (!map.hasLayer(layer)) return;
      if (++errors >= 3)
        mapNotice(
          "Some map tiles are unavailable. Try another layer; the place directory still works.",
        );
    });
    layer.on("tileload", () => {
      errors = 0;
    });
  });
  window._mView = null;
  // Satellite first: this is a destination map, and the coastline, reefs and
  // tree cover are the thing people are actually looking at. Anyone who picks
  // another layer keeps it for the rest of their session.
  let preferred = "satellite";
  try {
    preferred = sessionStorage.getItem("sanvic_basemap") || "satellite";
    barangayVisible = sessionStorage.getItem("sanvic_boundaries") !== "off";
  } catch (e) {}
  switchMapLayer(preferred);
  L.control.zoom({ position: "topright" }).addTo(map);
  // No more permanent `.visible` here. It used to pin the Layers pill to the
  // corner for the rest of the session, so it floated over Tribes, The Hunt and
  // My Journey. Visibility is now owned by body[data-active-tab] + panel-open in
  // the stylesheet — one place, no stale class.
  initBarangayLayer();
  rebuildMarkers();
  map.on("zoomend", applyPinVisibility);
  map.on("moveend", () => {
    if (map.getZoom() < 9) setAreaLabel(true);
  });
  map.on("resize", () => highlightExplorePlace(exploreState.selected));
  syncMapViewport();
  if (document.body.classList.contains("explore-open")) fitExploreResults();
}
function getBarangayStyle() {
  const light = ["street", "terrain"].includes(window._mView);
  return {
    color: light ? "#34556b" : "#d1e3ec",
    weight: 1.3,
    opacity: 0.55,
    fillOpacity: 0.015,
    dashArray: "5,5",
  };
}
function barangayCenter(feature) {
  const geom = feature && feature.geometry;
  if (!geom) return null;
  const polygons =
    geom.type === "Polygon"
      ? [geom.coordinates]
      : geom.type === "MultiPolygon"
        ? geom.coordinates
        : [];
  let best = null,
    bestArea = -1;
  polygons.forEach((poly) => {
    const ring = poly && poly[0];
    if (!ring || ring.length < 3) return;
    let area = 0,
      cx = 0,
      cy = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
      area += cross;
      cx += (ring[j][0] + ring[i][0]) * cross;
      cy += (ring[j][1] + ring[i][1]) * cross;
    }
    area *= 0.5;
    const abs = Math.abs(area);
    if (abs > bestArea) {
      bestArea = abs;
      best = abs > 1e-12 ? [cx / (6 * area), cy / (6 * area)] : null;
    }
  });
  if (best && Number.isFinite(best[0]) && Number.isFinite(best[1])) return [best[1], best[0]];
  const bounds = L.geoJSON(feature).getBounds();
  return bounds.isValid() ? bounds.getCenter() : null;
}
// Where the dot for a barangay sits. A polygon centroid is the wrong answer on
// this coast: every barangay runs from the shoreline east into the mountains, so
// the centroid lands in the jungle (or in the sea off a headland) and all ten
// dots lined up nicely in a diagonal that meant nothing. Port Barton only looked
// right by accident.
//
// The town is where the places are, so the anchor is the median position of the
// barangay's own mapped places (destinations carry `barangay`, set in admin).
// Median, not mean: one far-flung island belonging to the barangay cannot drag
// the dot back out to sea.
function normalizeBarangayName(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function medianOf(values) {
  const v = values.slice().sort((a, b) => a - b);
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
function barangayAnchor(feature) {
  const name = normalizeBarangayName(feature && feature.properties && feature.properties.name);
  const onLand = [],
    anyPlace = [];
  (Array.isArray(destinations) ? destinations : []).forEach((d) => {
    if (!d || d.lat == null || d.lng == null) return;
    const b = normalizeBarangayName(d.barangay);
    if (!b) return;
    const hit =
      b === name || (name.length > 3 && b.includes(name)) || (b.length > 3 && name.includes(b));
    if (!hit) return;
    const la = Number(d.lat),
      ln = Number(d.lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
    anyPlace.push([la, ln]);
    // An island belongs to a barangay but sits offshore, so it never gets to
    // pull the town dot out to sea (Caruray would otherwise land on Boayan).
    if (!/island/i.test(String(d.category || ""))) onLand.push([la, ln]);
  });
  const pool = onLand.length ? onLand : anyPlace;
  if (pool.length) return [medianOf(pool.map((p) => p[0])), medianOf(pool.map((p) => p[1]))];
  return barangayCenter(feature);
}
function buildBarangayMarkers() {
  if (!map || !barangayMarkerLayer || typeof SAN_VICENTE_BARANGAYS === "undefined") return;
  barangayMarkerLayer.clearLayers();
  SAN_VICENTE_BARANGAYS.features.forEach((feature) => {
    const name = feature.properties?.name || "Barangay";
    const center = barangayAnchor(feature);
    if (!center) return;
    const marker = L.marker(center, {
      title: name,
      keyboard: true,
      icon: L.divIcon({
        className: "barangay-point-icon",
        html: `<span class="barangay-point" aria-hidden="true"></span>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    });
    marker.bindTooltip(name, {
      direction: "top",
      offset: [0, -9],
      className: "barangay-point-tooltip",
    });
    marker.on("click", () => {
      const bounds = L.geoJSON(feature).getBounds();
      if (bounds.isValid())
        map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 13, duration: 0.7 });
    });
    marker.addTo(barangayMarkerLayer);
  });
}
function initBarangayLayer() {
  if (typeof SAN_VICENTE_BARANGAYS === "undefined") return;
  barangayLayer = L.geoJSON(SAN_VICENTE_BARANGAYS, {
    style: getBarangayStyle(),
    onEachFeature: (f, layer) => {
      const label = document.createElement("span");
      label.textContent = f.properties?.name || "Barangay";
      layer.bindTooltip(label, { sticky: true, className: "barangay-tooltip" });
    },
  });
  barangayMarkerLayer = L.layerGroup();
  buildBarangayMarkers();
  if (barangayVisible) barangayLayer.addTo(map);
  updateBarangayMarkerVisibility(map.getZoom());
  document.getElementById("barangayToggle").checked = barangayVisible;
}
function toggleBarangayLayer() {
  barangayVisible = document.getElementById("barangayToggle").checked;
  if (barangayLayer && map) {
    if (barangayVisible) barangayLayer.addTo(map);
    else map.removeLayer(barangayLayer);
  }
  updateBarangayMarkerVisibility(map?.getZoom() || 0);
  try {
    sessionStorage.setItem("sanvic_boundaries", barangayVisible ? "on" : "off");
  } catch (e) {}
}
function updateBarangayStyle() {
  barangayLayer?.setStyle(getBarangayStyle());
}
function switchMapLayer(type) {
  if (!map) return;
  const layers = {
    street: window._mS,
    dark: window._mS,
    terrain: window._mTerrain,
    satellite: window._mSatellite,
  };
  if (!layers[type]) type = "street";
  const previous = layers[window._mView];
  if (previous && previous !== layers[type]) map.removeLayer(previous);
  if (!map.hasLayer(layers[type])) layers[type].addTo(map);
  window._mView = type;
  document.body.classList.toggle("map-dark", type === "dark");
  document.body.classList.toggle("map-light", type === "street" || type === "terrain");
  document.body.classList.toggle("map-satellite", type === "satellite");
  document.querySelectorAll('input[name="basemap"]').forEach((input) => {
    input.checked = input.value === type;
  });
  try {
    sessionStorage.setItem("sanvic_basemap", type);
  } catch (e) {}
  updateBarangayStyle();
  mapNotice("");
}
function renderMapLegend() {
  const host = document.getElementById("mapLegendItems");
  if (!host) return;
  host.innerHTML = Object.keys(catStyle)
    .filter((k) => destinations.some((d) => d.category === k))
    .map(
      (k) =>
        `<div class="map-legend-item"><i class="map-legend-dot" style="--legend-color:${escT(categoryMarkerColor(k))}"></i><span>${escT(catStyle[k].label || k)}</span></div>`,
    )
    .join("");
}
function toggleLayersMenu(force) {
  const menu = document.getElementById("layersMenu"),
    trigger = document.getElementById("layersButton");
  const open = typeof force === "boolean" ? force : menu.hidden;
  menu.hidden = !open;
  trigger.setAttribute("aria-expanded", String(open));
  if (open) {
    renderMapLegend();
    menu.querySelector("input:checked")?.focus();
  }
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("#mapLayerToggle")) toggleLayersMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!document.getElementById("layersMenu").hidden) {
    toggleLayersMenu(false);
    document.getElementById("layersButton").focus();
  } else if (currentDest) {
    closeDestSheet();
  } else if (document.body.classList.contains("explore-open") && !exploreIsSide()) {
    setExploreSnap(1);
    document.getElementById("esHandle").focus();
  }
});

// ─── SINGLE-ACTIVE-LAYER SYSTEM ───
// At any moment, at most ONE of: destSheet, talaSheet, search-focus is active.
// When one opens, others close automatically.

function closeAllPanels() {
  closeDestSheet(false);
  closeTalaSheet(false);
  closeAroundMePanel();
  closePulsePanel();
  closeDashboard();
  closeTodaySheet();
  closeExploreSheet();
  if (typeof closeMySanvicPanel === "function") closeMySanvicPanel();
  if (typeof closeHuntPanel === "function") closeHuntPanel();
  // Belt and braces. A place opened from Explore could leave this behind, and
  // place-open both shrinks the map on desktop and hides the Explore sheet, so
  // the map kept looking "wrong" until the next tab change cleared it.
  document.body.classList.remove("place-open");
  refreshPanelOpen();
}

// ─── PANEL-OPEN BODY STATE ───
// Toggles body.panel-open whenever any drawer/sheet/panel is visible so we
// can dampen the hero greeting + weather bar and prevent visual bleed.
function refreshPanelOpen() {
  try {
    // Pulse, My Journey and The Hunt all open with `.open` and are never given a
    // `hidden` class, so the old `:not(.hidden)` selectors were true from first
    // paint. panel-open was therefore permanently on — which is why the Locate
    // button never appeared on the map and why every panel looked "always open"
    // to the stylesheet.
    const sel = [
      ".today-panel.open",
      ".explore-sheet.open",
      "#pulsePanel.open",
      "#mySanvicPanel.open",
      "#huntPanel.open",
      "#discoverPanel.open",
      "#aroundMePanel.open",
      "#destSheet.open",
      "#talaSheet.open",
      "#dashboard.open",
    ].join(",");
    const open = !!document.querySelector(sel);
    document.body.classList.toggle("panel-open", open);
  } catch (e) {}
  // Same trigger, separate question: is the map the surface in front right now?
  refreshMapTools();
}
// Re-check on next frame so class mutations settle before we read them.
function schedulePanelOpen() {
  requestAnimationFrame(refreshPanelOpen);
}

// ─── MAP TOOLS VISIBILITY ───
// Where the Layers pill and the Locate button belong. Not a guess about panels:
// the dock knows which surface is open, so it says so, and the CSS follows
// body[data-map-tools]. The tools are for the map, and the map is the Explore
// and Today tabs — they stay up over the Explore sheet (the map is still behind
// it, that is the whole point of the sheet) and go away the moment a full-screen
// panel covers it.
const MAP_TOOL_TABS = ["map", "discover"];
const COVERING_PANELS = [
  ".today-panel.open",
  "#pulsePanel.open",
  "#mySanvicPanel.open",
  "#huntPanel.open",
  "#dashboard.open",
  "#talaSheet.open",
  ".dest-sheet.expanded", // a place detail sheet open over the map
  "#infoSheet.open",
  "#adminPanelOverlay.active",
].join(",");
function refreshMapTools() {
  try {
    const tab = document.body.dataset.activeTab || "";
    const onTab = MAP_TOOL_TABS.includes(tab);
    const covered = !!document.querySelector(COVERING_PANELS);
    const on = onTab && !covered;
    if (document.body.dataset.mapTools !== (on ? "on" : "off")) {
      document.body.dataset.mapTools = on ? "on" : "off";
      // The Layers menu is a child of the pill; hiding the pill with the menu
      // still expanded left an orphaned list of basemaps on screen.
      if (!on && typeof toggleLayersMenu === "function") {
        const menu = document.getElementById("layersMenu");
        if (menu && !menu.hidden) toggleLayersMenu(false);
      }
    }
  } catch (e) {}
}
window.refreshMapTools = refreshMapTools;
// Observe body subtree for class changes on the panel roots and auto-sync.
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    try {
      const mo = new MutationObserver(schedulePanelOpen);
      mo.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ["class", "hidden", "style"],
      });
    } catch (e) {}
  });
}

// ─── TODAY DRAWER ───
// The "Today" dock tab opens this bottom sheet. Peek state shows a
// greeting ("Good morning, {Name}") and a Today chip; expanded state
// reveals the seven "San Vicente Daily" editorial cards.
function timeOfDayGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
function todayProfile() {
  try {
    return JSON.parse(localStorage.getItem("sanvic_entry_v1") || "null");
  } catch (e) {
    return null;
  }
}
function todayNickname() {
  const profile = todayProfile();
  return profile && profile.nickname ? String(profile.nickname).trim() : "";
}
function todayAudience() {
  return todayProfile()?.audience === "local" ? "local" : "visitor";
}
// The Today header strip and the Pulse "Live now" line carried hardcoded
// counts that drifted from the real data ("4 tribes forming" while seven were
// live). Derive them from the loaded rows instead.
function updateLiveCounts() {
  const tribes =
    typeof PULSE_TRIBES !== "undefined" && PULSE_TRIBES.length ? PULSE_TRIBES.length : 0;
  const events =
    typeof PULSE_EVENTS !== "undefined" && PULSE_EVENTS.length ? PULSE_EVENTS.length : 0;
  const setText = (id, s) => {
    const el = document.getElementById(id);
    if (el) el.textContent = s;
  };
  setText("tmTribes", String(tribes));
  setText("tmHappening", String(events));
  setText("tmSunset", (TODAY_DATA.snapshot && TODAY_DATA.snapshot.sunset) || "");
  setText("pv2LiveCount", tribes + " open tribes · " + events + " events listed");
}
function updateTodayGreeting() {
  const kicker = document.getElementById("todayGreetingKicker");
  const nameEl = document.getElementById("todayGreetingName");
  if (!kicker || !nameEl) return;
  kicker.textContent = timeOfDayGreeting();
  const name = todayNickname();
  nameEl.textContent = name || (todayAudience() === "local" ? "Neighbour" : "Traveller");
  updateLiveCounts();
}
function openTodaySheet() {
  const s = document.getElementById("todayPanel");
  if (!s) return;
  renderTodayContent();
  updateTodayGreeting();
  s.classList.add("open");
  s.setAttribute("aria-hidden", "false");
  // Re-opening always starts at the greeting, not halfway down yesterday's cards.
  const page = document.getElementById("todayPage");
  if (page) page.scrollTop = 0;
}
// Today is a full-screen panel now, not a 3-snap bottom sheet, so "toggle",
// "snap" and "collapse" all just resolve to open or close. Kept as named
// aliases because other code and the mobile test harness still call them.
function toggleTodaySheet() {
  const s = document.getElementById("todayPanel");
  if (!s) return;
  if (s.classList.contains("open")) closeTodaySheet();
  else openTodaySheet();
}
function setTodaySnap(level) {
  if (level >= 2) openTodaySheet();
  else closeTodaySheet();
}
function collapseTodaySheet() {
  closeTodaySheet();
}
function closeTodaySheet() {
  const s = document.getElementById("todayPanel");
  if (!s) return;
  s.classList.remove("open");
  s.setAttribute("aria-hidden", "true");
}

// ─── EXPLORE — one shared state for the list, map and selected place ───
const EXPLORE_SIDE_QUERY = "(min-width:1100px), (min-width:900px) and (orientation:landscape)";
const EXPLORE_AREAS =
  typeof SAN_VICENTE_BARANGAYS === "undefined"
    ? []
    : SAN_VICENTE_BARANGAYS.features.map((f) => ({ k: f.properties.name }));
let exploreAudience = "visitor";
try {
  exploreAudience =
    localStorage.getItem("sanvic_explore_audience") === "local" ? "local" : "visitor";
} catch (e) {}
const exploreState = {
  query: "",
  category: "all",
  area: "",
  snap: 2,
  selected: null,
  scroll: 0,
  nearby: false,
};
let exploreReturnView = null;
let exploreResizeObserver = null;
// True while a thumb is dragging the Explore sheet. The sheet's ResizeObserver
// fires on every height change, so re-measuring Leaflet mid-drag used to call
// map.invalidateSize() ~60x/second and make the drag crawl. See syncMapViewport.
let exploreSheetDragging = false;
function exploreIsSide() {
  return window.matchMedia(EXPLORE_SIDE_QUERY).matches;
}
function setExploreAudience(mode) {
  exploreAudience = mode === "local" ? "local" : "visitor";
  try {
    localStorage.setItem("sanvic_explore_audience", exploreAudience);
  } catch (e) {}
  renderExploreContent();
}
function openExploreSheet() {
  const s = document.getElementById("exploreSheet");
  if (!s) return;
  document.body.classList.add("explore-open");
  s.classList.add("open");
  s.removeAttribute("inert");
  document.getElementById("heroOverlay").classList.add("hidden");
  document.getElementById("heroFade").classList.add("hidden");
  setExploreSnap(exploreState.snap);
  renderExploreContent();
  requestAnimationFrame(() => {
    document.getElementById("exploreContent").scrollTop = exploreState.scroll;
    syncExploreMap();
  });
}
function closeExploreSheet() {
  const s = document.getElementById("exploreSheet");
  if (!s) return;
  exploreState.scroll = document.getElementById("exploreContent").scrollTop;
  s.classList.remove("open");
  s.setAttribute("inert", "");
  document.body.classList.remove("explore-open");
  syncMapViewport();
}
function setExploreSnap(level) {
  const s = document.getElementById("exploreSheet");
  if (!s) return;
  exploreState.snap = Math.max(1, Math.min(3, Number(level) || 1));
  s.classList.remove("l1", "l2", "l3");
  s.classList.add("l" + exploreState.snap);
  s.dataset.snap = String(exploreState.snap);
  const handle = document.getElementById("esHandle");
  handle.setAttribute(
    "aria-label",
    exploreState.snap === 3 ? "Collapse place list" : "Expand place list",
  );
  handle.setAttribute("aria-expanded", String(exploreState.snap > 1));
  syncMapViewport();
}
function cycleExploreSnap() {
  setExploreSnap(exploreState.snap === 3 ? 1 : exploreState.snap + 1);
}
function syncMapViewport() {
  if (!map) return;
  // A drag rewrites the sheet height every frame. Re-measuring the map each
  // time is what made the sheet feel slow, so defer the whole sync to release.
  if (exploreSheetDragging) return;
  const sheet = document.getElementById("exploreSheet");
  const detail = document.body.classList.contains("place-open");
  const open = document.body.classList.contains("explore-open");
  let bottom = 0;
  if (!exploreIsSide()) {
    if (detail) bottom = document.getElementById("destSheet").getBoundingClientRect().height + 80;
    else if (open) bottom = sheet.getBoundingClientRect().height + 80;
  }
  document.body.style.setProperty(
    "--map-bottom",
    Math.min(bottom, window.innerHeight - 160) + "px",
  );
  // Desktop map has its own column; Leaflet measures the actual available space.
  map.invalidateSize({ animate: false, pan: false });
}
function exploreResults() {
  const results = SanvicExplore.filter(destinations, exploreState, catStyle);
  const localKeys = /food|shop|service|transport|market|stay|cafe|restaurant/i;
  // When someone has typed something, the best match leads. The search used to
  // fall back to alphabetical, so "quiet beach" could put the weakest match
  // first just because of its letter.
  const terms =
    typeof SanvicExplore.queryTerms === "function"
      ? SanvicExplore.queryTerms(exploreState.query)
      : [];
  const scoreOf = (d) => (terms.length ? SanvicExplore.score(d, terms, catStyle) : 0);
  return results.sort((a, b) => {
    if (terms.length) {
      const byScore = scoreOf(b) - scoreOf(a);
      if (byScore) return byScore;
    }
    if (exploreState.nearby && userLocationMarker) {
      const p = userLocationMarker.getLatLng();
      const dist = (d) =>
        SanvicExplore.hasCoordinates(d) ? SanvicExplore.distanceKm(p, d) : Infinity;
      return dist(a) - dist(b);
    }
    if (exploreAudience === "local") {
      const local = (d) =>
        localKeys.test(d.category + " " + (catStyle[d.category]?.label || "")) ? 1 : 0;
      if (local(a) !== local(b)) return local(b) - local(a);
    }
    return Number(!!b.featured) - Number(!!a.featured) || a.name.localeCompare(b.name);
  });
}
// The category marker: a small dot in that category's own colour, glowing, so a
// row of categories reads as one family. This is the partner's "neon dots",
// replacing the icon that sat here and made the list look busy.
function catDot(key) {
  const c = categoryMarkerColor(key);
  return `<i class="sv-cat-dot" style="--c:${escT(c)}" aria-hidden="true"></i>`;
}
function catColour(key) {
  return categoryMarkerColor(key);
}
function explorePlaceCard(d) {
  const cat = catStyle[d.category] || { label: d.category || "Place", icon: "map-pin" };
  const photo = SanvicExplore.safeUrl(d.image, true);
  const selected = String(exploreState.selected) === String(d.id);
  const distance =
    exploreState.nearby && userLocationMarker && SanvicExplore.hasCoordinates(d)
      ? SanvicExplore.distanceKm(userLocationMarker.getLatLng(), d).toFixed(1) + " km"
      : "";
  // Two lines, always: the name (clamped) and one meta line. Keeps every row the
  // same height so the list scans as one uniform column at any width.
  const meta = distance || d.stats?.travel || "";
  // A listing with no photo yet still has to look intentional, so the empty
  // tile carries the category colour and the category icon instead of sitting
  // there as a blank grey box.
  const catColor = cat.color || "#94b7b8";
  return `<button class="explore-result${selected ? " selected" : ""}" data-place-id="${escT(d.id)}" aria-pressed="${selected}" onclick="selectExplorePlace(this.dataset.placeId)">
    <span class="explore-result-image">${photo ? `<img src="${escT(photo)}" alt="${escT(d.name)}" loading="lazy" onerror="this.hidden=true">` : ""}<span class="image-placeholder" style="color:${escT(catColor)};background:linear-gradient(145deg,${escT(catColor)}2e,${escT(catColor)}0f)" aria-hidden="true">${lucideSvg(cat.icon || "map-pin", 24)}</span></span>
    <span class="explore-result-copy"><strong class="result-name">${escT(d.name)}</strong><span class="result-meta"><span class="result-category">${catDot(d.category)}${escT(cat.label)}</span><span class="result-area">${lucideSvg("map-pin", 12)} ${escT(d.barangay || "San Vicente")}</span>${meta ? `<span class="result-access">${escT(meta)}</span>` : ""}</span></span>
    <span class="result-arrow" aria-hidden="true">${lucideSvg("chevron-right", 17)}</span>
  </button>`;
}
function renderExploreContent() {
  const body = document.getElementById("exploreContent");
  if (!body) return;
  // The visiting/local question is asked once, in the first-visit questions.
  // Once answered there, the Explore sheet stays clean. If it was skipped the
  // toggle remains, so the choice is never unavailable.
  const keys = Object.keys(catStyle).filter((k) => destinations.some((d) => d.category === k));
  // Show real categories only; the admin remains free to add or rename them.
  const ribbon = document.getElementById("esRibbon");
  ribbon.innerHTML =
    `<button class="es-chip ${exploreState.category === "all" ? "accent" : ""}" data-category="all" aria-pressed="${exploreState.category === "all"}" onclick="selectExploreCategory('all')"><span class="es-chip-label">All places</span></button>` +
    keys
      .map(
        (k) =>
          `<button class="es-chip ${exploreState.category === k ? "accent" : ""}" data-category="${escT(k)}" aria-pressed="${exploreState.category === k}" onclick="selectExploreCategory(this.dataset.category)">${catDot(k)}<span class="es-chip-label">${escT(catStyle[k].label)}</span></button>`,
      )
      .join("");
  const areas = Array.from(new Set(destinations.map((d) => d.barangay).filter(Boolean))).sort();
  const area = document.getElementById("esArea");
  area.innerHTML =
    '<option value="">All barangays</option>' +
    areas.map((b) => `<option value="${escT(b)}">${escT(b)}</option>`).join("");
  area.value = exploreState.area;
  const matches = exploreResults();
  document.getElementById("esResultCount").textContent =
    destinationsSource === "loading"
      ? "Loading places…"
      : matches.length + " place" + (matches.length === 1 ? "" : "s");
  document.getElementById("esReset").hidden =
    !exploreState.query &&
    exploreState.category === "all" &&
    !exploreState.area &&
    !exploreState.nearby;
  document.getElementById("esNearby").setAttribute("aria-pressed", String(exploreState.nearby));
  const status = document.getElementById("esDataStatus");
  status.hidden = destinationsSource === "supabase";
  status.innerHTML =
    destinationsSource === "fallback"
      ? 'Directory unavailable. These are sample places, not verified live listings. <button onclick="retryExploreData()">Retry</button>'
      : "Loading the local directory…";
  if (destinationsSource === "loading") {
    body.innerHTML =
      '<div class="explore-empty" role="status">Finding places across San Vicente…</div>';
    return;
  }
  body.innerHTML = matches.length
    ? matches.map(explorePlaceCard).join("")
    : `<div class="explore-empty">${lucideSvg("map-pin", 32)}<h3>${destinations.length ? (exploreState.query ? "Nothing matched that" : "No matching places yet") : "The directory is taking shape"}</h3><p>${destinations.length ? (exploreState.query ? 'Try a place name, or say what you feel like, like "quiet beach", "sunset", "waterfall trek" or "seafood dinner".' : "Try a different category or barangay.") : "Local businesses and tourist places will appear here as they are added."}</p>${destinations.length ? '<button class="es-action" onclick="resetExploreFilters()">Show all places</button>' : ""}</div>`;
  // The filter block's height changes with the ribbon, so it is re-measured on
  // every render rather than only once.
  if (typeof window.syncExploreFiltersHeight === "function") window.syncExploreFiltersHeight();
}
// Explore's filter block steps aside while the places scroll, then returns at the
// top. Its resting height is measured, because the ribbon wraps as categories
// come and go.
(function bindExploreFiltersCollapse() {
  function sync() {
    const box = document.querySelector(".es-browse-controls");
    if (!box) return;
    const h = box.scrollHeight;
    if (h) box.style.setProperty("--esb-h", h + "px");
  }
  window.syncExploreFiltersHeight = sync;
  function attach() {
    const body = document.getElementById("exploreContent");
    const box = document.querySelector(".es-browse-controls");
    if (!body || !box || body.dataset.filtersBound) return;
    body.dataset.filtersBound = "1";
    sync();
    body.addEventListener(
      "scroll",
      () => {
        box.classList.toggle("is-away", body.scrollTop > 28);
      },
      { passive: true },
    );
    window.addEventListener("resize", sync);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
  else attach();
})();

function syncExploreMap() {
  if (!map) return;
  const ids = new Set(
    exploreResults()
      .filter(SanvicExplore.hasCoordinates)
      .map((d) => String(d.id)),
  );
  allMarkers.forEach((m) => {
    if (!ids.has(String(m._d.id))) map.removeLayer(m);
  });
  activeMarkerSet = allMarkers.filter((m) => ids.has(String(m._d.id)));
  applyPinVisibility();
  highlightExplorePlace(exploreState.selected);
}
function filterExploreResults(raw) {
  exploreState.query = String(raw || "");
  renderExploreContent();
  syncExploreMap();
}
function selectExploreCategory(category) {
  exploreState.category = category;
  renderExploreContent();
  syncExploreMap();
  fitExploreResults();
}
function selectExploreArea(area) {
  exploreState.area = area;
  renderExploreContent();
  syncExploreMap();
  fitExploreResults();
}
function resetExploreFilters() {
  Object.assign(exploreState, { query: "", category: "all", area: "", nearby: false });
  document.getElementById("esSearchInput").value = "";
  renderExploreContent();
  syncExploreMap();
  fitExploreResults();
}
function fitExploreResults() {
  if (!map) return;
  const coords = exploreResults()
    .filter(SanvicExplore.hasCoordinates)
    .map((d) => [Number(d.lat), Number(d.lng)]);
  if (!coords.length) return;
  syncMapViewport();
  const bottom = exploreIsSide()
    ? 90
    : Math.min(
        document.getElementById("exploreSheet").getBoundingClientRect().height + 100,
        window.innerHeight - 180,
      );
  map.fitBounds(coords, {
    paddingTopLeft: [48, 100],
    paddingBottomRight: [70, bottom],
    maxZoom: 14,
    animate: false,
  });
}
function selectExplorePlace(id) {
  const d = destinations.find((d) => String(d.id) === String(id));
  if (d) openDest(d);
}
function highlightExplorePlace(id) {
  exploreState.selected = id;
  allMarkers.forEach((m) => {
    const selected = String(m._d.id) === String(id);
    m.getElement()?.classList.toggle("selected", selected);
    m.setZIndexOffset(selected ? 1000 : 0);
  });
  document.querySelectorAll(".explore-result").forEach((el) => {
    const selected = el.dataset.placeId === String(id);
    el.classList.toggle("selected", selected);
    el.setAttribute("aria-pressed", String(selected));
  });
}
async function retryExploreData() {
  destinationsSource = "loading";
  renderExploreContent();
  await loadDataFromSupabase();
  rebuildMarkers();
  renderExploreContent();
  syncExploreMap();
}
function askTalaFromExplore() {
  closeAllPanels();
  openTalaSheet();
  const input = document.getElementById("talaInput");
  input.value =
    exploreAudience === "local"
      ? "Help me find a local business in San Vicente"
      : "Help me plan a day exploring San Vicente";
  input.focus();
}
function recommendExplorePlace() {
  closeAllPanels();
  openTalaSheet();
  const input = document.getElementById("talaInput");
  input.value =
    "I would like to recommend a local place. How can I share its name, barangay and location with the SANVIC team?";
  input.focus();
  // This is assistance, not a submission form. Never imply it saves a listing.
}
function initExploreInteractions() {
  const sheet = document.getElementById("exploreSheet"),
    handle = document.getElementById("esHandle");
  const heading = document.querySelector(".es-heading");
  let drag = null,
    moved = false;
  function start(e) {
    if (exploreIsSide()) return;
    drag = { y: e.clientY, height: sheet.getBoundingClientRect().height };
    moved = false;
    exploreSheetDragging = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    sheet.style.transition = "none";
  }
  function move(e) {
    if (!drag) return;
    moved = moved || Math.abs(drag.y - e.clientY) > 5;
    sheet.style.setProperty(
      "height",
      Math.max(180, Math.min(window.innerHeight - 84, drag.height + drag.y - e.clientY)) + "px",
      "important",
    );
  }
  function release() {
    if (!drag) return;
    const h = sheet.getBoundingClientRect().height;
    sheet.style.height = "";
    sheet.style.transition = "";
    if (moved) {
      const heights = [
        Math.min(232, window.innerHeight * 0.4),
        window.innerHeight * 0.74,
        window.innerHeight - 84,
      ];
      let best = 0;
      heights.forEach((v, i) => {
        if (Math.abs(v - h) < Math.abs(heights[best] - h)) best = i;
      });
      setExploreSnap(best + 1);
    }
    drag = null;
    exploreSheetDragging = false;
    syncMapViewport();
  }
  handle.addEventListener("pointerdown", start);
  handle.addEventListener("pointermove", move);
  handle.addEventListener("pointerup", release);
  handle.addEventListener("pointercancel", release);
  handle.addEventListener("click", () => {
    if (!moved) cycleExploreSnap();
    moved = false;
  });
  if (heading) {
    // Second drag surface: the whole title row drags the sheet, but a touch
    // that starts on a control (the close button) must not be hijacked.
    heading.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      start(e);
    });
    heading.addEventListener("pointermove", move);
    heading.addEventListener("pointerup", release);
    heading.addEventListener("pointercancel", release);
  }
  document.getElementById("esSearchInput").addEventListener("focus", () => {
    if (!exploreIsSide()) setExploreSnap(2);
  });
  document.getElementById("exploreContent").addEventListener(
    "scroll",
    (e) => {
      exploreState.scroll = e.target.scrollTop;
    },
    { passive: true },
  );
  exploreResizeObserver = new ResizeObserver(syncMapViewport);
  exploreResizeObserver.observe(sheet);
  exploreResizeObserver.observe(document.getElementById("destSheet"));
  window.addEventListener("resize", syncMapViewport, { passive: true });
  window.visualViewport?.addEventListener("resize", () => {
    const keyboard = window.innerHeight - window.visualViewport.height;
    document.body.style.setProperty("--keyboard-inset", keyboard > 120 ? keyboard + "px" : "0px");
    syncMapViewport();
  });
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", initExploreInteractions, { once: true });
else initExploreInteractions();

// ─── TODAY DAILY DATA (demo seed; DB wiring is a follow-up) ───
const TODAY_DATA = {
  snapshot: {
    weather: { icon: "sun", temp: "29°C", label: "Sunny" },
    sea: "Calm swell",
    sunset: "17:52",
    moon: { glyph: "moon", label: "Waxing gibbous" },
    tribes: 3,
    happenings: 6,
  },
  talaPick: {
    intro:
      "Go north today. The sea looks calmer near Alimanguan, and the light will thank you at sunset.",
    path: [
      { label: "Late lunch", sub: "12:30 · Port Barton" },
      { label: "Wild beach", sub: "14:00 · Alimanguan" },
      { label: "Sunset drink", sub: "17:30 · Long Beach" },
    ],
  },
  happening: [
    {
      title: "Acoustic night at Nauti Beach",
      place: "Long Beach",
      time: "19:30",
      dist: "2.4 km",
      vibe: "Chill",
    },
    { title: "Sunset paddle out", place: "Alimanguan", time: "16:30", dist: "11 km", vibe: "Surf" },
    {
      title: "Fiesta procession",
      place: "Poblacion",
      time: "18:00",
      dist: "0.6 km",
      vibe: "Local",
    },
    {
      title: "Beach bonfire jam",
      place: "Port Barton",
      time: "20:30",
      dist: "28 km",
      vibe: "Social",
    },
  ],
  joinable: [
    {
      title: "Island hop from Port Barton",
      detail: "3 seats left · departs 8:00 tomorrow",
      crowd: 3,
    },
    {
      title: "Dinner in Poblacion tonight",
      detail: "2 travelers looking for company · 19:30",
      crowd: 2,
    },
    { title: "Van to Puerto Princesa", detail: "1 seat left · Friday 06:00 pickup", crowd: 4 },
  ],
  weather: [
    {
      icon: "palmtree",
      label: "Island hopping",
      verdict: "Good morning for it. Wind picks up after 2 PM — head out early.",
    },
    {
      icon: "waves",
      label: "Surf",
      verdict: "Small and clean at Alimanguan. Fine for longboards, patient shortboarders.",
    },
    {
      icon: "cloud-rain",
      label: "Rain risk",
      verdict: "Low until early evening. A short shower possible around 18:00.",
    },
    {
      icon: "droplets",
      label: "Tide",
      verdict: "Low tide at 14:20 — good for tidepools, not great for shallow boat launches.",
    },
  ],
  locals: [
    {
      biz: "Long Beach Grill",
      badge: "fish",
      text: "Fresh yellowfin tuna just came in. Ask for kinilaw.",
      meta: "Poblacion · 18m ago",
    },
    {
      biz: "Nauti Beach Bar",
      badge: "martini",
      text: "2-for-1 sunset drinks, 17:00 to 18:30 only.",
      meta: "Long Beach · 42m ago",
    },
    {
      biz: "Aling Rosa Bakery",
      badge: "croissant",
      text: "Fresh pandesal from 6 AM. Ube version back tomorrow.",
      meta: "Poblacion · 2h ago",
    },
  ],
  notices: [
    { text: "BPI ATM Poblacion — cash available, no queue right now." },
    { text: "Alimanguan gas station: out of unleaded until Thursday." },
    { text: "Weak cell signal past Bato ni Ningning — download offline maps first." },
    { text: "Muddy road to Pamuayan Falls after last night’s rain. 4×4 or scooter only." },
  ],
};

function escT(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

// What the visitor told us in the entry questionnaire, turned into a day. TALA
// used to write this line. It is now built from the vibes the visitor actually
// picked, matched against real directory places — no answers, no guess, and no
// invented itinerary.
// How many times the visitor has asked for a fresh set today. Rotating through
// the ranked pool is what makes "generate new pick" give a different answer
// rather than the same three again.
let todayPickTurn = 0;
function todayPickPool() {
  let prof = null;
  try {
    prof = JSON.parse(localStorage.getItem("sanvic_entry_v1") || "null");
  } catch (e) {
    return [];
  }
  const selected = prof && Array.isArray(prof.vibes) ? prof.vibes.map(String) : [];
  const selectedVibes = (Array.isArray(window.SANVIC_VIBES) ? window.SANVIC_VIBES : []).filter(
    (v) => selected.includes(v.label),
  );
  const list = (Array.isArray(destinations) ? destinations : []).filter(
    (d) => d.lat != null && d.lng != null,
  );
  if (selectedVibes.length !== 4 || !list.length) return [];
  const groups = {
    food: /food|resto|restaurant|cafe|caf[eé]|dining|bar|bakery/i,
    beach: /beach/i,
    island: /island|boat/i,
    nature: /nature|waterfall|falls|wildlife|forest/i,
    explore: /adventure|explore/i,
    stay: /stay|accommodation|hotel|resort|lodge/i,
    service: /service|transport|market|shop/i,
    surf: /surf|sport/i,
    nightlife: /nightlife|music|bar/i,
    social: /community|event|tribe|social/i,
  };
  const terms = {
    food: /food|eat|eating|restaurant|resto|cafe|caf[eé]|dining|burger|seafood|menu|grill|dish|coffee|drink/i,
    beach: /beach|shore|coast|sand|swim|swimming|seaside/i,
    island: /island|boat|hopping|reef|sandbar/i,
    nature: /nature|waterfall|falls|forest|jungle|wildlife|trek|trail/i,
    explore: /explore|adventure|hidden|route|scooter|journey/i,
    stay: /stay|hotel|resort|lodge|accommodation|cottage|homestay/i,
    service: /service|transport|market|shop|laundry|atm|repair/i,
    surf: /surf|wave|board|sport/i,
    nightlife: /night|music|bar|cocktail|videoke/i,
    social: /social|people|group|friends|local|community|event/i,
    quiet: /quiet|calm|peaceful|secluded|slow|hammock/i,
    sunset: /sunset|sunrise|golden hour|viewpoint|dusk/i,
    photo: /photo|photography|camera|viewpoint|scenic/i,
    wildlife: /turtle|wildlife|hatchling|reef|animal/i,
    wellness: /massage|wellness|spa|slow|relax/i,
    private: /private|boat|couple|intimate/i,
    hidden: /hidden|secret|remote|wild|quiet/i,
    couples: /couple|romantic|private/i,
    local: /local|market|community|barangay|culture/i,
    market: /market|shop|stall|souvenir/i,
    routes: /route|road|scooter|transport/i,
    drink: /drink|bar|wine|cocktail|beer/i,
    recovery: /coffee|breakfast|food|meal/i,
    curated: /private|curated|boat|guide/i,
    boat: /boat|island|sailing|water/i,
    adventure: /adventure|trek|surf|explore|waterfall/i,
    viewpoints: /view|viewpoint|scenic|sunset/i,
  };
  const categoryGroup = (d) => {
    const key = String(d.category || "").toLowerCase();
    const text = String(catStyle[key]?.label || "").toLowerCase();
    const source = key + " " + text;
    return Object.keys(groups).find((g) => groups[g].test(source)) || "";
  };
  return list
    .map((d) => {
      const hay = [
        d.name,
        d.category,
        catStyle[d.category]?.label,
        d.barangay,
        d.description,
        d.tip,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const primaryGroup = categoryGroup(d);
      let score = 0;
      const matched = [];
      selectedVibes.forEach((v) => {
        let vibeScore = 0;
        (v.tags || []).forEach((tag) => {
          const group = String(tag).toLowerCase();
          const categoryMatch = !!(
            primaryGroup &&
            groups[group] &&
            groups[group].test(
              String(d.category || "") + " " + String(catStyle[d.category]?.label || ""),
            )
          );
          // If a listing has a strong, unrelated category (e.g. an island) do not
          // let a generic word such as "beach" turn it into a restaurant pick.
          const unrelatedStrongCategory = !!(primaryGroup && groups[group] && !categoryMatch);
          if (categoryMatch) vibeScore += 5;
          else if (!unrelatedStrongCategory && terms[group] && terms[group].test(hay))
            vibeScore += 2;
          else if (!unrelatedStrongCategory && group.length > 3 && hay.includes(group))
            vibeScore += 1;
        });
        if (vibeScore) {
          score += vibeScore;
          matched.push({ label: v.label, score: vibeScore });
        }
      });
      return { d, score, why: matched };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || String(a.d.name).localeCompare(String(b.d.name)));
}
// Three picks per page, drawn from the twelve best matches. The old version
// shuffled the pool and then re-ran the same greedy "highest score wins" loop, so
// unless two places had exactly the same score the winner was always identical:
// "generate new picks doesn't work, it's not giving me new picks". Paging
// through the ranked window guarantees a different set every tap, and still only
// ever shows places that actually matched the visitor's four vibes.
const TODAY_PICK_PAGE = 3;
const TODAY_PICK_WINDOW = 12;
function todayPersonalPick() {
  const pool = todayPickPool();
  if (!pool.length) return null;
  const windowItems = pool.slice(0, Math.min(pool.length, TODAY_PICK_WINDOW));
  if (windowItems.length <= TODAY_PICK_PAGE) return windowItems;
  const start = (todayPickTurn * TODAY_PICK_PAGE) % windowItems.length;
  const picked = [];
  for (let i = 0; i < TODAY_PICK_PAGE; i++)
    picked.push(windowItems[(start + i) % windowItems.length]);
  return picked;
}
function generateNewPick() {
  let prof = null;
  try {
    prof = JSON.parse(localStorage.getItem("sanvic_entry_v1") || "null");
  } catch (_) {}
  const selected = prof && Array.isArray(prof.vibes) ? prof.vibes.map(String) : [];
  if (selected.length !== 4) {
    toast(
      'Choose 4 vibes on Today first (the "Choose your vibes" button) — then new picks come through.',
    );
    openMyVibes();
    return;
  }
  const pool = todayPickPool();
  if (pool.length <= 1) {
    toast("Only one place matches your four vibes so far. Add another vibe to widen the search.");
    return;
  }
  const idSet = (list) => (list || []).map((x) => String(x.d.id)).join("|");
  const before = idSet(todayPersonalPick());
  const windowSize = Math.min(pool.length, TODAY_PICK_WINDOW);
  const pages = Math.max(1, Math.ceil(windowSize / TODAY_PICK_PAGE));
  todayPickTurn += 1;
  let next = todayPersonalPick();
  // Never hand back the set that is already on screen: keep paging until it
  // actually changes, or until we have tried every page.
  let guard = 0;
  while (idSet(next) === before && guard++ < pages) {
    todayPickTurn += 1;
    next = todayPersonalPick();
  }
  refreshTodayPicks();
  if (idSet(next) === before) {
    toast("That is every place matching your four vibes. Add another vibe to widen it.");
  } else {
    toast("Fresh picks from your answers.");
  }
}
function catLabelFor(cat) {
  return (catStyle && catStyle[cat] && catStyle[cat].label) || cat || "";
}

// One quiet line where a list would be. Used when the database answered and
// there is genuinely nothing listed, so the card reads as "nothing yet" rather
// than showing packaged copy about places that were never checked.
function todayEmptyRow(text) {
  return `<li class="today-row today-row-empty"><div class="trow-main"><div class="trow-meta">${escT(text)}</div></div></li>`;
}

// Builds one "Picked for you" place card from the visitor's chosen vibes.
// `total` is used only to decide whether a divider arrow is shown after it.
function pickCard(x, i, total) {
  const p = x.d;
  const whyIcon =
    x.why && x.why.icon
      ? x.why.icon
      : (catStyle[p.category] && catStyle[p.category].icon) || "map-pin";
  // Say why this place is here, using the visitor's own words, and then let the
  // place's own tip do the describing. "Long Beach · Poblacion · Beaches" read
  // like a directory line, not a suggestion.
  const whyLine = x.why
    ? "Matches: " + x.why.map((v) => v.label).join(" + ") + (p.barangay ? " · " + p.barangay : "")
    : [p.barangay, catLabelFor(p.category)].filter(Boolean).join(" · ");
  const tip = String(p.tip || "").trim();
  const tipLine = tip ? (tip.length > 104 ? tip.slice(0, 101).trim() + "…" : tip) : "";
  return `
    <div class="today-node" role="button" tabindex="0" style="cursor:pointer" onclick="openDestinationById(${p.id})">
      <div class="tnode-label">${lucideSvg(whyIcon, 15)} ${escT(p.name)}</div>
      <div class="tnode-sub">${escT(whyLine)}</div>
      ${tipLine ? `<div class="tnode-tip">${escT(tipLine)}</div>` : ""}
    </div>
    ${i < total - 1 ? '<div class="today-arrow">' + lucideSvg("arrow-right", 16) + "</div>" : ""}`;
}

function renderTodayContent() {
  const host = document.getElementById("todayScroll");
  if (!host) return;
  // Re-rendering used to jump the panel back to the top, so pressing "Generate
  // new pick" scrolled you away from the picks you just asked for.
  // The whole Today page scrolls now (greeting scrolls away with the cards), so
  // the scroll position lives on #todayPage; fall back to the list itself.
  const page = document.getElementById("todayPage");
  const scroller = page || host;
  const keepScroll = scroller.scrollTop;
  const d = TODAY_DATA;
  // Counts must come from the live data: the hardcoded TODAY_DATA.snapshot
  // numbers went stale the moment tribes/events moved into the database
  // ("3 Tribes forming" while seven were live).
  // Counts come from the lists on screen, never from the packaged snapshot: the
  // snapshot said "3 Tribes · 6 Happening" while both lists were empty.
  const tribeCount =
    typeof PULSE_TRIBES !== "undefined" && Array.isArray(PULSE_TRIBES) ? PULSE_TRIBES.length : 0;
  const happenCount = Array.isArray(d.happening) ? d.happening.length : 0;
  const snap = `
    <article class="today-card">
      <div class="today-kicker">Daily snapshot</div>
      <div class="today-title">San Vicente, right now</div>
      <div class="today-snap-grid">
        <div class="today-snap"><span class="tsn-glyph">${iconOrText(d.snapshot.weather.icon, 20)}</span><span class="tsn-val">${escT(d.snapshot.weather.temp)}</span><span class="tsn-lbl">${escT(d.snapshot.weather.label)}</span></div>
        <div class="today-snap"><span class="tsn-glyph">${lucideSvg("waves", 20)}</span><span class="tsn-val">${escT(d.snapshot.sea)}</span><span class="tsn-lbl">Sea</span></div>
        <div class="today-snap"><span class="tsn-glyph">${lucideSvg("sunset", 20)}</span><span class="tsn-val">${escT(d.snapshot.sunset)}</span><span class="tsn-lbl">Sunset</span></div>
        <div class="today-snap"><span class="tsn-glyph">${iconOrText(d.snapshot.moon.glyph, 20)}</span><span class="tsn-val">${escT(d.snapshot.moon.label)}</span><span class="tsn-lbl">Moon</span></div>
        <div class="today-snap"><span class="tsn-glyph">${lucideSvg("users", 20)}</span><span class="tsn-val">${tribeCount}</span><span class="tsn-lbl">Tribes</span></div>
        <div class="today-snap"><span class="tsn-glyph">${lucideSvg("sparkles", 20)}</span><span class="tsn-val">${happenCount}</span><span class="tsn-lbl">Happening</span></div>
      </div>
    </article>`;
  // Personalised suggestions, built from the vibes the visitor chose in the
  // questionnaire. This replaces the old "TALA's pick of the day".
  const picks = todayPersonalPick();
  const pick = picks
    ? `
    <article id="today-pick-card" class="today-card">
      <div class="today-kicker">Picked for you</div>
      <p class="today-lede">${picks.length === 1 ? "One place" : picks.length + " places"} scored against all four interests in your profile. Ask for another set any time.</p>
      <div class="today-path">
        ${picks.map((x, i) => pickCard(x, i, picks.length)).join("")}
      </div>
      <button class="today-newpick" onclick="generateNewPick()">${lucideSvg("refresh-cw", 13)} Generate new pick</button>
    </article>`
    : `
    <article id="today-pick-card" class="today-card">
      <div class="today-kicker">Your day</div>
      <p class="today-lede">Tell us what you are into and this fills with places chosen for you.</p>
      <div class="today-path">
        <div class="today-node" role="button" tabindex="0" style="cursor:pointer" onclick="openMyVibes()">
          <div class="tnode-label">Choose your vibes</div>
          <div class="tnode-sub">A few quick taps — then this is yours</div>
        </div>
      </div>
    </article>`;
  // The questionnaire is the source, so let the visitor reopen it from here.
  window.openMyVibes = function () {
    if (typeof window.openSanvicWelcome === "function") window.openSanvicWelcome();
  };
  const happening = `
    <article class="today-card">
      <div class="today-kicker">Happening today</div>
      <ul class="today-list">
        ${
          d.happening.length
            ? d.happening
                .map((e, i) => {
                  const key = todayItemKey(e, i);
                  const going = myToday.has(key);
                  const count = todayGoingCount(key);
                  const names = todayGoingNames(key);
                  const photo = todayFirstImage(e);
                  return `
          <li class="today-row">
            ${photo ? `<div class="trow-photo"><img src="${escT(photo)}" alt="" loading="lazy" onerror="this.closest('.trow-photo').remove()"></div>` : ""}
            <div class="trow-main">
              <div class="trow-title">${escT(e.title)}</div>
              <div class="trow-meta">${escT(e.place)} · ${escT(e.time)}</div>
            </div>
            <div class="trow-chips">
              <span class="tchip">${escT(e.dist)}</span>
              <span class="tchip tchip-accent">${escT(e.vibe)}</span>
              ${count ? `<span class="tchip tchip-going">${count} going</span>` : ""}
            </div>
            ${names.length ? `<div class="trow-names">With ${escT(names.slice(0, 3).join(", "))}${names.length > 3 ? " +" + (names.length - 3) : ""}</div>` : ""}
            <div class="trow-actions">
              <button class="tbtn tbtn-primary${going ? " is-on" : ""}" onclick="todayJoinHappening(${i})" aria-pressed="${going ? "true" : "false"}">${going ? "Going" : "Join"}</button>
              <button class="tbtn" onclick="todayDirectionsHappening(${i})">Directions</button>
            </div>
          </li>`;
                })
                .join("")
            : todayEmptyRow("Nothing listed for today yet.")
        }
      </ul>
      ${todayCreditsHtml(d.happening)}
    </article>`;
  const joinable = `
    <article class="today-card">
      <div class="today-kicker">Joinable today</div>
      <div class="today-title">Open spots, right now</div>
      <ul class="today-list">
        ${
          d.joinable.length
            ? d.joinable
                .map((j, i) => {
                  const on = myToday.has(todayJoinableKey(j));
                  return `
          <li class="today-row">
            <div class="trow-main">
              <div class="trow-title">${escT(j.title)}</div>
              <div class="trow-meta">${escT(j.detail)}</div>
            </div>
            <div class="tavatars">${Array.from({ length: j.crowd })
              .map((_, k) => `<span class="tav" style="--i:${k}"></span>`)
              .join("")}</div>
            <div class="trow-actions">
              <button class="tbtn tbtn-primary${on ? " is-on" : ""}" onclick="todayJoinJoinable(${i})" aria-pressed="${on ? "true" : "false"}">${on ? "On the list" : "Ask to join"}</button>
            </div>
          </li>`;
                })
                .join("")
            : todayEmptyRow("No open seats posted yet — form a tribe and start one.")
        }
      </ul>
    </article>`;
  const weather = `
    <article class="today-card">
      <div class="today-kicker">Sea &amp; weather</div>
      <div class="today-title">What the day is telling you</div>
      <ul class="today-verdicts">
        ${d.weather
          .map(
            (w) => `
          <li class="tverdict">
            <span class="tv-icon">${iconOrText(w.icon, 18)}</span>
            <div><div class="tv-label">${escT(w.label)}</div><div class="tv-text">${escT(w.verdict)}</div></div>
          </li>
        `,
          )
          .join("")}
      </ul>
    </article>`;
  const locals = `
    <article class="today-card">
      <div class="today-kicker">Fresh from locals</div>
      <ul class="today-locals">
        ${
          d.locals.length
            ? d.locals
                .map((l) => {
                  const photo = todayFirstImage(l);
                  return `
          <li class="tlocal">
            <span class="tl-badge">${iconOrText(l.badge, 18)}</span>
            <div><div class="tl-text">${escT(l.text)}</div><div class="tl-meta">${escT(l.biz)} · ${escT(l.meta)}</div></div>
            ${photo ? `<div class="tl-photo"><img src="${escT(photo)}" alt="" loading="lazy" onerror="this.closest('.tl-photo').remove()"></div>` : ""}
          </li>`;
                })
                .join("")
            : todayEmptyRow("No local updates yet.")
        }
      </ul>
      ${todayCreditsHtml(d.locals)}
    </article>`;
  const notices = `
    <article class="today-card today-card-muted">
      <div class="today-kicker">Small notices</div>
      <ul class="today-notices">
        ${d.notices.length ? d.notices.map((n) => `<li class="tnotice"><span class="tn-glyph">${lucideSvg("triangle-alert", 14)}</span><span>${escT(n.text)}</span></li>`).join("") : `<li class="tnotice tnotice-empty"><span>${escT("Nothing to flag today.")}</span></li>`}
      </ul>
    </article>`;
  host.innerHTML = snap + pick + happening + joinable + weather + locals + notices;
  if (keepScroll) scroller.scrollTop = keepScroll;
}

// Re-render only the "Picked for you" card when the visitor taps "Generate new
// pick", instead of rebuilding the whole Today panel (snapshot, happening,
// weather, locals, notices). Keeps the panel fast on low-end devices.
function refreshTodayPicks() {
  const card = document.getElementById("today-pick-card");
  if (!card) return;
  const picks = todayPersonalPick();
  card.innerHTML = picks
    ? `
      <div class="today-kicker">Picked for you</div>
      <p class="today-lede">${picks.length === 1 ? "One place" : picks.length + " places"} scored against all four interests in your profile. Ask for another set any time.</p>
      <div class="today-path">
        ${picks.map((x, i) => pickCard(x, i, picks.length)).join("")}
      </div>
      <button class="today-newpick" onclick="generateNewPick()">${lucideSvg("refresh-cw", 13)} Generate new pick</button>
    `
    : `
      <div class="today-kicker">Your day</div>
      <p class="today-lede">Tell us what you are into and this fills with places chosen for you.</p>
      <div class="today-path">
        <div class="today-node" role="button" tabindex="0" style="cursor:pointer" onclick="openMyVibes()">
          <div class="tnode-label">Choose your vibes</div>
          <div class="tnode-sub">A few quick taps — then this is yours</div>
        </div>
      </div>
    `;
}

// ─── DESTINATION SHEET ───
let currentDest = null;

// ─── AROUND ME ───
// Each destination carries its own `barangay` (set in admin, from the
// destinations table). Nearby places are loaded from Supabase
// (nearby_places table, admin-manageable) and grouped by barangay.
// DEFAULT_NEARBY_PLACES below is only the offline fallback.
const DEFAULT_NEARBY_PLACES = {
  Poblacion: [
    {
      name: "Tienda ni Aling Rosa",
      cat: "shop",
      desc: "Sari-sari store, snacks & drinks",
      dist: "Poblacion town",
      icon: "shopping-cart",
    },
    {
      name: "Long Beach Grill",
      cat: "food",
      desc: "Grilled seafood, beachfront seating",
      dist: "Poblacion town",
      icon: "utensils",
    },
    {
      name: "Motorbike Rental Hub",
      cat: "service",
      desc: "Daily & weekly rentals",
      dist: "Poblacion town",
      icon: "scooter",
    },
  ],
  "Port Barton": [
    {
      name: "Jambalaya Cajun Café",
      cat: "food",
      desc: "Cajun-Filipino fusion, fast wifi",
      dist: "Port Barton town",
      icon: "utensils",
    },
    {
      name: "Ballesteros General Store",
      cat: "shop",
      desc: "Supplies, snacks, sunscreen",
      dist: "Port Barton town",
      icon: "shopping-cart",
    },
    {
      name: "NFH Port Barton Dive Club",
      cat: "service",
      desc: "PADI training & equipment",
      dist: "Port Barton town",
      icon: "waves",
    },
  ],
  Alimanguan: [
    {
      name: "Alimanguan Boat Co-op",
      cat: "service",
      desc: "Island-hopping boat hire",
      dist: "At the dock",
      icon: "sailboat",
    },
    {
      name: "Beachside Carinderia",
      cat: "food",
      desc: "Home-style Filipino meals",
      dist: "Alimanguan",
      icon: "utensils",
    },
  ],
};

// Mutable — repopulated from nearby_places in Supabase every time data
// loads. Starts with the defaults above so nothing is ever blank.
let nearbyPlacesByBarangay = {};
Object.keys(DEFAULT_NEARBY_PLACES).forEach((b) => {
  nearbyPlacesByBarangay[b] = DEFAULT_NEARBY_PLACES[b].map((p) => ({ ...p }));
});

function applyNearbyPlacesFromRows(rows) {
  if (!rows || !rows.length) return; // keep current/default set if the table is empty/unreachable
  const next = {};
  rows.forEach((r) => {
    if (!next[r.barangay]) next[r.barangay] = [];
    next[r.barangay].push({
      id: r.id,
      name: r.name,
      cat: r.category,
      desc: r.description,
      dist: r.distance_label,
      icon: r.icon || "map-pin",
    });
  });
  nearbyPlacesByBarangay = next;
}

let currentAroundBarangay = null;
let currentAroundCat = "all";

function getAroundMeData(barangay) {
  return nearbyPlacesByBarangay[barangay] || [];
}

function openAroundMePanel() {
  if (!currentDest) return;
  currentAroundBarangay = currentDest.barangay || null;
  currentAroundCat = "all";
  document
    .querySelectorAll(".around-cat")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === "all"));

  const titleEl = document.getElementById("aroundTitle");
  const subEl = document.getElementById("aroundSubtitle");
  if (currentAroundBarangay) {
    titleEl.textContent = `Around ${currentDest.name}`;
    subEl.textContent = `Brgy. ${currentAroundBarangay} · ${getAroundMeData(currentAroundBarangay).length} places`;
  } else {
    titleEl.textContent = `Around ${currentDest.name}`;
    subEl.textContent = `Nearby places`;
  }

  renderAroundList();
  document.getElementById("aroundSheet").classList.add("open");
  document.getElementById("aroundOverlay").classList.add("active");
}

function closeAroundMePanel() {
  document.getElementById("aroundSheet").classList.remove("open");
  document.getElementById("aroundOverlay").classList.remove("active");
}

function selectAroundCategory(cat) {
  currentAroundCat = cat;
  document
    .querySelectorAll(".around-cat")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  renderAroundList();
}

function renderAroundList() {
  const list = document.getElementById("aroundList");
  const places = getAroundMeData(currentAroundBarangay);
  const filtered =
    currentAroundCat === "all" ? places : places.filter((p) => p.cat === currentAroundCat);

  if (!filtered.length) {
    list.innerHTML = `<div class="around-empty">No ${currentAroundCat === "all" ? "" : currentAroundCat + " "}places listed yet for this area.</div>`;
    return;
  }

  list.innerHTML = filtered
    .map(
      (p) => `
    <div class="around-card">
      <div class="around-card-icon">${iconOrText(p.icon, 20)}</div>
      <div class="around-card-body">
        <div class="around-card-name">${escapeHtml(p.name)}</div>
        <div class="around-card-meta">${escapeHtml(p.desc)}</div>
      </div>
      <div class="around-card-dist">${escapeHtml(p.dist)}</div>
    </div>`,
    )
    .join("");
}
