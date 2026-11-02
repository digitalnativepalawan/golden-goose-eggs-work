const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
// Loads the shipped model directly. No TypeScript, no node_modules - these
// assertions must run on a fresh checkout, so they can never be skipped.
const model = fs.readFileSync("public/site/explore-model.js", "utf8");
function context() {
  const c = vm.createContext({ URL });
  vm.runInContext(model, c);
  return c.SanvicExplore;
}
const cats = {
  food: { label: "Food & drinks" },
  beach: { label: "Beaches" },
  waterfall: { label: "Waterfalls" },
  stay: { label: "Stays" },
  service: { label: "Services" },
};
function place(o) {
  return { id: 0, lat: 10.4, lng: 119.2, tip: "", description: "", ...o };
}
const ids = (list) => Array.from(list, (x) => x.id);

test("a synonym never matches a fragment of a longer word", () => {
  const m = context();
  // "drinks" widens to "bar". Both of these have "bar" inside a word, not as one.
  const places = [
    place({
      id: 1,
      name: "Hillside Homestay",
      category: "stay",
      barangay: "Port Barton",
      description: "Barangay hall is next door",
    }),
    place({ id: 2, name: "Barton Ridge Inn", category: "stay", barangay: "Poblacion" }),
  ];
  assert.deepEqual(ids(m.filter(places, { query: "drinks", category: "all", area: "" }, cats)), []);
  assert.equal(m.score(places[0], m.queryTerms("drinks"), cats), 0);
  assert.equal(m.score(places[1], m.queryTerms("drinks"), cats), 0);
});

test("a typed word still matches when it is a whole word", () => {
  const m = context();
  const places = [
    place({ id: 1, name: "Beach Bar", category: "food", barangay: "Poblacion" }),
    place({ id: 2, name: "Barton Ridge Inn", category: "stay", barangay: "Port Barton" }),
  ];
  assert.deepEqual(ids(m.filter(places, { query: "bar", category: "all", area: "" }, cats)), [1]);
});

test("stopwords are dropped but the meaning survives", () => {
  const m = context();
  assert.deepEqual(Array.from(m.queryTerms("best sunset spots")), ["sunset"]);
  const places = [
    place({
      id: 1,
      name: "Poblacion Shore",
      category: "beach",
      barangay: "Poblacion",
      description: "Wide sand at sunset",
    }),
    place({
      id: 2,
      name: "Alimanguan Market",
      category: "food",
      barangay: "Alimanguan",
      description: "Fruit and fish",
    }),
  ];
  assert.deepEqual(
    ids(m.filter(places, { query: "best sunset spots", category: "all", area: "" }, cats)),
    [1],
  );
});

test("a synonym match is found but ranks below the literal word", () => {
  const m = context();
  const literal = place({ id: 1, name: "Waterfall", category: "waterfall", barangay: "Poblacion" });
  const synonym = place({
    id: 2,
    name: "Pamuayan Falls",
    category: "waterfall",
    barangay: "Poblacion",
  });
  const terms = m.queryTerms("waterfall");
  assert.ok(m.score(synonym, terms, cats) > 0, 'Pamuayan Falls should be found through "falls"');
  assert.ok(
    m.score(literal, terms, cats) > m.score(synonym, terms, cats),
    "the literal name must lead",
  );
  assert.deepEqual(
    ids(
      m.filter([synonym, literal], { query: "waterfall", category: "all", area: "" }, cats),
    ).sort(),
    [1, 2],
  );
});

test("an empty query keeps every place and the filters still apply", () => {
  const m = context();
  const places = [
    place({ id: 1, name: "Beach Bar", category: "food", barangay: "Poblacion" }),
    place({ id: 2, name: "Long Beach", category: "beach", barangay: "Alimanguan" }),
    place({ id: 3, name: "Pamuayan Falls", category: "waterfall", barangay: "Poblacion" }),
  ];
  assert.deepEqual(
    ids(m.filter(places, { query: "", category: "all", area: "" }, cats)),
    [1, 2, 3],
  );
  assert.deepEqual(ids(m.filter(places, { query: "", category: "beach", area: "" }, cats)), [2]);
  assert.deepEqual(
    ids(m.filter(places, { query: "", category: "all", area: "alimanguan" }, cats)),
    [2],
  );
  assert.deepEqual(
    ids(m.filter(places, { query: "beach", category: "food", area: "" }, cats)),
    [1],
  );
  assert.equal(m.filter([], { query: "", category: "all", area: "" }, cats).length, 0);
});

test("short variants only match whole words", () => {
  const m = context();
  const places = [
    place({
      id: 1,
      name: "Support Services",
      category: "service",
      barangay: "Poblacion",
      description: "Airport shuttle booking desk",
    }),
    place({
      id: 2,
      name: "Boat Port",
      category: "service",
      barangay: "Port Barton",
      description: "Ferry crossing",
    }),
  ];
  assert.deepEqual(ids(m.filter(places, { query: "port", category: "all", area: "" }, cats)), [2]);
  assert.equal(m.score(places[0], m.queryTerms("port"), cats), 0);
});
