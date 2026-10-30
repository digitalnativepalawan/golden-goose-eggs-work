const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

// The shipped file is a classic browser script. Evaluate it in a VM with a
// CommonJS module object so tests exercise the exact source, not a copy.
const source = fs.readFileSync(
  path.join(__dirname, "..", "public", "site", "admin-model.js"),
  "utf8",
);
const moduleObj = { exports: {} };
vm.runInNewContext(
  source,
  vm.createContext({
    module: moduleObj,
    exports: moduleObj.exports,
    URL,
    Date,
    Number,
    Math,
    String,
    Object,
    Array,
    Set,
    RegExp,
    Error,
  }),
  { filename: "admin-model.js" },
);
const admin = moduleObj.exports;

const place = (overrides = {}) => ({
  id: 1,
  name: "Long Beach",
  category: "beaches",
  barangay: "Poblacion",
  description: "A long sweep of sand.",
  lat: 10.4962,
  lng: 119.2607,
  image: "https://example.supabase.co/storage/v1/object/public/destination-images/beach.jpg",
  images: [],
  status: "published",
  updatedAt: "2026-10-26T08:00:00Z",
  createdAt: "2026-10-20T08:00:00Z",
  ...overrides,
});

test("existing rows default to published while drafts stay hidden", () => {
  const rows = [
    place({ id: 1, status: undefined }),
    place({ id: 2, status: "draft" }),
    place({ id: 3, status: "archived" }),
    place({ id: 4, status: "published" }),
  ];
  assert.deepEqual(
    admin.publicPlaces(rows).map((p) => p.id),
    [1, 4],
  );
  assert.equal(admin.statusOf("unknown"), "published");
});

test("draft validation tolerates a missing pin, publishing does not", () => {
  const incomplete = place({
    lat: "",
    lng: "",
    barangay: "",
    description: "",
    image: "",
    status: "draft",
  });
  const draft = admin.validatePlace(incomplete, { mode: "draft" });
  assert.equal(draft.valid, true);
  assert.equal(Object.keys(draft.errors).length, 0);

  const publish = admin.validatePlace(incomplete, { mode: "publish" });
  assert.equal(publish.valid, false);
  assert.ok(publish.errors.coordinates);
  assert.ok(publish.errors.barangay);
  assert.ok(publish.errors.description);
  assert.ok(publish.errors.cover);
});

test("coordinates distinguish missing, malformed, out-of-area and valid", () => {
  assert.equal(admin.coordinates({ lat: "", lng: "" }).missing, true);
  assert.equal(admin.coordinates({ lat: "10.5", lng: "banana" }).valid, false);
  const manila = admin.coordinates({ lat: "14.6", lng: "120.98" });
  assert.equal(manila.valid, true);
  assert.equal(manila.inArea, false);
  assert.equal(admin.coordinates({ lat: "10.5", lng: "119.26" }).inArea, true);
  const outside = admin.validatePlace(place({ lat: 14.6, lng: 120.98 }), { mode: "publish" });
  assert.equal(outside.valid, true);
  assert.ok(outside.warnings.coordinates);
});

test("published-place issues and content status come from real fields", () => {
  const deadCovers = new Set(["2"]);
  const rows = [
    place({ id: 1 }),
    place({ id: 2, barangay: "", lat: "", lng: "", image: "", status: "draft" }),
    place({ id: 3, status: "archived" }),
  ];
  const status = admin.contentStatus(rows, {
    deadCovers,
    categories: { beaches: {}, food: {} },
    tribes: [1, 2, 3],
    events: [1],
    nearby: { Poblacion: [1] },
    talaAnswers: [1, 2, 3, 4],
  });
  assert.equal(status.total, 3);
  assert.equal(status.published, 1);
  assert.equal(status.drafts, 1);
  assert.equal(status.archived, 1);
  assert.equal(status.needsWork, 1);
  assert.equal(status.missingPin, 1);
  assert.equal(status.missingCover, 1);
  assert.equal(status.categories, 2);
  assert.equal(status.tribes, 3);
  assert.equal(
    admin.issueList(rows[1]).slice().sort().join("|"),
    ["barangay", "cover photo", "map pin"].sort().join("|"),
  );
});

test("filters combine status, query, area and issue state, and sorting is stable", () => {
  const rows = [
    place({ id: 1, name: "Alpha Cove", status: "draft", updatedAt: "2026-10-25T10:00:00Z" }),
    place({ id: 2, name: "Beta Beach", status: "published", updatedAt: "2026-10-26T10:00:00Z" }),
    place({
      id: 3,
      name: "Gamma Stay",
      barangay: "Port Barton",
      status: "published",
      updatedAt: "2026-10-24T10:00:00Z",
    }),
  ];
  const filtered = admin.filterAndSortPlaces(rows, { status: "published", query: "beta" });
  assert.deepEqual(
    filtered.map((p) => p.id),
    [2],
  );
  const byName = admin.filterAndSortPlaces(rows, { sort: "name_asc" });
  assert.deepEqual(
    byName.map((p) => p.name),
    ["Alpha Cove", "Beta Beach", "Gamma Stay"],
  );
  const recent = admin.filterAndSortPlaces(rows, {});
  assert.equal(recent[0].id, 2);
});

test("image validation rejects SVG, huge files and unsupported types", () => {
  assert.equal(admin.validateImage({ name: "a.jpg", type: "image/jpeg", size: 1024 }).ok, true);
  assert.match(
    admin.validateImage({ name: "a.svg", type: "image/svg+xml", size: 1024 }).error,
    /SVG/,
  );
  assert.match(
    admin.validateImage({ name: "a.jpg", type: "image/jpeg", size: 20 * 1024 * 1024 }).error,
    /15 MB/,
  );
  assert.match(
    admin.validateImage({ name: "notes.pdf", type: "application/pdf", size: 1024 }).error,
    /Choose/,
  );
});

test("unsafe image URLs are rejected and storage URLs are encoded", () => {
  assert.equal(admin.safeImageUrl("javascript:alert(1)"), "");
  assert.equal(admin.safeImageUrl("data:image/png;base64,AAAA"), "");
  assert.equal(admin.safeImageUrl("assets/beach.jpg"), "assets/beach.jpg");
  assert.equal(
    admin.storagePublicUrl(
      "https://example.supabase.co/",
      "destination-images",
      "my place/a b.jpg",
    ),
    "https://example.supabase.co/storage/v1/object/public/destination-images/my%20place/a%20b.jpg",
  );
});

test("change summaries and marker visibility explain public impact", () => {
  const before = place();
  const after = place({ name: "Long Beach North", status: "draft", images: ["a.jpg"] });
  const changes = admin.changedFields(before, after);
  assert.ok(changes.includes("Name"));
  assert.ok(changes.includes("Publishing status"));
  assert.ok(changes.includes("Photo gallery"));
  assert.equal(admin.markerVisibility("beaches", "Beaches").zoom, 13);
  assert.equal(admin.markerVisibility("stops", "Useful Stops").zoom, 15);
});
