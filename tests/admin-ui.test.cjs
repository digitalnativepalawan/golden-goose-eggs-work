const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { appFiles, appSource, scriptFiles } = require("./support/client.cjs");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "public", "site", "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "public", "site", "admin-ux.css"), "utf8");
const studio = fs.readFileSync(path.join(root, "public", "site", "admin-studio.js"), "utf8");
// The app, however many files it is spread across, in page load order - and
// only the app, so an attribute that exists in admin-studio.js cannot leak in.
const app = appSource();
const migration = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20261026120000_destination_publishing.sql"),
  "utf8",
);
const adminModel = fs.readFileSync(path.join(root, "public", "site", "admin-model.js"), "utf8");

test("the Backoffice loads pure rules, the enhancement layer and the responsive CSS in the right order", () => {
  assert.ok(html.match(/\['supabase-config\.js'[^\]]+\]/), "script list exists");
  // Read the order rather than the raw string, so it holds whether the app is
  // one file or several.
  const order = scriptFiles();
  const at = (name) => order.indexOf(name);
  assert.ok(at("admin-model.js") >= 0 && at("admin-studio.js") >= 0, "loaders are listed");
  assert.ok(at("admin-model.js") < at("admin-studio.js"), "rules load before the Backoffice UI");
  assert.ok(at("admin-studio.js") < at("kmz-import.js"), "the Backoffice UI loads before KMZ");
  // The app sits between the pure rules and the Backoffice enhancement layer,
  // and admin-studio.js must stay the file that loads last among them.
  assert.ok(appFiles().length >= 1, "the app loads after the rules and before the Admin UI");
  assert.equal(
    appFiles().some((f) => /admin-studio|kmz-import/.test(f)),
    false,
    "the Backoffice UI is not part of the app",
  );
  assert.match(html, /admin-ux\.css\?v=/);
  assert.match(html, /id="adminTabHome"/);
  assert.match(html, /id="adminTabMap"/);
  assert.match(html, /id="adminTabPhotos"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-live="polite"/);
});

test("responsive admin CSS covers phone drawer, tablet rail, desktop workspace, keyboard and safe areas", () => {
  assert.match(css, /@media \(min-width: 700px\)/);
  assert.match(css, /@media \(min-width: 1180px\)/);
  assert.match(css, /@media \(max-height: 520px\) and \(orientation: landscape\)/);
  assert.match(css, /env\(safe-area-inset-top/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /--admin-visual-height/);
  assert.match(css, /position: sticky/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /font-size: 16px/); // prevents iOS input zoom
  assert.match(css, /:focus-visible/);
  assert.match(css, /overflow-x: hidden/);
});

test("admin code avoids native white tooltip boxes and uses explicit device-photo affordances", () => {
  assert.equal(/\btitle="/.test(studio), false);
  assert.equal(/\btitle="/.test(app), false);
  assert.match(studio, /capture="environment"/);
  assert.match(studio, /multiple/);
  assert.match(studio, /ondrop=/);
  assert.match(studio, /upload\.onprogress/);
  assert.match(studio, /Retry/);
  assert.match(studio, /Set cover/);
  assert.match(studio, /Move photo/);
  assert.match(studio, /blob: and data: URLs cannot be saved/);
});

test("publishing migration preserves existing public rows and hides drafts from visitors", () => {
  assert.match(migration, /ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'/);
  assert.match(migration, /ALTER COLUMN lat DROP NOT NULL/);
  assert.match(migration, /ALTER COLUMN lng DROP NOT NULL/);
  assert.match(migration, /USING \(status = 'published'\)/);
  assert.match(migration, /Admins read all destinations/);
  assert.match(migration, /has_role\(auth\.uid\(\), 'admin'\)/);
  assert.match(migration, /destinations_publishing_metadata_trg/);
});

test("the shipped enhancement module evaluates and exposes its global handlers", () => {
  const vm = require("node:vm");
  const style = { setProperty() {} };
  const documentStub = {
    addEventListener() {},
    querySelectorAll() {
      return [];
    },
    getElementById() {
      return null;
    },
    documentElement: { style },
  };
  const ctx = vm.createContext({
    console,
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
    JSON,
    document: documentStub,
    addEventListener() {},
    innerWidth: 1024,
    innerHeight: 768,
    location: { search: "" },
  });
  vm.runInContext("var window = globalThis;", ctx);
  vm.runInContext(adminModel, ctx);
  vm.runInContext(
    "window.loadDataFromSupabase = async function(){}; window.destRowToObj = function(r){return r;};",
    ctx,
  );
  vm.runInContext(studio, ctx);
  const exposed = vm.runInContext(
    "JSON.stringify({home:typeof window.adminRenderHome, map:typeof window.adminRenderMapOverview, photos:typeof window.adminRenderPhotos, save:typeof window.adminSaveDest, switch:typeof window.switchAdminTab, media:typeof window.mediaGalleryHtml})",
    ctx,
  );
  const result = JSON.parse(exposed);
  assert.deepEqual(result, {
    home: "function",
    map: "function",
    photos: "function",
    save: "function",
    switch: "function",
    media: "function",
  });
});
