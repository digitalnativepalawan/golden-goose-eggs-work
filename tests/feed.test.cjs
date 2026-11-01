// The Pulse feed: reachable, honest, and separate from the tribe filters.
//
// The feed code, its tables, the photo bucket and the Backoffice moderation
// screen all existed — but no view pointed at it, so a visitor could not post
// and the moderation tab had nothing to moderate. These cases keep the entry
// point from disappearing again.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { client, canon, has, after, between } = require("./support/client.cjs");

const app = client();
const html = fs.readFileSync("public/site/index.html", "utf8");

test("the feed is one of the Pulse views", () => {
  assert.match(html, /class="pv2-vtab" data-view="feed" onclick="selectPulseView\('feed'\)"/);
  const tabs = [...html.matchAll(/class="pv2-vtab[^"]*" data-view="(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(tabs, ["tribes", "feed", "events", "lounge", "form"]);
  // ...and the tab row lays out five of them.
  assert.match(html, /\.pv2-viewtabs\{[^}]*repeat\(5,minmax\(0,1fr\)\)/);
});

test("selecting the feed renders the feed", () => {
  assert.ok(has(app, "else if(pulseView==='feed'){ renderPulseFeed();"));
});

test("the feed has a way in to the composer", () => {
  assert.ok(has(app, 'onclick="openPulseCompose()"'));
  assert.ok(has(app, "function openPulseCompose(){"));
  // The empty state must not be a dead end either.
  assert.ok(has(app, "Write a post"));
});

test("feed channels are not tribe tags", () => {
  // Sharing pulseCategory meant picking "Surf" in Active Tribes emptied the feed.
  assert.ok(has(app, "let pulseFeedCategory = 'all';"));
  assert.ok(has(app, "const FEED_CHANNEL_ORDER = ["));
  assert.ok(has(app, "function feedChannels(){"));
  const feed = between(app, "async function renderPulseFeed()", "// Pulse photos were previously");
  assert.ok(feed.includes(canon("pulseFeedCategory !== 'all'")));
  assert.equal(
    feed.includes(canon("pulseCategory")),
    false,
    "renderPulseFeed must not read the tribe filter",
  );
  assert.ok(has(app, "pulseFeedCategory = 'all';\n  pulseTab = 'feed';"));
});

test("an empty feed says it is empty, a failed one says it failed", () => {
  assert.ok(has(app, "No posts yet."));
  assert.ok(has(app, "Could not load the feed."));
  assert.ok(has(app, "Try again"));
  // The two states must not be the same screen.
  const failed = between(app, "Could not load the feed.", "No posts yet.");
  assert.equal(failed.includes(canon("No posts yet")), false);
});

test("the feed still shows nothing it was not given", () => {
  // Content-policy rule, applied to the newest surface.
  assert.equal(has(app, "const PULSE_POSTS"), false);
  const feed = between(app, "async function renderPulseFeed()", "// Pulse photos were previously");
  assert.equal(
    feed.includes(canon("PULSE_POSTS")) || feed.includes(canon("SAMPLE_")),
    false,
    "no packaged posts may be substituted",
  );
});

test("posting resets the channel and lands back on the feed", () => {
  const submit = between(app, "async function submitPulsePost()", "// HERO WEATHER WIDGET");
  assert.ok(submit.includes(canon("closePulseCompose();")));
  assert.ok(submit.includes(canon("pulseFeedCategory = 'all';")));
  assert.ok(submit.includes(canon("await renderPulseFeed();")));
});

test("the feed schema ships as a migration the user can run", () => {
  const sql = fs.readFileSync("supabase/migrations/20261030120000_pulse_feed_schema.sql", "utf8");
  for (const column of [
    "display_name",
    "is_anonymous",
    "admin_post",
    "location_text",
    "image_url",
  ]) {
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
  assert.ok(has(app, "function applyPulseHeading(view){"));
  assert.ok(has(app, "const PULSE_VIEW_HEADINGS = {"));
  assert.ok(has(app, "applyPulseHeading(view);"));
  assert.ok(has(app, "title: 'Feed',"));
  // Everything that is not the feed keeps the copy it shipped with.
  assert.ok(
    has(app, "const PULSE_DEFAULT_HEADING = { title:'Tribes', sub:'Find your tribe today.'"),
  );
});

test("the feed's channels are the categories the Backoffice edits", () => {
  // A second hardcoded list meant a category added in the Backoffice could never
  // be posted to, and a renamed one never showed up in the feed.
  assert.ok(has(app, "function feedChannels(){"));
  assert.ok(has(app, "FEED_CHANNEL_ORDER.filter(k=>PULSE_CATEGORIES[k])"));
  assert.equal(has(app, "const FEED_CHANNELS = ["), false, "no duplicate channel list");
  // The chips and the composer dropdown both read it.
  assert.ok(has(app, "const chips = feedChannels().map"));
  assert.ok(has(app, "function renderPulseComposeCategoryMenu(){"));
  assert.ok(has(app, "menu.innerHTML = feedChannels().map"));
  // And the markup no longer carries its own copy of the six channels.
  assert.equal(/data-val="hidden" data-label="Hidden Spots"/.test(html), false);
  assert.match(
    html,
    /<div id="pulseComposeCatMenu" class="pulse-custom-menu" style="display:none;"><\/div>/,
  );
});

test("saving a category in the Backoffice refreshes what visitors see", () => {
  // refreshPulseCategoryChips() called applyPulseCategoryLabelsToChips(), which
  // was never written: the save threw and nothing on screen changed.
  assert.equal(
    has(app, "applyPulseCategoryLabelsToChips"),
    false,
    "no call to a function that does not exist",
  );
  const fn = after(app, "async function refreshPulseCategoryChips()", 400);
  assert.ok(fn.includes(canon("await loadPulseCategoriesFromDB();")));
  assert.ok(fn.includes(canon("renderPulseComposeCategoryMenu();")));
  assert.ok(fn.includes(canon("if(pulseView === 'feed') renderPulseFeed();")));
  // The labels are loaded when Pulse opens, not only when an admin saves.
  assert.ok(has(app, "loadPulseCategoriesFromDB().then(()=>{"));
});
