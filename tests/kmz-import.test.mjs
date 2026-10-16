// Tests for public/site/kmz-import.js — the KMZ/KML bulk importer.
//
// The module is a classic browser script (no exports), so it is loaded here by
// evaluating its real source with small stubs for the app.js globals it uses.
// That keeps the test honest: it exercises the shipped file, not a copy.
//
// The ZIP half runs anywhere. KML parsing needs DOMParser, which Node does not
// provide; those assertions are skipped unless a DOM parser is available.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(here, "..", "public", "site", "kmz-import.js"), "utf8");

const STUBS = `
var catStyle = {
  beaches:{label:'Beaches',color:'#0ea5e9'}, islands:{label:'Islands',color:'#8b5cf6'},
  nature:{label:'Nature',color:'#22c55e'}, adventure:{label:'Adventure',color:'#ef4444'},
  waterfalls:{label:'Waterfalls',color:'#06b6d4'}
};
var destinations = [{ id:1, name:'Long Beach', lat:10.5, lng:119.26, barangay:'San Isidro' }];
var destinationsSource = 'supabase';
function escapeHtml(s){ return String(s==null?'':s); }
function lucideSvg(){ return ''; }
function renderAdminDest(){}
function loadDataFromSupabase(){}
function rebuildMarkers(){}
var sb = { from(){ return { insert(){ return { select: async()=>({data:[],error:null}) }; } }; } };
`;

const api = new Function(
  STUBS + SRC +
  "\nreturn { kmzExtractKmlText, kmzParseKml, kmzFinish, kmzInSanVicente, kmzGuessCategory," +
  " kmzStripHtml, kmzHaversineM, getRows:()=>kmzRows, getMsg:()=>kmzMsg };"
)();

// Build a genuine ZIP archive in memory. CRC fields are left zero on purpose —
// the importer does not validate them, it only needs the size/offset metadata.
async function makeZip(name, text, method) {
  const enc = new TextEncoder();
  const nameBytes = enc.encode(name);
  let data = enc.encode(text);
  if (method === 8) {
    const cs = new CompressionStream("deflate-raw");
    data = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(cs)).arrayBuffer());
  }
  const local = new Uint8Array(30 + nameBytes.length + data.length);
  const lv = new DataView(local.buffer);
  lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(8, method, true);
  lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true);
  lv.setUint16(26, nameBytes.length, true); lv.setUint16(28, 0, true);
  local.set(nameBytes, 30); local.set(data, 30 + nameBytes.length);

  const central = new Uint8Array(46 + nameBytes.length);
  const cv = new DataView(central.buffer);
  cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
  cv.setUint16(10, method, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
  cv.setUint16(28, nameBytes.length, true); cv.setUint32(42, 0, true);
  central.set(nameBytes, 46);

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, 1, true); ev.setUint16(10, 1, true);
  ev.setUint32(12, central.length, true); ev.setUint32(16, local.length, true);

  const out = new Uint8Array(local.length + central.length + eocd.length);
  out.set(local, 0); out.set(central, local.length); out.set(eocd, local.length + central.length);
  return out.buffer;
}

const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <Folder><name>Waterfalls</name>
    <Placemark><name>Bigaho Falls</name><description><![CDATA[<p>Hidden <b>gem</b>.&nbsp;Bring water.</p>]]></description>
      <Point><coordinates>119.3100,10.4400,0</coordinates></Point></Placemark>
    <Placemark><name>No Coords</name><description>x</description></Placemark>
  </Folder>
  <Folder><name>Beaches</name>
    <Placemark><name>Long Beach</name><description>Already mapped</description>
      <Point><coordinates>119.2600,10.5000,0</coordinates></Point></Placemark>
    <Placemark><name>Port Barton Bay</name><description>Bay</description>
      <MultiGeometry><Point><coordinates>119.2200,10.4500,0</coordinates></Point></MultiGeometry></Placemark>
  </Folder>
  <Placemark><name>Choke Point</name><description>Far away</description>
    <Point><coordinates>121.0000,14.6000,0</coordinates></Point></Placemark>
</Document></kml>`;

/* ------------------------------------------------------------- archive --- */

test("extracts the KML from a stored (uncompressed) KMZ", async () => {
  const kml = await api.kmzExtractKmlText(await makeZip("doc.kml", KML, 0));
  assert.match(kml, /<Placemark>/);
});

test("extracts the KML from a deflated KMZ", async () => {
  const kml = await api.kmzExtractKmlText(await makeZip("doc.kml", KML, 8));
  assert.match(kml, /<Placemark>/);
});

test("rejects a file that is not a ZIP at all", async () => {
  await assert.rejects(
    () => api.kmzExtractKmlText(new TextEncoder().encode('<?xml version="1.0"?>').buffer),
    /not a KMZ\/ZIP/
  );
});

test("rejects a ZIP that contains no .kml entry", async () => {
  await assert.rejects(
    async () => api.kmzExtractKmlText(await makeZip("readme.txt", "nope", 0)),
    /did not contain a \.kml/
  );
});

/* ------------------------------------------------------------- helpers --- */

test("strips HTML without leaving a space before punctuation", () => {
  assert.equal(
    api.kmzStripHtml("<p>Hidden <b>gem</b>.&nbsp;Bring water.</p>"),
    "Hidden gem. Bring water."
  );
});

test("San Vicente bounds accept an in-area point and reject Manila", () => {
  assert.equal(api.kmzInSanVicente(10.45, 119.31), true);
  assert.equal(api.kmzInSanVicente(14.6, 121.0), false);
});

/* --------------------------------------------------------- kml parsing --- */

const dom = globalThis.DOMParser ? globalThis : null;
const skip = dom ? false : "no DOMParser in this runtime";

test("parses placemarks and maps KML lng,lat order correctly", { skip }, () => {
  const parsed = api.kmzParseKml(KML);
  // The placemark with no <coordinates> is dropped.
  assert.equal(parsed.length, 4);
  const falls = parsed.find(p => p.name === "Bigaho Falls");
  assert.equal(falls.lat, 10.44);
  assert.equal(falls.lng, 119.31);
  assert.equal(falls.folder, "Waterfalls");
});

test("reads coordinates out of a MultiGeometry", { skip }, () => {
  const bay = api.kmzParseKml(KML).find(p => p.name === "Port Barton Bay");
  assert.equal(bay.lat, 10.45);
  assert.equal(bay.lng, 119.22);
});

test("guesses the category from the containing folder", { skip }, () => {
  const falls = api.kmzParseKml(KML).find(p => p.name === "Bigaho Falls");
  assert.equal(api.kmzGuessCategory(falls), "waterfalls");
});

test("review pass ticks in-area rows, skips duplicates and out-of-area rows", { skip }, () => {
  api.kmzFinish(api.kmzParseKml(KML), [{ name: "test.kmz" }]);
  const rows = api.getRows();
  const byName = Object.fromEntries(rows.map(r => [r.name, r]));
  assert.equal(byName["Bigaho Falls"].include, true);
  assert.equal(byName["Long Beach"].duplicateOf, "Long Beach");
  assert.equal(byName["Long Beach"].include, false);
  assert.equal(byName["Choke Point"].inArea, false);
  assert.equal(byName["Choke Point"].include, false);
});
