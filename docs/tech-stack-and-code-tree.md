# SANVIC — Tech Stack, Code Tree & Flow

Verified **2026-11-09** on branch `arena/afee70dd-golden-goose-eggs-work`
(HEAD `6f03786`, "Cleanup: remove dead weight, fix search matching, format, split
app.js into seven files"). Every count below was taken from the files on disk
and from a clean `npm ci` + lint/typecheck/test/build run, not from earlier
notes. This file supersedes the 2026-11-01 version.

SANVIC is an interactive map and community platform for San Vicente, Palawan:
beaches, islands, stays, food and services for travellers, plus Tribes, Events,
The Hunt, stories (Pulse) and a Backoffice for the people who edit the content.

---

## 1. What actually ships

One repository, **two surfaces**, and only one of them is in the deploy.

| Surface                                               | Path           | Status                                                                                                        |
| ----------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------- |
| **The product** — vanilla-JS single page              | `public/site/` | Live. All real work happens here. 22,657 lines, no build step.                                                |
| **React/TanStack shell** (SSR, `/`, `/api/tala-chat`) | `src/`         | Development only under the current `vercel.json`. Not built, not served in production. Used by `npm run dev`. |

The product is **static files with no build step**. The app scripts and
`index.html` are loaded as written. There is no bundler, no TypeScript and no
framework in the shipped product.

Vendor code is CDN-loaded, so it is absent from `package.json`:
Leaflet 1.9.4, `@supabase/supabase-js` 2 (UMD), Google Fonts.

### How it is deployed

`vercel.json` is the single source of truth:

```json
{
  "framework": null,
  "buildCommand": null,
  "installCommand": null,
  "outputDirectory": "public/site",
  "rewrites": [{ "source": "/api/tala-chat", "destination": "/api/tala" }]
}
```

That means production is **`public/site/` served verbatim plus the one Vercel
Function at `api/tala.js`**. No `vite build` runs on Vercel. Consequences:

- `/site/index.html` is the app; `/` on Vercel has no SSR redirect (the static
  host serves `public/site` as the root, so `/` resolves to `index.html`).
- The React shell's routes are not reachable in production. The old passcode
  `/admin` page was deleted on 2026-11-09; the only admin surface now is the
  in-app Backoffice below.
- Cache headers: HTML `max-age=0, must-revalidate`, `/assets/*` immutable for a
  year, `/api/*` `no-store`.

`npm run build` still succeeds (Nitro → `.output/`, Cloudflare-compatible), so a
full TanStack Start deploy remains possible. It is simply not what `vercel.json`
does today.

### One admin surface

1. **In-app Backoffice** (`admin-studio.js` + `app-backoffice.js` + the other
   app scripts). No login, no PIN, and no visible control: it opens from three
   taps on the SANVIC.PH logo in the header, or via `?admin=1`. Writes with the
   public publishable key, permitted by
   `supabase/migrations/20261101090000_open_backoffice_writes.sql`. Photo
   Photo uploads use the publishable key too. The shared gallery
   (`mediaGalleryHtml` → `studioStoreImageFile`) posts to the
   `destination-images` bucket, which
   `20261101090000_open_backoffice_writes.sql` opened to `anon`; a session token
   is sent only when one happens to exist. Before 2026-11-09 this path threw
   "Sign in with an admin account" and every photo picker silently failed.
2. **The old `/admin` React page is gone.** Removed 2026-11-09 together with
   `src/routes/api/admin.ts`, `src/lib/admin-helpers.ts`,
   `src/components/admin/kmz-panel.tsx` and the service-role client it used. It
   was a redundant second admin surface with a passcode; git history keeps it if
   it is ever wanted again. There is no passcode anywhere in the repo now.

---

## 2. Boot sequence

`index.html` loads things in a fixed order. Order matters — the app scripts
expect `sb` to exist, and they share one global scope.

```
index.html
├─ <head>  Leaflet CSS, Google Fonts, inline <style> (the bulk of the design system)
├─ Leaflet JS (unpkg)
├─ supabase-js UMD (unpkg)
├─ inline: window.SANVIC_DEPLOY_VERSION, window.SANVIC_SPLASH_HOLD = 4500
├─ barangays.geojson.js          PSA Dec-2023 barangay boundaries
├─ inline loader (?v=DEPLOY_VERSION, async=false → strict order):
│    1. supabase-config.js       creates `sb`; then appends entry-flow,
│                                personalize, pulse-demo-content
│    2. explore-model.js         pure Explore state
│    3. admin-model.js           pure Backoffice rules
│    4. app-core.js              data, samples policy, live-data state (252 ln)
│    5. app-map-explore-today.js identity, taxonomy + icons, map, Today, Explore (2,943 ln)
│    6. app-pulse.js             feed, tribes, events, Lounge (2,644 ln)
│    7. app-weather.js           hero weather widget, then boot on `load` (1,374 ln)
│    8. app-backoffice.js        the in-app Backoffice panel (1,413 ln)
│    9. app-place-details.js     the place sheet: gallery, video, tips, contacts (2,595 ln)
│   10. app-pulse-admin-my-sanvic-hunt.js  moderation, My Sanvic, the Hunt (1,390 ln)
│   11. admin-studio.js          Backoffice UI, overrides window.openAdminPanel (2,979 ln)
│   12. kmz-import.js            KMZ upload UI (426 ln)
├─ explore-ux.css
└─ admin-ux.css
```

That is 15 app JavaScript files (12 loader entries + the 3 appended by
`supabase-config.js`), plus `barangays.geojson.js` — 16 `.js` files in
`public/site/`.

The app was one 12,617-line `app.js` until the Phase 4 split; entries 4–10 are
that file cut at section boundaries and loaded in the same order, so nothing
about execution changed (12,611 lines after Prettier removed six blank joins).
They share one global scope, as `app.js` always did.

`app-weather.js` listens for `load` and starts: hide the splash after
`SANVIC_SPLASH_HOLD`, then `initAuth()` (device identity), weather, then show the
dock. The map is lazy: it initialises when the map view is first shown.

**Bump `SANVIC_DEPLOY_VERSION` in `index.html` for any deploy that changes JS.**
Every script and module is fetched with `?v=<stamp>`, which is how a phone is
stopped from running yesterday's app. There is a second, independent stamp in
`src/lib/buildVersion.ts` for the React shell; it does not affect the product.

### Deleted in the 2026-11-01 cleanup — do not recreate

Three files that were present but never loaded have been removed:

| File                        | Why it was dead                                                                                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry-polish.js`           | CSS-only refinement of an entry card that no longer exists; nothing referenced it                                                                                                   |
| `map-pin-boost.js`          | Polygon visual-centre maths for pins. The app has its own `barangayAnchor()` (in `app-map-explore-today.js`) which prefers on-land places and never drags a town dot onto an island |
| `barangay-marker-polish.js` | Same ground as `map-pin-boost.js`; map hierarchy belongs to the app                                                                                                                 |

---

## 3. Code tree

```
golden-goose-eggs-work/
├── public/site/                    # ★ THE PRODUCT — static, no build step, 22,657 lines
│   ├── index.html        2,497 ln  # every screen's markup + the design system CSS
│   ├── app-core.js         252 ln  # data, samples policy, live-data state
│   ├── app-map-explore-today.js 2,943 ln # identity, taxonomy + icons, map, Today, Explore
│   ├── app-pulse.js      2,644 ln  # Pulse: feed, tribes, events, Lounge
│   ├── app-weather.js    1,374 ln  # hero weather widget, then boot on `load`
│   ├── app-backoffice.js 1,413 ln  # the in-app Backoffice panel
│   ├── app-place-details.js 2,595 ln # the place sheet: gallery, video, tips, contacts
│   ├── app-pulse-admin-my-sanvic-hunt.js 1,390 ln # moderation, My Sanvic, the Hunt
│   ├── admin-studio.js   2,979 ln  # Backoffice UI (overrides openAdminPanel)
│   ├── admin-model.js      447 ln  # Backoffice rules: publishing, validation (unit-tested)
│   ├── kmz-import.js       426 ln  # KMZ/KML upload + preview
│   ├── entry-flow.js       235 ln  # first-visit questions (OFF — see §8)
│   ├── personalize.js      129 ln  # locale, units, preferences
│   ├── explore-model.js    258 ln  # Explore filtering/sorting (unit-tested, pure)
│   ├── pulse-demo-content.js 73 ln # Pulse seed content
│   ├── supabase-config.js   26 ln  # project URL + publishable key + module loader
│   ├── barangays.geojson.js        # 32 KB boundary geometry
│   ├── admin-ux.css      1,826 ln  # Backoffice layout (phone drawer → desktop)
│   ├── explore-ux.css    1,146 ln  # Explore sheet + map control styling
│   └── assets/                     # logo, 4 hero photos, 6 Pulse photos
│
├── src/                            # REACT SHELL — dev only under vercel.json
│   ├── routes/
│   │   ├── __root.tsx      135 ln  # document shell, SEO meta
│   │   ├── index.tsx        36 ln  # / → window.location.replace('/site/index.html?v=…')
│   │   └── api/tala-chat.ts 14 ln  # same Tala handler as the Vercel Function
│   │   └── README.md               # TanStack file-routing conventions
│   ├── components/ui/              # 9 shadcn primitives, imported by nothing (see §8)
│   ├── integrations/supabase/      # browser client, auth middleware/attacher,
│   │                               # types.ts (993 ln)
│   ├── lib/                        # kmz-parser, buildVersion, error-capture,
│   │                               # error-page, utils
│   ├── hooks/use-mobile.tsx
│   ├── router.tsx · start.ts · server.ts · styles.css
│   ├── routeTree.gen.ts            # generated — never edit by hand
│   └── (31 .ts/.tsx files, 33 files total)
│
├── server/tala.js  (352 ln)        # OpenRouter proxy: prompt, knowledge, rate limit
├── api/tala.js      (18 ln)        # Vercel Function → server/tala.js (/api/tala-chat)
│
├── supabase/
│   ├── migrations/  32 files       # historical record, NOT replayable
│   ├── scripts/                    # health check, make_admin, 2 verifications
│   ├── config.toml                 # project_id = khbtdhvoghdlicgidgkc
│   └── seed_images.sql
│
├── tests/                          # 10 test files + support/client.cjs, node --test
│   ├── admin-model.test.cjs      192 ln
│   ├── admin-ui.test.cjs         139 ln
│   ├── content-policy.test.cjs   111 ln
│   ├── dom-contract.test.cjs      84 ln
│   ├── explore-model.test.cjs    234 ln
│   ├── explore-search.test.cjs   143 ln
│   ├── feed.test.cjs             143 ln
│   ├── kmz-import.test.mjs       185 ln
│   ├── map-tools.test.cjs        104 ln
│   ├── tala-server.test.mjs      216 ln
│   └── support/client.cjs          # rebuilds the client from the loader lists
│
├── docs/
│   ├── tech-stack-and-code-tree.md # this file
│   ├── admin-backoffice-audit.md   # October audit, historical (status note on top)
│   ├── explore-ux-v2-review.md     # Explore v2 review, historical
│   ├── images/explore-map.png      # the README hero
│   └── screenshots/                # README captures (see its README)
│
├── vercel.json                     # static public/site, /api rewrite, cache headers
├── vite.config.ts                  # React shell only; not used by the product
├── package.json · tsconfig.json · eslint.config.js · .prettierrc
├── .env.example                    # public Supabase values only
├── components.json                 # shadcn config for src/components/ui
└── README.md · AGENTS.md · HANDOFF.md · THIRD-PARTY-NOTICES.md
```

Totals: **22,657 lines** in `public/site`, **26 TypeScript files** in `src`,
**352 lines** of Tala server code, **32 migrations**, **10 test files**.

---

## 4. How a screen works

Every screen follows the same three steps. Learn this pattern once and the rest
of the app scripts is readable.

```
  1. MARKUP      index.html holds the element, hidden by CSS
  2. OPEN        openXSheet() / openXPane()
                   - adds body state class (place-open, pulse-open, …)
                   - hides the header, closes the other panels
                   - renders content into the element (usually async)
  3. DATA        renderX() reads the in-memory arrays that loadDataFromSupabase()
                 filled at boot, and writes HTML with escapeHtml()
```

Writes go the other way: an `admin…` function builds a row, calls Supabase,
then re-renders the list it belongs to.

### The one data load

`loadDataFromSupabase()` fires once, and again when the Backoffice opens. It
issues ~17 parallel selects and assigns module-level arrays (`destinations`,
`tribes`, `events`, `todayContent`, `huntRiddles`, …). Every render function
reads those arrays — they do not query again. If a screen looks empty, that
load failed or a table is empty; it is not a rendering bug.

### Identity: a device, not an account

There are no visitor accounts and no login. Identity is a random id in
`localStorage` (`personId()` / `personGet()`), used for:

- tribe membership and tribe chat
- event interest and event messages
- Today interest, Pulse likes, saved places

Clearing browser data resets that person. There is nothing to recover, by design.

---

## 5. Map of features to code

| Feature                         | Markup                 | Logic                                                                                                                                                                                                                     |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Map, pins, layers, zoom         | `#map` in `index.html` | `app-map-explore-today.js`, `mountMap`, `renderPins`, single-active-layer system                                                                                                                                          |
| Place detail sheet              | `.dest-sheet`          | `app-place-details.js`, `openDestSheet`                                                                                                                                                                                   |
| Explore list + filters          | `#exploreSheet`        | `explore-model.js` (pure) + `app-map-explore-today.js`                                                                                                                                                                    |
| Today                           | `#todayScroll`         | `app-map-explore-today.js`, `openTodaySheet`, `refreshTodayPicks`                                                                                                                                                         |
| Tribes / Events / Lounge / Feed | `#pulsePane`           | `app-pulse.js` (feed, tribes, events, Lounge)                                                                                                                                                                             |
| The Hunt (riddles)              | Hunt pane              | `app-pulse-admin-my-sanvic-hunt.js`: whole photo in the card, tap → `openRiddleView` full-screen photo + verse, 200 m GPS unlock; edited in Backoffice → The Hunt → Riddles (`adminEditRiddle` in `app-place-details.js`) |
| My Journey                      | Journey pane           | `app-pulse-admin-my-sanvic-hunt.js` (My Sanvic panel)                                                                                                                                                                     |
| Search                          | `#searchInput`         | `app-map-explore-today.js`                                                                                                                                                                                                |
| Tala (assistant)                | Tala sheet             | `app-map-explore-today.js` (keyword replies) + `/api/tala-chat` (AI, optional)                                                                                                                                            |
| Backoffice                      | `#adminPanelOverlay`   | `admin-studio.js` + `app-backoffice.js` + `app-pulse-admin-my-sanvic-hunt.js` (moderation)                                                                                                                                |
| Entry questions                 | `#sanvicEntry`         | `entry-flow.js` — **off while building**                                                                                                                                                                                  |

`admin-studio.js` defines `window.openAdminPanel`, which **overrides** the
function of the same name in `app-backoffice.js`. When changing how admin opens,
change the one in `admin-studio.js` — the app's copy is not what runs.

---

## 6. Data layer

**31 tables are queried by the client**, grouped:

- **Directory** — `destinations`, `destination_categories`, `nearby_places`,
  `amenities`, `place_details`, `place_contacts`, `place_links`,
  `place_amenities`, `place_tips`
- **Community** — `pulse_posts`, `pulse_comments`, `pulse_likes`,
  `pulse_categories`
- **Tribes & events** — `tribes`, `tribe_members`, `tribe_messages`, `events`,
  `event_interest`, `event_messages`
- **The Hunt** — `hunt_settings`, `hunt_riddles`, `hunt_rewards`
- **Today / saved** — `today_content`, `today_interest`, `my_sanvic_upcoming`,
  `saved_places`, `traveler_profiles`
- **Site & assistant** — `site_settings`, `tala_settings`, `tala_responses`,
  `tala_suggestions`

Migration history contains **22 `CREATE TABLE`, 87 `CREATE POLICY` and 11
functions**; tables that predate the history are not in those counts but are
queried by the client.

Storage buckets: `destination-images`, `destination-videos`, `media`,
`traveler-experiences`, `pulse-media`. Photo credits live on the rows
(`destinations.image_credit`, plus the tribe/event credit columns).

**Access control.** RLS is the control plane, not a login. The publishable key
is public by design. Content writes were opened to `anon` on 2026-11-01
(`20261101090000_open_backoffice_writes.sql`) so the Backoffice can save with no
sign-in; `20261016063448_lock_down_content_writes.sql` is the earlier, closed
state. Storage image uploads still require an authenticated admin session.

**Migrations are history, not a replayable path.** The live database is the
source of truth.

### Tala's AI

`api/tala.js` (Vercel Function, reached at `/api/tala-chat`) and
`src/routes/api/tala-chat.ts` (dev) both delegate to `server/tala.js`:

- `OPENROUTER_API_KEY` is server-only; the browser never sees it.
- Model comes from `tala_settings.ai_model`, falling back to
  `OPENROUTER_DEFAULT_MODEL` and then `google/gemini-2.5-flash`.
- Requests are rate-limited in-process; a model override is honoured only for
  callers who pass the admin check (Backoffice "Test" button).
- With no key the endpoint reports `configured: false` and the client falls back
  to its built-in keyword replies.

---

## 7. Reading order for someone new

1. `index.html` tail — see the loader list and the deploy stamp.
2. `app-core.js` — fallback data, samples policy and live-data state.
3. `loadDataFromSupabase()` — the only data entry point.
4. `openDestSheet()` — the smallest complete screen: markup → state → render.
5. `admin-studio.js` `openAdminPanel` + one save path — the write side.
6. `explore-model.js` — the one piece of logic extracted and unit-tested.

Skip, for now: `src/`, the shadcn primitives, the AST-ish checks in
`tests/explore-model.test.cjs`.

---

## 8. Current state and known drift (2026-11-09)

- **The first-visit questionnaire is OFF, and this is the only switch.** In
  `public/site/entry-flow.js` the flag is `const ENTRY_QUESTIONS_ON = false;`
  (line 11) and the flow declines to show whenever it is false. The rest is
  intact: `openWhenReady()` still holds for `SANVIC_SPLASH_HOLD` and would mount
  the card. **Flip the flag to `true` to bring the questions back**; nothing else
  needs to change.
- **No visitor login and no admin PIN anywhere.** The in-app Backoffice opens
  from three taps on the logo (or `?admin=1`) and has no passcode. The old React
  `/admin` page was deleted on 2026-11-09.
- **`src/` is not in the production deploy.** `vercel.json` serves
  `public/site/` with no build. If the React shell is still wanted in
  production, that is a deliberate config change, not a bug fix.
- **`src/components/ui/` is 9 files** (button, dialog, input, label, separator,
  sheet, skeleton, toggle, tooltip). Nothing outside that folder imports them.
  Kept as scaffolding.
- **Unused direct dependencies:** `@hookform/resolvers`, `date-fns`, `zod`.
  All three predate the cleanup and are unimported; they are harmless but are
  the obvious first candidates if the dependency list is ever trimmed.
- **Tests read behaviour, not source text.** `tests/support/client.cjs` builds
  the client from the loader lists in `index.html` and `supabase-config.js` and
  matches canonicalised snippets (`has`, `count`, `after`, `between`). That is
  what allowed `app.js` and `explore-ux.css` to be formatted and `app.js` to be
  split without rewriting assertions.
- **The app is one global scope, split into files.** The split made it
  navigable, not decoupled; real decoupling means ES modules, which needs a
  bundler the product does not have. `explore-model.js` and `admin-model.js`
  show the seam to move along when something needs extracting.
- **`README.md` and `HANDOFF.md` are the entry points**; `AGENTS.md` carries the
  short version for tooling. If you change deployment or the stack, change all
  three (and this file) in the same commit.

---

## 9. Verification baseline

Run from a clean checkout:

```bash
npm ci          # 348 packages
npm run lint    # 0 errors, 2 react-refresh warnings (ui/button.tsx, ui/toggle.tsx)
npx tsc --noEmit  # clean
npm test        # 72 assertions: 68 pass, 4 skipped, 0 fail (~4 s)
npm run build   # Nitro → .output/ (Cloudflare-compatible), ~0.5 s
npx prettier --check .   # clean
npm run dev     # Vite 8 dev server; 8080 (or the next free port)
```

The 4 skips are `tests/kmz-import.test.mjs`'s DOMParser cases — that file skips
them when the runtime has no DOM parser (plain Node). They are not failures.

Last verified: **2026-11-09**, Node 22.22.3 / npm 10.9.8.
