// ═══════════════════════════════════════════════════════
// HERO WEATHER WIDGET — small, non-critical visual touch under
// the hero subtitle. Uses Open-Meteo (no API key, no signup,
// free for non-commercial use up to 10k calls/day). Client-side
// only, cached in localStorage for 10 minutes so a page refresh
// doesn't re-fetch immediately. If the request fails for any
// reason, the widget simply stays hidden — this is decoration,
// never allowed to show an error or interrupt the page.
// ═══════════════════════════════════════════════════════
const SANVIC_LAT = 10.5,
  SANVIC_LNG = 119.22;
const WEATHER_CACHE_KEY = "sanvic_weather_cache_v1";
const WEATHER_CACHE_MS = 10 * 60 * 1000; // 10 minutes

// Open-Meteo WMO weather codes -> a small label + simple inline SVG icon.
// Codes grouped into the handful of states that matter for a quick glance.
// severity: 'calm' (default/fine), 'caution' (rain/drizzle/fog — be aware),
// 'severe' (storms/heavy showers — clear safety signal for boats/beach plans)
function weatherCodeToDisplay(code) {
  if (code === 0) return { label: "Clear", icon: "sun", severity: "calm" };
  if ([1, 2, 3].includes(code))
    return { label: "Partly cloudy", icon: "cloud-sun", severity: "calm" };
  if ([45, 48].includes(code)) return { label: "Foggy", icon: "cloud", severity: "caution" };
  if ([51, 53, 55, 56, 57].includes(code))
    return { label: "Drizzle", icon: "cloud-drizzle", severity: "caution" };
  if ([61, 63, 66, 80].includes(code))
    return { label: "Rain", icon: "cloud-rain", severity: "caution" };
  if ([65, 67, 81, 82].includes(code))
    return { label: "Heavy rain", icon: "cloud-rain", severity: "severe" };
  if ([95, 96, 99].includes(code))
    return { label: "Thunderstorms", icon: "cloud-lightning", severity: "severe" };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { label: "Showers", icon: "cloud-rain", severity: "caution" };
  return { label: "Cloudy", icon: "cloud", severity: "calm" };
}

// Strong wind escalates severity even on an otherwise calm-coded day —
// relevant for boats/island-hopping, which this app cares about a lot.
function escalateForWind(severity, windKmh) {
  if (windKmh == null) return severity;
  if (windKmh >= 50) return "severe";
  if (windKmh >= 30 && severity === "calm") return "caution";
  return severity;
}

const WEATHER_ICONS = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
  "cloud-sun":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2"/><path d="M9.5 14.5A4.5 4.5 0 1 1 13.74 8h.76a4 4 0 0 1 0 8h-7a3.5 3.5 0 0 1-.99-1.5z"/></svg>',
  cloud:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.6A4 4 0 0 0 6 19h11.5z"/></svg>',
  "cloud-drizzle":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 15a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.6A4 4 0 0 0 6 15h11.5z"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="16" y1="19" x2="16" y2="21"/></svg>',
  "cloud-rain":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.6A4 4 0 0 0 4.5 13h11.5z"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="16" y1="19" x2="16" y2="21"/></svg>',
  "cloud-lightning":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 13a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.6A4 4 0 0 0 6 13h11.5z"/><polyline points="13 14 11 18 14 18 12 22"/></svg>',
  sunset:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="19.78" y1="10.22" x2="18.36" y2="11.64"/><line x1="1" y1="18" x2="23" y2="18"/><polyline points="8 6 12 2 16 6"/></svg>',
  warning:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
};

async function initHeroWeather() {
  try {
    const cached = getWeatherCache();
    if (cached) {
      renderHeroWeather(cached);
      return;
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${SANVIC_LAT}&longitude=${SANVIC_LNG}&current=temperature_2m,weather_code,wind_speed_10m&daily=sunset&timezone=Asia%2FManila`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather request failed");
    const data = await res.json();

    const temp = data.current && data.current.temperature_2m;
    const code = data.current && data.current.weather_code;
    const wind = data.current && data.current.wind_speed_10m;
    const sunsetIso = data.daily && data.daily.sunset && data.daily.sunset[0];
    if (temp == null || code == null) throw new Error("Unexpected weather response shape");

    const payload = { temp, code, wind, sunsetIso, fetchedAt: Date.now() };
    setWeatherCache(payload);
    renderHeroWeather(payload);
  } catch (err) {
    // Decoration only — fail silently, widget just stays hidden.
    console.warn("[SANVIC] Hero weather unavailable:", err);
  }
}

function getWeatherCache() {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.fetchedAt || Date.now() - parsed.fetchedAt > WEATHER_CACHE_MS) return null;
    return parsed;
  } catch (err) {
    return null;
  }
}

function setWeatherCache(payload) {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    /* ignore quota/private-mode errors */
  }
}

function renderHeroWeather(payload) {
  const widget = document.getElementById("heroWeather");
  if (!widget) return;

  const { label, icon, severity: baseSeverity } = weatherCodeToDisplay(payload.code);
  const severity = escalateForWind(baseSeverity, payload.wind);
  const tempC = Math.round(payload.temp);

  widget.classList.remove("wx-calm", "wx-caution", "wx-severe");
  widget.classList.add(`wx-${severity}`);

  let html = "";
  if (severity !== "calm") {
    const alertText = severity === "severe" ? "Rough conditions" : "Be aware";
    html += `<span class="hw-item hw-alert-label">${WEATHER_ICONS.warning}${alertText}</span><span class="hw-dot"></span>`;
  }

  html += `<span class="hw-item">${WEATHER_ICONS[icon]}${tempC}°C</span>`;
  html += `<span class="hw-dot"></span><span class="hw-item">${escapeHtml(label)}</span>`;

  if (payload.sunsetIso) {
    const sunsetDate = new Date(payload.sunsetIso);
    const timeStr = sunsetDate.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    html += `<span class="hw-dot"></span><span class="hw-item">${WEATHER_ICONS.sunset}Sunset ${timeStr}</span>`;
  }

  widget.innerHTML = html;
  widget.style.display = "inline-flex";
}

function getYoutubeId(url) {
  if (!url) return "";
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  return m ? m[1] : "";
}

// Extracts {lat, lng, name} from a (non-shortened) Google Maps URL.
// Handles the common patterns Google Maps produces:
//   .../@10.538951,119.27753,15z              (viewport center)
//   ...!3d10.538951!4d119.27753...            (exact pin, preferred)
//   .../place/Boayan+Island/data=...!8m2!3d10.5!4d119.2 (place page, has a name)
//   ?q=10.538951,119.27753  or  ?ll=10.5,119.2
// Returns null if it's a shortened maps.app.goo.gl link (those need
// to be opened once so the browser can follow the redirect) or if
// no coordinate pattern is found. `name` is null when the URL has
// no /place/ segment (e.g. a bare @lat,lng viewport link).
function parseGoogleMapsUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)) return null; // shortened — can't resolve client-side

  let lat = null,
    lng = null;

  // Prefer the exact-pin pair (!3d...!4d...) over the viewport-center pair (@lat,lng)
  let m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m) {
    lat = parseFloat(m[1]);
    lng = parseFloat(m[2]);
  }

  if (lat === null) {
    m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
      lat = parseFloat(m[1]);
      lng = parseFloat(m[2]);
    }
  }

  if (lat === null) {
    m = url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
      lat = parseFloat(m[1]);
      lng = parseFloat(m[2]);
    }
  }

  if (lat === null) return null;

  let name = null;
  const nameMatch = url.match(/\/maps\/place\/([^/@]+)/);
  if (nameMatch) {
    name = decodeURIComponent(nameMatch[1].replace(/\+/g, " "));
  }

  return { lat, lng, name };
}

// ───────────── IMAGE CAROUSEL ─────────────
let __carouselImages = [];
let __carouselIndex = 0;

function openCarousel(images, startIndex) {
  if (!images || images.length === 0) return;
  __carouselImages = images;
  __carouselIndex = startIndex || 0;
  renderCarousel();
  document.getElementById("carouselOverlay").classList.add("active");
}

function closeCarousel(e) {
  if (
    e &&
    e.target !== document.getElementById("carouselOverlay") &&
    e.target.className !== "carousel-close"
  )
    return;
  document.getElementById("carouselOverlay").classList.remove("active");
}

function carouselPrev(e) {
  if (e) e.stopPropagation();
  __carouselIndex = (__carouselIndex - 1 + __carouselImages.length) % __carouselImages.length;
  renderCarousel();
}

function carouselNext(e) {
  if (e) e.stopPropagation();
  __carouselIndex = (__carouselIndex + 1) % __carouselImages.length;
  renderCarousel();
}

function renderCarousel() {
  const img = document.getElementById("carouselImg");
  img.src = __carouselImages[__carouselIndex];
  document.getElementById("carouselCounter").textContent =
    __carouselIndex + 1 + " / " + __carouselImages.length;
  const dots = document.getElementById("carouselDots");
  dots.innerHTML = __carouselImages
    .map(
      (_, i) =>
        `<button class="carousel-dot${i === __carouselIndex ? " active" : ""}" onclick="event.stopPropagation();__carouselIndex=${i};renderCarousel()"></button>`,
    )
    .join("");
  // Hide nav if single image
  document
    .querySelectorAll(".carousel-nav")
    .forEach((el) => (el.style.display = __carouselImages.length > 1 ? "" : "none"));
  dots.style.display = __carouselImages.length > 1 ? "" : "none";
}

function buildCarouselImages(d) {
  return destinationImageGallery(d).images;
}

// ── WHAT THE PLACE ACTUALLY OFFERS ────────────────────────────────────────
// Address, how to reach it, opening hours, prices, phones, links and
// facilities. Fetched per place when the sheet opens, so a visitor who never
// opens a listing pays nothing for the feature. One request: all four child
// tables hang off the place itself.
async function renderPlaceExtras(d) {
  const box = document.getElementById("deExtras");
  const callAction = document.getElementById("deCall");
  if (!box) return;
  box.innerHTML = "";
  if (callAction) {
    callAction.style.display = "none";
    callAction.removeAttribute("href");
  }
  if (!d || d.id == null) return;
  let row = null;
  try {
    const { data, error } = await sb
      .from("destinations")
      .select("id,place_details(*),place_contacts(*),place_links(*),place_amenities(*)")
      .eq("id", d.id)
      .maybeSingle();
    if (error) throw error;
    row = data;
  } catch (err) {
    console.warn("[SANVIC] Place details failed to load:", err);
    return;
  }
  // The sheet may have moved on to another place while this was in flight.
  if (!row || !box.isConnected) return;
  if (!currentDest || String(currentDest.id) !== String(d.id)) return;

  const det = Array.isArray(row.place_details) ? row.place_details[0] : row.place_details;
  const statsBox = document.getElementById("deStats");
  if (det && det.hours && statsBox) {
    const emptyHours = statsBox.querySelector(".dest-exp-stat strong")?.textContent === "Hours";
    if (emptyHours) {
      statsBox.innerHTML = `<div class="dest-exp-stat"><strong>Hours</strong><span>${escapeHtml(det.hours)}</span></div>`;
    } else {
      statsBox.insertAdjacentHTML(
        "beforeend",
        `<div class="dest-exp-stat"><strong>Hours</strong><span>${escapeHtml(det.hours)}</span></div>`,
      );
    }
  }
  const contacts = (row.place_contacts || [])
    .slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const phoneContact = contacts.find(
    (c) =>
      ["phone", "mobile"].includes(String(c.kind || "phone").toLowerCase()) &&
      String(c.value || "").trim(),
  );
  if (callAction && phoneContact) {
    const phone = String(phoneContact.value).trim();
    callAction.href = "tel:" + phone.replace(/[^0-9+]/g, "");
    callAction.style.display = "flex";
  }
  const links = (row.place_links || [])
    .slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const amKeys = (row.place_amenities || []).map((a) => a.amenity_key);
  if (amKeys.length) await loadAmenityVocab();

  const safeUrl = (u) => {
    const href = /^https?:/i.test(String(u || "")) ? String(u) : "https://" + String(u || "");
    try {
      return typeof SanvicExplore !== "undefined" && SanvicExplore.safeUrl
        ? SanvicExplore.safeUrl(href, true)
        : href;
    } catch (e) {
      return href;
    }
  };
  const contactIcon = (kind) =>
    kind === "email"
      ? "mail"
      : kind === "whatsapp" || kind === "viber" || kind === "messenger"
        ? "message-circle"
        : "phone";

  const facts = [];
  if (det && det.hours) facts.push(["clock", det.hours]);
  if (det && det.price_from != null)
    facts.push([
      "banknote",
      "From ₱" +
        Number(det.price_from).toLocaleString() +
        (det.price_unit ? " / " + det.price_unit : ""),
    ]);
  else if (det && det.price_range) facts.push(["banknote", det.price_range]);
  if (det && det.entrance_fee) facts.push(["ticket", det.entrance_fee]);
  if (det && det.check_in) facts.push(["key", "Check-in " + det.check_in]);
  if (det && det.check_out) facts.push(["key", "Check-out " + det.check_out]);
  if (det && det.best_time) facts.push(["sunset", det.best_time]);
  if (det && det.payment_methods && det.payment_methods.length)
    facts.push(["banknote", det.payment_methods.join(", ")]);
  if (det && det.languages && det.languages.length) facts.push(["globe", det.languages.join(", ")]);

  const whereLines = [];
  if (det && det.address) whereLines.push(det.address);
  if (det && det.landmark) whereLines.push(det.landmark);
  if (det && det.plus_code) whereLines.push("Plus code " + det.plus_code);
  if (det && det.how_to_get) whereLines.push(det.how_to_get);
  if (det && det.accessibility) whereLines.push(det.accessibility);

  const amenities = amKeys.map((k) => {
    const a = (AMENITY_VOCAB || []).find((x) => x.key === k);
    return { label: a ? a.label : k, icon: a ? a.icon : null };
  });

  const html = `
    ${
      whereLines.length
        ? `<div class="dex-block">
      <div class="dex-title">${lucideSvg("map-pin", 12)} Where and how to reach it</div>
      ${whereLines.map((l) => `<div class="dex-line">${escapeHtml(l)}</div>`).join("")}
    </div>`
        : ""
    }
    ${
      facts.length
        ? `<div class="dex-block">
      <div class="dex-title">Good to know</div>
      <div class="dex-facts">${facts.map(([ic, t]) => `<span class="dex-fact">${lucideSvg(ic, 12)} ${escapeHtml(String(t))}</span>`).join("")}</div>
    </div>`
        : ""
    }
    ${
      contacts.length
        ? `<div class="dex-block">
      <div class="dex-title">Contact</div>
      <div class="dex-links">${contacts
        .map((c) => {
          const v = String(c.value || "").trim();
          if (!v) return "";
          const kind = c.kind || "phone";
          const href =
            kind === "email"
              ? "mailto:" + v
              : kind === "whatsapp"
                ? "https://wa.me/" + v.replace(/[^0-9]/g, "")
                : kind === "viber" || kind === "messenger"
                  ? safeUrl(v)
                  : "tel:" + v.replace(/[^0-9+]/g, "");
          return `<a class="dex-link" href="${escapeHtml(href)}"${kind === "email" || kind === "phone" || kind === "mobile" ? "" : ' target="_blank" rel="noopener noreferrer"'}>${lucideSvg(contactIcon(kind), 12)} ${escapeHtml((c.label ? c.label + ": " : "") + v)}</a>`;
        })
        .join("")}</div>
    </div>`
        : ""
    }
    ${
      links.length
        ? `<div class="dex-block">
      <div class="dex-title">Find them online</div>
      <div class="dex-links">${links
        .map((l) => {
          const url = safeUrl(l.url);
          if (!url) return "";
          const label = (LINK_KINDS.find((x) => x[0] === l.kind) || [])[1] || l.label || "Link";
          return `<a class="dex-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${lucideSvg("external-link", 12)} ${escapeHtml(label)}</a>`;
        })
        .join("")}</div>
    </div>`
        : ""
    }
    ${
      amenities.length
        ? `<div class="dex-block">
      <div class="dex-title">What it has</div>
      <div class="dex-amen">${amenities.map((a) => `<span>${a.icon ? lucideSvg(a.icon, 12) : ""} ${escapeHtml(a.label)}</span>`).join("")}</div>
    </div>`
        : ""
    }
    ${
      det && det.policies
        ? `<div class="dex-block">
      <div class="dex-title">Rules and policy</div>
      <div class="dex-line">${escapeHtml(det.policies)}</div>
    </div>`
        : ""
    }
    ${det && (det.verified_at || det.source) ? `<div class="dex-src">${det.verified_at ? "Details confirmed " + escapeHtml(String(det.verified_at).slice(0, 10)) : "Details not yet confirmed"}${det.source ? " · " + escapeHtml(det.source) : ""}</div>` : ""}`;

  box.innerHTML = html;
}

function renderPlaceCommunity(d) {
  const box = document.getElementById("deCommunity");
  if (!box) return;
  const terms = [d?.name, d?.barangay]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase().trim())
    .filter((x) => x && x !== "san vicente");
  const relatedTribes = (typeof PULSE_TRIBES !== "undefined" ? PULSE_TRIBES : [])
    .filter((t) =>
      terms.some(
        (term) =>
          String(t.where || "")
            .toLowerCase()
            .includes(term) ||
          String(t.title || "")
            .toLowerCase()
            .includes(term) ||
          String(t.sub || "")
            .toLowerCase()
            .includes(term),
      ),
    )
    .slice(0, 3);
  const relatedEvents = (typeof PULSE_EVENTS !== "undefined" ? PULSE_EVENTS : [])
    .filter((e) =>
      terms.some(
        (term) =>
          String(e.where || "")
            .toLowerCase()
            .includes(term) ||
          String(e.title || "")
            .toLowerCase()
            .includes(term),
      ),
    )
    .slice(0, 2);
  const rows = [
    ...relatedTribes.map((t) => ({
      kind: "Tribe",
      title: t.title,
      meta: [t.when, t.joined ? `${t.joined} joining` : ""].filter(Boolean).join(" · "),
      onclick: `openTribeDetail('${escT(t.id)}')`,
    })),
    ...relatedEvents.map((e) => ({
      kind: "Event",
      title: e.title,
      meta: e.when || "",
      onclick: `openEventDetail('${escT(e.id)}')`,
    })),
  ];
  if (!rows.length) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }
  box.hidden = false;
  // Two lines per row, not one run-on: the title on top, the kind and the time
  // underneath. They used to be adjacent inline elements, so it read
  // "Sunset ChasersTribe" with no space between them.
  box.innerHTML = `<div class="dest-community-title">People &amp; tribe chats around ${escT(d.barangay || d.name)}</div>${rows.map((r) => `<button class="dest-community-card" type="button" onclick="${r.onclick}"><span class="dcc-body"><strong class="dcc-t">${escT(r.title)}</strong><small class="dcc-m">${escT(r.kind)}${r.meta ? " · " + escT(r.meta) : ""}</small></span>${lucideSvg("chevron-right", 16)}</button>`).join("")}`;
}

let routeLine = null;
let routeController = null;
let routeWasDestExpanded = false;
function closeRoutePreview() {
  if (routeController) {
    routeController.abort();
    routeController = null;
  }
  const panel = document.getElementById("routePreview");
  if (panel) panel.hidden = true;
  if (routeLine && map && map.hasLayer(routeLine)) map.removeLayer(routeLine);
  routeLine = null;
  const sheet = document.getElementById("destSheet");
  if (routeWasDestExpanded && sheet && currentDest) {
    sheet.className = "dest-sheet expanded";
    sheet.style.maxHeight = exploreIsSide() ? "" : "58dvh";
  }
  routeWasDestExpanded = false;
  if (typeof renderNearestBar === "function") renderNearestBar();
  if (typeof syncMapViewport === "function") syncMapViewport();
}
async function previewRouteToCurrentPlace() {
  const d = currentDest;
  const panel = document.getElementById("routePreview");
  const summary = document.getElementById("routeSummary");
  const note = document.getElementById("routeNote");
  const google = document.getElementById("routeGoogle");
  const waze = document.getElementById("routeWaze");
  if (!d || !SanvicExplore.hasCoordinates(d) || !panel || !summary || !note) return;
  if (!userLocationMarker) {
    toast("Tap Near me first to preview a route from your location.");
    return;
  }
  const start = userLocationMarker.getLatLng();
  const destLat = Number(d.lat);
  const destLng = Number(d.lng);
  const googleUrl = `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lng}&destination=${destLat},${destLng}&travelmode=driving`;
  const wazeUrl = `https://waze.com/ul?ll=${destLat}%2C${destLng}&navigate=yes`;
  google.href = googleUrl;
  waze.href = wazeUrl;
  summary.textContent = "Checking the road route…";
  note.textContent = "Road estimate only. Islands and ferry connections may not be covered.";
  panel.hidden = false;
  document.getElementById("nearestBar").hidden = true;
  const sheet = document.getElementById("destSheet");
  routeWasDestExpanded = !!sheet && sheet.classList.contains("expanded");
  if (routeWasDestExpanded && !exploreIsSide()) {
    sheet.className = "dest-sheet closed";
    sheet.style.maxHeight = "";
  }
  if (routeLine && map && map.hasLayer(routeLine)) map.removeLayer(routeLine);
  routeLine = null;
  if (!map || typeof L === "undefined") {
    summary.textContent = "Map is unavailable. Continue in your navigation app.";
    return;
  }
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${destLng},${destLat}?overview=full&geometries=geojson&steps=false`;
  const controller = new AbortController();
  routeController = controller;
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("Routing service unavailable");
    const data = await response.json();
    const route = data && data.routes && data.routes[0];
    const coordinates = route && route.geometry && route.geometry.coordinates;
    if (!route || !Array.isArray(coordinates) || coordinates.length < 2) {
      throw new Error("No road route found");
    }
    routeLine = L.polyline(
      coordinates.map(([lng, lat]) => [lat, lng]),
      {
        color: "#25c7b5",
        weight: 5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      },
    ).addTo(map);
    map.fitBounds(routeLine.getBounds(), {
      padding: [48, 48],
      maxZoom: 15,
      animate: !reducedMotion(),
    });
    const km = Number(route.distance) / 1000;
    const minutes = Math.max(1, Math.round(Number(route.duration) / 60));
    summary.textContent = `${km.toFixed(1)} km · about ${minutes} min driving`;
    note.textContent =
      "Road estimate only; this route may omit islands or ferry transfers. Confirm locally before setting out.";
  } catch (err) {
    summary.textContent = "No road route available for this trip.";
    note.textContent =
      "This is common for islands and ferry routes. You can still hand off the destination to your navigation app.";
  } finally {
    window.clearTimeout(timeout);
    if (routeController === controller) routeController = null;
  }
}

async function shareCurrentPlace() {
  if (!currentDest) return;
  const payload = {
    title: currentDest.name || "San Vicente place",
    text: [
      currentDest.name,
      currentDest.barangay ? "Barangay " + currentDest.barangay : "San Vicente, Palawan",
    ].join(" · "),
    url: new URL("#place/" + encodeURIComponent(String(currentDest.id)), window.location.href).href,
  };
  try {
    if (navigator.share) await navigator.share(payload);
    else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(payload.text + " — " + payload.url);
      toast("Place details copied to clipboard.");
    } else {
      toast("Sharing is not available in this browser.");
    }
  } catch (err) {
    if (err && err.name !== "AbortError") toast("Could not share this place.");
  }
}

function openDest(d, recordHistory = true) {
  if (!d) return;
  closeRoutePreview();
  const fromExplore = document.body.classList.contains("explore-open");
  if (!fromExplore) {
    closeAllPanels();
    Object.assign(exploreState, { query: "", category: "all", area: "", nearby: false });
    const search = document.getElementById("esSearchInput");
    if (search) search.value = "";
    openExploreSheet();
    setActiveDock("discover");
    activeMarkerSet = allMarkers;
    renderExploreContent();
  }
  if (!exploreReturnView) {
    exploreReturnView = {
      center: map?.getCenter(),
      zoom: map?.getZoom(),
      snap: exploreState.snap,
      scroll: document.getElementById("exploreContent").scrollTop,
    };
  }
  currentDest = d;
  mysvTrackRecent(d);
  highlightExplorePlace(d.id);
  renderPlaceExtras(d); // address, contacts, links, facilities — fetched per place
  if (recordHistory) {
    syncSanvicUrl("discover", !history.state?.place, d.id);
  }
  const category = catStyle[d.category] || {
    label: d.category || "Place",
    color: "#0d9488",
    bg: "rgba(13,148,136,.15)",
  };
  const stats = d.stats || {};
  const photo = document.getElementById("dePhoto");
  const media = document.getElementById("deMedia");
  let gallery = destinationImageGallery(d);
  const images = buildCarouselImages(d)
    .map((u) => SanvicExplore.safeUrl(u, true))
    .filter(Boolean);
  photo.classList.remove("has-carousel");
  photo.onclick = null;
  photo.removeAttribute("tabindex");
  photo.removeAttribute("role");
  photo.removeAttribute("aria-label");
  photo.onkeydown = null;
  media.replaceChildren();
  const placeholder = document.createElement("div");
  placeholder.className = "detail-image-placeholder";
  placeholder.innerHTML = lucideSvg(category.icon || "map-pin", 36) + "<span>No photo yet</span>";
  media.appendChild(placeholder);
  // Attribution is a licence condition for the CC BY / CC BY-SA photos in the
  // directory, so it is tied to the photo actually being shown: it appears with
  // the hero image and stays hidden when a video or the placeholder is used.
  const creditEl = document.getElementById("deCredit");
  creditEl.hidden = true;
  creditEl.textContent = "";
  const video = SanvicExplore.safeUrl(d.videoUrl);
  // The photo is the fallback whenever the video slot is empty OR fails to
  // load. A dead real photo advances through the remaining gallery, then falls
  // back to the local category samples without changing the saved record.
  const updatePhotoCredit = () => {
    if (gallery.illustrative) {
      creditEl.textContent = "Illustrative sample photos · replace with verified place photos";
      creditEl.hidden = false;
    } else if (d.imageCredit) {
      creditEl.textContent = d.imageCredit;
      creditEl.hidden = false;
    }
  };
  const activatePhotoCarousel = () => {
    if (images.length <= 1) {
      photo.classList.remove("has-carousel");
      photo.onclick = null;
      photo.removeAttribute("tabindex");
      photo.removeAttribute("role");
      photo.removeAttribute("aria-label");
      photo.onkeydown = null;
      return;
    }
    photo.classList.add("has-carousel");
    photo.setAttribute("role", "button");
    photo.tabIndex = 0;
    photo.setAttribute("aria-label", "View " + images.length + " photos of " + d.name);
    photo.onclick = () => openCarousel(images, 0);
    photo.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openCarousel(images, 0);
      }
    };
  };
  const showHeroImage = () => {
    if (!images[0] || media.querySelector("img")) return;
    const img = document.createElement("img");
    img.src = images[0];
    img.alt = d.name;
    img.onerror = () => {
      if (images.length > 1) {
        images.shift();
        img.src = images[0];
        activatePhotoCarousel();
        return;
      }
      if (!gallery.illustrative) {
        gallery = destinationImageGallery({ category: d.category, name: d.name });
        images.splice(0, images.length, ...gallery.images);
        if (images[0]) {
          img.src = images[0];
          updatePhotoCredit();
          activatePhotoCarousel();
          return;
        }
      }
      img.hidden = true;
      photo.classList.remove("has-carousel");
    };
    media.appendChild(img);
    updatePhotoCredit();
    activatePhotoCarousel();
  };
  if (video && d.videoType === "youtube" && getYoutubeId(video)) {
    const frame = document.createElement("iframe");
    frame.src =
      "https://www.youtube.com/embed/" +
      encodeURIComponent(getYoutubeId(video)) +
      "?playsinline=1&rel=0";
    frame.title = d.name + " video";
    frame.allow = "encrypted-media; picture-in-picture";
    frame.allowFullscreen = true;
    media.appendChild(frame);
  } else if (video && d.videoType === "upload") {
    const el = document.createElement("video");
    el.src = video;
    el.controls = true;
    el.playsInline = true;
    el.preload = "metadata";
    if (images[0]) el.poster = images[0];
    el.onerror = () => {
      el.remove();
      showHeroImage();
    };
    media.appendChild(el);
  } else {
    showHeroImage();
  }
  document.getElementById("deTitle").textContent = d.name;
  renderPlaceCommunity(d);
  document.getElementById("dcName").textContent = d.name;
  document.getElementById("deBarangay").textContent = d.barangay
    ? "Barangay " + d.barangay
    : "San Vicente, Palawan";
  const cat = document.getElementById("deCat");
  cat.textContent = category.label;
  cat.style.background = category.bg;
  cat.style.color = category.color;
  const statRows = [
    stats.travel ? ["Access", stats.travel] : null,
    stats.season ? ["Season", stats.season] : null,
    stats.rating ? ["Listed rating", stats.rating + " · source not supplied"] : null,
  ].filter(Boolean);
  if (userLocationMarker && SanvicExplore.hasCoordinates(d)) {
    const distance = SanvicExplore.distanceKm(userLocationMarker.getLatLng(), d);
    statRows.push(["From you", distance.toFixed(1) + " km straight-line"]);
  }
  document.getElementById("deStats").innerHTML = statRows.length
    ? statRows
        .map(
          ([label, value]) =>
            `<div class="dest-exp-stat"><strong>${escT(label)}</strong><span>${escT(value)}</span></div>`,
        )
        .join("")
    : `<div class="dest-exp-stat"><strong>Hours</strong><span>Not listed — call the branch</span></div>`;
  const desc = document.getElementById("deDesc");
  desc.textContent = d.description || "More details will be added by the local team.";
  desc.classList.add("collapsed");
  const readMore = document.getElementById("deReadMore");
  readMore.textContent = "Read more";
  readMore.style.display = "";
  requestAnimationFrame(() => {
    if (!desc.isConnected) return;
    readMore.style.display = desc.scrollHeight > desc.clientHeight + 2 ? "" : "none";
  });
  const tip = document.getElementById("deTip");
  tip.textContent = d.tip || "";
  tip.hidden = !d.tip;
  const directions = document.getElementById("deDirections");
  directions.disabled = !SanvicExplore.hasCoordinates(d);
  directions.onclick = previewRouteToCurrentPlace;
  const gbp = document.getElementById("deGbp"),
    url = SanvicExplore.safeUrl(d.googleBusinessUrl);
  gbp.style.display = url ? "" : "none";
  gbp.onclick = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  const save = document.getElementById("deSaveBtn");
  save.setAttribute("aria-label", "Save " + d.name);
  save.disabled = destinationsSource !== "supabase";
  save.title = save.disabled ? "Sample places cannot be saved" : "Save this place";
  refreshDestSaveButton(d.id);
  // "Ask tala" used to sit on this button. It is "Leave a tip" now, so the
  // panel is reset for each place rather than carrying the last one over.
  const tipsBox = document.getElementById("deTipsBox");
  if (tipsBox) {
    tipsBox.hidden = true;
    tipsBox.innerHTML = "";
  }
  closeTalaSheet(false);
  const sheet = document.getElementById("destSheet");
  sheet.className = "dest-sheet expanded";
  sheet.removeAttribute("inert");
  // Keep a generous map window visible above the detail sheet on phones, while
  // preserving the compact-sheet control for anyone who wants more map context.
  sheet.style.maxHeight = exploreIsSide() ? "" : "58dvh";
  sheet.setAttribute("role", "region");
  sheet.setAttribute("aria-labelledby", "deTitle");
  sheet.style.transform = "";
  document.getElementById("destOverlay").classList.remove("active");
  document.body.classList.add("place-open");
  document.getElementById("exploreSheet").setAttribute("inert", "");
  document.getElementById("heroOverlay").classList.add("hidden");
  document.getElementById("heroFade").classList.add("hidden");
  document.querySelector(".dest-expanded").scrollTop = 0;
  syncMapViewport();
  centerMapOnPlace(d);
  document.getElementById("detailBack").focus({ preventScroll: true });
}

// Put the place in the slice of map the sheet is not covering. panBy moves the
// content the other way, so a positive y lifts the pin up the screen.
function centerMapOnPlace(d) {
  if (!map || !d || typeof SanvicExplore === "undefined" || !SanvicExplore.hasCoordinates(d))
    return;
  try {
    map.setView([d.lat, d.lng], Math.max(15, map.getZoom()), { animate: false });
    highlightExplorePlace(d.id);
    if (!exploreIsSide())
      map.panBy([0, Math.min(window.innerHeight * 0.3, 260)], { animate: false });
  } catch (e) {}
}

// "See this place on the map": lower the sheet to its peek and put the pin in
// the part of the map that is left. The button used to open a separate panel
// about the neighbourhood, which is not what someone reading a listing wants.
function showCurrentPlaceOnMap() {
  const d = currentDest;
  if (!d) return;
  if (typeof SanvicExplore === "undefined" || !SanvicExplore.hasCoordinates(d)) {
    toast("This place has no map location yet.");
    return;
  }
  const sheet = document.getElementById("destSheet");
  if (sheet && !exploreIsSide()) {
    sheet.className = "dest-sheet closed";
    sheet.style.maxHeight = "";
  }
  centerMapOnPlace(d);
  syncMapViewport();
  if (typeof map !== "undefined" && map) map.invalidateSize({ animate: false, pan: false });
  toast("Here it is on the map.");
}

// The handle lowers the sheet to the compact bar and shows the map, which is the
// only way to see where the place actually is. It used to only scroll the panel,
// so the window could not be lowered at all. On a tablet or desktop the sheet is
// a side panel beside the map, so there is nothing to lower.
function toggleDestSheet() {
  const sheet = document.getElementById("destSheet");
  if (!sheet || !currentDest) return;
  const body = document.querySelector(".dest-expanded");
  if (exploreIsSide()) {
    if (body) body.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
    return;
  }
  if (sheet.classList.contains("closed")) {
    sheet.className = "dest-sheet expanded";
    sheet.style.maxHeight = "58dvh";
    if (body) body.scrollTop = 0;
  } else {
    sheet.className = "dest-sheet closed";
    sheet.style.maxHeight = "";
  }
  centerMapOnPlace(currentDest);
  syncMapViewport();
}

// Drag the handle down to lower it, the way a sheet is expected to behave.
(function bindDestHandleDrag() {
  let startY = 0,
    dragging = false,
    sheet = null,
    handler = null;
  const onStart = (e) => {
    sheet = document.getElementById("destSheet");
    if (!sheet || !currentDest || exploreIsSide()) return;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    dragging = true;
    sheet.style.transition = "none";
  };
  const onMove = (e) => {
    if (!dragging || !sheet) return;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - startY;
    if (y > 0) sheet.style.transform = "translateY(" + Math.min(y, 220) + "px)";
  };
  const onEnd = (e) => {
    if (!dragging || !sheet) {
      dragging = false;
      return;
    }
    dragging = false;
    const y = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) - startY;
    sheet.style.transition = "";
    if (y > 70 && !sheet.classList.contains("closed")) {
      sheet.style.transform = "";
      sheet.className = "dest-sheet closed";
      sheet.style.maxHeight = "";
      centerMapOnPlace(currentDest);
      syncMapViewport();
    } else {
      sheet.style.transform = "";
    }
  };
  const attach = () => {
    handler = document.querySelector(".dest-handle");
    if (!handler || handler.dataset.dragBound) return;
    handler.dataset.dragBound = "1";
    handler.addEventListener("touchstart", onStart, { passive: true });
    handler.addEventListener("touchmove", onMove, { passive: true });
    handler.addEventListener("touchend", onEnd);
    handler.addEventListener("mousedown", onStart);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
  else attach();
})();
function closeDestSheet(restore = true) {
  const routePreview = document.getElementById("routePreview");
  if (routePreview && !routePreview.hidden) closeRoutePreview();
  const sheet = document.getElementById("destSheet");
  const wasOpen = !!currentDest;
  sheet.style.transform = "";
  sheet.style.maxHeight = "";
  sheet.className = "dest-sheet";
  sheet.setAttribute("inert", "");
  document.getElementById("deMedia").replaceChildren(); // stop video/audio
  document.getElementById("destOverlay").classList.remove("active");
  document.body.classList.remove("place-open");
  if (document.getElementById("exploreSheet").classList.contains("open"))
    document.getElementById("exploreSheet").removeAttribute("inert");
  closeAroundMePanel();
  currentDest = null;
  if (!talaOpen) document.getElementById("talaOrbWrap").classList.remove("hidden");
  if (restore && wasOpen && exploreReturnView) {
    const previous = exploreReturnView;
    setExploreSnap(previous.snap);
    document.getElementById("exploreContent").scrollTop = previous.scroll;
    syncMapViewport();
    if (map && previous.center) map.setView(previous.center, previous.zoom, { animate: false });
    const selected = Array.from(document.querySelectorAll(".explore-result")).find(
      (el) => el.dataset.placeId === String(exploreState.selected),
    );
    (selected || document.getElementById("esSearchInput")).focus({ preventScroll: true });
  }
  exploreReturnView = null;
  if (!handlingExploreHistory && history.state?.place) syncSanvicUrl("discover", false);
  schedulePanelOpen();
}

// ─── DISCOVER + NAVIGATION ───
function focusSanVicente() {
  closeAllPanels();
  closeDiscoverPanel();
  if (map) {
    activeMarkerSet = allMarkers;
    map.flyTo([10.5, 119.22], 11, { duration: 1 });
    applyPinVisibility();
  }
  document.querySelectorAll(".dock-item").forEach((d) => d.classList.remove("active"));
  const mapBtn = document.querySelector('.dock-item[data-tab="map"]');
  if (mapBtn) mapBtn.classList.add("active");
}

function renderDiscoverList(cat = "all") {
  const list = document.getElementById("discoverList");
  if (!list) return;
  let items;
  if (cat === "all") {
    items = destinations.filter((d) => d.featured);
    if (!items.length) items = destinations; // fallback so Discover is never empty before anything is marked featured
  } else {
    items = destinations.filter((d) => d.category === cat);
  }
  if (!items.length) {
    list.innerHTML = `<div style="padding:20px;color:var(--white-dim);font-size:.78rem;">No spots yet.</div>`;
    return;
  }
  list.innerHTML = items
    .map((d) => {
      const gallery = destinationImageGallery(d);
      const cover = gallery.images[0] || "";
      return `
    <button class="discover-card" onclick="openDestinationById(${d.id})">
      <img src="${escT(cover)}" alt="${escT(d.name)}" onerror="destinationImageLoadFallback(this,'${escT(d.id)}')">
      <div class="discover-card-body">
        <div class="discover-card-name">${escT(d.name)}</div>
        <div class="discover-card-meta"><span>${escT(catStyle[d.category]?.label || d.category)}</span><span>•</span><span>${escT(d.stats?.travel || "")}</span>${gallery.illustrative ? '<span class="sample-demo-label">Illustrative photo</span>' : ""}</div>
      </div>
    </button>`;
    })
    .join("");
}

// Built from the live taxonomy, so this row can never drift out of step with
// Explore again. It used to be hardcoded markup and still offered Culture long
// after Culture was retired, while missing Adventure entirely.
function renderDiscoverCats(active) {
  const box = document.getElementById("discoverCats");
  if (!box) return;
  const cat = active || "all";
  const keys = Object.keys(catStyle).filter((k) => destinations.some((d) => d.category === k));
  box.innerHTML =
    `<button class="discover-cat${cat === "all" ? " active" : ""}" data-cat="all" onclick="selectDiscoverCategory('all')">All</button>` +
    keys
      .map(
        (k) =>
          `<button class="discover-cat${cat === k ? " active" : ""}" data-cat="${escT(k)}" onclick="selectDiscoverCategory(this.dataset.cat)">${escT(catStyle[k].label)}</button>`,
      )
      .join("");
}

function openDiscoverPanel() {
  closeDestSheet(false);
  closeTalaSheet(false);
  const cat = document.querySelector(".discover-cat.active")?.dataset.cat || "all";
  renderDiscoverCats(cat);
  document.getElementById("discoverPanel").classList.add("open");
  document.getElementById("heroOverlay").classList.add("hidden");
  document.getElementById("heroFade").classList.add("hidden");
  renderDiscoverList(cat);
}

function closeDiscoverPanel() {
  const panel = document.getElementById("discoverPanel");
  if (panel) panel.classList.remove("open");
}

function selectDiscoverCategory(cat) {
  document
    .querySelectorAll(".discover-cat")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  filterCategory(cat);
  renderDiscoverList(cat);
}

function openDestinationById(id) {
  const d = destinations.find((item) => item.id === id);
  if (d) openDest(d);
}

function toggleReadMore() {
  const el = document.getElementById("deDesc");
  const btn = document.getElementById("deReadMore");
  if (el.classList.contains("collapsed")) {
    el.classList.remove("collapsed");
    btn.textContent = "Show less";
  } else {
    el.classList.add("collapsed");
    btn.textContent = "Read more";
  }
}

// ─── TALA ───
let talaOpen = false;
let voiceOn = true;
let isListening = false;
let recognition = null;
let synth = window.speechSynthesis;
let voices = [];

// ─── UNIFIED VOICE STATE (defined first, used by everything) ───
function setListeningUI(on) {
  const orb = document.getElementById("talaOrb");
  const micBtn = document.getElementById("talaMicBtn");
  const status = document.getElementById("tshStatus");
  if (on) {
    orb.classList.add("listening");
    micBtn.classList.add("listening");
    status.textContent = "Listening...";
  } else {
    orb.classList.remove("listening");
    micBtn.classList.remove("listening");
    if (talaOpen) status.textContent = "Your Palawan concierge";
  }
}
function stopVoice() {
  if (recognition && isListening) recognition.stop();
  isListening = false;
  setListeningUI(false);
}
function startVoice() {
  if (!recognition) return;
  if (!talaOpen) openTalaSheet();
  isListening = true;
  setListeningUI(true);
  recognition.start();
}

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognition.onresult = (e) => {
    let t = "";
    for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
    document.getElementById("talaInput").value = t;
    if (e.results[e.results.length - 1].isFinal) processTala(t);
  };
  recognition.onend = () => {
    isListening = false;
    setListeningUI(false);
  };
  recognition.onerror = (e) => {
    isListening = false;
    setListeningUI(false);
    if (e.error === "not-allowed")
      addMsg("bot", "Microphone access needed. Please allow permissions or type instead.");
  };
}

function loadVoices() {
  voices = synth.getVoices();
}
loadVoices();
if (synth.onvoiceschanged) synth.onvoiceschanged = loadVoices;

function openTalaSheet() {
  // TALA is off until the 2.0 build (see the kill switch in index.html). Guarded
  // so no stray caller can bring the sheet back or lock the page behind it.
  if (!document.getElementById("talaSheet")) return;
  talaOpen = true;
  document.getElementById("talaSheet").classList.add("open");
  document.getElementById("talaOverlay").classList.add("active");
  document.getElementById("talaOrbWrap").classList.add("hidden");
  closeDestSheet(false);
  renderTalaSuggestions();
}

const TALA_VIBE_CHIPS = [
  { text: "Something quiet" },
  { text: "Food after swimming" },
  { text: "People to join" },
  { text: "Sunset plan" },
  { text: "Hidden place nearby" },
  { text: "What’s happening tonight?" },
];
function renderTalaSuggestions() {
  const container = document.getElementById("talaSugs");
  if (!container) return;
  const list = talaSuggestions && talaSuggestions.length ? talaSuggestions : TALA_VIBE_CHIPS;
  const active = list.filter((s) =>
    typeof isSuggestionActiveToday === "function" ? isSuggestionActiveToday(s) : true,
  );
  const shown = active.length ? active : list;
  container.innerHTML = shown
    .map((s) => `<button class="tala-sug" onclick="askTala(this)">${escapeHtml(s.text)}</button>`)
    .join("");
}

function closeTalaSheet(anim) {
  talaOpen = false;
  document.getElementById("talaSheet").classList.remove("open");
  document.getElementById("talaOverlay").classList.remove("active");
  if (!currentDest) document.getElementById("talaOrbWrap").classList.remove("hidden");
}

// Orb: tap opens sheet, long-press starts listening
let orbTimer = null,
  orbLong = false;
function orbTouchStart() {
  orbLong = false;
  orbTimer = setTimeout(() => {
    orbLong = true;
    startVoice();
  }, 500);
}
function orbTouchEnd() {
  clearTimeout(orbTimer);
  if (!orbLong) openTalaSheet();
}
function orbMouseDown() {
  orbLong = false;
  orbTimer = setTimeout(() => {
    orbLong = true;
    startVoice();
  }, 500);
}
function orbMouseUp() {
  clearTimeout(orbTimer);
  if (!orbLong) openTalaSheet();
}

function toggleMic() {
  if (!recognition) {
    addMsg("bot", "Voice not supported. Type your question.");
    return;
  }
  if (isListening) {
    stopVoice();
  } else {
    startVoice();
  }
}

function sendTala() {
  const inp = document.getElementById("talaInput");
  const t = inp.value.trim();
  if (!t) return;
  processTala(t);
  inp.value = "";
}

function processTala(t) {
  addMsg("user", t);
  answerTala(t);
}

function askTala(btn) {
  processTala(btn.textContent);
}

function addMsg(type, text) {
  const chat = document.getElementById("talaChat");
  const d = document.createElement("div");
  d.className = `tala-msg ${type}`;
  d.innerHTML = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

function speak(text) {
  if (!synth || !voiceOn) return;
  synth.cancel();
  if (!voices.length) voices = synth.getVoices();
  const c = text
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!c) return;
  const u = new SpeechSynthesisUtterance(c);
  u.rate = 1;
  u.pitch = 1;
  u.volume = 0.85;
  const v =
    voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ||
    voices.find((v) => v.lang.startsWith("en-US")) ||
    voices.find((v) => v.lang.startsWith("en"));
  if (v) u.voice = v;
  u.onstart = () => {
    document.getElementById("tshAvatar").classList.add("speaking");
    document.getElementById("tshStatus").textContent = "tala is speaking...";
  };
  u.onend = () => {
    document.getElementById("tshAvatar").classList.remove("speaking");
    document.getElementById("tshStatus").textContent = "Your Palawan concierge";
  };
  synth.speak(u);
}

function toggleMute() {
  voiceOn = !voiceOn;
  const b = document.getElementById("tshMute");
  b.classList.toggle("muted", !voiceOn);
  if (voiceOn) {
    b.title = "Mute voice";
    document.getElementById("tshStatus").textContent = "Your Palawan concierge";
  } else {
    b.title = "Unmute voice";
    document.getElementById("tshStatus").textContent = "Voice muted";
    synth.cancel();
    document.getElementById("tshAvatar").classList.remove("speaking");
  }
}

// ─── SEARCH ───
const placeholders = [
  "Search beaches, stays, restaurants...",
  "Best time to visit San Vicente?",
  "How to get to San Vicente?",
  "Hidden gems locals love...",
  "Budget travel tips...",
  "Best surf spots in Alimanguan...",
  "What to eat in San Vicente...",
];
let phIdx = 0,
  phChar = 0,
  phDir = 1;
const heroInput = document.getElementById("heroInput");

function animPlaceholder() {
  const cur = placeholders[phIdx];
  if (phDir === 1) {
    heroInput.setAttribute("placeholder", cur.substring(0, phChar + 1));
    phChar++;
    if (phChar === cur.length) {
      setTimeout(() => {
        phDir = -1;
        animPlaceholder();
      }, 2200);
      return;
    }
  } else {
    heroInput.setAttribute("placeholder", cur.substring(0, phChar - 1));
    phChar--;
    if (phChar === 0) {
      phDir = 1;
      phIdx = (phIdx + 1) % placeholders.length;
    }
  }
  setTimeout(animPlaceholder, phDir === 1 ? 55 : 28);
}

function heroAsk() {
  const t = heroInput.value.trim();
  if (!t) return;
  closeDestSheet(false);
  openTalaSheet();
  addMsg("user", t);
  answerTala(t);
}

function heroMic() {
  if (isListening) {
    stopVoice();
    return;
  }
  if (!recognition) {
    openTalaSheet();
    addMsg("bot", "Voice requires Chrome, Edge, or Safari. Type instead.");
    return;
  }
  // Show orb listening immediately for visual feedback
  setListeningUI(true);
  // Open tala sheet if not already open, then start recognition
  if (!talaOpen) openTalaSheet();
  setTimeout(() => {
    if (recognition && !isListening) {
      recognition.start();
      isListening = true;
      setListeningUI(true);
      document.getElementById("tshStatus").textContent = "Listening...";
    }
  }, 200);
}

// ─── BOTTOM NAV ───
const DOCK_SEEN_KEY = "sanvic_dock_seen";
function dismissDockIntro() {
  document.getElementById("bottomDock")?.classList.remove("intro-pulse");
  document.getElementById("dockCoachmark")?.classList.remove("show");
  localStorage.setItem(DOCK_SEEN_KEY, "1");
}
let handlingExploreHistory = false;
let preserveMapViewOnDock = false;
function sanvicHashFor(tab, place = null) {
  if (place != null) return "#place/" + encodeURIComponent(String(place));
  if (tab === "discover") {
    return exploreState.category && exploreState.category !== "all"
      ? "#explore?cat=" + encodeURIComponent(exploreState.category)
      : "#explore";
  }
  if (tab === "map") {
    const center = map && map.getCenter ? map.getCenter() : { lat: 10.5, lng: 119.22 };
    const zoom = map && map.getZoom ? map.getZoom() : 11;
    return `#map/zoom=${Number(zoom).toFixed(0)}/lat=${Number(center.lat).toFixed(5)}/lng=${Number(center.lng).toFixed(5)}`;
  }
  return "#" + encodeURIComponent(tab || "map");
}
function syncSanvicUrl(tab, push = false, place = null) {
  const state = { sanvic: true, tab: tab || "map" };
  if (place != null) state.place = String(place);
  const url = window.location.pathname + window.location.search + sanvicHashFor(tab, place);
  if (push) history.pushState(state, "", url);
  else history.replaceState(state, "", url);
}
let initialSanvicDeepLinkApplied = false;
function applyInitialSanvicDeepLink() {
  if (initialSanvicDeepLinkApplied || !map || !window.location.hash) return;
  initialSanvicDeepLinkApplied = handleSanvicDeepLink(window.location.hash);
}
function handleSanvicDeepLink(hash = window.location.hash) {
  if (!map || !hash) return false;
  const placeMatch = hash.match(/^#place\/([^/?#]+)/i);
  if (placeMatch) {
    let id;
    try {
      id = decodeURIComponent(placeMatch[1]);
    } catch (e) {
      return false;
    }
    const d = destinations.find((x) => String(x.id) === id);
    if (!d) return false;
    dockNav("discover");
    openDest(d, false);
    syncSanvicUrl("discover", false, id);
    return true;
  }
  const exploreMatch = hash.match(/^#explore(?:\?cat=([^&]+))?/i);
  if (exploreMatch) {
    dockNav("discover");
    let requested = "all";
    try {
      requested = exploreMatch[1] ? decodeURIComponent(exploreMatch[1]) : "all";
    } catch (e) {
      return false;
    }
    const variants = new Set([requested.toLowerCase()]);
    if (requested.toLowerCase().endsWith("es")) variants.add(requested.toLowerCase().slice(0, -2));
    if (requested.toLowerCase().endsWith("s")) variants.add(requested.toLowerCase().slice(0, -1));
    const category = Object.keys(catStyle).find((key) => {
      const keyName = key.toLowerCase();
      const label = String(catStyle[key].label || "").toLowerCase();
      return (
        variants.has(keyName) ||
        variants.has(label) ||
        keyName === requested.toLowerCase() ||
        label === requested.toLowerCase()
      );
    });
    selectExploreCategory(category || "all");
    syncSanvicUrl("discover");
    return true;
  }
  const mapMatch = hash.match(/^#map\/zoom=([\d.]+)\/lat=(-?[\d.]+)\/lng=(-?[\d.]+)$/i);
  if (mapMatch) {
    const zoom = Number(mapMatch[1]);
    const lat = Number(mapMatch[2]);
    const lng = Number(mapMatch[3]);
    if (
      !Number.isFinite(zoom) ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      zoom < 8 ||
      zoom > 18 ||
      lat < 6.5 ||
      lat > 12.9 ||
      lng < 116.6 ||
      lng > 121
    )
      return false;
    preserveMapViewOnDock = true;
    dockNav("map");
    preserveMapViewOnDock = false;
    map.setView([lat, lng], zoom, { animate: false });
    syncSanvicUrl("map");
    return true;
  }
  return false;
}
function dockNav(tab) {
  dismissDockIntro();
  setActiveDock(tab);
  if (!handlingExploreHistory) {
    if (!history.state?.sanvic) syncSanvicUrl(tab, false);
    else if (history.state.tab !== tab) syncSanvicUrl(tab, true);
    else syncSanvicUrl(tab, false);
  }

  switch (tab) {
    case "map":
      closeAllPanels();
      closeDiscoverPanel();
      document.getElementById("heroOverlay").classList.remove("hidden");
      document.getElementById("heroFade").classList.remove("hidden");
      if (map) {
        activeMarkerSet = allMarkers;
        if (!preserveMapViewOnDock) map.flyTo([10.5, 119.22], 11, { duration: 1 });
        applyPinVisibility();
      }
      openTodaySheet();
      break;
    case "discover":
      closeAllPanels();
      closeDiscoverPanel();
      openExploreSheet();
      break;
    case "tala":
      closeAllPanels();
      closeDiscoverPanel();
      openTalaSheet();
      break;
    case "pulse":
      closeAllPanels();
      closeDiscoverPanel();
      openPulsePanel();
      break;
    case "saved":
      closeAllPanels();
      closeDiscoverPanel();
      openMySanvicPanel();
      break;
    case "journey":
      closeAllPanels();
      closeDiscoverPanel();
      openMySanvicPanel();
      break;
    case "hunt":
      closeAllPanels();
      closeDiscoverPanel();
      openHuntPanel();
      break;
  }
}

function setActiveDock(tab) {
  document.body.dataset.activeTab = tab;
  if (typeof renderPulseNowLayer === "function") renderPulseNowLayer();
  if (typeof setPulseNowMapOpen === "function") setPulseNowMapOpen(tab === "map");
  // data-active-tab is an attribute write; the class-filtered MutationObserver
  // does not fire for it, so the map tools are refreshed explicitly here.
  refreshMapTools();
  document.querySelectorAll(".dock-item").forEach((d) => {
    const active = d.dataset.tab === tab || (tab === "hunt" && d.dataset.tab === "discover");
    d.classList.toggle("active", active);
    if (active) d.setAttribute("aria-current", "page");
    else d.removeAttribute("aria-current");
  });
}
window.addEventListener("load", applyInitialSanvicDeepLink);
window.addEventListener("popstate", (e) => {
  if (!e.state?.sanvic) return;
  handlingExploreHistory = true;
  if (currentDest) closeDestSheet(true);
  dockNav(e.state.tab || "discover");
  if (e.state.place) {
    const d = destinations.find((x) => String(x.id) === e.state.place);
    if (d) openDest(d, false);
  }
  handlingExploreHistory = false;
});

function filterCategory(cat) {
  if (!mapReady) return;
  allMarkers.forEach((m) => {
    if (map.hasLayer(m)) map.removeLayer(m);
  });
  if (cat === "all") {
    activeMarkerSet = allMarkers;
    map.flyTo([10.5, 119.22], 11, { duration: 1 });
  } else {
    const ms = markersByCat[cat] || [];
    activeMarkerSet = ms;
    if (ms.length)
      map.flyToBounds(L.featureGroup(ms).getBounds().pad(0.25), { duration: 1, maxZoom: 15 });
  }
  applyPinVisibility();
}

// ─── MAP LAZY LOAD ───
const mapObs = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting && !mapReady) {
      initMap();
      mapObs.disconnect();
    }
  },
  { rootMargin: "200px" },
);
// Map is fullscreen so always observing
setTimeout(() => {
  if (!mapReady) initMap();
}, 100);

// ─── SCROLL → HIDE HERO ───
const shell = document.getElementById("appShell") || document.body;
let scrollY = 0;
window.addEventListener(
  "scroll",
  () => {
    scrollY = window.scrollY;
    const hero = document.getElementById("heroOverlay");
    const fade = document.getElementById("heroFade");
    if (scrollY > 100) {
      hero.classList.add("hidden");
      fade.classList.add("hidden");
    } else {
      hero.classList.remove("hidden");
      fade.classList.remove("hidden");
    }
  },
  { passive: true },
);

// ─── INIT ───
window.addEventListener("load", () => {
  setTimeout(
    () => {
      document.getElementById("splash").classList.add("hidden");
    },
    Number(window.SANVIC_SPLASH_HOLD) || 650,
  );
  setTimeout(animPlaceholder, 1200);
  setTimeout(loadVoices, 800);
  initAuth();
  initHeroWeather();

  // Show dock & orb after splash (kept in sync with the 5s splash hold)
  setTimeout(() => {
    document.getElementById("bottomDock").classList.add("visible");
    document.getElementById("talaOrbWrap").classList.remove("hidden");
    // Land on the map, not on a panel. This used to call dockNav('discover'),
    // which opened the Explore sheet automatically — so the first thing anyone
    // saw was a window over the map. The partner asked for the map only, with
    // Explore one tap away.
    setActiveDock("discover");
    closeAllPanels();
    refreshMapTools();
    if (!localStorage.getItem(DOCK_SEEN_KEY)) {
      setTimeout(() => {
        document.getElementById("bottomDock").classList.add("intro-pulse");
        document.getElementById("dockCoachmark").classList.add("show");
      }, 400);
      setTimeout(dismissDockIntro, 5200); // auto-dismiss if user never taps
    }
  }, 750);
  setTimeout(
    () => {
      if (typeof maybeShowMapTour === "function") maybeShowMapTour();
    },
    (Number(window.SANVIC_SPLASH_HOLD) || 650) + 100,
  );
});
