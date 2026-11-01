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
const { client, canon, has, count, after } = require("./support/client.cjs");

const app = client();

test("samples are off by default and the switch is one constant", () => {
  assert.ok(has(app, "const SHOW_SAMPLES_WHEN_DB_IS_EMPTY = false;"));
  // It must actually be consulted, not just declared.
  const uses = count(app, "SHOW_SAMPLES_WHEN_DB_IS_EMPTY");
  assert.ok(uses >= 3, `policy constant referenced ${uses} time(s)`);
});

test("an answered query replaces samples even when it answers none", () => {
  for (const [name, row] of [
    ["tribes", "tribesRes"],
    ["events", "eventsRes"],
  ]) {
    const block = after(app, `if(${row} && !${row}.error`, 300);
    assert.ok(
      block.includes(canon(`Array.isArray(${row}.data)`)),
      `${name}: must require an array answer`,
    );
    assert.ok(
      block.includes(canon(`|| !SHOW_SAMPLES_WHEN_DB_IS_EMPTY`)),
      `${name}: empty answer must clear the samples`,
    );
  }
  // The old unconditional length check is the bug; make sure it is gone.
  assert.equal(has(app, "if(tribesRes && tribesRes.data && tribesRes.data.length){"), false);
  assert.equal(has(app, "if(eventsRes && eventsRes.data && eventsRes.data.length){"), false);
});

test("Today cards describe today, so they are live or empty", () => {
  assert.ok(has(app, "const TODAY_LIVE_KEYS = ['happening','joinable','locals','notices'];"));
  // Missing rows for those keys must clear the packaged copy.
  assert.ok(
    has(
      app,
      "else if(!SHOW_SAMPLES_WHEN_DB_IS_EMPTY && TODAY_LIVE_KEYS.indexOf(key) >= 0) TODAY_DATA[target[key]] = [];",
    ),
  );
  // A failed query is offline demo mode and leaves the samples alone.
  assert.ok(has(app, "On a failed query nothing changes"));
});

test("Today never reports counts it cannot see", () => {
  assert.ok(
    has(
      app,
      "const tribeCount = (typeof PULSE_TRIBES !== 'undefined' && Array.isArray(PULSE_TRIBES)) ? PULSE_TRIBES.length : 0;",
    ),
  );
  assert.ok(
    has(app, "const happenCount = Array.isArray(d.happening) ? d.happening.length : 0;"),
  );
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

test("the packaged samples are still there for the offline demo", () => {
  // Removing them would leave the app blank with no connection; the rule is about
  // when they may be shown, not about deleting them.
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
  assert.ok(has(app, `pulseCategory!=='all') ? \`<button class="pv2-viewall"`));
  assert.ok(has(app, `onclick="selectPulseCategoryV2('all')"`));
});
