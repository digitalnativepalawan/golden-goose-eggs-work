// Map tool visibility, marker legibility and tile ceilings.
//
// These are the three things that broke in the field and were invisible to every
// other test, because they are CSS/Leaflet wiring rather than logic:
//
//   1. The Layers pill was pinned with a one-way class at map init, then hidden
//      by a panel-open guess that was wrong - so it floated over Tribes and then
//      vanished from the map itself, the one place it belongs.
//   2. Place and barangay dots drifted to 8px/6px and read as dust on a phone.
//   3. Esri World Imagery has no detail past z17 here and answers with a grey
//      "Map data not yet available" tile, which Leaflet drew happily.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("public/site/app.js", "utf8");
const html = fs.readFileSync("public/site/index.html", "utf8");
const css = fs.readFileSync("public/site/explore-ux.css", "utf8");

test("map tools are driven by one explicit switch, not by a panel guess", () => {
  // The switch exists and covers both surfaces that own the map.
  assert.match(app, /const MAP_TOOL_TABS = \['map','discover'\]/);
  assert.match(app, /function refreshMapTools\(\)/);
  assert.match(app, /document\.body\.dataset\.mapTools = on \? 'on' : 'off'/);
  // It is re-evaluated on dock taps and on every panel class change.
  assert.match(app, /refreshMapTools\(\);/);

  // Both controls obey it, in both directions.
  assert.match(html, /body\[data-map-tools="on"\] \.map-layer-toggle/);
  assert.match(html, /body\[data-map-tools="off"\] \.map-layer-toggle/);
  assert.match(html, /body\[data-map-tools="on"\] \.map-util-btn/);
  assert.match(html, /body\[data-map-tools="off"\] \.map-util-btn/);

  // The old failure modes must not come back: no permanent `.visible` pin, and
  // no rule that hides the tools because some panel is open.
  assert.equal(/mapLayerToggle'\)\.classList\.add\('visible'\)/.test(app), false);
  assert.equal(/body\.panel-open[^}{\n]*\.map-layer-toggle/.test(html), false);
  assert.equal(/body\.panel-open[^}{\n]*\.map-util-btn/.test(html), false);
});

test("a full-screen panel hides the tools, the Explore sheet does not", () => {
  const covering = app.slice(app.indexOf("const COVERING_PANELS"), app.indexOf("].join(',');", app.indexOf("const COVERING_PANELS")));
  for (const sel of [".today-panel.open", "#pulsePanel.open", "#mySanvicPanel.open", "#huntPanel.open", ".dest-sheet.expanded", "#infoSheet.open"]) {
    assert.ok(covering.includes(sel), `expected ${sel} to count as covering`);
  }
  // The Explore sheet is the one panel with the map still behind it.
  assert.equal(covering.includes(".explore-sheet.open"), false);
});

test("marker dots stay big enough to read on a phone", () => {
  const placePin = css.match(/\.place-pin\{[^}]*width:(\d+)px/);
  assert.ok(placePin, "place pin rule missing");
  assert.ok(Number(placePin[1]) >= 12, `place pin is ${placePin[1]}px`);

  const barangay = css.match(/\.barangay-point\{[^}]*width:(\d+)px/);
  assert.ok(barangay, "barangay dot rule missing");
  assert.ok(Number(barangay[1]) >= 12, `barangay dot is ${barangay[1]}px`);

  // The mobile override must not shrink them again.
  const mobile = css.match(/@media\(max-width:700px\)\{([^@]*)\}\s*$/);
  assert.ok(mobile, "mobile pin override missing");
  const mobileWidths = [...mobile[1].matchAll(/\.place-pin\{[^}]*width:(\d+)px|\.place-marker\.is-key \.place-pin\{[^}]*width:(\d+)px/g)];
  mobileWidths.forEach((m) => {
    const w = Number(m[1] || m[2]);
    assert.ok(w >= 12, `mobile pin is ${w}px`);
  });

  // A neon dot needs a halo, not a 3px shadow.
  assert.match(css, /\.place-pin\{[\s\S]*?0 0 16px/);
  assert.match(css, /\.barangay-point\{[\s\S]*?0 0 18px/);
});

test("tile layers declare what detail they actually have", () => {
  // Esri imagery stops at z17 along this coast and returns a grey placeholder
  // past it; maxNativeZoom makes Leaflet scale the real tile instead.
  const satellite = app.match(/_mSatellite=L\.tileLayer\([\s\S]*?\}\);/);
  assert.ok(satellite, "satellite layer missing");
  assert.match(satellite[0], /maxNativeZoom:17/);

  // The map itself must not invite zooming past the best imagery available.
  assert.match(app, /L\.map\('map',\{[^}]*maxZoom:18/);

  // Street and terrain keep their own declared ceilings too.
  assert.match(app, /_mS=L\.tileLayer\([\s\S]*?maxNativeZoom:19/);
  assert.match(app, /_mTerrain=L\.tileLayer\([\s\S]*?maxNativeZoom:17/);
});

test("featured places and landmarks survive regional zoom", () => {
  assert.match(app, /function keyPlaceIds\(\)/);
  assert.match(app, /d && d\.featured/);
  assert.match(app, /if\(marker && marker\._key\) return zoom>=10/);
});
