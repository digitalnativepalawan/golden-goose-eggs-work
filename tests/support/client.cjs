// Reading the shipped client without depending on how it is laid out.
//
// These tests pin behaviour that has broken in the field: a constant that
// stopped being consulted, an empty state that went missing, a filter that
// leaked into the feed. They used to pin it by matching source text exactly,
// which meant the code could not be reformatted or split without ~20 assertions
// failing for reasons that have nothing to do with behaviour.
//
// Two things fix that here:
//
//   1. The file list comes from the page itself - the loader arrays in
//      index.html and supabase-config.js. Splitting the app into several files
//      only has to update those lists, and every test follows.
//   2. `has(code, "if(x){y();}")` compares both sides with whitespace removed
//      and quotes made uniform. A snippet that appears in the file still
//      matches after Prettier moves it, and the same snippet still fails when
//      the code stops doing that thing.
//
// Why whitespace removal is safe: it is applied character by character to both
// the file and the snippet, so a snippet that is present stays present. The
// trade is that it can also match across a line break it would not have matched
// before - a false positive, never a false negative - which is the same slack
// the previous regexes already had.
//
// This is a text-matching layer, not a parser, and deliberately small enough to
// read in one sitting.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");
const SITE = path.join(ROOT, "public", "site");

const read = (file) => fs.readFileSync(path.join(SITE, file), "utf8");
const readRoot = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), "utf8");

// Load order as the page declares it: the tag in index.html, then the array in
// the inline loader, then the modules supabase-config.js appends.
function scriptFiles() {
  const seen = new Set();
  const order = [];
  const push = (file) => {
    if (!/^[\w.-]+\.js$/.test(file)) return;
    if (!fs.existsSync(path.join(SITE, file))) return;
    if (seen.has(file)) return;
    seen.add(file);
    order.push(file);
  };
  const html = read("index.html");
  for (const m of html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)) push(m[1]);
  for (const m of html.matchAll(/'([\w.-]+\.js)'/g)) push(m[1]);
  for (const m of read("supabase-config.js").matchAll(/'([\w.-]+\.js)'/g)) push(m[1]);
  return order;
}

// Every shipped script, concatenated in load order.
const client = () => scriptFiles().map(read).join("\n");

// Just the app: the files the loader places after the pure models and before
// the Backoffice enhancement layer. A test that means "the app and nothing
// else" should read this rather than the whole client, so a string that only
// appears in admin-studio.js (a `title="` attribute, say) cannot make it fail.
function appFiles() {
  const order = scriptFiles();
  const from = order.indexOf("admin-model.js") + 1;
  const to = order.indexOf("admin-studio.js");
  return order.slice(from, to);
}

const appSource = () => appFiles().map(read).join("\n");

// Whitespace gone, quotes uniform. Comments are kept, because one assertion
// pins the reasoning written next to the code.
const canon = (code) => String(code).replace(/\s+/g, "").replace(/['"`]/g, '"');

const has = (code, snippet) => canon(code).includes(canon(snippet));

function count(code, snippet) {
  const needle = canon(snippet);
  if (!needle) return 0;
  const haystack = canon(code);
  let total = 0;
  let at = haystack.indexOf(needle);
  while (at !== -1) {
    total += 1;
    at = haystack.indexOf(needle, at + needle.length);
  }
  return total;
}

// The code that follows a marker, so a rule can be read out of its surroundings
// without hard-coding how far away it sits.
function after(code, marker, size = 400) {
  const haystack = canon(code);
  const at = haystack.indexOf(canon(marker));
  return at < 0 ? "" : haystack.slice(at, at + size);
}

// One function, read out of the file by its opening line and the next marker.
// Returned canonicalised, so callers compare against `canon(...)` snippets or
// plain text that goes through `has`. Throws rather than returning "" so a
// renamed function shows up as a failure where the test lives.
function between(code, start, end) {
  const haystack = canon(code);
  const from = haystack.indexOf(canon(start));
  if (from < 0) throw new Error(`marker not found: ${start}`);
  const to = haystack.indexOf(canon(end), from + 1);
  if (to < 0) throw new Error(`end marker not found: ${end}`);
  return haystack.slice(from, to);
}

// CSS is canonicalised the same way, so `.place-pin{width:12px}` matches however
// the rule is laid out.
const canonCss = (css) => canon(css);
const cssHas = (css, snippet) => has(css, snippet);
const cssAfter = (css, marker, size = 400) => after(css, marker, size);

module.exports = {
  ROOT,
  SITE,
  read,
  readRoot,
  scriptFiles,
  client,
  appFiles,
  appSource,
  canon,
  has,
  count,
  after,
  between,
  canonCss,
  cssHas,
  cssAfter,
};
