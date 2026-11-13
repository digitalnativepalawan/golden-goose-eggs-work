// ═══════════════════════════════════════════════════════
// PULSE — live community layer with an explicit partner-preview fixture set.
// Packaged examples are opt-in only, clearly labeled across the app, and their
// engagement actions never write to the real community tables.
// ═══════════════════════════════════════════════════════

let PULSE_CATEGORIES = {
  all: { label: "All", subtitle: "Live community in San Vicente" },
  hidden: { label: "Hidden Spots", subtitle: "Secret places, shared by locals." },
  island: { label: "Island Hopping", subtitle: "Plan. Connect. Explore together." },
  food: { label: "Food & Nightlife", subtitle: "Where to eat, drink, and dance tonight." },
  surf: { label: "Surf Report", subtitle: "Conditions, sessions, and swells." },
  events: { label: "Events Tonight", subtitle: "What's happening around San Vicente." },
};

// Loads admin-edited category labels from Supabase, overlaying them
// onto the hardcoded defaults above (subtitles + icons stay as
// designed; only the label text is admin-editable for now).
async function loadPulseCategoriesFromDB() {
  try {
    const { data: cats, error } = await sb.from("pulse_categories").select("key, label");
    if (error) throw error;
    (cats || []).forEach((c) => {
      if (PULSE_CATEGORIES[c.key]) PULSE_CATEGORIES[c.key].label = c.label;
      else PULSE_CATEGORIES[c.key] = { label: c.label, subtitle: "" };
    });
  } catch (err) {
    console.warn("[SANVIC] Could not load pulse categories from DB, using defaults:", err);
  }
}

// There used to be a PULSE_POSTS array here: thirteen invented travellers with
// invented timestamps ("3m ago"), likes and comments, left over from the sample
// feed. Nothing rendered it — the feed was never wired to a table — so it was dead
// weight that only invited someone to display it later. Real posts would come from
// a table, and an empty feed gets an empty state.

let pulseCategory = "all";
let pulseView = "tribes";
// The v1 feed wrote this; nothing declared it, so any call into the feed path
// threw ReferenceError before it drew anything. Declared so the code is at least
// honest about what it expects.
let pulseTab = "feed";
// The feed's channels (general, hidden spots, island hopping…) are a different
// set from the tribe/event tags, so they get their own filter state. Sharing
// pulseCategory meant switching to "Surf" in Active Tribes silently emptied the
// feed.
let pulseFeedCategory = "all";
// The channels are the same set the Backoffice edits (pulse_categories, with the
// built-in defaults underneath), in a fixed reading order. A second hardcoded
// list meant a category added in the Backoffice could never be posted to.
const FEED_CHANNEL_ORDER = ["all", "hidden", "island", "food", "surf", "events"];
function feedChannels() {
  const keys = FEED_CHANNEL_ORDER.filter((k) => PULSE_CATEGORIES[k]).concat(
    Object.keys(PULSE_CATEGORIES).filter((k) => FEED_CHANNEL_ORDER.indexOf(k) < 0),
  );
  return keys.map((k) => ({
    key: k,
    label: (PULSE_CATEGORIES[k] && PULSE_CATEGORIES[k].label) || k,
  }));
}

// ─── PULSE v2: Tribes / Events / Lounge / Form ───
const PV2_CATS = [
  "All",
  "Island Hopping",
  "Sunset",
  "Food & Drinks",
  "Transport",
  "Surf",
  "Nightlife",
  "Explore",
  "Local Life",
];
const PV2_AV = [
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&q=70",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=70",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&q=70",
  "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=80&h=80&fit=crop&q=70",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=70",
];
const PULSE_TRIBES = [
  {
    id: "t1",
    title: "Sunset Chasers",
    where: "Long Beach",
    when: "Today, 5:30 PM",
    sub: "Sunset, drinks, photos & good vibes.",
    cap: 6,
    joined: 4,
    extra: 2,
    tags: ["Sunset"],
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=260&fit=crop&q=70",
  },
  {
    id: "t2",
    title: "Island Hopping Tomorrow",
    where: "Port Barton",
    when: "Tomorrow, 8:00 AM",
    sub: "3 island stops, crystal water.",
    cap: 6,
    joined: 4,
    extra: 1,
    tags: ["Island Hopping"],
    spots: 2,
    warn: true,
    thumb: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=200&h=260&fit=crop&q=70",
  },
  {
    id: "t3",
    title: "Sunset Drinks",
    where: "Poblacion",
    when: "Today, 6:00 PM",
    sub: "Let's catch the golden hour.",
    cap: 5,
    joined: 4,
    extra: 3,
    tags: ["Sunset", "Food & Drinks", "Nightlife"],
    thumb: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=200&h=260&fit=crop&q=70",
  },
  {
    id: "t4",
    title: "Sunrise Surf Crew",
    where: "Alimanguan",
    when: "Tomorrow, 6:00 AM",
    sub: "Waves, coffee, go!",
    cap: 3,
    joined: 2,
    extra: 1,
    spots: 1,
    tags: ["Surf"],
    thumb: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=200&h=260&fit=crop&q=70",
  },
  {
    id: "t5",
    title: "Shared Ride to Port Barton",
    where: "Poblacion",
    when: "Tomorrow, 10:00 AM",
    sub: "2 seats open. Let's split gas!",
    cap: 0,
    joined: 4,
    extra: 1,
    tags: ["Transport"],
    seatsOpen: 2,
    ok: true,
    thumb: "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=200&h=260&fit=crop&q=70",
  },
];
const PULSE_EVENTS = [
  {
    id: "e1",
    title: "Full Moon Party at Baybay",
    org: "Baybay Beach Club",
    where: "Baybay Beach",
    when: "Tonight, 9:00 PM",
    price: "Free entry",
    tags: ["Nightlife"],
  },
  {
    id: "e2",
    title: "Lechon by the Beach",
    org: "Sunset Resort",
    where: "Sunset Resort",
    when: "Today, 6:00 PM",
    price: "₱650 / plate",
    tags: ["Food & Drinks"],
  },
  {
    id: "e3",
    title: "Acoustic Night in Poblacion",
    org: "The Deck",
    where: "Poblacion",
    when: "Tonight, 7:30 PM",
    price: "No cover",
    tags: ["Nightlife", "Food & Drinks"],
  },
];
const PARTNER_DEMO_TRIBE_MEDIA = [
  ["assets/pulse/island-boats-beach.jpg", "assets/pulse/island-boats-aerial.jpg"],
  ["assets/pulse/island-boats-aerial.jpg", "assets/pulse/kayak-lagoon.jpg"],
  ["assets/pulse/street-food-skewers.jpg", "assets/pulse/bulalo-boodle.jpg"],
  ["assets/san-vicente-long-beach.jpg", "assets/san-vicente-waterfalls.jpg"],
  ["assets/pulse/kayak-lagoon.jpg", "assets/pulse/island-boats-beach.jpg"],
];
const PARTNER_DEMO_IMAGE_NOTE = "Illustrative sample image · partner preview only";
const PULSE_MISSING_PHOTOS = [
  "assets/pulse/island-boats-beach.jpg",
  "assets/pulse/island-boats-aerial.jpg",
  "assets/pulse/kayak-lagoon.jpg",
  "assets/pulse/street-food-skewers.jpg",
  "assets/pulse/bulalo-boodle.jpg",
  "assets/san-vicente-long-beach.jpg",
  "assets/san-vicente-waterfalls.jpg",
];
function pulseMissingPhoto(item) {
  const key = String((item && (item.id || item.title)) || "listing");
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PULSE_MISSING_PHOTOS[hash % PULSE_MISSING_PHOTOS.length];
}
const PARTNER_DEMO_TRIBES = PULSE_TRIBES.map((item, index) => {
  const images = PARTNER_DEMO_TRIBE_MEDIA[index] || PARTNER_DEMO_TRIBE_MEDIA[0];
  return {
    ...item,
    thumb: images[0],
    images: [...images],
    imageCredit: PARTNER_DEMO_IMAGE_NOTE,
    tags: [...(item.tags || [])],
  };
});
const PARTNER_DEMO_EVENT_MEDIA = [
  "assets/pulse/island-boats-beach.jpg",
  "assets/pulse/bulalo-boodle.jpg",
  "assets/pulse/street-food-skewers.jpg",
];
const PARTNER_DEMO_EVENTS = PULSE_EVENTS.map((item, index) => {
  const image = PARTNER_DEMO_EVENT_MEDIA[index] || PARTNER_DEMO_EVENT_MEDIA[0];
  return {
    ...item,
    images: [image],
    imageCredit: PARTNER_DEMO_IMAGE_NOTE,
    description: item.description || `${item.title} — illustrative partner-preview listing.`,
    tags: [...(item.tags || [])],
  };
});
function partnerDemoWhen(start) {
  const date = new Date(start);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayLabel =
    date.toDateString() === today.toDateString()
      ? "Today"
      : date.toDateString() === tomorrow.toDateString()
        ? "Tomorrow"
        : date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return `${dayLabel}, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}
function setPulsePartnerDemo(enabled) {
  if (!enabled) return;
  const now = Date.now();
  const tribeOffsets = [55, 1450, 330, 1260, 1600];
  const tribeSpots = [
    [10.4962, 119.2607],
    [10.4102, 119.1771],
    [10.5318, 119.2822],
    [10.55, 119.09],
    [10.5318, 119.2822],
  ];
  PULSE_TRIBES.splice(
    0,
    PULSE_TRIBES.length,
    ...PARTNER_DEMO_TRIBES.map((item, index) => {
      const startsAt = new Date(now + tribeOffsets[index] * 60000);
      return {
        ...item,
        starts_at: startsAt.toISOString(),
        lat: tribeSpots[index][0],
        lng: tribeSpots[index][1],
        when: partnerDemoWhen(startsAt),
      };
    }),
  );
  const eventOffsets = [210, 90, 150];
  const eventSpots = [
    [10.4962, 119.2607],
    [10.5318, 119.2822],
    [10.5318, 119.2822],
  ];
  PULSE_EVENTS.splice(
    0,
    PULSE_EVENTS.length,
    ...PARTNER_DEMO_EVENTS.map((item, index) => {
      const startsAt = new Date(now + eventOffsets[index] * 60000);
      return {
        ...item,
        starts_at: startsAt.toISOString(),
        lat: eventSpots[index][0],
        lng: eventSpots[index][1],
        when: partnerDemoWhen(startsAt),
      };
    }),
  );
}
if (partnerDemoMode) setPulsePartnerDemo(true);
else {
  PULSE_TRIBES.length = 0;
  PULSE_EVENTS.length = 0;
}
// The lounge starts empty on purpose. It used to be seeded with three invented
// travellers — one of them quoting a real-looking boat rental price — which a
// visitor would take for real people. Messages are not stored server-side yet,
// so an honest empty room beats inventing company.
const PULSE_LOUNGE = [];

// Real email accounts still exist for the Backoffice and for syncing saves.
// Nothing a visitor does in Pulse requires one.
function pulseIsSignedIn() {
  try {
    if (window.pulseIsSignedIn_override) return true;
    if (typeof supabase !== "undefined" && supabase && supabase.auth) {
      const u = supabase.auth.__cachedUser;
      if (u) return true;
    }
    if (localStorage.getItem("sanvic_user")) return true;
  } catch (_) {}
  return false;
}

function openPulsePanel() {
  document.getElementById("pulsePanel").classList.add("open");
  renderPulseCatRibbon();
  selectPulseView(pulseView || "tribes");
  // Admin-edited channel names arrive slightly later than the panel; redraw the
  // feed once they do rather than showing the built-in defaults all session.
  loadPulseCategoriesFromDB().then(() => {
    if (pulseView === "feed") renderPulseFeed();
  });
  updateLiveCounts();
  maybeShowSectionBriefing("tribes");
  pulseRibbonOnScroll();
  syncPulseRibbonHeight();
}

// The category chips wrap to as many lines as there are categories, so the
// resting height is measured instead of assumed. A fixed cap clipped the third
// row on a phone and the last categories could not be reached.
function syncPulseRibbonHeight() {
  const rib = document.getElementById("pv2CatRibbon");
  if (!rib) return;
  const full = rib.scrollHeight;
  if (full) rib.style.setProperty("--rib-h", full + "px");
}
window.addEventListener("resize", () => {
  if (document.body.classList.contains("panel-open")) syncPulseRibbonHeight();
});
// The filter row used to be pinned above the scrolling area for good, so on a
// phone it ate the height an event card needed and a single card could not fit.
// Now it collapses away as the list scrolls and returns at the top.
function pulseRibbonOnScroll() {
  const body = document.getElementById("pulseBody");
  const rib = document.getElementById("pv2CatRibbon");
  if (!body || !rib || rib.dataset.scrollBound) return;
  rib.dataset.scrollBound = "1";
  body.addEventListener(
    "scroll",
    () => {
      if (rib.style.display === "none") return;
      rib.classList.toggle("is-away", body.scrollTop > 28);
    },
    { passive: true },
  );
}
// The Tribes panel is one scrolling page now (title, tabs and chips scroll away),
// so "start at the top" means the page wrapper, not the inner list.
function pulsePageEl() {
  return document.getElementById("pv2Scroll");
}
function resetPulsePageScroll() {
  const page = pulsePageEl();
  if (page) page.scrollTop = 0;
  const body = document.getElementById("pulseBody");
  if (body) body.scrollTop = 0;
}
function closePulsePanel() {
  const panel = document.getElementById("pulsePanel");
  if (panel) panel.classList.remove("open");
}

function pulseDeviceId() {
  try {
    let id = localStorage.getItem("pulse_device_id");
    if (!id) {
      id = "d_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("pulse_device_id", id);
    }
    return id;
  } catch (_) {
    return "d_anon";
  }
}
function pulseSavedName() {
  try {
    return (
      localStorage.getItem("pulse_display_name") ||
      (window.todayNickname ? todayNickname() : "") ||
      "You"
    );
  } catch (_) {
    return "You";
  }
}
function pulseSaveName(n) {
  try {
    if (n) localStorage.setItem("pulse_display_name", n);
  } catch (_) {}
}

// The panel heading described Tribes while five different things lived under it.
// Only the feed gets its own heading for now; every other view keeps the copy it
// shipped with, so nothing else moves.
const PULSE_VIEW_HEADINGS = {
  feed: {
    title: "Feed",
    sub: "What is happening right now.",
    copy: "Posts from locals and travellers around San Vicente. No account needed to read or reply.",
  },
};
const PULSE_DEFAULT_HEADING = {
  title: "Tribes",
  sub: "Find your tribe today.",
  copy: "Join small groups, local happenings, and tribe chats around San Vicente.",
};

function applyPulseHeading(view) {
  const h = PULSE_VIEW_HEADINGS[view] || PULSE_DEFAULT_HEADING;
  const t = document.getElementById("pv2Title");
  const sub = document.getElementById("pv2Sub");
  const copy = document.getElementById("pv2Copy");
  if (t) t.textContent = h.title;
  if (sub) sub.textContent = h.sub;
  if (copy) copy.textContent = h.copy;
}

function selectPulseView(view) {
  pulseView = view;
  const panel = document.getElementById("pulsePanel");
  if (panel) panel.dataset.view = view;
  applyPulseHeading(view);
  document
    .querySelectorAll(".pv2-vtab")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  // Hide the shared ribbon on lounge/form, and on the feed — the feed carries
  // its own channel chips, and those names are not tribe tags.
  const rib = document.getElementById("pv2CatRibbon");
  if (rib)
    rib.style.display = view === "lounge" || view === "form" || view === "feed" ? "none" : "";
  if (rib) rib.classList.remove("is-away");
  resetPulsePageScroll();
  renderPulseBody();
}
function selectPulseCategoryV2(cat) {
  pulseCategory = cat;
  document
    .querySelectorAll(".pv2-cat")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  renderPulseBody();
  // Bring the row back and start the filtered list from the top, so the first
  // card is the first thing you see after tapping a filter.
  const rib = document.getElementById("pv2CatRibbon");
  if (rib) rib.classList.remove("is-away");
  resetPulsePageScroll();
}
function renderPulseCatRibbon() {
  const el = document.getElementById("pv2CatScroll");
  if (!el) return;
  el.innerHTML = PV2_CATS.map((c) => {
    const key = c === "All" ? "all" : c;
    const active =
      pulseCategory === key || (pulseCategory === "all" && c === "All") ? " active" : "";
    return `<button class="pv2-cat${active}" data-cat="${key}" onclick="selectPulseCategoryV2('${key.replace(/'/g, "\\'")}')">${c}</button>`;
  }).join("");
}
function matchesCat(item) {
  if (!pulseCategory || pulseCategory === "all") return true;
  return Array.isArray(item.tags) && item.tags.includes(pulseCategory);
}
// This stack used to be filled with stock portrait photos of people who have
// nothing to do with the tribe. Real per-tribe member rows are not loaded, so it
// now shows nothing at all rather than faces of strangers.
function avStackHTML(count) {
  return "";
}
// ── PERSON ID ─────────────────────────────────────────────────────────────
// Joining a tribe or an event must not cost an email round-trip. A "person" is
// the anonymous device id Pulse likes already use (pulse_likes.device_id) plus
// a name chosen once. No password, no verification, no inbox.
const PERSON_KEY = "sanvic_person_v1";
let personKindChoice = "traveler";
let pendingPersonAction = null;

function personGet() {
  try {
    const raw = localStorage.getItem(PERSON_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.id) return p;
    }
  } catch (_) {}
  return null;
}
function personId() {
  const p = personGet();
  return p && p.id ? p.id : pulseDeviceId();
}
function personName() {
  const p = personGet();
  if (p && p.name) return p.name;
  return todayNickname() || "";
}
function personSave(name, kind) {
  let profile = null;
  try {
    profile = JSON.parse(localStorage.getItem("sanvic_entry_v1") || "null");
  } catch (_) {}
  const resolvedKind = kind || (profile && profile.audience === "local" ? "local" : "traveler");
  const p = {
    id: personId(),
    name: String(name || "")
      .trim()
      .slice(0, 40),
    kind: resolvedKind === "local" ? "local" : "traveler",
    at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(PERSON_KEY, JSON.stringify(p));
  } catch (_) {}
  pulseSaveName(p.name);
  return p;
}
// The one gate, and it is one field: what should we call you. Runs
// `action(person)` straight away if a name is already known.
function ensurePerson(action) {
  const p = personGet();
  if (p && p.name) {
    action(p);
    return;
  }
  let profile = null;
  try {
    profile = JSON.parse(localStorage.getItem("sanvic_entry_v1") || "null");
  } catch (_) {}
  if (profile && profile.nickname && String(profile.nickname).trim()) {
    const person = personSave(profile.nickname, profile.audience);
    action(person);
    return;
  }
  pendingPersonAction = action;
  openPersonSheet();
}
function openPersonSheet() {
  const ov = document.getElementById("personOverlay");
  const sh = document.getElementById("personSheet");
  if (!sh) return;
  const inp = document.getElementById("personNameInput");
  if (inp) inp.value = personName();
  const known = personGet();
  let profile = null;
  try {
    profile = JSON.parse(localStorage.getItem("sanvic_entry_v1") || "null");
  } catch (_) {}
  setPersonKind(
    known ? known.kind : profile && profile.audience === "local" ? "local" : "traveler",
  );
  const st = document.getElementById("personStatus");
  if (st) {
    st.textContent = "";
    st.className = "person-status";
  }
  if (ov) ov.classList.add("active");
  sh.classList.add("open");
  try {
    window.setTimeout(() => {
      try {
        if (inp) inp.focus();
      } catch (_) {}
    }, 80);
  } catch (_) {}
}
function closePersonSheet(cancelled) {
  const ov = document.getElementById("personOverlay");
  const sh = document.getElementById("personSheet");
  if (ov) ov.classList.remove("active");
  if (sh) sh.classList.remove("open");
  if (cancelled) pendingPersonAction = null;
}
function setPersonKind(k) {
  personKindChoice = k === "local" ? "local" : "traveler";
  document
    .querySelectorAll(".person-kind")
    .forEach((b) => b.classList.toggle("active", b.dataset.kind === personKindChoice));
}
function confirmPerson() {
  const inp = document.getElementById("personNameInput");
  const name = (inp ? inp.value : "").trim();
  const st = document.getElementById("personStatus");
  if (name.length < 2) {
    if (st) {
      st.textContent = "Please type a name — 2 letters or more.";
      st.className = "person-status err";
    }
    return;
  }
  const person = personSave(name, personKindChoice);
  const action = pendingPersonAction;
  pendingPersonAction = null;
  closePersonSheet(false);
  if (action) action(person);
}
// A tribe formed on this device has an id like 't_123' and no database row.
function isDbId(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(String(id || ""));
}

// ── REAL MEMBERSHIP ───────────────────────────────────────────────────────
// Who has joined what, counted from rows rather than a hardcoded number.
let tribeMembers = {}; // { tribeId: [{device_id, display_name}] }
let eventInterest = {}; // { eventId: [{device_id, display_name}] }
let myTribes = new Set();
let myEvents = new Set();

function applyJoinRows(tribeRows, eventRows) {
  tribeMembers = {};
  eventInterest = {};
  myTribes = new Set();
  myEvents = new Set();
  const me = personId();
  (tribeRows || []).forEach((r) => {
    const k = String(r.tribe_id);
    (tribeMembers[k] = tribeMembers[k] || []).push(r);
    if (r.device_id === me) myTribes.add(k);
  });
  (eventRows || []).forEach((r) => {
    const k = String(r.event_id);
    (eventInterest[k] = eventInterest[k] || []).push(r);
    if (r.device_id === me) myEvents.add(k);
  });
}
async function loadJoinData() {
  try {
    const [tm, ei] = await Promise.all([
      sb.from("tribe_members").select("tribe_id,device_id,display_name"),
      sb.from("event_interest").select("event_id,device_id,display_name"),
    ]);
    applyJoinRows(tm && tm.data, ei && ei.data);
  } catch (err) {
    console.warn("[SANVIC] Could not load joins:", err);
  }
}
function tribeRealCount(id) {
  return (tribeMembers[String(id)] || []).length;
}
function tribeTotalCount(t) {
  return (t.joined || 0) + tribeRealCount(t.id);
}
function tribeMemberNames(id) {
  return (tribeMembers[String(id)] || []).map((r) => r.display_name).filter(Boolean);
}
function eventRealCount(id) {
  return (eventInterest[String(id)] || []).length;
}

// ── TODAY: WHO'S GOING ────────────────────────────────────────────────────
// A "Happening today" item is an element of a jsonb array, not a row, so it
// carries its own stable id instead of a foreign key. Same person-id model as
// tribes and events: one row per (item, device), no email, no password.
let todayInterest = {}; // { itemId: [{device_id, display_name}] }
let myToday = new Set();

function applyTodayInterestRows(rows) {
  todayInterest = {};
  myToday = new Set();
  const me = personId();
  (rows || []).forEach((r) => {
    const k = String(r.item_id);
    (todayInterest[k] = todayInterest[k] || []).push(r);
    if (r.device_id === me) myToday.add(k);
  });
}
async function loadTodayInterest() {
  try {
    const { data } = await sb.from("today_interest").select("item_id,device_id,display_name");
    applyTodayInterestRows(data);
  } catch (err) {
    console.warn("[SANVIC] Could not load Today interest:", err);
  }
}
function todayGoingCount(key) {
  return (todayInterest[String(key)] || []).length;
}
function todayGoingNames(key) {
  return (todayInterest[String(key)] || []).map((r) => r.display_name).filter(Boolean);
}

// The stable key for a Happening item: the id the admin wrote, or one derived
// from the item's own text for rows saved before ids existed. The derived key
// is written back on the next save in the Backoffice, so it stops moving then.
function todayItemKey(e, i) {
  if (e && e.id) return String(e.id);
  const base = [e && e.title, e && e.place, e && e.time]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return "t_" + (base || "item-" + (i || 0));
}
function todayJoinableKey(j) {
  const base = [j && j.title, j && j.detail]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return "j_" + (base || "open-spot");
}
function todayHappeningItem(i) {
  return (TODAY_DATA.happening || [])[i] || null;
}

function todayInterestToggle(key, doneMsg) {
  if (partnerDemoMode) return toast("Sample activity — interest is not saved in preview.");
  ensurePerson(async (person) => {
    const on = myToday.has(key);
    try {
      if (on) {
        const { error } = await sb
          .from("today_interest")
          .delete()
          .eq("item_id", key)
          .eq("device_id", person.id);
        if (error) throw error;
        myToday.delete(key);
      } else {
        const { error } = await sb.from("today_interest").insert({
          item_id: key,
          device_id: person.id,
          display_name: person.name,
          kind: person.kind,
        });
        if (error && error.code !== "23505") throw error;
        myToday.add(key);
      }
      await loadTodayInterest();
      renderTodayContent();
      toast(on ? "Removed from your list." : doneMsg || "You're going, " + person.name + ".");
    } catch (err) {
      console.warn("[SANVIC] Today interest failed:", err);
      toast("Could not save that just now. Try again.");
    }
  });
}
function todayJoinHappening(i) {
  const e = todayHappeningItem(i);
  if (e) todayInterestToggle(todayItemKey(e, i));
}
function todayJoinJoinable(i) {
  const j = (TODAY_DATA.joinable || [])[i];
  if (j) todayInterestToggle(todayJoinableKey(j), "You're on the list.");
}

// An admin types a place as free text ("Long Beach", "Alimanguan", "Poblacion").
// Save and Directions need a real directory row behind it, so match loosely:
// exact name, then either name containing the other, then the barangay.
function findDestinationByPlace(place) {
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const needle = norm(place);
  if (!needle) return null;
  const list = typeof destinations !== "undefined" && destinations ? destinations : [];
  return (
    list.find((d) => norm(d.name) === needle) ||
    list.find((d) => norm(d.name).includes(needle)) ||
    list.find((d) => needle.includes(norm(d.name)) && norm(d.name).length > 2) ||
    list.find((d) => norm(d.barangay) === needle) ||
    null
  );
}
// There is deliberately no "Save" action on a Today row any more. It used to
// fuzzy-match the row's free-text place ("Long Beach Sunset Fiesta" matched
// "Long Beach") and save that directory entry instead, so a visitor tapped
// Save on one thing and found a different thing in My Journey. A Today row now
// has one action, Going, which records the row itself and appears under its own
// name. Saved Places in My Journey is still for places saved from Explore,
// where the place is the thing you tapped.
function todayDirectionsHappening(i) {
  const e = todayHappeningItem(i);
  if (!e) return;
  const d = findDestinationByPlace(e.place);
  const target =
    d && d.lat && d.lng
      ? d.lat + "," + d.lng
      : (e.place || e.title || "") + ", San Vicente, Palawan";
  window.open(
    "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(target),
    "_blank",
    "noopener,noreferrer",
  );
}
// Attribution travels with the card, not the row: one short line listing the
// credits actually in use, so a licensed photo is never shown without one.
function todayCreditsHtml(items) {
  const credits = [
    ...new Set(
      (items || [])
        .map((x) => (x && x.imageCredit ? String(x.imageCredit).trim() : ""))
        .filter(Boolean),
    ),
  ];
  if (!credits.length) return "";
  return `<div class="today-credits">${credits.map(escT).join(" · ")}</div>`;
}
function todayFirstImage(item) {
  return item && Array.isArray(item.images) && item.images[0] ? String(item.images[0]) : "";
}
function toast(msg) {
  let el = document.getElementById("sanvicToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "sanvicToast";
    el.className = "sanvic-toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("on");
  try {
    clearTimeout(window.__sanvicToastT);
    window.__sanvicToastT = setTimeout(() => el.classList.remove("on"), 2800);
  } catch (_) {}
}

function joinTribe(id) {
  ensurePerson(async (person) => {
    const key = String(id);
    const t = PULSE_TRIBES.find((x) => String(x.id) === key);
    if (!t) return;
    const joined = myTribes.has(key);

    // Formed on this device only: it has no database row to join.
    if (!isDbId(key)) {
      t.joined = Math.max(1, (t.joined || 1) + (joined ? -1 : 1));
      if (joined) myTribes.delete(key);
      else myTribes.add(key);
      renderPulseBody();
      return;
    }

    try {
      if (joined) {
        const { error } = await sb
          .from("tribe_members")
          .delete()
          .eq("tribe_id", key)
          .eq("device_id", person.id);
        if (error) throw error;
        myTribes.delete(key);
      } else {
        const { error } = await sb.from("tribe_members").insert({
          tribe_id: key,
          device_id: person.id,
          display_name: person.name,
          kind: person.kind,
        });
        if (error && error.code !== "23505") throw error;
        myTribes.add(key);
      }
      await loadJoinData();
      renderPulseBody();
      toast(joined ? "You left the tribe." : "You are in, " + person.name + ".");
    } catch (err) {
      console.warn("[SANVIC] Join failed:", err);
      toast("Could not save that just now. Try again.");
    }
  });
}

function interestedEvent(id) {
  ensurePerson(async (person) => {
    const key = String(id);
    if (!isDbId(key)) {
      toast("You're on the list.");
      return;
    }
    const on = myEvents.has(key);
    try {
      if (on) {
        const { error } = await sb
          .from("event_interest")
          .delete()
          .eq("event_id", key)
          .eq("device_id", person.id);
        if (error) throw error;
        myEvents.delete(key);
      } else {
        const { error } = await sb.from("event_interest").insert({
          event_id: key,
          device_id: person.id,
          display_name: person.name,
          kind: person.kind,
        });
        if (error && error.code !== "23505") throw error;
        myEvents.add(key);
      }
      await loadJoinData();
      renderPulseBody();
      toast(on ? "Removed from your list." : "You're on the list, " + person.name + ".");
    } catch (err) {
      console.warn("[SANVIC] Interest failed:", err);
      toast("Could not save that just now. Try again.");
    }
  });
}

function tribeCardHTML(t) {
  const total = tribeTotalCount(t);
  const mine = myTribes.has(String(t.id));
  const names = tribeMemberNames(t.id);
  const capacity =
    Number(t.cap) > 0 ? Math.max(0, Number(t.cap) - total) : Number(t.spots || t.seatsOpen) || 0;
  const metaExtra =
    capacity > 0
      ? `${total} joining · ${capacity} ${capacity === 1 ? "spot" : "spots"} open`
      : total + " joined · Full";
  const namesLine = names.length
    ? `<div class="pv2-metaline names">With ${escapeHtml(names.slice(0, 3).join(", "))}${names.length > 3 ? " +" + (names.length - 3) : ""}</div>`
    : "";
  const allImages = [];
  if (t.thumb) allImages.push(t.thumb);
  if (t.images && Array.isArray(t.images)) allImages.push(...t.images);
  const uniqueImages = [...new Set(allImages.filter((image) => String(image || "").trim()))];
  const fallbackPhoto = pulseMissingPhoto(t);
  const isSamplePhoto =
    uniqueImages.length === 0 || /illustrative sample/i.test(String(t.imageCredit || ""));
  const displayThumb = uniqueImages[0] || fallbackPhoto;
  const thumbClick =
    uniqueImages.length > 1
      ? (() => {
          const imagesArg = JSON.stringify(uniqueImages).replace(/"/g, "&quot;");
          return `role="button" tabindex="0" aria-label="View ${uniqueImages.length} tribe photos" onclick="openCarousel(${imagesArg},0)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openCarousel(${imagesArg},0)}"`;
        })()
      : "";
  // Missing photos use a local illustrative image, clearly marked as a sample.
  // Real photos already on a listing always take priority over this fallback.
  const hasThumb = !!displayThumb;
  const thumbImage = `<img src="${escT(displayThumb)}" alt="${isSamplePhoto ? "Illustrative sample photo" : "Photo for " + escT(t.title)}" loading="lazy" onerror="this.onerror=null;this.src='${escT(fallbackPhoto)}';this.nextElementSibling.hidden=false">`;
  return `
  <div class="pv2-tribe">
    <div class="pv2-tribe-thumb${hasThumb ? "" : " is-empty"}" ${thumbClick} aria-label="${isSamplePhoto ? "Illustrative sample photo" : "Tribe photo"}">${thumbImage}<span class="pv2-sample-photo-tag"${isSamplePhoto ? "" : " hidden"}>Illustrative sample</span></div>
    <div class="pv2-tribe-body">
      <div class="pv2-tribe-title" role="button" tabindex="0" style="cursor:pointer" onclick="openTribeDetail('${t.id}')">${t.title}</div>
      <div class="pv2-tribe-meta">
        <span class="when"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${t.when}</span>
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${t.where}</span>
      </div>
      <div class="pv2-tribe-capacity">${metaExtra}</div>
      <div class="pv2-tribe-sub">${t.sub}</div>
      <div class="pv2-tribe-foot">
        <div>${namesLine}</div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="pv2-join ghost" onclick="openTribeDetail('${t.id}')">Tribe Chat</button>
          <button class="pv2-join${mine ? " on" : ""}" onclick="joinTribe('${t.id}')">${mine ? lucideSvg("check", 13) + " Joined" : "Join Tribe"}</button>
        </div>
      </div>
      ${t.imageCredit ? `<div class="pv2-creditline">${escT(t.imageCredit)}</div>` : ""}
    </div>
  </div>`;
}
function eventCardHTML(e) {
  const allImages =
    e.images && Array.isArray(e.images)
      ? e.images.filter((image) => String(image || "").trim())
      : [];
  const isSamplePhoto =
    !allImages.length || /illustrative sample/i.test(String(e.imageCredit || ""));
  const displayImage = allImages[0] || pulseMissingPhoto(e);
  const interested = eventRealCount(e.id);
  const mine = myEvents.has(String(e.id));
  // A single real image is enough to show the card photo. Listings with no
  // image receive a clearly marked local illustration until the admin replaces it.
  const imageHtml = `<div class="pv2-event-image"><img class="pulse-card-image" src="${escT(displayImage)}" alt="${isSamplePhoto ? "Illustrative sample photo" : ""}" loading="lazy"${allImages.length > 1 ? ` style="cursor:pointer" onclick="openCarousel(${JSON.stringify(allImages).replace(/"/g, "&quot;")},0)"` : ""} onerror="this.onerror=null;this.src='${escT(pulseMissingPhoto(e))}';this.nextElementSibling.hidden=false"><span class="pv2-sample-photo-tag"${isSamplePhoto ? "" : " hidden"}>Illustrative sample</span></div>`;
  return `
  <div class="pv2-event">
    ${imageHtml}
    ${e.imageCredit ? `<div class="pv2-creditline">${escT(e.imageCredit)}</div>` : ""}
    <div class="pv2-event-t">${e.title}</div>
    <div class="pv2-event-org"><span class="pv2-event-org-dot">${e.org.slice(0, 1)}</span>${e.org}</div>
    <div class="pv2-event-meta"><span>${lucideSvg("map-pin", 12)} ${e.where}</span><span>${lucideSvg("clock", 12)} ${e.when}</span></div>
    <div class="pv2-event-foot">
      <div class="pv2-event-left">
        ${e.price ? `<span class="pv2-pricechip">${e.price}</span>` : ""}
        ${interested ? `<span class="pv2-interested-count">${interested} interested</span>` : ""}
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="pv2-join ghost" onclick="openEventDetail('${e.id}')">Details</button>
        <button class="pv2-join${mine ? " on" : ""}" onclick="interestedEvent('${e.id}')">${mine ? lucideSvg("check", 13) + " Interested" : "I'm Interested"}</button>
      </div>
    </div>
  </div>`;
}

// One empty state, two meanings. "Start the first tribe" is the right nudge
// under an empty tribe list and the wrong one under an empty event list, so the
// caller says which list it is.
function emptyStateHTML(kind) {
  if (kind === "events") {
    return `<div class="pv2-empty">
      <div style="display:flex;justify-content:center;color:rgba(255,255,255,.4)">${lucideSvg("calendar", 28)}</div>
      <div>No events listed yet.</div>
      <div class="pv2-empty-s">Verified organisers post here. Nothing on the calendar for now — meanwhile you can gather people yourself.</div>
      <button class="pv2-cta" onclick="selectPulseView('form')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Form Your Tribe</button>
    </div>`;
  }
  return `<div class="pv2-empty">
    <div style="display:flex;justify-content:center;color:rgba(255,255,255,.4)">${lucideSvg("eye-off", 28)}</div>
    <div>No tribes yet. Start the first one and see who joins!</div>
    <button class="pv2-cta" onclick="selectPulseView('form')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Form Your Tribe</button>
  </div>`;
}

// ── INFO SHEET ────────────────────────────────────────────────────────────
// One sheet for the two things that needed a page of their own: an event, so
// the organiser's own description can build interest, and a tribe, so the plan
// is readable and its members have somewhere to talk. Cards stay short; this is
// where the detail lives.
let infoContext = null;

function openInfoSheet(opts) {
  const sheet = document.getElementById("infoSheet");
  if (!sheet) return;
  document.getElementById("infoKicker").textContent = opts.kicker || "";
  document.getElementById("infoTitle").textContent = opts.title || "";
  document.getElementById("infoMeta").textContent = opts.meta || "";
  document.getElementById("infoBody").innerHTML = opts.body || "";
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
  document.getElementById("infoOverlay").classList.add("active");
  schedulePanelOpen();
}
// The first-visit briefing is suppressed when a panel is reopened mid-flow (for
// example coming back from picking a meeting point on the map), so it cannot
// cover the wizard the visitor is in the middle of.
let suppressSectionBriefing = false;
function maybeShowSectionBriefing(key) {
  if (suppressSectionBriefing) {
    suppressSectionBriefing = false;
    return;
  }
  const copy = {
    tribes: {
      title: "Tribes",
      meta: "Chat with your tribe",
      body: "<p>Join a small group by checking where and when they are meeting, how many people are already in, and how many places remain. Every tribe has its own chat room. Or start your own with <strong>Form a Tribe</strong>.</p>",
    },
    hunt: {
      title: "The Hunt",
      meta: "Discover San Vicente by doing",
      body: "<p>Follow local clues, visit real places, and unlock stories as you go. Check the map and conditions before setting out, and keep your group together.</p>",
    },
  }[key];
  if (!copy) return;
  const storageKey = "sanvic_section_briefing_" + key + "_v1";
  try {
    if (localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, "1");
  } catch (_) {}
  setTimeout(
    () =>
      openInfoSheet({
        kicker: "First time here",
        title: copy.title,
        meta: copy.meta,
        body: `${copy.body}<div class="info-actions"><button class="info-cta" onclick="closeInfoSheet()">Got it</button></div>`,
      }),
    220,
  );
}

function closeInfoSheet() {
  const sheet = document.getElementById("infoSheet");
  if (!sheet) return;
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden", "true");
  document.getElementById("infoOverlay").classList.remove("active");
  infoContext = null;
  schedulePanelOpen();
}
function infoDirections(place) {
  const d = findDestinationByPlace(place);
  const target = d && d.lat && d.lng ? d.lat + "," + d.lng : place + ", San Vicente, Palawan";
  window.open(
    "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(target),
    "_blank",
    "noopener,noreferrer",
  );
}

// An event card could only ever say one line. The organiser's own description is
// what builds the interest, so it gets room here.
function openEventDetail(id) {
  const list = typeof PULSE_EVENTS !== "undefined" && PULSE_EVENTS ? PULSE_EVENTS : [];
  const e = list.find((x) => String(x.id) === String(id));
  if (!e) {
    toast("That event is no longer listed.");
    return;
  }
  infoContext = { kind: "event", id: String(id) };
  const imgs = (e.images || []).filter(Boolean);
  if (!imgs.length) imgs.push(pulseMissingPhoto(e));
  const samplePhoto =
    !(Array.isArray(e.images) && e.images.some(Boolean)) ||
    /illustrative sample/i.test(String(e.imageCredit || ""));
  const mine = typeof myEvents !== "undefined" && myEvents ? myEvents.has(String(e.id)) : false;
  openInfoSheet({
    kicker: "Event",
    title: e.title,
    meta: [e.org, [e.where, e.when].filter(Boolean).join(" · "), e.price]
      .filter(Boolean)
      .join("   ·   "),
    body: `
      ${imgs.length ? `<div class="info-media" style="background-image:url('${escapeHtml(imgs[0])}')">${samplePhoto ? '<span class="pv2-sample-photo-tag">Illustrative sample</span>' : ""}</div>` : ""}
      <div class="info-copy">${e.description ? escapeHtml(e.description) : '<span class="info-muted">The organiser has not written the details yet.</span>'}</div>
      ${e.imageCredit ? `<div class="info-credit">Photo: ${escapeHtml(e.imageCredit)}</div>` : ""}
      <div class="info-actions">
        <button class="info-cta" onclick="infoInterested('${escT(String(e.id))}')">${mine ? "Joined" : "Join the event"}</button>
        ${e.where ? `<button class="info-cta ghost" onclick="infoDirections('${escT(e.where)}')">Directions</button>` : ""}
      </div>
      <div class="info-chat" id="infoChatEvent"></div>`,
  });
  // Load event chat first so messages are there when the sheet opens.
  loadEventChat(id);
}
function infoInterested(id) {
  interestedEvent(id); // records the row; asks for a name first if needed
  // Reflect the tap immediately. The row itself lands behind ensurePerson.
  setTimeout(() => {
    if (infoContext && infoContext.kind === "event") openEventDetail(id);
  }, 700);
}

function openTribeDetail(id) {
  const list = typeof PULSE_TRIBES !== "undefined" && PULSE_TRIBES ? PULSE_TRIBES : [];
  const t = list.find((x) => String(x.id) === String(id));
  if (!t) {
    toast("That tribe is no longer listed.");
    return;
  }
  infoContext = { kind: "tribe", id: String(id) };
  const imgs = [
    ...new Set([t.thumb, ...(Array.isArray(t.images) ? t.images : [])].filter(Boolean)),
  ];
  if (!imgs.length) imgs.push(pulseMissingPhoto(t));
  const samplePhoto =
    (!t.thumb && !(Array.isArray(t.images) && t.images.some(Boolean))) ||
    /illustrative sample/i.test(String(t.imageCredit || ""));
  const mine = typeof myTribes !== "undefined" && myTribes ? myTribes.has(String(t.id)) : false;
  const desc = t.description || t.extra || t.sub || "";
  openInfoSheet({
    kicker: "Tribe",
    title: t.title,
    meta: [t.where, t.when, t.by ? "Started by " + t.by : ""].filter(Boolean).join("   ·   "),
    body: `
      ${imgs.length ? `<div class="info-media" style="background-image:url('${escapeHtml(imgs[0])}')">${samplePhoto ? '<span class="pv2-sample-photo-tag">Illustrative sample</span>' : ""}</div>` : ""}
      ${t.imageCredit ? `<div class="info-credit">${escapeHtml(t.imageCredit)}</div>` : ""}
      <div class="info-copy">${desc ? escapeHtml(desc) : '<span class="info-muted">The organiser has not written the details yet — say hello in the tribe chat below.</span>'}</div>
      <div class="info-actions">
        <button class="info-cta" onclick="infoJoinTribe('${escT(String(t.id))}')">${mine ? "Leave this tribe" : "Join this tribe"}</button>
        ${tribeIsMine(t.id) ? `<button class="info-cta ghost" onclick="cancelMyTribe('${escT(String(t.id))}')">Cancel this tribe</button>` : ""}
      </div>
      <div class="info-chat" id="infoChat"></div>`,
  });
  loadTribeChat(String(t.id));
}
function infoJoinTribe(id) {
  joinTribe(id);
  setTimeout(() => {
    if (infoContext && infoContext.kind === "tribe") openTribeDetail(id);
  }, 700);
}

// ── TRIBE CHAT ────────────────────────────────────────────────────────────
// One room per tribe. Rows are visitor-written, so the only guards are the same
// length checks the other visitor tables use.
function infoIsUuid(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ""));
}
async function loadTribeChat(tribeId) {
  const host = document.getElementById("infoChat");
  if (!host) return;
  if (partnerDemoMode) {
    host.innerHTML = `<div class="info-chat-head">Sample tribe chat · preview only</div>
      <div class="info-msg"><div class="info-msg-name">Sample traveler</div>Meet by the Long Beach access at 5:30?</div>
      <div class="info-msg"><div class="info-msg-name">Sample organizer</div>Sounds good. I’ll share the exact pin here.</div>`;
    return;
  }
  if (!infoIsUuid(tribeId)) {
    host.innerHTML = `<div class="info-chat-head">Tribe chat</div>
      <div class="info-note">This tribe was made before tribes were saved for everyone, so it has no chat room. Form a new tribe to get one.</div>`;
    return;
  }
  host.innerHTML = `<div class="info-chat-head">Tribe chat</div><div class="info-note">Loading…</div>`;
  let rows = [];
  try {
    const { data, error } = await sb
      .from("tribe_messages")
      .select("id,device_id,display_name,body,created_at")
      .eq("tribe_id", tribeId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw error;
    rows = data || [];
  } catch (err) {
    console.warn("[SANVIC] Tribe chat load failed:", err);
    host.innerHTML = `<div class="info-chat-head">Tribe chat</div><div class="info-note">The chat could not be loaded just now.</div>`;
    return;
  }
  const me = personId();
  host.innerHTML = `
    <div class="info-chat-head">Tribe chat · ${rows.length} message${rows.length === 1 ? "" : "s"}</div>
    ${
      rows.length
        ? rows
            .map(
              (m) => `
      <div class="info-msg${m.device_id === me ? " me" : ""}">
        ${m.device_id === me ? "" : `<div class="info-msg-name">${escapeHtml(m.display_name || "Traveller")}</div>`}
        ${escapeHtml(m.body)}
      </div>`,
            )
            .join("")
        : '<div class="info-note">Nobody has said anything yet. Start it.</div>'
    }
    <div class="info-chat-input">
      <input id="infoChatInput" type="text" maxlength="600" placeholder="Say something to this tribe…" onkeydown="if(event.key==='Enter')sendTribeMessage('${tribeId}')">
      <button onclick="sendTribeMessage('${tribeId}')">Send</button>
    </div>`;
  const scroller = document.getElementById("infoBody");
  if (scroller) scroller.scrollTop = scroller.scrollHeight;
}
function sendTribeMessage(tribeId) {
  const input = document.getElementById("infoChatInput");
  const typed = (input && input.value ? input.value : "").trim();
  if (!typed) return;
  ensurePerson(async (person) => {
    const el = document.getElementById("infoChatInput");
    const body = (el && el.value ? el.value : typed).trim();
    if (!body) return;
    try {
      const { error } = await sb
        .from("tribe_messages")
        .insert({ tribe_id: tribeId, device_id: person.id, display_name: person.name, body });
      if (error) throw error;
      await loadTribeChat(tribeId);
    } catch (err) {
      console.warn("[SANVIC] Tribe message failed:", err);
      toast("Could not send that just now.");
    }
  });
}

// ── EVENT CHAT ──────────────────────────────────────────────────────────────
// Mirrors tribe chat but keyed on event_id.
async function loadEventChat(eventId) {
  const host = document.getElementById("infoChatEvent");
  if (!host) return;
  if (partnerDemoMode) {
    host.innerHTML = `<div class="info-chat-head">Sample event chat · preview only</div>
      <div class="info-msg"><div class="info-msg-name">Sample attendee</div>What time should we arrive?</div>
      <div class="info-msg"><div class="info-msg-name">Sample organizer</div>Come a little before the music starts.</div>`;
    return;
  }
  host.innerHTML = `<div class="info-chat-head">Event chat</div><div class="info-note">Loading…</div>`;
  let rows = [];
  try {
    const { data, error } = await sb
      .from("event_messages")
      .select("id,device_id,display_name,body,created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw error;
    rows = data || [];
  } catch (err) {
    console.warn("[SANVIC] Event chat load failed:", err);
    host.innerHTML = `<div class="info-chat-head">Event chat</div><div class="info-note">The chat could not be loaded just now.</div>`;
    return;
  }
  const me = personId();
  host.innerHTML = `
    <div class="info-chat-head">Event chat · ${rows.length} message${rows.length === 1 ? "" : "s"}</div>
    ${
      rows.length
        ? rows
            .map(
              (m) => `
      <div class="info-msg${m.device_id === me ? " me" : ""}">
        ${m.device_id === me ? "" : `<div class="info-msg-name">${escapeHtml(m.display_name || "Traveller")}</div>`}
        ${escapeHtml(m.body)}
      </div>`,
            )
            .join("")
        : '<div class="info-note">Nobody has said anything yet. Start it.</div>'
    }
    <div class="info-chat-input">
      <input id="infoChatEventInput" type="text" maxlength="600" placeholder="Say something about this event…" onkeydown="if(event.key==='Enter')sendEventMessage('${eventId}')">
      <button onclick="sendEventMessage('${eventId}')">Send</button>
    </div>`;
  const scroller = document.getElementById("infoBody");
  if (scroller) scroller.scrollTop = scroller.scrollHeight;
}
function sendEventMessage(eventId) {
  const input = document.getElementById("infoChatEventInput");
  const typed = (input && input.value ? input.value : "").trim();
  if (!typed) return;
  ensurePerson(async (person) => {
    const el = document.getElementById("infoChatEventInput");
    const body = (el && el.value ? el.value : typed).trim();
    if (!body) return;
    try {
      const { error } = await sb
        .from("event_messages")
        .insert({ event_id: eventId, device_id: person.id, display_name: person.name, body });
      if (error) throw error;
      await loadEventChat(eventId);
    } catch (err) {
      console.warn("[SANVIC] Event message failed:", err);
      toast("Could not send that just now.");
    }
  });
}

// ── VISITOR TIPS ON A PLACE ───────────────────────────────────────────────
// "Ask tala" sat on this button. What is actually useful when you are standing
// in front of a place is not a machine's answer but what the last visitor
// learned, so this is where they leave it. Tips are public by design — the point
// is the next traveller reading them.
function placeTipKey(d) {
  return d && d.id != null ? "d:" + d.id : "";
}
function togglePlaceTips() {
  const box = document.getElementById("deTipsBox");
  if (!box) return;
  if (box.hidden) {
    box.hidden = false;
    renderPlaceTips();
  } else {
    box.hidden = true;
  }
}
async function renderPlaceTips() {
  const box = document.getElementById("deTipsBox");
  if (!box) return;
  const key = placeTipKey(currentDest);
  if (!key) return;
  box.innerHTML = `<div class="dept-head">Visitor tips</div><div class="dept-note">Loading…</div>`;
  let rows = [];
  try {
    const { data, error } = await sb
      .from("place_tips")
      .select("id,device_id,display_name,body,created_at")
      .eq("place_key", key)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    rows = data || [];
  } catch (err) {
    console.warn("[SANVIC] Tips load failed:", err);
    box.innerHTML = `<div class="dept-head">Visitor tips</div><div class="dept-note">Could not load tips just now.</div>`;
    return;
  }
  box.innerHTML = `
    <div class="dept-head">Visitor tips · ${rows.length}</div>
    ${
      rows.length
        ? rows
            .map(
              (t) => `
      <div class="dept-tip">
        <div class="dept-tip-name">${escapeHtml(t.display_name || "A traveller")}</div>
        <div class="dept-tip-body">${escapeHtml(t.body)}</div>
      </div>`,
            )
            .join("")
        : '<div class="dept-note">No tips yet. If you learned something here, leave it for the next person.</div>'
    }
    <div class="dept-form">
      <textarea id="deptInput" rows="3" maxlength="600" placeholder="What should the next visitor know? Sea conditions, a price, where to stand for the light…"></textarea>
      <button class="info-cta" onclick="postPlaceTip()">Post tip</button>
    </div>`;
}
function postPlaceTip() {
  const key = placeTipKey(currentDest);
  const input = document.getElementById("deptInput");
  const typed = (input && input.value ? input.value : "").trim();
  if (!key) return;
  if (typed.length < 3) {
    toast("Write a little more than that.");
    return;
  }
  ensurePerson(async (person) => {
    const el = document.getElementById("deptInput");
    const body = (el && el.value ? el.value : typed).trim();
    if (body.length < 3) return;
    try {
      const { error } = await sb
        .from("place_tips")
        .insert({ place_key: key, device_id: person.id, display_name: person.name, body });
      if (error) throw error;
      toast("Thanks — your tip is up.");
      await renderPlaceTips();
    } catch (err) {
      console.warn("[SANVIC] Tip failed:", err);
      toast("Could not post that just now.");
    }
  });
}

function renderPulseBody() {
  const body = document.getElementById("pulseBody");
  if (!body) return;
  if (pulseView === "tribes") {
    const list = PULSE_TRIBES.filter(matchesCat);
    if (!list.length) {
      body.innerHTML = emptyStateHTML("tribes");
      return;
    }
    body.innerHTML = `
      <div class="pv2-listhead">
        <div class="pv2-listhead-l">
          <div class="pv2-listhead-t">${lucideSvg("users", 15)} Active Tribes</div>
          <div class="pv2-listhead-s">Small groups, each with their own tribe chat.</div>
        </div>
        ${pulseCategory && pulseCategory !== "all" ? `<button class="pv2-viewall" onclick="selectPulseCategoryV2('all')">View all ${lucideSvg("chevron-right", 13)}</button>` : ""}
      </div>
      ${list.map(tribeCardHTML).join("")}
      <div class="pv2-footbanner">
        <div class="pv2-footbanner-i">${lucideSvg("users", 18)}</div>
        <div class="pv2-footbanner-body">
          <div class="pv2-footbanner-t">Can't find what you're looking for?</div>
          <div class="pv2-footbanner-s">Start a tribe and see who joins!</div>
        </div>
        <button class="pv2-cta" onclick="selectPulseView('form')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Form Your Tribe</button>
      </div>`;
  } else if (pulseView === "events") {
    const list = PULSE_EVENTS.filter(matchesCat);
    if (!list.length) {
      body.innerHTML = emptyStateHTML("events");
      return;
    }
    body.innerHTML = `
      <div class="pv2-listhead"><div class="pv2-listhead-l"><div class="pv2-listhead-t">${lucideSvg("party-popper", 15)} Events &amp; Happenings</div><div class="pv2-listhead-s">Verified organizers only.</div></div></div>
      ${list.map(eventCardHTML).join("")}`;
  } else if (pulseView === "feed") {
    renderPulseFeed();
  } else if (pulseView === "lounge") {
    renderPulseLounge();
  } else if (pulseView === "form") {
    renderPulseWizard();
  }
}

// ── LOUNGE ──
let LOUNGE_MSGS = null;
function renderPulseLounge() {
  const body = document.getElementById("pulseBody");
  if (!LOUNGE_MSGS) LOUNGE_MSGS = PULSE_LOUNGE.map((m) => ({ ...m, me: false }));
  const chat =
    LOUNGE_MSGS.map(
      (m) => `
    <div class="pv2-lmsg${m.me ? " me" : ""}">
      ${m.me ? "" : `<div class="pv2-lmsg-name">${m.name}</div>`}${m.text}
    </div>
    ${m.helper ? `<div class="pv2-helper"><span>Want to turn this into a Tribe?</span><button onclick="selectPulseView('form')">Form Your Tribe</button></div>` : ""}
  `,
    ).join("") ||
    `<div class="pv2-lounge-empty">${lucideSvg("users", 20)}<div class="pv2-lounge-empty-t">The lounge is quiet.</div><div class="pv2-lounge-empty-s">Say hello and see who's around San Vicente right now.</div></div>`;
  body.innerHTML = `<div class="pv2-lounge" id="pv2LoungeScroll">${chat}</div>
    <div class="pv2-linput">
      <input id="pv2LoungeInput" type="text" placeholder="Say something to the lounge…" onkeydown="if(event.key==='Enter')sendLoungeMsg()"/>
      <button onclick="sendLoungeMsg()">Send</button>
    </div>`;
  const page = pulsePageEl();
  if (page) page.scrollTop = page.scrollHeight;
  body.scrollTop = body.scrollHeight;
}
function sendLoungeMsg() {
  const input = document.getElementById("pv2LoungeInput");
  const typed = (input && input.value ? input.value : "").trim();
  if (!typed) return;
  ensurePerson((person) => {
    const el = document.getElementById("pv2LoungeInput");
    const text = (el && el.value ? el.value : typed).trim();
    if (!text) return;
    const isCoord =
      /(anyone|who wants|looking for|split|share|join)/i.test(text) &&
      /(tomorrow|tonight|today|hopping|surf|dinner|ride|boat|trip)/i.test(text);
    LOUNGE_MSGS.push({
      id: "my_" + Date.now(),
      name: person.name,
      text,
      me: true,
      helper: isCoord,
    });
    renderPulseLounge();
  });
}

// ── WIZARD ──
const WIZ_STEPS = 5;
let wizStep = 0;
const EMPTY_FORM_DRAFT = {
  name: "",
  plan: "",
  when: "",
  whenCustom: "",
  whenTime: "",
  wherePick: "",
  whereText: "",
  whereSearch: "",
  whereLat: null,
  whereLng: null,
  whereBarangay: "",
  size: "",
  note: "",
  imageFile: null,
  imagePreview: "",
  imageIsSample: false,
};
let formDraft = Object.assign({}, EMPTY_FORM_DRAFT);
function selectPulseView_reset() {
  wizStep = 0;
  formDraft = Object.assign({}, EMPTY_FORM_DRAFT);
}
let wizHintMsg = "";
function renderPulseWizard() {
  const body = document.getElementById("pulseBody");
  const progress = Array.from({ length: WIZ_STEPS })
    .map((_, i) => `<span class="${i <= wizStep ? "done" : ""}"></span>`)
    .join("");
  let q = "",
    opts = "",
    hint = "";
  if (wizStep === 0) {
    q = "What are you planning?";
    const plans = [
      "Island Hopping",
      "Sunset",
      "Drinks",
      "Surf",
      "Dinner",
      "Shared Ride",
      "Explore",
    ];
    const typed = plans.includes(formDraft.plan) ? "" : formDraft.plan;
    opts = `<div class="pv2-wiz-opts">${plans.map((p) => `<button class="pv2-wiz-chip${formDraft.plan === p ? " on" : ""}" onclick="wizPick(this,'plan','${p}')">${p}</button>`).join("")}</div>
      <input class="pv2-wiz-input" id="wizPlanOwn" maxlength="40" placeholder="Or write your own, e.g. sunrise swim" value="${escT(typed)}" oninput="formDraft.plan=this.value">`;
    hint = String(formDraft.plan || "").trim()
      ? ""
      : "Choose or type what you have in mind to continue.";
  } else if (wizStep === 1) {
    q = "When?";
    opts = `<div class="pv2-wiz-opts">
      <button class="pv2-wiz-chip${formDraft.when === "Today" ? " on" : ""}" onclick="wizPick(this,'when','Today')">Today</button>
      <button class="pv2-wiz-chip${formDraft.when === "Tomorrow" ? " on" : ""}" onclick="wizPick(this,'when','Tomorrow')">Tomorrow</button>
      <button class="pv2-wiz-chip${formDraft.when === "custom" ? " on" : ""}" onclick="wizPick(this,'when','custom',true)">Pick date/time</button>
    </div>${formDraft.when === "custom" ? `<input class="pv2-wiz-input" type="datetime-local" aria-label="Start date and time" value="${formDraft.whenCustom}" oninput="formDraft.whenCustom=this.value">` : ["Today", "Tomorrow"].includes(formDraft.when) ? `<input class="pv2-wiz-input" type="time" aria-label="Start time" value="${formDraft.whenTime}" oninput="formDraft.whenTime=this.value">` : ""}`;
    hint =
      formDraft.when === "custom"
        ? formDraft.whenCustom
          ? ""
          : "Pick the date and time."
        : ["Today", "Tomorrow"].includes(formDraft.when)
          ? formDraft.whenTime
            ? ""
            : "Pick a start time so people can find this on the live map."
          : "Pick when it happens.";
  } else if (wizStep === 2) {
    // "Choose Place" used to be a dead chip. It set a flag, never asked which
    // place, and saved the tribe at the literal string "Chosen place" — so a
    // tribe could exist with no idea where it was meeting. Every option here
    // now ends in a real answer: a mapped place, a point tapped on the map, or
    // text the organiser typed.
    q = "Where will your tribe meet?";
    const chosen = String(formDraft.whereText || "").trim();
    const pickedRow = chosen
      ? `
      <div class="pv2-picked">
        ${lucideSvg("map-pin", 15)}
        <span class="pv2-picked-main">
          <span class="pv2-picked-name">${escT(chosen)}</span>
          <span class="pv2-picked-meta">${escT(formDraft.wherePick === "map" ? "Dropped on the map" : formDraft.wherePick === "choose" ? "San Vicente place" : "Typed by you")}</span>
        </span>
        <button type="button" class="pv2-picked-change" onclick="wizClearWhere()">Change</button>
      </div>`
      : "";
    opts = `${pickedRow}
      <div class="pv2-wiz-opts">
        <button type="button" class="pv2-wiz-chip${formDraft.wherePick === "choose" ? " on" : ""}" onclick="wizPick(this,'wherePick','choose',true)">${lucideSvg("map-pin", 13)} Pick a place</button>
        <button type="button" class="pv2-wiz-chip${formDraft.wherePick === "map" ? " on" : ""}" onclick="startTribeMapPick()">${lucideSvg("compass", 13)} Pick on the map</button>
        <button type="button" class="pv2-wiz-chip${formDraft.wherePick === "type" ? " on" : ""}" onclick="wizPick(this,'wherePick','type',true)">${lucideSvg("map-pin", 13)} Type it</button>
      </div>
      ${formDraft.wherePick === "choose" ? placePickerHtml() : ""}
      ${formDraft.wherePick === "type" ? `<input class="pv2-wiz-input" placeholder="Type a place or meeting point…" value="${escT(formDraft.whereText)}" oninput="formDraft.whereText=this.value">` : ""}`;
    hint = chosen
      ? ""
      : formDraft.wherePick === "choose"
        ? "Pick one from the list."
        : formDraft.wherePick === "map"
          ? "Tap the map to drop your meeting point."
          : formDraft.wherePick === "type"
            ? "Type where you want to meet."
            : "Pick a meeting point.";
  } else if (wizStep === 3) {
    q = "How many people?";
    const sizes = ["2–4", "5–10", "10+"];
    opts = `<div class="pv2-wiz-opts">${sizes.map((s) => `<button class="pv2-wiz-chip${formDraft.size === s ? " on" : ""}" onclick="wizPick(this,'size','${s}')">${s}</button>`).join("")}</div>`;
    hint = formDraft.size ? "" : "Roughly how many are you?";
  } else {
    q = "Name your tribe";
    opts = `
      <input class="pv2-wiz-input" id="wizName" maxlength="60" placeholder="${escT(formDraft.plan || "Sunrise surf crew")}" value="${escT(formDraft.name)}" oninput="formDraft.name=this.value">
      <div class="pv2-wiz-photo">
        <label class="pv2-wiz-photobtn" for="wizImage">${lucideSvg("camera", 14)} <span>${formDraft.imagePreview ? "Change photo" : "Add a photo"}</span></label>
        <input type="file" id="wizImage" accept="image/*" onchange="wizPickImage(this)" hidden>
        ${partnerDemoMode ? `<button class="pv2-wiz-sample" type="button" onclick="wizUseSamplePhoto()">Use sample photo</button>` : ""}
        <div class="pv2-wiz-photoprev${formDraft.imagePreview ? " has" : ""}" id="wizImagePrev" style="${formDraft.imagePreview ? `background-image:url('${escT(formDraft.imagePreview)}')` : ""}">${formDraft.imagePreview ? "" : lucideSvg("image", 22)}</div>
      </div>
      ${partnerDemoMode ? `<div class="pv2-wiz-photo-note">Preview only. Sample and selected photos stay on this device; nothing uploads or publishes while partner preview is on.</div>` : ""}
      <textarea class="pv2-wiz-textarea" placeholder="Looking for 2 more people to split a boat tomorrow morning." oninput="formDraft.note=this.value">${escT(formDraft.note)}</textarea>`;
  }
  const last = wizStep === WIZ_STEPS - 1;
  body.innerHTML = `
    <div class="pv2-wiz">
      <div class="pv2-wiz-progress">${progress}</div>
      <div class="pv2-wiz-q">${q}</div>
      ${opts}
      ${hint ? `<div class="pv2-wiz-hint">${hint}</div>` : ""}
      <div class="pv2-wiz-nav">
        <button class="pv2-wiz-back" onclick="wizBack()" ${wizStep === 0 ? 'style="visibility:hidden"' : ""}>${lucideSvg("chevron-left", 13)} Back</button>
        <button class="pv2-wiz-next" onclick="wizAdvance()">${last ? "Create Tribe" : "Next " + lucideSvg("chevron-right", 13)}</button>
      </div>
    </div>`;
  wizHintMsg = hint;
}

// Next is never a dead button. It used to render `disabled` until the step was
// valid, with nothing on screen saying why — that is the "it gets stuck" report.
// It always responds now: it advances, or it says what is still missing.
function wizAdvance() {
  // Checked when Next is pressed, not when the step was drawn. It used to read a
  // message computed at render, so typing a location and pressing Next still
  // said "Type where you want to meet": the message was stale, not the input.
  const st = wizStepState();
  if (!st.ok) {
    toast(st.hint);
    return;
  }
  if (wizStep < WIZ_STEPS - 1) {
    wizStep++;
    renderPulseWizard();
  } else wizCreate();
}

// The live answer for the step on screen, read from the form as it stands now.
function wizStepState() {
  if (wizStep === 0) {
    return String(formDraft.plan || "").trim()
      ? { ok: true }
      : { ok: false, hint: "Choose or type what you have in mind to continue." };
  }
  if (wizStep === 1) {
    if (!formDraft.when) return { ok: false, hint: "Pick when it happens." };
    if (formDraft.when === "custom" && !String(formDraft.whenCustom || "").trim())
      return { ok: false, hint: "Pick the date and time." };
    if (["Today", "Tomorrow"].includes(formDraft.when) && !String(formDraft.whenTime || "").trim())
      return { ok: false, hint: "Pick a start time so people can find this on the live map." };
    const startsAt = pulseStartAtFromDraft();
    if ((formDraft.when === "custom" || formDraft.whenTime) && !startsAt)
      return { ok: false, hint: "Choose a valid start date and time." };
    return { ok: true };
  }
  if (wizStep === 2) {
    if (!formDraft.wherePick) return { ok: false, hint: "Pick a meeting point." };
    const where = String(formDraft.whereText || "").trim();
    if (formDraft.wherePick === "choose" && !where)
      return { ok: false, hint: "Pick the place from the list." };
    if (formDraft.wherePick === "map" && !where)
      return { ok: false, hint: "Tap the map to drop your meeting point." };
    if (formDraft.wherePick === "type" && !where)
      return { ok: false, hint: "Type where you want to meet." };
    return { ok: true };
  }
  if (wizStep === 3) {
    return formDraft.size ? { ok: true } : { ok: false, hint: "Roughly how many are you?" };
  }
  return { ok: true };
}

function wizRender() {
  renderPulseWizard();
}

// A plain choice updates the chips in place instead of re-rendering the whole
// step, so the buttons can never move out from under the tap. `reveal` re-renders
// only when choosing opens an extra field.
function wizPick(btn, key, val, reveal) {
  formDraft[key] = val;
  if (reveal) {
    renderPulseWizard();
    return;
  }
  const box = btn && btn.closest ? btn.closest(".pv2-wiz-opts") : null;
  if (box)
    box.querySelectorAll(".pv2-wiz-chip").forEach((b) => b.classList.toggle("on", b === btn));
  // Picking a chip replaces whatever was typed in the "write your own" field, so
  // the two cannot disagree about what the plan is.
  if (key === "plan") {
    const own = document.getElementById("wizPlanOwn");
    if (own) own.value = "";
  }
  const hint = document.querySelector(".pv2-wiz-hint");
  if (hint) hint.style.display = "none";
  wizHintMsg = "";
}

function wizSet(k, v) {
  formDraft[k] = v;
  renderPulseWizard();
}

// A tribe photo is optional. Anything picked is checked here first so the
// visitor hears about a wrong file straight away, not after the upload fails.
function wizPickImage(input) {
  const f = (input && input.files && input.files[0]) || null;
  if (!f) return;
  if (!/^image\//.test(f.type || "")) {
    toast("That file is not a photo. Pick a JPEG or PNG.");
    input.value = "";
    return;
  }
  if (f.size > 5 * 1024 * 1024) {
    toast("That photo is over 5 MB. Pick a smaller one.");
    input.value = "";
    return;
  }
  formDraft.imageFile = f;
  formDraft.imageIsSample = false;
  try {
    formDraft.imagePreview = URL.createObjectURL(f);
  } catch (e) {
    formDraft.imagePreview = "";
  }
  const prev = document.getElementById("wizImagePrev");
  if (prev) {
    prev.classList.add("has");
    prev.style.backgroundImage = formDraft.imagePreview ? `url('${formDraft.imagePreview}')` : "";
    prev.innerHTML = "";
  }
}
function wizUseSamplePhoto() {
  if (!partnerDemoMode) return;
  if (formDraft.imagePreview && formDraft.imagePreview.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(formDraft.imagePreview);
    } catch (e) {}
  }
  formDraft.imageFile = null;
  formDraft.imageIsSample = true;
  formDraft.imagePreview = "assets/pulse/island-boats-beach.jpg";
  renderPulseWizard();
}
function wizNext() {
  if (wizStep < WIZ_STEPS - 1) wizStep++;
  renderPulseWizard();
}
function wizBack() {
  if (wizStep > 0) wizStep--;
  renderPulseWizard();
}

// ── WHERE? — PICK A PLACE OR DROP A PIN ────────────────────────────────────
// The wizard's third step had three chips and none of them asked a follow-up
// question, which is the report: "you can select a place but it never actually
// asks you what place". This is the picker it should have opened — every mapped
// spot, searchable — plus a real map mode for anything that is not in the
// directory yet.
function placeLabel(d) {
  if (!d) return "";
  return d.barangay ? d.name + ", " + d.barangay : String(d.name || "");
}
function placePickerHtml() {
  return `<div class="pv2-place-pick">
    <input class="pv2-place-search" id="wizPlaceSearch" type="search" autocomplete="off" placeholder="Search a beach, a business, a barangay…" value="${escT(formDraft.whereSearch || "")}" oninput="wizPlaceSearch(this.value)">
    <div class="pv2-place-list" id="wizPlaceList">${placeRowsHtml()}</div>
  </div>`;
}
function placeMatches() {
  const q = String(formDraft.whereSearch || "")
    .trim()
    .toLowerCase();
  return (Array.isArray(destinations) ? destinations : [])
    .filter((d) => d && d.name)
    .filter((d) => {
      if (!q) return true;
      const hay = [
        d.name,
        d.barangay,
        d.category,
        catStyle[d.category] && catStyle[d.category].label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .slice(0, 60);
}
function placeRowsHtml() {
  const rows = placeMatches();
  if (!rows.length) {
    const typed = String(formDraft.whereSearch || "").trim();
    // An empty directory and a search that found nothing are different problems
    // and deserve different words.
    if (!typed)
      return `<div class="pv2-place-empty">No places in the directory yet. Use “Pick on the map” to drop the meeting point anywhere in San Vicente.</div>`;
    return `<div class="pv2-place-empty">Nothing in the directory matches “${escT(typed)}”. Try the map instead — you can pin any beach, business or landmark.</div>`;
  }
  return rows
    .map((d) => {
      const meta = [d.barangay, (catStyle[d.category] && catStyle[d.category].label) || d.category]
        .filter(Boolean)
        .join(" · ");
      const on = String(formDraft.whereText || "") === placeLabel(d) ? " on" : "";
      return `<button type="button" class="pv2-place-row${on}" onclick="wizChoosePlace('${escT(String(d.id))}')">
      ${lucideSvg("map-pin", 15)}
      <span class="pv2-place-main">
        <span class="pv2-place-name">${escT(d.name)}</span>
        <span class="pv2-place-meta">${escT(meta)}</span>
      </span>
    </button>`;
    })
    .join("");
}
// Only the list is redrawn as you type, so the search box keeps focus and the
// keyboard stays up on a phone.
function wizPlaceSearch(v) {
  formDraft.whereSearch = v;
  const host = document.getElementById("wizPlaceList");
  if (host) host.innerHTML = placeRowsHtml();
}
function wizChoosePlace(id) {
  const d = (Array.isArray(destinations) ? destinations : []).find(
    (x) => String(x.id) === String(id),
  );
  if (!d) return;
  formDraft.wherePick = "choose";
  formDraft.whereText = placeLabel(d);
  formDraft.whereLat = Number(d.lat);
  formDraft.whereLng = Number(d.lng);
  formDraft.whereBarangay = d.barangay || "";
  formDraft.whereSearch = "";
  renderPulseWizard();
}
function wizClearWhere() {
  formDraft.whereText = "";
  formDraft.whereLat = null;
  formDraft.whereLng = null;
  formDraft.whereBarangay = "";
  formDraft.whereSearch = "";
  renderPulseWizard();
}

// ── MAP PICKING ────────────────────────────────────────────────────────────
// The wizard steps aside, the map takes the screen, the next tap becomes the
// meeting point. Tapping an existing pin picks that place; tapping open water
// or a hillside picks the point and names the nearest landmark or barangay.
let mapPickPin = null;
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371,
    toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1),
    dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
function describeMapPoint(latlng) {
  const lat = Number(latlng.lat),
    lng = Number(latlng.lng);
  let nearest = null,
    nearestKm = Infinity;
  (Array.isArray(destinations) ? destinations : []).forEach((d) => {
    if (!d || d.lat == null || d.lng == null) return;
    const km = distanceKm(lat, lng, Number(d.lat), Number(d.lng));
    if (km < nearestKm) {
      nearestKm = km;
      nearest = d;
    }
  });
  if (nearest && nearestKm <= 0.25)
    return { label: placeLabel(nearest), barangay: nearest.barangay || "" };
  if (nearest && nearestKm <= 1.2)
    return { label: "Near " + nearest.name, barangay: nearest.barangay || "" };
  let bName = "",
    bKm = Infinity;
  if (typeof SAN_VICENTE_BARANGAYS !== "undefined" && SAN_VICENTE_BARANGAYS.features) {
    SAN_VICENTE_BARANGAYS.features.forEach((f) => {
      const c = barangayAnchor(f);
      if (!c) return;
      const km = distanceKm(lat, lng, c[0], c[1]);
      if (km < bKm) {
        bKm = km;
        bName = (f.properties && f.properties.name) || "";
      }
    });
  }
  if (bName && bKm <= 10) return { label: "Near Brgy. " + bName, barangay: bName };
  if (nearest) return { label: "Near " + nearest.name, barangay: nearest.barangay || "" };
  return { label: lat.toFixed(4) + ", " + lng.toFixed(4), barangay: bName };
}
function startTribeMapPick() {
  if (!map) {
    toast("The map is still loading. Give it a second and try again.");
    return;
  }
  mapPickActive = true;
  document.body.classList.add("map-picking");
  const title = document.getElementById("mapPickTitle");
  const sub = document.getElementById("mapPickSub");
  if (title) title.textContent = "Tap where your tribe meets";
  if (sub)
    sub.textContent = "Tap a pin to choose that place, or tap anywhere else to drop a point.";
  closePulsePanel();
  schedulePanelOpen();
  if (map.getZoom() < 11) map.flyTo(SANVICENTE_CENTER, 11, { duration: 0.6 });
  applyPinVisibility(); // every pin on the map is now a valid target
  map.once("click", onMapPickClick);
}
function endMapPick() {
  mapPickActive = false;
  document.body.classList.remove("map-picking");
  if (map) map.off("click", onMapPickClick);
  applyPinVisibility(); // back to the normal zoom rules
}
function clearMapPickPin() {
  if (mapPickPin && map && map.hasLayer(mapPickPin)) map.removeLayer(mapPickPin);
  mapPickPin = null;
}
function dropMapPickPin(latlng) {
  clearMapPickPin();
  if (!map) return;
  mapPickPin = L.marker(latlng, {
    icon: L.divIcon({
      className: "",
      html: '<span class="map-pick-pin"></span>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    }),
    keyboard: false,
    zIndexOffset: 2000,
  });
  mapPickPin.addTo(map);
}
function applyTribePlace(label, lat, lng, barangay, mode) {
  formDraft.wherePick = mode;
  formDraft.whereText = String(label || "");
  formDraft.whereLat = lat == null ? null : Number(lat);
  formDraft.whereLng = lng == null ? null : Number(lng);
  formDraft.whereBarangay = barangay || "";
  formDraft.whereSearch = "";
  wizStep = 2;
}
function finishMapPick() {
  endMapPick();
  pulseView = "form";
  suppressSectionBriefing = true;
  openPulsePanel(); // renderPulseBody() draws the wizard at the step it was on
}
function onMapPickClick(e) {
  if (!mapPickActive) return;
  const picked = describeMapPoint(e.latlng);
  applyTribePlace(picked.label, e.latlng.lat, e.latlng.lng, picked.barangay, "map");
  dropMapPickPin(e.latlng);
  toast("Meeting point set: " + picked.label);
  // Let the pin land before the sheet comes back over it.
  setTimeout(() => {
    clearMapPickPin();
    finishMapPick();
  }, 420);
}
// Tapping an existing pin during picking selects that business or landmark
// instead of opening its detail sheet.
function pickFromMarker(d) {
  applyTribePlace(placeLabel(d), d.lat, d.lng, d.barangay, "choose");
  endMapPick();
  clearMapPickPin();
  toast("Meeting point set: " + placeLabel(d));
  setTimeout(finishMapPick, 260);
}
function cancelMapPick() {
  endMapPick();
  clearMapPickPin();
  if (pulseView === "form") finishMapPick();
}
window.startTribeMapPick = startTribeMapPick;
window.cancelMapPick = cancelMapPick;
window.pickFromMarker = pickFromMarker;
// ── WHO MADE THIS TRIBE ───────────────────────────────────────────────────
// Visitors have no login, so authorship is proved with a capability instead of
// an identity: the row carries a random delete_token, the browser that created
// it keeps that token locally, and the cancel call only works when they match.
// Nobody else can cancel a tribe, even knowing its id.
const TRIBE_TOKENS_KEY = "sanvic_my_tribe_tokens";
function tribeTokens() {
  try {
    return JSON.parse(localStorage.getItem(TRIBE_TOKENS_KEY) || "{}") || {};
  } catch (e) {
    return {};
  }
}
function rememberTribeToken(id, token) {
  if (!id || !token) return;
  try {
    const t = tribeTokens();
    t[String(id)] = String(token);
    localStorage.setItem(TRIBE_TOKENS_KEY, JSON.stringify(t));
  } catch (e) {}
}
function forgetTribeToken(id) {
  try {
    const t = tribeTokens();
    delete t[String(id)];
    localStorage.setItem(TRIBE_TOKENS_KEY, JSON.stringify(t));
  } catch (e) {}
}
function tribeIsMine(id) {
  return !!tribeTokens()[String(id)];
}

async function cancelMyTribe(id) {
  const token = tribeTokens()[String(id)];
  if (!token) {
    toast("Only the person who started a tribe can cancel it.");
    return;
  }
  if (!confirm("Cancel this tribe? Its tribe chat and members go with it. This cannot be undone."))
    return;
  try {
    const { data, error } = await sb.rpc("cancel_tribe", {
      p_tribe_id: String(id),
      p_token: token,
    });
    if (error) throw error;
    if (data !== true) {
      toast("That tribe could not be cancelled.");
      return;
    }
    const i = PULSE_TRIBES.findIndex((x) => String(x.id) === String(id));
    if (i >= 0) PULSE_TRIBES.splice(i, 1);
    const j = MYSV_TRIBES.findIndex((x) => String(x.id) === String(id));
    if (j >= 0) MYSV_TRIBES.splice(j, 1);
    if (typeof myTribes !== "undefined" && myTribes) myTribes.delete(String(id));
    forgetTribeToken(id);
    closeInfoSheet();
    renderPulseBody();
    toast("Tribe cancelled.");
  } catch (err) {
    console.warn("[SANVIC] Cancel tribe failed:", err);
    toast("Could not cancel that just now. Try again.");
  }
}

function pulseStartAtFromDraft() {
  if (formDraft.when === "custom") {
    const date = new Date(formDraft.whenCustom);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  if (!["Today", "Tomorrow"].includes(formDraft.when) || !formDraft.whenTime) return null;
  const [hours, minutes] = String(formDraft.whenTime).split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  const date = new Date();
  if (formDraft.when === "Tomorrow") date.setDate(date.getDate() + 1);
  date.setHours(hours, minutes, 0, 0);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
function isMissingPulseNowColumn(error) {
  return (
    ["42703", "PGRST204"].includes(String(error && error.code)) ||
    /column .*?(starts_at|lat|lng).*?(does not exist|schema cache)/i.test(
      String(error && error.message),
    )
  );
}

function wizCreate() {
  if (partnerDemoMode) return toast("Turn off partner preview before creating a real tribe.");
  if (formDraft.imageIsSample)
    return toast(
      "That sample photo is only for preview. Choose your own photo before creating a real tribe.",
    );
  ensurePerson(async (person) => {
    // Never "Chosen place" again: a tribe is saved with the place the organiser
    // actually picked (a mapped spot), the point they tapped on the map, or the
    // words they typed.
    const whereLabel =
      String(formDraft.whereText || "").trim() ||
      (formDraft.wherePick === "current" ? "Current map area" : "San Vicente");
    const startsAt = pulseStartAtFromDraft();
    const localStart = startsAt ? new Date(startsAt) : null;
    const whenLabel =
      formDraft.when === "custom"
        ? localStart
          ? localStart.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
          : formDraft.whenCustom.replace("T", ", ")
        : startsAt
          ? `${formDraft.when}, ${localStart.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
          : formDraft.when;
    // The organiser names their own tribe; the plan they picked becomes the tag
    // instead of the title.
    const title = (formDraft.name || "").trim() || formDraft.plan;
    const note = (formDraft.note || "").trim();
    const capNum = formDraft.size === "2–4" ? 4 : formDraft.size === "5–10" ? 10 : 0;
    try {
      // The photo goes up first. It is optional, so a failed upload does not cost
      // the visitor their tribe — it just arrives without a picture.
      let imageUrl = "";
      if (formDraft.imageFile) {
        try {
          const ext =
            ((formDraft.imageFile.name || "").split(".").pop() || "jpg")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .slice(0, 5) || "jpg";
          const path = person.id + "/" + Date.now() + "." + ext;
          const up = await sb.storage.from("tribe-images").upload(path, formDraft.imageFile, {
            cacheControl: "31536000",
            upsert: false,
            contentType: formDraft.imageFile.type,
          });
          if (up.error) throw up.error;
          const pub = sb.storage.from("tribe-images").getPublicUrl(path);
          imageUrl = (pub && pub.data && pub.data.publicUrl) || "";
        } catch (upErr) {
          console.warn("[SANVIC] Tribe photo upload failed:", upErr);
          toast("The photo did not upload — creating the tribe without it.");
        }
      }
      const tribeRow = {
        title,
        where_text: whereLabel,
        when_text: whenLabel,
        sub: note || "Just formed.",
        description: note || "",
        tags: [formDraft.plan],
        cap: capNum,
        joined: 1,
        extra: 0,
        device_id: person.id,
        display_name: person.name,
        image_url: imageUrl || null,
        thumb_url: imageUrl || "",
        lat: formDraft.whereLat,
        lng: formDraft.whereLng,
        starts_at: startsAt,
      };
      let insert = await sb.from("tribes").insert(tribeRow).select().single();
      if (insert.error && isMissingPulseNowColumn(insert.error)) {
        const { lat, lng, starts_at, ...legacyTribeRow } = tribeRow;
        insert = await sb.from("tribes").insert(legacyTribeRow).select().single();
      }
      const { data, error } = insert;
      if (error) throw error;
      // Hold the cancel token: it is the only thing that can remove this tribe.
      rememberTribeToken(data.id, data.delete_token);
      PULSE_TRIBES.unshift({
        id: data.id,
        title: data.title,
        where: data.where_text,
        when: data.when_text,
        starts_at: data.starts_at || startsAt,
        lat: data.lat ?? formDraft.whereLat,
        lng: data.lng ?? formDraft.whereLng,
        sub: data.sub,
        description: data.description,
        by: person.name,
        cap: data.cap,
        joined: 1,
        extra: 0,
        tags: data.tags || [],
        thumb: data.thumb_url || "",
        images: data.images || [],
      });
      MYSV_TRIBES.unshift({
        id: data.id,
        title: data.title,
        meta: (data.where_text || "") + " • " + (data.when_text || ""),
        more: data.sub,
        grad: "linear-gradient(135deg,#f97316,#7c2d12)",
        thumb: data.thumb_url || "",
        images: data.images || [],
        credit: "",
      });
      myTribes.add(String(data.id));
      selectPulseView_reset();
      selectPulseView("tribes");
      toast("Tribe formed, " + person.name + ". Anyone can find it in Tribes now.");
      openTribeDetail(String(data.id));
    } catch (err) {
      const msg = String((err && (err.message || err.details || err.hint)) || err);
      // The database refuses these two outright, so say why rather than "failed".
      if (/TRIBE_LIMIT/.test(msg))
        return toast("That is two tribes today. You can start another tomorrow.");
      if (/TRIBE_DUPLICATE/.test(msg))
        return toast(
          "You already have a tribe with that name. Give it a different name so people can tell them apart.",
        );
      console.warn("[SANVIC] Tribe create failed:", err);
      toast("Could not create that tribe just now. Try again.");
    }
  });
}

function pulseCardHtml(post) {
  let avatarHtml;
  if (post.admin) {
    avatarHtml = `<div class="pulse-avatar-icon">Local<br>Guide</div>`;
  } else if (post.avatar) {
    avatarHtml = `<div class="pulse-avatar-wrap"><img class="pulse-avatar" src="${post.avatar}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=&quot;pulse-avatar-icon&quot; style=&quot;background:rgba(255,255,255,.08);color:var(--white-muted);&quot;>${escapeHtml(post.name.slice(0, 2).toUpperCase())}</div>'"><span class="online-dot"></span></div>`;
  } else {
    avatarHtml = `<div class="pulse-avatar-wrap"><div class="pulse-avatar-icon" style="background:rgba(255,255,255,.08);color:var(--white-muted);">${escapeHtml(post.name.slice(0, 2).toUpperCase())}</div><span class="online-dot"></span></div>`;
  }

  return `
    <div class="pulse-card">
      <div class="pulse-card-top">
        ${avatarHtml}
        <div class="pulse-card-meta">
          <div class="pulse-card-name-row">
            <span class="pulse-card-name">${escapeHtml(post.name)}</span>
            <span class="pulse-card-time">${escapeHtml(post.time)}</span>
            ${post.admin ? '<span class="pulse-admin-badge">Admin</span>' : ""}
          </div>
          <div class="pulse-card-text">${escapeHtml(post.text)}</div>
          ${post.tag ? `<span class="pulse-card-tag">${escapeHtml(post.tag)}</span>` : ""}
          ${post.location ? `<div class="pulse-card-location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(post.location)}</div>` : ""}
          ${post.image ? `<img class="pulse-card-image" src="${post.image}" alt="" loading="lazy" style="cursor:zoom-in" onclick="openPulseLightbox('${encodeURI(post.image).replace(/'/g, "\\'")}')" onerror="this.style.display='none'">` : ""}
          ${
            post.avatars
              ? `<div class="pulse-card-avatars">${Array.from({ length: Math.min(post.avatars, 3) })
                  .map((_, i) => `<div class="pulse-avatar-more">+</div>`)
                  .join(
                    "",
                  )}${post.avatars > 3 ? `<div class="pulse-avatar-more">+${post.avatars - 3}</div>` : ""}</div>`
              : ""
          }
          <div class="pulse-card-actions">
            <button class="pulse-action" onclick="togglePulseLike(this, ${post.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>${post.likes}</span>
            </button>
            <button class="pulse-action" onclick="togglePulseThread(${post.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span id="pulseCommentCount-${post.id}">${post.comments}</span>
            </button>
          </div>
          <div class="pulse-thread" id="pulseThread-${post.id}" style="display:none;"></div>
        </div>
      </div>
    </div>`;
}

async function togglePulseThread(postId) {
  if (partnerDemoMode) return toast("Sample post — replies are not available in preview.");
  const wrap = document.getElementById("pulseThread-" + postId);
  if (!wrap) return;
  if (wrap.style.display !== "none") {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "block";
  wrap.innerHTML = `<div class="pulse-thread-loading">Loading replies…</div>`;
  await renderPulseThread(postId);
}

async function renderPulseThread(postId) {
  const wrap = document.getElementById("pulseThread-" + postId);
  if (!wrap) return;
  const { data: rows, error } = await sb
    .from("pulse_comments")
    .select("id, display_name, text_content, created_at, is_anonymous, user_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) {
    wrap.innerHTML = `<div class="pulse-thread-loading">Could not load replies: ${escapeHtml(error.message)}</div>`;
    return;
  }
  const savedName = pulseSavedName();
  const list = (rows || [])
    .map((c) => {
      const name = c.display_name || "Anonymous traveler";
      return `<div class="pulse-comment"><div class="pulse-comment-head"><span class="pulse-comment-name">${escapeHtml(name)}</span><span class="pulse-comment-time">${escapeHtml(relTime(c.created_at))}</span></div><div class="pulse-comment-text">${escapeHtml(c.text_content || "")}</div></div>`;
    })
    .join("");
  wrap.innerHTML = `
    <div class="pulse-comment-list">${list || '<div class="pulse-thread-empty">No replies yet. Be the first.</div>'}</div>
    <div class="pulse-comment-composer">
      <input type="text" id="pulseCommentName-${postId}" maxlength="40" placeholder="Your name (optional)" value="${escapeHtml(savedName)}" class="pulse-comment-input pulse-comment-name-input">
      <div class="pulse-comment-row">
        <input type="text" id="pulseCommentText-${postId}" maxlength="300" placeholder="Write a reply…" class="pulse-comment-input" onkeydown="if(event.key==='Enter'){submitPulseComment(${postId})}">
        <button class="pulse-comment-send" onclick="submitPulseComment(${postId})">Send</button>
      </div>
    </div>`;
}

let pulseLastCommentAt = 0;
async function submitPulseComment(postId) {
  const txtEl = document.getElementById("pulseCommentText-" + postId);
  const nameEl = document.getElementById("pulseCommentName-" + postId);
  if (!txtEl) return;
  const text = (txtEl.value || "").trim();
  if (!text) return;
  const now = Date.now();
  if (now - pulseLastCommentAt < 15000) {
    alert("Please wait a few seconds before replying again.");
    return;
  }
  const name = ((nameEl && nameEl.value) || "").trim().slice(0, 40) || null;
  if (name) pulseSaveName(name);
  txtEl.disabled = true;
  const { error } = await sb.from("pulse_comments").insert({
    post_id: postId,
    user_id: null,
    display_name: name,
    is_anonymous: !name,
    text_content: text.slice(0, 300),
  });
  txtEl.disabled = false;
  if (error) {
    alert("Could not reply: " + error.message);
    return;
  }
  pulseLastCommentAt = now;
  txtEl.value = "";
  // bump count
  const cntEl = document.getElementById("pulseCommentCount-" + postId);
  if (cntEl) cntEl.textContent = (parseInt(cntEl.textContent, 10) || 0) + 1;
  await renderPulseThread(postId);
}

function openPulseLightbox(url) {
  const box = document.getElementById("pulseLightbox");
  const img = document.getElementById("pulseLightboxImg");
  if (!box || !img) return;
  img.src = url;
  box.classList.add("open");
}
function closePulseLightbox() {
  const box = document.getElementById("pulseLightbox");
  if (box) {
    box.classList.remove("open");
    const img = document.getElementById("pulseLightboxImg");
    if (img) img.src = "";
  }
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePulseLightbox();
});

// Set of post IDs the current user has liked — refreshed on each feed load
let pulseLikedSet = new Set();
// Cache of latest feed rows by id so togglePulseLike can update counts
let pulseFeedById = new Map();
const PARTNER_DEMO_FEED = [
  {
    id: 91001,
    cat: "island",
    name: "Sample traveler",
    avatar: null,
    admin: false,
    text: "Example plan: sharing a boat from Port Barton for a relaxed island-hopping day.",
    image: "assets/pulse/island-boats-aerial.jpg",
    location: "Port Barton",
    tag: "Sample trip idea",
    likes: 12,
    comments: 3,
    minutesAgo: 11,
  },
  {
    id: 91002,
    cat: "surf",
    name: "Sample local guide",
    avatar: null,
    admin: true,
    text: "Example update: check the sea and wind again before heading out. Conditions can change quickly.",
    image: "assets/san-vicente-long-beach.jpg",
    location: "Alimanguan",
    tag: "Sample surf note",
    likes: 8,
    comments: 2,
    minutesAgo: 38,
  },
  {
    id: 91003,
    cat: "food",
    name: "Sample traveler",
    avatar: null,
    admin: false,
    text: "Example question: where can we find a relaxed dinner near Poblacion tonight?",
    image: "assets/pulse/street-food-skewers.jpg",
    location: "Poblacion",
    tag: "Sample question",
    likes: 5,
    comments: 1,
    minutesAgo: 74,
  },
];

function relTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const days = Math.floor(h / 24);
  if (days < 7) return days + "d ago";
  return d.toLocaleDateString();
}

async function togglePulseLike(btn, postId) {
  if (partnerDemoMode) return toast("Sample post — likes are not saved in preview.");
  const device = pulseDeviceId();
  const liked = pulseLikedSet.has(postId);
  const span = btn.querySelector("span");
  const cur = parseInt(span.textContent, 10) || 0;
  if (liked) {
    pulseLikedSet.delete(postId);
    btn.classList.remove("liked");
    span.textContent = Math.max(0, cur - 1);
    const { error } = await sb
      .from("pulse_likes")
      .delete()
      .eq("post_id", postId)
      .eq("device_id", device);
    if (error) {
      pulseLikedSet.add(postId);
      btn.classList.add("liked");
      span.textContent = cur;
      alert("Could not unlike: " + error.message);
    }
  } else {
    pulseLikedSet.add(postId);
    btn.classList.add("liked");
    span.textContent = cur + 1;
    const { error } = await sb.from("pulse_likes").insert({ post_id: postId, device_id: device });
    if (error && error.code !== "23505") {
      pulseLikedSet.delete(postId);
      btn.classList.remove("liked");
      span.textContent = cur;
      alert("Could not like: " + error.message);
    }
  }
}

// The feed's own chrome: a way in to the composer and the channel chips. It is
// drawn before the query resolves so the panel never looks like it has nothing
// to offer while it is still thinking.
function pulseFeedChromeHtml() {
  const chips = feedChannels()
    .map((c) => {
      const active = pulseFeedCategory === c.key ? " active" : "";
      return `<button class="pv2-cat${active}" onclick="setPulseFeedCategory('${c.key}')">${escT(c.label)}</button>`;
    })
    .join("");
  return `
    <div class="pv2-feed-top">
      <button class="pv2-feed-compose" type="button" onclick="openPulseCompose()">
        ${lucideSvg("pencil", 16)}
        <span>Say something to San Vicente…</span>
      </button>
      <div class="pv2-feed-chips">${chips}</div>
    </div>`;
}

function setPulseFeedCategory(cat) {
  pulseFeedCategory = cat;
  renderPulseFeed();
}

async function renderPulseFeed() {
  const body = document.getElementById("pulseBody");
  if (!body) return;
  if (partnerDemoMode) {
    const posts = PARTNER_DEMO_FEED.filter(
      (post) => pulseFeedCategory === "all" || post.cat === pulseFeedCategory,
    ).map((post) => ({
      ...post,
      time: relTime(new Date(Date.now() - post.minutesAgo * 60000).toISOString()),
    }));
    body.innerHTML = `${pulseFeedChromeHtml()}
      <div class="partner-demo-feed-note">Sample feed posts · likes and replies are not saved.</div>
      ${posts.length ? posts.map(pulseCardHtml).join("") : '<div class="pv2-empty">No sample posts in this channel.</div>'}`;
    return;
  }

  body.innerHTML = `${pulseFeedChromeHtml()}<div class="pulse-empty">Loading…</div>`;

  let query = sb
    .from("pulse_posts")
    .select(
      "id, user_id, category, text_content, image_url, location_text, tag, display_name, is_anonymous, admin_post, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (pulseFeedCategory !== "all") query = query.eq("category", pulseFeedCategory);

  const { data: rows, error } = await query;
  if (error) {
    // A failed query is not an empty feed. Say which one it is, and give a way
    // back rather than a dead panel.
    body.innerHTML = `${pulseFeedChromeHtml()}
      <div class="pv2-empty">
        <div style="display:flex;justify-content:center;color:rgba(255,255,255,.4)">${lucideSvg("cloud", 28)}</div>
        <div>Could not load the feed.</div>
        <div class="pv2-empty-s">${escapeHtml(error.message || "The connection dropped.")}</div>
        <button class="pv2-cta" onclick="renderPulseFeed()">Try again</button>
      </div>`;
    return;
  }

  // Fetch traveler profiles for the post authors (no FK between tables, so do it separately)
  const profileById = new Map();
  const authorIds = Array.from(
    new Set((rows || []).filter((r) => !r.is_anonymous && r.user_id).map((r) => r.user_id)),
  );
  if (authorIds.length) {
    const { data: profs } = await sb.rpc("get_public_profiles", { _ids: authorIds });
    if (profs) profs.forEach((p) => profileById.set(p.id, p));
  }

  // Load this device's likes so the heart state is correct
  pulseLikedSet = new Set();
  // Fetch likes and comment counts separately (avoids RLS-hanging count aggregates)
  const postIds = (rows || []).map((r) => r.id);
  const likeCountByPost = {};
  if (postIds.length) {
    const { data: likes } = await sb
      .from("pulse_likes")
      .select("post_id")
      .eq("device_id", pulseDeviceId())
      .in("post_id", postIds);
    if (likes) likes.forEach((l) => pulseLikedSet.add(l.post_id));
    // All likes for count
    const { data: allLikes } = await sb
      .from("pulse_likes")
      .select("post_id")
      .in("post_id", postIds);
    (allLikes || []).forEach((l) => {
      likeCountByPost[l.post_id] = (likeCountByPost[l.post_id] || 0) + 1;
    });
  }
  const commentCountByPost = {};
  if (postIds.length) {
    const { data: allComments } = await sb
      .from("pulse_comments")
      .select("post_id")
      .in("post_id", postIds);
    (allComments || []).forEach((c) => {
      commentCountByPost[c.post_id] = (commentCountByPost[c.post_id] || 0) + 1;
    });
  }

  pulseFeedById = new Map();
  const posts = (rows || []).map((r) => {
    const prof = r.user_id ? profileById.get(r.user_id) : null;
    const name = r.display_name || (prof && prof.display_name) || "Anonymous traveler";
    const avatar = (prof && prof.avatar_url) || null;
    const mapped = {
      id: r.id,
      cat: r.category,
      name,
      avatar,
      admin: !!r.admin_post,
      time: relTime(r.created_at),
      text: r.text_content || "",
      image: r.image_url || null,
      location: r.location_text || null,
      tag: r.tag || null,
      likes: likeCountByPost[r.id] || 0,
      comments: commentCountByPost[r.id] || 0,
    };
    pulseFeedById.set(r.id, mapped);
    return mapped;
  });

  if (!posts.length) {
    const all = pulseFeedCategory === "all";
    body.innerHTML = `${pulseFeedChromeHtml()}
      <div class="pv2-empty">
        <div style="display:flex;justify-content:center;color:rgba(255,255,255,.4)">${lucideSvg("message-circle", 28)}</div>
        <div>${all ? "No posts yet." : "Nothing posted in this channel yet."}</div>
        <div class="pv2-empty-s">${all ? "Be the first to say what is happening in San Vicente — a spot worth seeing, a boat with seats, the surf right now." : "Try another channel, or start the conversation yourself."}</div>
        <button class="pv2-cta" onclick="openPulseCompose()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Write a post</button>
      </div>`;
    return;
  }
  body.innerHTML = `${pulseFeedChromeHtml()}${posts.map(pulseCardHtml).join("")}`;
  // Mark hearts that the current user has already liked
  body.querySelectorAll(".pulse-action").forEach((btn) => {
    const m =
      btn.getAttribute("onclick") &&
      btn.getAttribute("onclick").match(/togglePulseLike\(this,\s*(\d+)\)/);
    if (m && pulseLikedSet.has(parseInt(m[1], 10))) btn.classList.add("liked");
  });
}

// Pulse photos were previously kept as base64 data URLs and written straight into
// pulse_posts.image_url. Nine posts reached 27 MB, which blew the Postgres statement
// timeout and broke both the Pulse feed and the Pulse admin tab. Now the browser
// downscales and re-encodes the photo, uploads it to the pulse-media bucket, and
// only the public URL is stored.
let pulseComposeImageBlob = null; // compressed, ready to upload
let pulseComposeImagePreviewUrl = null; // object URL, for the preview only
let pulseNextPostId = 1000; // mock IDs for session-local posts, won't collide with seeded 1-12

let pulseComposeLocation = null;

// The composer's dropdown is rendered from the same list as the chips, so a
// channel the Backoffice adds is selectable the moment it is saved.
function renderPulseComposeCategoryMenu() {
  const menu = document.getElementById("pulseComposeCatMenu");
  if (!menu) return;
  menu.innerHTML = feedChannels()
    .map(
      (c) =>
        `<button type="button" data-val="${escT(c.key)}" data-label="${escT(c.label)}" onclick="selectPulseCat(this)">${escT(c.label)}</button>`,
    )
    .join("");
}

function openPulseCompose() {
  if (partnerDemoMode) return toast("Turn off partner preview to publish a real post.");
  document.getElementById("pulseComposeText").value = "";
  renderPulseComposeCategoryMenu();
  const initCat = pulseFeedCategory !== "all" ? pulseFeedCategory : "all";
  setPulseCat(initCat);
  const nameEl = document.getElementById("pulseComposeName");
  if (nameEl) nameEl.value = pulseSavedName();
  removePulseComposeImage();
  clearPulseLocation();
  updatePulseComposeState();
  document.getElementById("pulseComposeOverlay").classList.add("active");
  document.getElementById("pulseComposeSheet").classList.add("open");
}

function closePulseCompose() {
  document.getElementById("pulseComposeOverlay").classList.remove("active");
  document.getElementById("pulseComposeSheet").classList.remove("open");
  document.getElementById("pulseComposeCatMenu").style.display = "none";
  closePulseLocPicker();
}

// ── Custom channel dropdown ──
function togglePulseCatMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("pulseComposeCatMenu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}
function selectPulseCat(btn) {
  setPulseCat(btn.dataset.val, btn.dataset.label);
  document.getElementById("pulseComposeCatMenu").style.display = "none";
}
function setPulseCat(val, label) {
  document.getElementById("pulseComposeCategory").value = val;
  if (!label) {
    const btn = document.querySelector(`#pulseComposeCatMenu button[data-val="${val}"]`);
    label = btn ? btn.dataset.label : "General";
  }
  document.getElementById("pulseComposeCatLabel").textContent = label;
  document.querySelectorAll("#pulseComposeCatMenu button").forEach((b) => {
    b.classList.toggle("active", b.dataset.val === val);
  });
}
document.addEventListener("click", (e) => {
  const menu = document.getElementById("pulseComposeCatMenu");
  const btn = document.getElementById("pulseComposeCatBtn");
  if (
    menu &&
    menu.style.display === "block" &&
    !menu.contains(e.target) &&
    e.target !== btn &&
    !btn.contains(e.target)
  ) {
    menu.style.display = "none";
  }
});

// ── Location picker ──
function openPulseLocPicker() {
  const list = document.getElementById("pulseLocList");
  const items = (Array.isArray(destinations) && destinations.length ? destinations : [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  list.innerHTML = items
    .map(
      (d) => `
    <button type="button" onclick="pickPulseLocation('${escapeHtml(d.name).replace(/'/g, "\\'")}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;color:var(--ocean-teal-light)"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      ${escapeHtml(d.name)}
    </button>
  `,
    )
    .join("");
  document.getElementById("pulseLocOverlay").classList.add("active");
  document.getElementById("pulseLocSheet").classList.add("open");
}
function closePulseLocPicker() {
  const o = document.getElementById("pulseLocOverlay");
  const s = document.getElementById("pulseLocSheet");
  if (o) o.classList.remove("active");
  if (s) s.classList.remove("open");
}
function pickPulseLocation(name) {
  pulseComposeLocation = name;
  const chip = document.getElementById("pulseComposeLocChip");
  document.getElementById("pulseComposeLocChipText").textContent = name;
  chip.style.display = "inline-flex";
  closePulseLocPicker();
}
function clearPulseLocation() {
  pulseComposeLocation = null;
  const chip = document.getElementById("pulseComposeLocChip");
  if (chip) chip.style.display = "none";
}
function useCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not available on this device.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const items = Array.isArray(destinations) ? destinations : [];
      let best = null,
        bestKm = Infinity;
      const toRad = (d) => (d * Math.PI) / 180;
      for (const d of items) {
        if (typeof d.lat !== "number" || typeof d.lng !== "number") continue;
        const dLat = toRad(d.lat - lat),
          dLng = toRad(d.lng - lng);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat)) * Math.cos(toRad(d.lat)) * Math.sin(dLng / 2) ** 2;
        const km = 2 * 6371 * Math.asin(Math.sqrt(a));
        if (km < bestKm) {
          bestKm = km;
          best = d;
        }
      }
      if (best && bestKm <= 5) pickPulseLocation(best.name);
      else if (best && bestKm <= 30) pickPulseLocation(`Near ${best.name}`);
      else pickPulseLocation("Near San Vicente");
    },
    (err) => {
      alert("Could not get your location: " + (err.message || "permission denied"));
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
  );
}

// ───────────── Pulse photo handling ─────────────

const PULSE_IMAGE_MAX_DIM = 1600;
const PULSE_IMAGE_QUALITY = 0.82;
const PULSE_IMAGE_MAX_INPUT_BYTES = 15 * 1024 * 1024;

// Downscale + re-encode before upload, so a 5 MB phone photo becomes roughly 250 KB.
async function compressImageForUpload(file, opts) {
  const maxDim = (opts && opts.maxDim) || PULSE_IMAGE_MAX_DIM;
  const quality = (opts && opts.quality) || PULSE_IMAGE_QUALITY;
  if (typeof createImageBitmap !== "function") return file; // bucket limits still guard the upload
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  if (bitmap.close) bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Could not compress that image.");
  return blob;
}

function setPulseComposeImage(blob) {
  if (pulseComposeImagePreviewUrl) URL.revokeObjectURL(pulseComposeImagePreviewUrl);
  pulseComposeImageBlob = blob;
  pulseComposeImagePreviewUrl = URL.createObjectURL(blob);
  document.getElementById("pulseComposeImagePreview").src = pulseComposeImagePreviewUrl;
  document.getElementById("pulseComposeImagePreviewWrap").style.display = "";
  updatePulseComposeState();
}

function handlePulseComposeImage(event) {
  const input = event.target;
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    input.value = "";
    return;
  }
  if (file.size > PULSE_IMAGE_MAX_INPUT_BYTES) {
    alert("That image is larger than 15 MB. Please choose a smaller one.");
    input.value = "";
    return;
  }
  const postBtn = document.getElementById("pulseComposePostBtn");
  postBtn.disabled = true;
  compressImageForUpload(file)
    .catch((err) => {
      console.warn("Pulse image compression failed; uploading the original file", err);
      return file;
    })
    .then((blob) => setPulseComposeImage(blob))
    .catch((err) => alert("Could not read that image: " + (err.message || err)))
    .finally(() => {
      input.value = "";
      postBtn.disabled = false;
      updatePulseComposeState();
    });
}

function removePulseComposeImage() {
  if (pulseComposeImagePreviewUrl) URL.revokeObjectURL(pulseComposeImagePreviewUrl);
  pulseComposeImagePreviewUrl = null;
  pulseComposeImageBlob = null;
  document.getElementById("pulseComposeImagePreview").src = "";
  document.getElementById("pulseComposeImagePreviewWrap").style.display = "none";
  document.getElementById("pulseComposeFileInput").value = "";
  updatePulseComposeState();
}

function updatePulseComposeState() {
  const text = document.getElementById("pulseComposeText").value.trim();
  const postBtn = document.getElementById("pulseComposePostBtn");
  postBtn.disabled = !text && !pulseComposeImageBlob;
}

let pulseImageUploadSeq = 0;

// Upload a compressed Pulse photo and return its public URL. Random path so
// anonymous uploads are not enumerable; the bucket caps size at 2 MB and images only.
async function uploadPulseImage(blob) {
  const path = `posts/${Date.now().toString(36)}-${(++pulseImageUploadSeq).toString(36)}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const { error } = await sb.storage.from("pulse-media").upload(path, blob, {
    cacheControl: "31536000",
    upsert: false,
    contentType: "image/jpeg",
  });
  if (error) throw error;
  const { data } = sb.storage.from("pulse-media").getPublicUrl(path);
  return data.publicUrl;
}

let pulseLastPostAt = 0;
async function submitPulsePost() {
  if (partnerDemoMode) return toast("Turn off partner preview to publish a real post.");
  const text = document.getElementById("pulseComposeText").value.trim();
  if (!text && !pulseComposeImageBlob) return;

  // Light client-side rate limit: 1 post per 30s per device.
  const now = Date.now();
  if (now - pulseLastPostAt < 30000) {
    alert("Please wait a few seconds before posting again.");
    return;
  }

  const cat = document.getElementById("pulseComposeCategory").value;
  const nameEl = document.getElementById("pulseComposeName");
  const displayName = ((nameEl && nameEl.value) || "").trim().slice(0, 40) || null;
  if (displayName) pulseSaveName(displayName);
  const postBtn = document.getElementById("pulseComposePostBtn");
  postBtn.disabled = true;

  let imageUrl = null;
  if (pulseComposeImageBlob) {
    try {
      imageUrl = await uploadPulseImage(pulseComposeImageBlob);
    } catch (err) {
      postBtn.disabled = false;
      alert("Could not upload the photo: " + (err.message || err));
      return;
    }
  }

  const { error } = await sb.from("pulse_posts").insert({
    user_id: null,
    display_name: displayName,
    category: cat || "all",
    text_content: text ? text.slice(0, 500) : null,
    image_url: imageUrl,
    location_text: pulseComposeLocation || null,
    is_anonymous: true,
  });

  postBtn.disabled = false;

  if (error) {
    alert("Could not post: " + error.message);
    return;
  }
  pulseLastPostAt = now;

  closePulseCompose();
  pulseFeedCategory = "all";
  pulseTab = "feed";
  document.querySelectorAll(".pulse-tab").forEach((b) => {
    if (!b.classList.contains("disabled")) b.classList.toggle("active", b.dataset.tab === "feed");
  });

  await renderPulseFeed();
  const pulsePage = pulsePageEl();
  if (pulsePage) pulsePage.scrollTo({ top: 0, behavior: "smooth" });
}
