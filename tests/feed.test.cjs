// The Pulse feed: reachable, honest, and separate from the tribe filters.
//
// The feed code, its tables, the photo bucket and the Backoffice moderation
// screen all existed — but no view pointed at it, so a visitor could not post
// and the moderation tab had nothing to moderate. These cases keep the entry
// point from disappearing again.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("public/site/app.js", "utf8");
const html = fs.readFileSync("public/site/index.html", "utf8");

test("the feed is one of the Pulse views", () => {
  assert.match(html, /class="pv2-vtab" data-view="feed" onclick="selectPulseView\('feed'\)"/);
  const tabs = [...html.matchAll(/class="pv2-vtab[^"]*" data-view="(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(tabs, ["tribes", "feed", "events", "lounge", "form"]);
  // ...and the tab row lays out five of them.
  assert.match(html, /\.pv2-viewtabs\{[^}]*repeat\(5,minmax\(0,1fr\)\)/);
});

test("selecting the feed renders the feed", () => {
  assert.match(app, /else if\(pulseView==='feed'\)\{\s*\n\s*renderPulseFeed\(\);/);
});

test("the feed has a way in to the composer", () => {
  assert.match(app, /onclick="openPulseCompose\(\)"/);
  assert.match(app, /function openPulseCompose\(\)\{/);
  // The empty state must not be a dead end either.
  assert.match(app, /Write a post/);
});

test("feed channels are not tribe tags", () => {
  // Sharing pulseCategory meant picking "Surf" in Active Tribes emptied the feed.
  assert.match(app, /let pulseFeedCategory = 'all';/);
  assert.match(app, /const FEED_CHANNEL_ORDER = \[/);
  assert.match(app, /function feedChannels\(\)\{/);
  const feed = app.slice(app.indexOf("async function renderPulseFeed()"), app.indexOf("// Pulse photos were previously"));
  assert.match(feed, /pulseFeedCategory !== 'all'/);
  assert.equal(/pulseCategory/.test(feed), false, "renderPulseFeed must not read the tribe filter");
  assert.match(app, /pulseFeedCategory = 'all';\n  pulseTab = 'feed';/);
});

test("an empty feed says it is empty, a failed one says it failed", () => {
  assert.match(app, /No posts yet\./);
  assert.match(app, /Could not load the feed\./);
  assert.match(app, /Try again/);
  // The two states must not be the same screen.
  const failed = app.slice(app.indexOf("Could not load the feed."), app.indexOf("No posts yet."));
  assert.equal(/No posts yet/.test(failed), false);
});

test("the feed still shows nothing it was not given", () => {
  // Content-policy rule, applied to the newest surface.
  assert.equal(/const PULSE_POSTS/.test(app), false);
  const feed = app.slice(app.indexOf("async function renderPulseFeed()"), app.indexOf("// Pulse photos were previously"));
  assert.equal(/PULSE_POSTS\b|SAMPLE_\w+/.test(feed), false, "no packaged posts may be substituted");
});

test("posting resets the channel and lands back on the feed", () => {
  const submit = app.slice(app.indexOf("async function submitPulsePost()"), app.indexOf("// ═══════════════════════════════════════════════════════\n// HERO WEATHER WIDGET"));
  assert.match(submit, /closePulseCompose\(\);/);
  assert.match(submit, /pulseFeedCategory = 'all';/);
  assert.match(submit, /await renderPulseFeed\(\);/);
});

test("the feed schema ships as a migration the user can run", () => {
  const sql = fs.readFileSync("supabase/migrations/20261030120000_pulse_feed_schema.sql", "utf8");
  for (const column of ["display_name", "is_anonymous", "admin_post", "location_text", "image_url"]) {
    assert.match(sql, new RegExp(`ADD COLUMN IF NOT EXISTS ${column}`), `pulse_posts.${column}`);
  }
  assert.match(sql, /CREATE POLICY "Anyone can create pulse posts"/);
  assert.match(sql, /'pulse-media'/);
  // Safe to run twice.
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.pulse_posts/);
  assert.match(sql, /DROP POLICY IF EXISTS "Anyone can create pulse posts"/);
});

test("the heading follows the view it is describing", () => {
  // Five views used to sit under a heading that said "Tribes".
  assert.match(html, /<span class="pv2-title" id="pv2Title">Tribes<\/span>/);
  assert.match(app, /function applyPulseHeading\(view\)\{/);
  assert.match(app, /const PULSE_VIEW_HEADINGS = \{/);
  assert.match(app, /applyPulseHeading\(view\);/);
  assert.match(app, /title: 'Feed',/);
  // Everything that is not the feed keeps the copy it shipped with.
  assert.match(app, /const PULSE_DEFAULT_HEADING = \{ title:'Tribes', sub:'Find your tribe today\.'/);
});

test("the feed's channels are the categories the Backoffice edits", () => {
  // A second hardcoded list meant a category added in the Backoffice could never
  // be posted to, and a renamed one never showed up in the feed.
  assert.match(app, /function feedChannels\(\)\{/);
  assert.match(app, /FEED_CHANNEL_ORDER\.filter\(k=>PULSE_CATEGORIES\[k\]\)/);
  assert.equal(/const FEED_CHANNELS = \[/.test(app), false, "no duplicate channel list");
  // The chips and the composer dropdown both read it.
  assert.match(app, /const chips = feedChannels\(\)\.map/);
  assert.match(app, /function renderPulseComposeCategoryMenu\(\)\{/);
  assert.match(app, /menu\.innerHTML = feedChannels\(\)\.map/);
  // And the markup no longer carries its own copy of the six channels.
  assert.equal(/data-val="hidden" data-label="Hidden Spots"/.test(html), false);
  assert.match(html, /<div id="pulseComposeCatMenu" class="pulse-custom-menu" style="display:none;"><\/div>/);
});

test("saving a category in the Backoffice refreshes what visitors see", () => {
  // refreshPulseCategoryChips() called applyPulseCategoryLabelsToChips(), which
  // was never written: the save threw and nothing on screen changed.
  assert.equal(/applyPulseCategoryLabelsToChips/.test(app), false, "no call to a function that does not exist");
  const fn = app.slice(app.indexOf("async function refreshPulseCategoryChips()"), app.indexOf("async function refreshPulseCategoryChips()") + 400);
  assert.match(fn, /await loadPulseCategoriesFromDB\(\);/);
  assert.match(fn, /renderPulseComposeCategoryMenu\(\);/);
  assert.match(fn, /if\(pulseView === 'feed'\) renderPulseFeed\(\);/);
  // The labels are loaded when Pulse opens, not only when an admin saves.
  assert.match(app, /loadPulseCategoriesFromDB\(\)\.then\(\(\)=>\{/);
});
