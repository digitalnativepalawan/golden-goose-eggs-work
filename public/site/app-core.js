// ═══════════════════════════════════════════════════════
// SANVIC.PH × TALA — Clean Interaction Model
// One active layer at a time. Map is the product.
// Data lives in Supabase (destinations, tala_responses, tala_settings).
// Hardcoded arrays below are only the fallback used if the
// Supabase fetch fails (offline, RLS issue, etc).
// ═══════════════════════════════════════════════════════

// ─── DEFAULT/FALLBACK DATA ───
const DEFAULT_DESTINATIONS = [
  {
    id: 1,
    name: "Long Beach",
    lat: 10.4962,
    lng: 119.2607,
    category: "beaches",
    image: "assets/san-vicente-long-beach.jpg",
    description:
      "San Vicente's signature coastline: a long, open sweep of golden sand with gentle water, coconut edges, and quiet sections that still feel undeveloped compared with busier Palawan towns.",
    tip: "Best for sunset, long walks, and easy swimming. Start near Poblacion, then move north or south for quieter stretches.",
    stats: { rating: "4.9", travel: "10m from Poblacion", temp: "29°C", season: "Nov–May" },
    color: "#0ea5e9",
  },
  {
    id: 2,
    name: "Port Barton",
    lat: 10.4102,
    lng: 119.1771,
    category: "beaches",
    image: "assets/san-vicente-port-barton.jpg",
    description:
      "A relaxed fishing village inside San Vicente with calm bay views, island-hopping boats, simple beachfront stays, and a slower local rhythm made for unhurried travelers.",
    tip: "Use Port Barton as the base for island hopping. Bring cash, book boats early, and expect a quieter night scene.",
    stats: { rating: "4.8", travel: "1h 20m from Poblacion", temp: "29°C", season: "Dec–May" },
    color: "#0ea5e9",
  },
  {
    id: 3,
    name: "Boayan Island",
    lat: 10.55,
    lng: 119.09,
    category: "islands",
    image: "assets/san-vicente-boayan.jpg",
    description:
      "A remote island off San Vicente with clear water, forested hills, small coves, and a frontier feeling for travelers who want a quieter island escape.",
    tip: "Go with a local boat operator and check sea conditions. Pack water, snacks, dry bag, and reef-safe sunscreen.",
    stats: { rating: "4.7", travel: "Boat from San Vicente", temp: "30°C", season: "Mar–May" },
    color: "#8b5cf6",
  },
  {
    id: 4,
    name: "German Island",
    lat: 10.4586,
    lng: 119.0705,
    category: "islands",
    image: "assets/san-vicente-boayan.jpg",
    description:
      "A small island stop often paired with Port Barton tours, known for clear shallows, snorkeling areas, and peaceful beach time between boat rides.",
    tip: "Ask your boatman about turtle-friendly viewing rules. Keep distance from wildlife and avoid stepping on coral.",
    stats: { rating: "4.6", travel: "30–45m by boat", temp: "30°C", season: "Dec–May" },
    color: "#8b5cf6",
  },
  {
    id: 5,
    name: "Pamuayan Falls",
    lat: 10.3908,
    lng: 119.2083,
    category: "nature",
    image: "assets/san-vicente-waterfalls.jpg",
    description:
      "A freshwater waterfall near Port Barton reached by a short inland ride and forest walk, ideal when you want a break from saltwater and beach heat.",
    tip: "Wear sandals with grip. Go after light rain for stronger flow, but avoid trails during heavy rain.",
    stats: { rating: "4.5", travel: "25m from Port Barton", temp: "27°C", season: "Year-round" },
    color: "#22c55e",
  },
  {
    id: 6,
    name: "Bato ni Ningning",
    lat: 10.5634,
    lng: 119.3092,
    category: "nature",
    image: "assets/san-vicente-long-beach.jpg",
    description:
      "A scenic viewpoint above San Vicente where the coast, green hills, and Long Beach reveal the scale of the municipality from above.",
    tip: "Go late afternoon for softer light. Use a motorbike or tricycle and allow extra time for the uphill route.",
    stats: { rating: "4.6", travel: "35m from Poblacion", temp: "28°C", season: "Nov–May" },
    color: "#22c55e",
  },
  {
    id: 7,
    name: "San Vicente - Poblacion",
    lat: 10.5318,
    lng: 119.2822,
    category: "services",
    image: "assets/san-vicente-long-beach.jpg",
    description:
      "The practical center of San Vicente, with access to Long Beach, transport, small eateries, municipal services, and local life away from the island-hopping crowds.",
    tip: "Use Poblacion for arrivals, supplies, and Long Beach access. Confirm van and boat schedules one day ahead.",
    stats: { rating: "4.4", travel: "Town center", temp: "29°C", season: "Year-round" },
    color: "#f59e0b",
  },
  {
    id: 8,
    name: "Inaladelan Island",
    lat: 10.4643,
    lng: 119.0447,
    category: "islands",
    image: "assets/san-vicente-boayan.jpg",
    description:
      "A polished island stop from Port Barton with bright sand, clear water, hammocks, and an easy picnic atmosphere for day trips.",
    tip: "Often included in Port Barton island-hopping. Bring a small dry bag and ask if environmental fees are included.",
    stats: { rating: "4.7", travel: "Boat from Port Barton", temp: "30°C", season: "Dec–May" },
    color: "#8b5cf6",
  },
];

const DEFAULT_TALA_DATA = [
  {
    kw: ["beach", "beaches", "sandy", "shore", "long beach"],
    r: `<strong>San Vicente Beaches</strong><br><br>1. <strong>Long Beach</strong> — the main 14km coastal highlight<br>2. <strong>Port Barton</strong> — calm bay, boats, relaxed village life<br>3. <strong>Inaladelan Island</strong> — bright sand and easy day-trip water<br><br>Best light: sunrise for quiet, sunset for color.`,
  },
  {
    kw: ["san vicente", "sanvicente", "sanvic"],
    r: `<strong>San Vicente, Palawan</strong><br><br>Focus on Long Beach, Port Barton, Boayan Island, Inaladelan Island, Pamuayan Falls, Bato ni Ningning, and Poblacion. It is quieter than El Nido or Coron, so navigation, cash, and local transport planning matter.`,
  },
  {
    kw: ["port barton", "barton"],
    r: `<strong>Port Barton</strong><br><br>A calm San Vicente village for island hopping, beachfront stays, snorkeling, and slow travel. Bring cash, book boats early, and keep plans flexible for weather.`,
  },
  {
    kw: ["island", "islands", "island hop", "island-hopping"],
    r: `<strong>Island Hopping from San Vicente</strong><br><br>Use Port Barton for German Island, Inaladelan Island, turtle-viewing areas, and reef stops. For a more remote feel, ask local operators about Boayan Island and check sea conditions first.`,
  },
  {
    kw: ["time", "visit", "weather", "season", "month"],
    r: `<strong>Best Time for San Vicente</strong><br><br>Nov–May is the easiest window for Long Beach and Port Barton island hopping. Mar–May has calmer seas and hotter days. Jun–Oct can still work, but boat trips are more weather-dependent.`,
  },
  {
    kw: ["get", "transport", "flight", "bus", "ferry", "travel"],
    r: `<strong>Getting Around San Vicente</strong><br><br>Puerto Princesa → San Vicente: van or bus, usually 3–4.5 hours.<br>Poblacion → Port Barton: around 1–1.5 hours by road.<br><br>Local movement: tricycle, motorbike rental, hired van, and boat transfers for islands. Confirm schedules one day ahead.`,
  },
  {
    kw: ["budget", "cost", "money", "price", "cheap"],
    r: `<strong>San Vicente Budget Guide</strong><br><br>Budget: 1,800–3,500₱/day<br>Mid-range: 4,000–8,000₱/day<br>Boat tours vary by route and group size.<br><br>Bring cash, especially for Port Barton, island stops, and small eateries.`,
  },
  {
    kw: ["food", "eat", "restaurant", "dish", "cuisine"],
    r: `<strong>Food Around San Vicente</strong><br><br>Look for grilled fish, kinilaw, simple beachfront carinderias, fresh fruit, and local seafood in Port Barton or Poblacion. Many small places are cash-only.`,
  },
  {
    kw: [
      "accommodation",
      "stays",
      "hotel",
      "lodging",
      "resort",
      "where to stay",
      "place to stay",
      "stay",
      "accomodation",
      "homestay",
    ],
    r: `<strong>Where to Stay in San Vicente</strong><br><br><strong>Long Beach</strong> — boathouses, beachfront cottages, and mid-range resorts along the 14km strip. Best for first-timers who want the beach in front of them.<br><br><strong>Port Barton</strong> — quieter, smaller beachfront lodges, homestays, and a few guesthouses. Better for slow travel and island-hopping bases.<br><br><strong>Poblacion</strong> — the practical base: closest to transport, market, and Long Beach access. Good for arrivals, supplies, and budget stays.<br><br>Book ahead in peak season (Dec–May). Many places are small and fill up on weekends. Cash is king — bring it.`,
  },
  {
    kw: [
      "cafe",
      "cafes",
      "coffee",
      "caffe",
      "brunch",
      "breakfast",
      "lunch",
      "dining",
      "resto",
      "restaurants",
      "food spots",
      "where to eat",
    ],
    r: `<strong>Cafés & Food Spots in San Vicente</strong><br><br><strong>Poblacion</strong> — the town center has simple cafés, carinderias, and a few spots with wifi and morning coffee. Good for a slow start before heading to the beach.<br><br><strong>Long Beach</strong> — beachfront grills, boathouse cafés, and casual seafood stops along the strip. Best at sunrise or late afternoon.<br><br><strong>Port Barton</strong> — a handful of cafés, fusion spots, and beachfront eateries. Smaller than Long Beach but more relaxed.<br><br>Most small places are cash-only and close early. Bring cash, ask locals for today's best spot — it changes.`,
  },
  {
    kw: ["diving", "snorkel", "dive", "coral", "wreck"],
    r: `<strong>Snorkeling</strong><br><br>Port Barton island-hopping is the easiest snorkeling base in San Vicente. Ask for reef stops, turtle-friendly viewing, German Island, and Inaladelan Island. Never touch coral or chase wildlife.`,
  },
  {
    kw: ["packing", "bring", "prepare", "gear"],
    r: `<strong>Packing</strong><br><br>Swimsuit, quick-dry towel, waterproof case<br>Reef-safe sunscreen (mandatory in El Nido)<br>Snorkel mask, water shoes, repellent<br><br>ID, printed tickets, cash — lots of cash.`,
  },
  {
    kw: ["tour", "tours", "island hop", "lagoon"],
    r: `<strong>San Vicente Island-Hopping</strong><br><br>Base yourself in Port Barton for boat routes to German Island, Inaladelan Island, reef stops, and turtle-viewing areas. For Boayan, arrange a local boat and check weather before committing.`,
  },
  {
    kw: ["hello", "hi", "hey", "morning", "evening"],
    r: `Mabuhay — welcome. I'm <strong>tala</strong>, your Palawan concierge. Ask about destinations, timing, routes, or hidden gems.`,
  },
  {
    kw: ["thank", "thanks", "salamat"],
    r: `My pleasure. Palawan will not disappoint. If you need anything else, I'm here.`,
  },
  {
    kw: ["safe", "safety", "danger"],
    r: `Palawan is one of the safest provinces in the Philippines. Watch for strong currents, use reef-safe sunscreen, and stick with registered tour operators. Emergency: 911.`,
  },
  {
    kw: ["waterfall", "falls", "pamuayan"],
    r: `<strong>Pamuayan Falls</strong><br><br>A freshwater stop near Port Barton with a forest path and natural pool. Go with grippy footwear, avoid heavy rain, and bring drinking water.`,
  },
];

const DEFAULT_FALLBACK_RESPONSE = `I'm not sure about that, but I can help with:<br><br>Long Beach · Port Barton · Boayan Island · Pamuayan Falls<br>Transport · Budget · Food · Island hopping<br><br>Or tap any San Vicente marker on the map.`;

const DEFAULT_HERO_TITLE = `Discover Palawan<br><em>Differently.</em>`;
const DEFAULT_HERO_SUBTITLE = ``;
const DEFAULT_SPLASH_SUBTEXT = `The San Vicente Travel Hub<br>Curated by the people who live here`;
const DEFAULT_SPLASH_FOOTER = `PALAWAN`;

// ─── TALA AI (OpenRouter) state ───
let talaAiEnabled = false;
let talaAiModel = "";

// ─── SAMPLE CONTENT POLICY ────────────────────────────────────────────────
// The arrays below (PULSE_TRIBES, PULSE_EVENTS, TODAY_DATA) are packaged samples
// so the app is not blank with no connection. They used to be the fallback
// whenever the matching table came back empty, which meant a visitor could be
// shown invented businesses and prices ("Lechon by the Beach — ₱650 / plate")
// and invented travellers holding seats ("2 seats open. Let's split gas!").
//
// That is the same call the Lounge already made: an honest empty room beats
// inventing company. So samples now survive only when the query itself failed
// (offline demo). If the database answers, the answer wins — including "none".
//
// Set this to true to demo the full experience on a machine with no database.
const SHOW_SAMPLES_WHEN_DB_IS_EMPTY = false;

// Today keys that describe what is happening in San Vicente right now. If the
// database has no row for one of these, the card says so instead of falling back
// to packaged copy. `weather` is exempt: its verdicts are general seasonal advice
// and the live conditions come from Open-Meteo on the map screen.
const TODAY_LIVE_KEYS = ["happening", "joinable", "locals", "notices"];

// ─── LIVE DATA (populated from Supabase, falls back to defaults) ───
let destinations = [];
let aiData = [];
let defaultR = DEFAULT_FALLBACK_RESPONSE;
let heroTitle = DEFAULT_HERO_TITLE;
let heroSubtitle = DEFAULT_HERO_SUBTITLE;
let splashSubtext = DEFAULT_SPLASH_SUBTEXT;
let splashFooter = DEFAULT_SPLASH_FOOTER;
// Off by default: the Explore search box and the barangay / Near me row stay out
// of the way. Backoffice -> Site -> "Explore search + barangay row" turns them on
// for everyone without touching any markup.
var exploreFiltersVisible = false;
let dataReady = false;
function applyExploreFiltersVisibility() {
  const sheet = document.getElementById("exploreSheet");
  if (!sheet) return;
  sheet.classList.toggle("es-no-filters", !exploreFiltersVisible);
  try {
    if (typeof syncExploreFiltersHeight === "function") syncExploreFiltersHeight();
  } catch (e) {
    /* the Explore sheet may not be measured yet; it re-measures on open */
  }
}
let destinationsSource = "loading";
