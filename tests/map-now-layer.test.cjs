const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const mapApp = fs.readFileSync("public/site/app-map-explore-today.js", "utf8");
const html = fs.readFileSync("public/site/index.html", "utf8");
const exploreCss = fs.readFileSync("public/site/explore-ux.css", "utf8");
const pulse = fs.readFileSync("public/site/app-pulse.js", "utf8");
const admin = fs.readFileSync("public/site/app-place-details.js", "utf8");
const adminStudio = fs.readFileSync("public/site/admin-studio.js", "utf8");
const adminCss = fs.readFileSync("public/site/admin-ux.css", "utf8");
const migration = fs.readFileSync(
  "supabase/migrations/20261112000000_pulse_now_location_time.sql",
  "utf8",
);
const liveLayerStart = mapApp.indexOf("let livePulseNowMarkers = [];");
const liveLayerEnd = mapApp.indexOf("function renderPulseNowLayer()", liveLayerStart);
const liveLayerSource = mapApp.slice(liveLayerStart, liveLayerEnd);

function liveLayerContext({ activeTab = "map", rows = {}, errors = {} } = {}) {
  const queries = [];
  const markers = [];
  const map = {
    hasLayer: (marker) => markers.includes(marker),
    removeLayer: (marker) => markers.splice(markers.indexOf(marker), 1),
  };
  const sb = {
    from(table) {
      const query = { table, columns: "", filters: [] };
      queries.push(query);
      return {
        select(columns) {
          query.columns = columns;
          return this;
        },
        gte(column, value) {
          query.filters.push(["gte", column, value]);
          return this;
        },
        lte(column, value) {
          query.filters.push(["lte", column, value]);
          return Promise.resolve({ data: rows[table] || [], error: errors[table] || null });
        },
      };
    },
  };
  const document = {
    body: { dataset: { activeTab } },
    createElement(tagName) {
      return {
        tagName,
        children: [],
        append(...children) {
          this.children.push(...children);
        },
      };
    },
  };
  const L = {
    divIcon: (options) => options,
    marker(coords, options) {
      const marker = {
        coords,
        options,
        addTo(targetMap) {
          assert.equal(targetMap, map);
          markers.push(this);
          return this;
        },
        bindPopup(content) {
          this.popup = content;
          return this;
        },
      };
      return marker;
    },
  };
  const context = vm.createContext({
    Date,
    document,
    partnerDemoMode: false,
    escT: (value) => String(value).replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
    L,
    map,
    sb,
    console: { warn() {} },
    window: { setInterval, clearInterval },
  });
  vm.runInContext(liveLayerSource, context);
  return { context, queries, markers, map };
}

test("first-visit map tour is brief, dismissible, and points at a visible pin", () => {
  assert.match(mapApp, /function maybeShowMapTour\(force = false\)/);
  assert.match(mapApp, /sanvic_map_tour_seen/);
  assert.match(mapApp, /markerVisibleAtZoom\(marker, map\.getZoom\(\)\)/);
  assert.match(mapApp, /Tap a pin to explore/);
  assert.match(mapApp, /window\.setTimeout\(dismissMapTour, 4000\)/);
  assert.match(mapApp, /document\.addEventListener\("pointerdown", mapTourDismiss, true\)/);
});

test("live Pulse Now reads structured rows only on the map tab", () => {
  assert.match(mapApp, /async function refreshLivePulseNow\(\)/);
  assert.match(mapApp, /\.from\("tribes"\)\s*\.select\(columns\)/);
  assert.match(mapApp, /\.from\("events"\)\s*\.select\(columns\)/);
  assert.match(mapApp, /starts_at,lat,lng/);
  assert.match(mapApp, /startsAt > until/);
  assert.match(mapApp, /document\.body\.dataset\.activeTab !== "map"/);
});

test("live Pulse Now creates markers only for valid upcoming event and tribe rows", async () => {
  const startsAt = new Date(Date.now() + 35 * 60 * 1000).toISOString();
  const { context, queries, markers } = liveLayerContext({
    rows: {
      tribes: [
        {
          id: "tribe-1",
          title: "<Sunset crew>",
          where_text: "Poblacion",
          when_text: "Tonight",
          starts_at: startsAt,
          lat: 10.42,
          lng: 119.31,
        },
        { id: "bad-coordinate", title: "Outside bounds", starts_at: startsAt, lat: 14, lng: 119 },
      ],
      events: [
        {
          id: "event-1",
          title: "Food walk",
          where_text: "Port Barton",
          when_text: "Today",
          starts_at: startsAt,
          lat: 10.42,
          lng: 119.31,
        },
      ],
    },
  });

  await vm.runInContext("refreshLivePulseNow()", context);

  assert.deepEqual(
    queries.map(({ table, columns }) => [table, columns]),
    [
      ["tribes", "id,title,where_text,when_text,starts_at,lat,lng"],
      ["events", "id,title,where_text,when_text,starts_at,lat,lng"],
    ],
  );
  assert.equal(markers.length, 2);
  assert.match(markers[0].options.icon.html, /&lt;Sunset crew&gt;/);
  assert.equal(markers[0].popup.children[0].textContent, "<Sunset crew>");
  assert.equal(markers[0].popup.children[1].textContent, "Tribe · Tonight · Poblacion");
  assert.equal(markers[1].popup.children[1].textContent, "Event · Today · Port Barton");
});

test("live Pulse Now does not query outside the map tab and disables missing optional columns", async () => {
  const closed = liveLayerContext({ activeTab: "today" });
  await vm.runInContext("refreshLivePulseNow()", closed.context);
  assert.equal(closed.queries.length, 0);

  const missingSchema = liveLayerContext({
    errors: { tribes: { code: "PGRST204", message: "starts_at missing from schema cache" } },
  });
  await vm.runInContext("refreshLivePulseNow()", missingSchema.context);
  assert.equal(missingSchema.markers.length, 0);
  assert.equal(vm.runInContext("pulseNowColumnsAvailable", missingSchema.context), false);
  await vm.runInContext("refreshLivePulseNow()", missingSchema.context);
  assert.equal(missingSchema.queries.length, 2);
});

test("partner-preview tribes and events get rolling future times and San Vicente coordinates", () => {
  const demoStart = pulse.indexOf("const PULSE_TRIBES = [");
  const demoEnd = pulse.indexOf("const PULSE_LOUNGE = [];", demoStart);
  const context = vm.createContext({ Date, partnerDemoMode: false });
  vm.runInContext(pulse.slice(demoStart, demoEnd), context);
  vm.runInContext("setPulsePartnerDemo(true)", context);
  const sample = JSON.parse(
    vm.runInContext("JSON.stringify({ tribes: PULSE_TRIBES, events: PULSE_EVENTS })", context),
  );
  const now = Date.now();
  for (const row of [...sample.tribes, ...sample.events]) {
    assert.ok(new Date(row.starts_at).getTime() > now);
    assert.ok(row.lat >= 6.5 && row.lat <= 12.9);
    assert.ok(row.lng >= 116.6 && row.lng <= 121);
    assert.ok(row.when.length > 0);
  }
  assert.equal(sample.tribes[0].title, "Sunset Chasers");
  assert.ok(sample.tribes[0].starts_at);
});

test("optional Pulse Now fields preserve existing tables and let tribes and events publish real time/place", () => {
  assert.match(
    migration,
    /ALTER TABLE public\.tribes[\s\S]*ADD COLUMN IF NOT EXISTS lat double precision[\s\S]*ADD COLUMN IF NOT EXISTS starts_at timestamptz/,
  );
  assert.match(
    migration,
    /ALTER TABLE public\.events[\s\S]*ADD COLUMN IF NOT EXISTS lat double precision[\s\S]*ADD COLUMN IF NOT EXISTS starts_at timestamptz/,
  );
  assert.match(pulse, /type="time" aria-label="Start time"/);
  assert.match(pulse, /starts_at: startsAt/);
  assert.match(admin, /adminPulseNowFields\("atbfLat", "atbfLng", "atbfStartsAt"\)/);
  assert.match(admin, /adminPulseNowFields\("aevfLat", "aevfLng", "aevfStartsAt"\)/);
  assert.match(admin, /saveAdminPulseRow\("tribes", id, payload\)/);
  assert.match(admin, /saveAdminPulseRow\("events", id, payload\)/);
});

test("partner preview is opt-in, labeled across screens, and includes upcoming sample pins", () => {
  assert.match(html, /pulseNowDemoToggle[^>]*onchange="togglePartnerDemo\(this\.checked\)"/);
  assert.match(html, /Partner preview · sample content/);
  assert.match(html, /Demo only · not live/);
  assert.match(html, /PARTNER PREVIEW · SAMPLE DATA · NOT LIVE/);
  assert.match(mapApp, /let pulseNowDemoEnabled = !!partnerDemoMode/);
  assert.match(mapApp, /document\.body\.dataset\.activeTab !== "map"/);
  assert.match(mapApp, /title: "Tribe · Sunset Chasers"/);
  assert.match(mapApp, /title: "Event · Acoustic Night in Poblacion"/);
  assert.match(mapApp, /className: "pulse-now-chip-marker"/);
  assert.match(mapApp, /startsInMinutes/);
  assert.match(pulse, /function setPulsePartnerDemo\(enabled\)/);
  assert.match(pulse, /starts_at: startsAt/);
});

test("partner preview gives tribes, events, feed and map pins local sample photos", () => {
  for (const image of [
    "assets/pulse/island-boats-beach.jpg",
    "assets/pulse/island-boats-aerial.jpg",
    "assets/pulse/kayak-lagoon.jpg",
    "assets/pulse/street-food-skewers.jpg",
    "assets/pulse/bulalo-boodle.jpg",
    "assets/san-vicente-long-beach.jpg",
    "assets/san-vicente-waterfalls.jpg",
  ]) {
    assert.ok(fs.existsSync(`public/site/${image}`), `missing local preview image: ${image}`);
  }
  assert.match(pulse, /const PARTNER_DEMO_TRIBE_MEDIA =/);
  assert.match(pulse, /const PARTNER_DEMO_EVENT_MEDIA =/);
  assert.match(pulse, /aria-label="View \$\{uniqueImages\.length\} tribe photos"/);
  assert.match(pulse, /event\.key==='Enter'\|\|event\.key===' '/);
  assert.match(pulse, /Illustrative sample image · partner preview only/);
  assert.match(pulse, /image: "assets\/pulse\/island-boats-aerial\.jpg"/);
  assert.match(pulse, /image: "assets\/san-vicente-long-beach\.jpg"/);
  assert.match(pulse, /image: "assets\/pulse\/street-food-skewers\.jpg"/);
  assert.match(mapApp, /interactive: true/);
  assert.match(mapApp, /marker\.on\("click", \(\) =>/);
  assert.match(mapApp, /openTribeDetail\(item\.recordId\)/);
  assert.match(mapApp, /openEventDetail\(item\.recordId\)/);
  assert.match(
    html,
    /id="pulsePartnerPreviewBtn"[^>]*onclick="togglePartnerDemo\(!partnerDemoMode\)"/,
  );
  assert.match(mapApp, /pulsePartnerPreviewLabel/);
  assert.match(pulse, /function wizUseSamplePhoto\(\)/);
  assert.match(pulse, /sample photo is only for preview/);
  assert.match(pulse, /nothing uploads or publishes while partner preview is on/);
  assert.match(pulse, /URL\.createObjectURL\(f\)/);
  assert.match(pulse, /sb\.storage\.from\("tribe-images"\)\.upload/);
  assert.match(admin, /function mediaGalleryHtml\(/);
  assert.match(admin, /mediaUploadFiles\(files, containerId\)/);
  assert.match(admin, /sb\.storage\.from\("destination-images"\)\.upload/);
  assert.match(pulse, /const PULSE_MISSING_PHOTOS =/);
  assert.match(pulse, /pulseMissingPhoto\(t\)/);
  assert.match(pulse, /pulseMissingPhoto\(e\)/);
  assert.match(pulse, /Illustrative sample/);
  assert.match(admin, /Or use a sample photo/);
  assert.match(admin, /legacyMediaAddSample/);
  assert.match(admin, /function legacyMediaAddSample\(/);
  assert.match(admin, /function mediaRemoveImage\(/);
  assert.match(adminStudio, /window\.mediaAddSample = function/);
  assert.match(adminStudio, /Or use a sample photo/);
  assert.match(adminCss, /\.admin-sample-photo/);
});

test("tribe cards fill missing photos with labeled local samples and keep real photos first", () => {
  const start = pulse.indexOf("function tribeCardHTML(t)");
  const end = pulse.indexOf("function eventCardHTML(e)", start);
  const source = pulse.slice(start, end);
  const context = vm.createContext({
    escT: (value) => String(value ?? ""),
    lucideSvg: () => "",
    myTribes: new Set(),
    pulseMissingPhoto: () => "assets/pulse/island-boats-beach.jpg",
    tribeMemberNames: () => [],
    tribeTotalCount: () => 2,
  });
  vm.runInContext(source, context);
  const missing = vm.runInContext(
    `tribeCardHTML({id:"db-row",title:"Single ready to mingle",where:"Poblacion",when:"Today",sub:"Meet up",images:[]})`,
    context,
  );
  assert.match(missing, /src="assets\/pulse\/island-boats-beach\.jpg"/);
  assert.match(missing, /Illustrative sample/);
  const real = vm.runInContext(
    `tribeCardHTML({id:"real-row",title:"Real photo",where:"Poblacion",when:"Today",sub:"Meet up",thumb:"https:\/\/images.example\/real.jpg",images:[]})`,
    context,
  );
  assert.match(real, /src="https:\/\/images\.example\/real\.jpg"/);
  assert.match(real, /class="pv2-sample-photo-tag" hidden/);
});

test("map controls are consolidated and map search shares a row with Explore", () => {
  assert.equal((html.match(/id="layersButton"/g) || []).length, 1);
  assert.equal((html.match(/id="legendButton"/g) || []).length, 0);
  assert.equal((html.match(/id="mapNearbyBtn"/g) || []).length, 0);
  assert.match(html, /aria-label="Map layers, boundaries and marker legend"/);
  assert.match(html, /Place markers/);
  assert.match(html, /id="locateMeBtn"[^>]*onclick="toggleMapNearby\(\)"/);
  assert.match(html, /aria-label="Use my location and show the nearest places"/);
  assert.match(
    html,
    /class="map-search-row"[\s\S]*?id="mapSearchInput"[\s\S]*?class="explore-reopen"[\s\S]*?Explore places/,
  );
  assert.match(mapApp, /const nearbyButton = document\.getElementById\("locateMeBtn"\)/);
  assert.match(
    exploreCss,
    /body\[data-map-tools="on"\] #heroSearch[\s\S]*display: none !important/,
  );
  assert.match(exploreCss, /body\.explore-open #mapExploreBar[\s\S]*visibility: hidden !important/);
  assert.match(html, /es-no-filters \.es-filter-row[\s\S]*es-no-filters \.es-stay-row/);
  assert.match(html, /class="stay-row es-stay-row"[\s\S]*id="staySelect"/);
  assert.doesNotMatch(html, /id="mapChipStrip"/);
});

test("street and dark use the replacement public basemap and surface failures accessibly", () => {
  assert.match(
    mapApp,
    /server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Street_Map\/MapServer\/tile\/\{z\}\/\{y\}\/\{x\}/,
  );
  assert.match(mapApp, /window\._mDark = window\._mS/);
  assert.match(mapApp, /dark: window\._mDark/);
  assert.match(mapApp, /window\._mS\.on\("tileerror"/);
  assert.match(mapApp, /Try Satellite or Terrain in Map options/);
  assert.match(mapApp, /GIS User Community/);
  assert.match(html, /Esri World Street Map/);
  assert.match(html, /Low-light style · Esri/);
  assert.doesNotMatch(mapApp, /tile\.openstreetmap\.org/);
  assert.doesNotMatch(mapApp, /basemaps\.cartocdn\.com/);
});
