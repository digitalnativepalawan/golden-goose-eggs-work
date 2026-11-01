// DOM contract: shipped code must not reach for an element id that nothing
// creates.
//
// This is the automated version of a manual audit that found nine dangling
// lookups. Seven of them were in a video-upload path replaced by the media
// gallery, and two were header writes left behind when Pulse was rebuilt — all
// of them would throw at the moment a person used that screen, and none of them
// are visible to a unit test that only reads source.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { read, scriptFiles, canon, has, count } = require("./support/client.cjs");

// Looked up on purpose, and handled when absent. Keep this list short and say why.
const INTENTIONALLY_OPTIONAL = {
  appShell: "app.js mounts overlays into #appShell||document.body",
};

// The scripts the page actually loads, in load order, so a file that is split
// into several is still all read.
const js = scriptFiles()
  .map((f) => read(f))
  .join("\n");
const html = fs.readFileSync("public/site/index.html", "utf8");

function createdIds() {
  const ids = new Set();
  for (const src of [html, js]) {
    for (const m of src.matchAll(/\bid=["']([^"']+)["']/g)) ids.add(m[1]);
    for (const m of src.matchAll(/\.id\s*=\s*["']([^"']+)["']/g)) ids.add(m[1]);
  }
  return ids;
}

function lookedUpIds() {
  const ids = new Set();
  // Both quote styles: which one is used is the formatter's decision, and a
  // single-quote-only pattern silently stopped seeing every lookup.
  for (const m of js.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)) ids.add(m[1]);
  return ids;
}

test("every id the client looks up is one the app actually creates", () => {
  const created = createdIds();
  const dangling = [...lookedUpIds()].filter((id) => !created.has(id)).sort();
  const explained = [...dangling].filter((id) => id in INTENTIONALLY_OPTIONAL);
  const unexplained = dangling.filter((id) => !(id in INTENTIONALLY_OPTIONAL));
  assert.deepEqual(unexplained, [], `looked up but never created: ${unexplained.join(", ")}`);
  // An allowlist entry that is no longer needed should be removed, not kept as
  // decoration.
  const stale = Object.keys(INTENTIONALLY_OPTIONAL).filter((id) => !dangling.includes(id));
  assert.deepEqual(stale, [], `allowlist entries no longer dangling: ${stale.join(", ")}`);
  assert.ok(explained.length <= 2, "the allowlist is meant to stay tiny");
});

test("superseded admin helpers are safe to call instead of half-alive", () => {
  // Both were replaced by the media gallery and used to reach for #adfVideo*
  // markup that no longer exists.
  assert.ok(has(js, "function adminToggleVideoFields(){ return; }"));
  assert.ok(has(js, "async function adminUploadVideoIfNeeded(){ return null;"));
  assert.equal(has(js, "getElementById('adfVideo"), false);
});

test("the live media path is the one the forms call", () => {
  assert.ok(has(js, "async function mediaUploadVideoIfNeeded(containerId)"));
  const callers = count(js, "mediaUploadVideoIfNeeded('");
  assert.ok(callers >= 5, `expected every form to use it, found ${callers}`);
});

test("feed state is declared before anything reads it", () => {
  // pulseTab was written by the v1 feed and never declared, so the first line of
  // the feed renderer threw ReferenceError instead of drawing a feed.
  const source = canon(js);
  const decl = source.indexOf(canon("let pulseTab = 'feed';"));
  assert.ok(decl > 0, "pulseTab must be declared");
  // Every mention of it must come after the declaration, or the first one throws.
  const firstUse = source.indexOf("pulseTab", decl + 1);
  assert.ok(firstUse > decl, "every use of pulseTab must follow its declaration");
  assert.equal(
    source.slice(0, decl).includes("pulseTab"),
    false,
    "pulseTab is read before it is declared",
  );
});
