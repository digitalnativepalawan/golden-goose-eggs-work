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

const app = fs.readFileSync("public/site/app.js", "utf8");

test("samples are off by default and the switch is one constant", () => {
  assert.match(app, /const SHOW_SAMPLES_WHEN_DB_IS_EMPTY = false;/);
  // It must actually be consulted, not just declared.
  const uses = app.match(/SHOW_SAMPLES_WHEN_DB_IS_EMPTY/g) || [];
  assert.ok(uses.length >= 3, `policy constant referenced ${uses.length} time(s)`);
});

test("an answered query replaces samples even when it answers none", () => {
  for (const [name, row] of [
    ["tribes", "tribesRes"],
    ["events", "eventsRes"],
  ]) {
    const block = app.slice(app.indexOf(`if(${row} && !${row}.error`), app.indexOf(`if(${row} && !${row}.error`) + 260);
    assert.ok(block.includes(`Array.isArray(${row}.data)`), `${name}: must require an array answer`);
    assert.ok(block.includes(`|| !SHOW_SAMPLES_WHEN_DB_IS_EMPTY`), `${name}: empty answer must clear the samples`);
  }
  // The old unconditional length check is the bug; make sure it is gone.
  assert.equal(/if\(tribesRes && tribesRes\.data && tribesRes\.data\.length\)\{/.test(app), false);
  assert.equal(/if\(eventsRes && eventsRes\.data && eventsRes\.data\.length\)\{/.test(app), false);
});

test("Today cards describe today, so they are live or empty", () => {
  assert.match(app, /const TODAY_LIVE_KEYS = \['happening','joinable','locals','notices'\];/);
  // Missing rows for those keys must clear the packaged copy.
  assert.match(app, /else if\(!SHOW_SAMPLES_WHEN_DB_IS_EMPTY && TODAY_LIVE_KEYS\.indexOf\(key\) >= 0\) TODAY_DATA\[target\[key\]\] = \[\];/);
  // A failed query is offline demo mode and leaves the samples alone.
  assert.match(app, /On a failed query nothing changes/);
});

test("Today never reports counts it cannot see", () => {
  assert.match(app, /const tribeCount\s*=\s*\(typeof PULSE_TRIBES !== 'undefined' && Array\.isArray\(PULSE_TRIBES\)\) \? PULSE_TRIBES\.length : 0;/);
  assert.match(app, /const happenCount\s*=\s*Array\.isArray\(d\.happening\) \? d\.happening\.length : 0;/);
  // The packaged snapshot numbers must not be a fallback for either count.
  assert.equal(/tribeCount[\s\S]{0,160}d\.snapshot\.tribes/.test(app), false);
  assert.equal(/happenCount[\s\S]{0,160}d\.snapshot\.happenings/.test(app), false);
});

test("every live Today list has a quiet empty state", () => {
  assert.match(app, /function todayEmptyRow\(text\)\{/);
  // happening, joinable and locals each guard on length and fall through.
  const guards = app.match(/d\.(happening|joinable|locals)\.length \? d\.\1\.map/g) || [];
  assert.equal(guards.length, 3, `expected 3 guarded lists, found ${guards.length}`);
  const emptyRows = app.match(/todayEmptyRow\(/g) || [];
  assert.equal(emptyRows.length, 4, "helper definition plus three call sites");
  // notices use their own list markup.
  assert.match(app, /d\.notices\.length \? d\.notices\.map/);
  assert.match(app, /tnotice-empty/);
});

test("the packaged samples are still there for the offline demo", () => {
  // Removing them would leave the app blank with no connection; the rule is about
  // when they may be shown, not about deleting them.
  assert.match(app, /const PULSE_TRIBES = \[/);
  assert.match(app, /const PULSE_EVENTS = \[/);
  assert.match(app, /const TODAY_DATA = \{/);
});

test("each empty list gets its own honest copy", () => {
  // One shared empty state used to tell people to "start the first tribe" under
  // the event list, which is the wrong instruction in the wrong place — and the
  // old samples hid it, because the list was never empty.
  assert.match(app, /function emptyStateHTML\(kind\)\{/);
  assert.match(app, /if\(kind === 'events'\)\{/);
  assert.match(app, /body\.innerHTML = emptyStateHTML\('events'\);/);
  assert.match(app, /No events listed yet\./);
  assert.match(app, /No tribes yet\./);
  // Nothing may still call it with no argument and hope for the best.
  assert.equal(/emptyStateHTML\(\)/.test(app), false);
});

test("no control ships without something to do", () => {
  // "View all" sat in the tribes header with no handler at all. It now only
  // appears when a category filter is on, and clears it.
  assert.equal(/<button class="pv2-viewall">/.test(app), false);
  assert.match(app, /pulseCategory!=='all'\) \? `<button class="pv2-viewall" onclick="selectPulseCategoryV2\('all'\)"/);
});
