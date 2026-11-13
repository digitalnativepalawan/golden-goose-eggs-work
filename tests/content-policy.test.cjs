// Sample-content policy: the app must never present packaged demo content as if
// it came from the database.
//
// The field problem this pins down: PULSE_TRIBES, PULSE_EVENTS and TODAY_DATA
// were the fallback whenever a table came back empty, so a visitor could be shown
// invented travellers ("2 seats open. Let's split gas!") and invented businesses
// with prices ("Lechon by the Beach — ₱650 / plate"), plus a status report on an
// ATM nobody had checked. The Lounge had already made the opposite call for chat:
// "an honest empty room beats inventing company."
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { client, canon, has, count, after } = require("./support/client.cjs");

const app = client();
const html = fs.readFileSync("public/site/index.html", "utf8");

test("partner preview is off by default and always carries a visible not-live label", () => {
  assert.ok(has(app, "let partnerDemoMode = false;"));
  assert.ok(has(app, 'partnerDemoMode=localStorage.getItem("sanvic_partner_demo")==="1";'));
  assert.match(html, /onchange="togglePartnerDemo\(this\.checked\)"/);
  assert.match(html, /id="partnerDemoBanner"/);
  assert.match(html, /PARTNER PREVIEW · SAMPLE DATA · NOT LIVE/);
  assert.equal(has(app, "SHOW_SAMPLES_WHEN_DB_IS_EMPTY"), false);
});

test("answered empty and failed activity queries do not expose samples unless preview is enabled", () => {
  assert.ok(has(app, "if(partnerDemoMode)setPulsePartnerDemo(true);else{"));
  assert.ok(has(app, "PULSE_TRIBES.length=0;"));
  assert.ok(has(app, "PULSE_EVENTS.length=0;"));
  assert.ok(has(app, "if(partnerDemoMode){setTodayPartnerDemo(true);setPulsePartnerDemo(true);}"));
  assert.equal(has(app, "SHOW_SAMPLES_WHEN_DB_IS_EMPTY"), false);
});

test("preview shows sample feed posts but blocks writes to real engagement tables", () => {
  assert.ok(has(app, "const PARTNER_DEMO_FEED = ["));
  assert.ok(has(app, "if(partnerDemoMode){const posts=PARTNER_DEMO_FEED.filter"));
  assert.ok(has(app, "Sample feed posts · likes and replies are not saved."));
  assert.ok(
    has(app, "if(partnerDemoMode)return toast('Sample post — likes are not saved in preview.');"),
  );
  assert.ok(
    has(
      app,
      "if(partnerDemoMode)return toast('Turn off partner preview to publish a real post.');",
    ),
  );
  assert.ok(
    has(
      app,
      "if(partnerDemoMode)return toast('Turn off partner preview before creating a real tribe.');",
    ),
  );
  assert.ok(has(app, "Sample tribe chat · preview only"));
  assert.ok(has(app, "Sample event chat · preview only"));
});

test("Today cards use labeled samples only in preview and clear live lists otherwise", () => {
  assert.ok(has(app, "const TODAY_LIVE_KEYS = ['happening','joinable','locals','notices'];"));
  assert.ok(has(app, "if(partnerDemoMode)setTodayPartnerDemo(true);"));
  assert.ok(has(app, "else if(TODAY_LIVE_KEYS.indexOf(key)>=0)TODAY_DATA[target[key]]=[];"));
  assert.ok(has(app, "function setTodayPartnerDemo(enabled){"));
});

test("Today never reports counts it cannot see", () => {
  // Read the expression, not its brackets: Prettier drops the redundant ones.
  const tribe = after(app, "const tribeCount", 220);
  assert.ok(tribe.includes(canon("typeof PULSE_TRIBES !== 'undefined'")));
  assert.ok(tribe.includes(canon("Array.isArray(PULSE_TRIBES)")));
  assert.ok(tribe.includes(canon("PULSE_TRIBES.length : 0;")));
  assert.ok(has(app, "const happenCount = Array.isArray(d.happening) ? d.happening.length : 0;"));
  // The packaged snapshot numbers must not be a fallback for either count.
  assert.equal(after(app, "tribeCount", 160).includes(canon("d.snapshot.tribes")), false);
  assert.equal(after(app, "happenCount", 160).includes(canon("d.snapshot.happenings")), false);
});

test("every live Today list has a quiet empty state", () => {
  assert.ok(has(app, "function todayEmptyRow(text){"));
  // happening, joinable and locals each guard on length and fall through.
  const guards = ["happening", "joinable", "locals"].filter((key) =>
    has(app, `d.${key}.length ? d.${key}.map`),
  );
  assert.equal(guards.length, 3, `expected 3 guarded lists, found ${guards.length}`);
  const emptyRows = count(app, "todayEmptyRow(");
  assert.equal(emptyRows, 4, "helper definition plus three call sites");
  // notices use their own list markup.
  assert.ok(has(app, "d.notices.length ? d.notices.map"));
  assert.ok(has(app, "tnotice-empty"));
});

test("the packaged samples remain available for explicit partner preview", () => {
  // Keep the fixtures available, but only show them behind the opt-in preview.
  assert.ok(has(app, "const PULSE_TRIBES = ["));
  assert.ok(has(app, "const PULSE_EVENTS = ["));
  assert.ok(has(app, "const TODAY_DATA = {"));
});

test("each empty list gets its own honest copy", () => {
  // One shared empty state used to tell people to "start the first tribe" under
  // the event list, which is the wrong instruction in the wrong place — and the
  // old samples hid it, because the list was never empty.
  assert.ok(has(app, "function emptyStateHTML(kind){"));
  assert.ok(has(app, "if(kind === 'events'){"));
  assert.ok(has(app, "body.innerHTML = emptyStateHTML('events');"));
  assert.ok(has(app, "No events listed yet."));
  assert.ok(has(app, "No tribes yet."));
  // Nothing may still call it with no argument and hope for the best.
  assert.equal(has(app, "emptyStateHTML()"), false);
});

test("no control ships without something to do", () => {
  // "View all" sat in the tribes header with no handler at all. It now only
  // appears when a category filter is on, and clears it.
  assert.equal(has(app, '<button class="pv2-viewall">'), false);
  // The bracket around the condition is Prettier's to add or drop, so it is not
  // part of what this pins: the button follows a category filter being on.
  assert.ok(has(app, `pulseCategory!=='all' ? \`<button class="pv2-viewall"`));
  assert.ok(has(app, `onclick="selectPulseCategoryV2('all')"`));
});
