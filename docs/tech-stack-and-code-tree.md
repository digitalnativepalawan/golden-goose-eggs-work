# SANVIC — Code Tree & Flow

Verified on branch `cleanup/verdict` (Phase 1 complete), 2026-11-01. Counts are
taken from the files on disk, not from earlier notes.
Supersedes the earlier version of this file, which described a login screen, an
admin passcode, and a React shell that is no longer what serves the product.

SANVIC is an interactive map and community platform for San Vicente, Palawan:
beaches, islands, stays, food and services for travellers, plus Tribes, Events,
The Hunt, stories (Pulse) and a Backoffice for the people who edit the content.

---

## 1. What actually ships

One repository, **two surfaces**:

| Surface                                                     | Path           | Status                                                                    |
| ----------------------------------------------------------- | -------------- | ------------------------------------------------------------------------- |
| **The product** — vanilla-JS single page                    | `public/site/` | Live, all real work happens here                                          |
| **React/TanStack shell** (SSR, `/`, `/admin`, `/api/admin`) | `src/`         | Deployed, but only used for `/` → redirect and the leftover `/admin` page |

The client is **static files with no build step**. The app scripts and
`index.html` are loaded as written. There is no bundler, no TypeScript, no
framework in the product.

Vendor code is CDN-loaded, so it is absent from `package.json`:
Leaflet 1.9.4, `@supabase/supabase-js` 2 (UMD), Google Fonts.

### Two admin surfaces — know the difference

1. **In-app Backoffice** (`admin-studio.js` + the Backoffice app scripts). No login, no
   PIN. Opens from the **Admin** button in the dock, or three taps on the
   SANVIC.PH logo. Writes with the public anon key, permitted by
   `supabase/migrations/20261101090000_open_backoffice_writes.sql`.
2. **`/admin` React page** (`src/routes/admin.tsx` + `src/routes/api/admin.ts`).
   Still deployed, still shows "Authorised staff only — Unlock", still has a
   passcode and a service-role API behind it. Nothing in the product links to it.
   Decide its fate before launch: it is the only remaining credential gate.

---

## 2. Boot sequence

`index.html` loads things in a fixed order. Order matters — the app scripts
expect `sb` to exist.

```
index.html
├─ <head>  Leaflet CSS, Google Fonts, inline <style> (the bulk of the design system)
├─ Leaflet JS (unpkg)
├─ supabase-js UMD (unpkg)
├─ inline: window.SANVIC_DEPLOY_VERSION, window.SANVIC_SPLASH_HOLD = 4500
├─ barangays.geojson.js          PSA Dec-2023 barangay boundaries
├─ inline loader (?v=DEPLOY_VERSION, async=false → strict order):
│    1. supabase-config.js       creates `sb`; then loads entry-flow, personalize, pulse-demo-content
│    2. explore-model.js         pure Explore state
│    3. admin-model.js           pure Backoffice rules
│    4. app-core.js              data, samples policy, live-data state (252 ln)
│    5. app-map-explore-today.js identity, taxonomy + icons, map, Today, Explore (2,943 ln)
│    6. app-pulse.js             feed, tribes, events, Lounge (2,644 ln)
│    7. app-weather.js           hero weather widget, then boot on `load` (1,374 ln)
│    8. app-backoffice.js        the in-app Backoffice panel (1,413 ln)
│    9. app-place-details.js     the place sheet: gallery, video, tips, contacts (2,595 ln)
│   10. app-pulse-admin-my-sanvic-hunt.js  moderation, My Sanvic, the Hunt (1,390 ln)
│   11. admin-studio.js          Backoffice UI, overrides window.openAdminPanel
│   12. kmz-import.js            KMZ upload UI
├─ explore-ux.css
└─ admin-ux.css
```

The app was one 12,617-line `app.js` until the Phase 4 split; the seven files
numbered 4–10 are that file cut at section boundaries and loaded in the same
order, so nothing about execution changed. They share one global scope, as
`app.js` always did.

`app-weather.js` reads a `load` event and starts: hide splash after
`SANVIC_SPLASH_HOLD`, then `initAuth()` (device identity), weather, then shows
the dock. The map is lazy: it initialises when the map view is first shown.

**Bump `SANVIC_DEPLOY_VERSION` in `index.html` for any deploy that changes JS.**
Every script and module is fetched with `?v=<stamp>`, which is how a phone is
stopped from running yesterday's app.

### Deleted in Phase 1 cleanup (2026-11-01, branch `cleanup/verdict`)

Three files that were present but never loaded have been removed. They are gone
from the tree, not disabled. Do not recreate them from memory:

| File                        | Why it was dead                                                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry-polish.js`           | CSS-only refinement of an entry card that no longer exists; nothing referenced it                                                                                                               |
| `map-pin-boost.js`          | Polygon visual-centre maths for pins. The app has its own, richer `barangayAnchor()` (now in `app-map-explore-today.js`) which prefers on-land places and never drags a town dot onto an island |
| `barangay-marker-polish.js` | Same ground as `map-pin-boost.js`; map hierarchy belongs to the app                                                                                                                             |

Proof before deletion: `git grep -E "entry-polish|map-pin-boost|barangay-marker-polish"`
returned matches only in `README.md` and this file — no script tag, loader,
test, build config or TypeScript import referenced any of them.

---

## 3. Code tree

```
golden-goose-eggs-work/
├── public/site/                    # THE PRODUCT — 22,618 lines
│   ├── index.html      2,459 ln    # every screen's markup + the design system CSS
│   ├── app-core.js       252 ln    # data, samples policy, live-data state
│   ├── app-map-explore-today.js 2,943 ln # identity, taxonomy + icons, map, Today, Explore
│   ├── app-pulse.js    2,644 ln    # Pulse: feed, tribes, events, Lounge
│   ├── app-weather.js  1,374 ln    # hero weather widget, then boot on `load`
│   ├── app-backoffice.js 1,413 ln  # the in-app Backoffice panel
│   ├── app-place-details.js 2,595 ln # the place sheet: gallery, video, tips, contacts
│   ├── app-pulse-admin-my-sanvic-hunt.js 1,390 ln # moderation, My Sanvic, the Hunt
│   ├── admin-studio.js 2,979 ln    # Backoffice UI (overrides openAdminPanel)
│   ├── admin-model.js    447 ln    # Backoffice rules: publishing, validation (unit-tested)
│   ├── kmz-import.js     426 ln    # KMZ/KML upload + preview
│   ├── entry-flow.js     235 ln    # first-visit questions (OFF — see §8)
│   ├── personalize.js    129 ln    # locale, units, preferences
│   ├── explore-model.js  258 ln    # Explore filtering/sorting (unit-tested, pure)
│   ├── pulse-demo-content.js 73 ln # Pulse seed content
│   ├── supabase-config.js 26 ln    # project URL + publishable key + module loader
│   ├── barangays.geojson.js        # 32 KB boundary geometry
│   ├── admin-ux.css    1,826 ln    # Backoffice layout (phone drawer → desktop)
│   ├── explore-ux.css  1,145 ln    # Explore sheet + map control styling
│   └── assets/                     # logo, 4 hero photos, 6 Pulse photos
│
├── src/                            # REACT SHELL (not the product)
│   ├── routes/
│   │   ├── __root.tsx              # document shell, SEO meta
│   │   ├── index.tsx               # / → window.location.replace('/site/index.html?v=…')
│   │   ├── admin.tsx               # leftover passcode Backoffice
│   │   └── api/{admin.ts,tala-chat.ts}
│   ├── components/ui/              # 9 shadcn primitives, imported by nothing (see §8)
│   ├── integrations/supabase/      # browser client, service-role client, types.ts (993 ln)
│   └── lib/                        # admin-helpers, kmz-parser, buildVersion, error pages
│
├── server/tala.js  (352 ln)        # OpenRouter proxy: prompt, knowledge, rate limit
├── api/tala.js                     # Vercel Function → server/tala.js  (/api/tala-chat)
│
├── supabase/
│   ├── migrations/  32 files       # historical record, NOT replayable
│   └── scripts/                    # health check, make_admin, verifications
│
├── tests/  9 files, 66 assertions   # node --test, no framework
├── docs/                           # this file + Backoffice audit + Explore review
├── vercel.json                     # static public/site, /api rewrite, cache headers
└── vite.config.ts                  # used only by the React shell, not by the product
```

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

There are no accounts and no login. Identity is a random id in `localStorage`
(`personId()` / `personGet()`), used for:

- tribe membership and tribe chat
- event interest and event messages
- Today interest, Pulse likes, saved places

Clearing browser data resets that person. There is nothing to recover, by design.

---

## 5. Map of features to code

| Feature                         | Markup                 | Logic                                                                                      |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| Map, pins, layers, zoom         | `#map` in `index.html` | `app-map-explore-today.js`, `mountMap`, `renderPins`, single-active-layer system           |
| Place detail sheet              | `.dest-sheet`          | `app-place-details.js`, `openDestSheet`                                                    |
| Explore list + filters          | `#exploreSheet`        | `explore-model.js` (pure) + `app-map-explore-today.js`                                     |
| Today                           | `#todayScroll`         | `app-map-explore-today.js`, `openTodaySheet`, `refreshTodayPicks`                          |
| Tribes / Events / Lounge / Feed | `#pulsePane`           | `app-pulse.js` (feed, tribes, events, Lounge)                                              |
| The Hunt (riddles)              | Hunt pane              | `app-pulse-admin-my-sanvic-hunt.js`, `hunt_riddles`, 200 m GPS unlock                      |
| My Journey                      | Journey pane           | `app-pulse-admin-my-sanvic-hunt.js` (My Sanvic panel)                                      |
| Search                          | `#searchInput`         | `app-map-explore-today.js`                                                                 |
| Tala (assistant)                | Tala sheet             | `app-map-explore-today.js` (keyword replies) + `/api/tala-chat` (AI, optional)             |
| Backoffice                      | `#adminPanelOverlay`   | `admin-studio.js` + `app-backoffice.js` + `app-pulse-admin-my-sanvic-hunt.js` (moderation) |
| Entry questions                 | `#sanvicEntry`         | `entry-flow.js` — **off while building**                                                   |

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

Storage buckets: `destination-images`, `destination-videos`, `media`,
`traveler-experiences`, `pulse-media`.

**Access control.** RLS is the control plane, not a login. The publishable key
is public by design. Content writes were opened to `anon` on 2026-11-01
(`20261101090000_open_backoffice_writes.sql`) so the Backoffice can save with no
sign-in; `20261016063448_lock_down_content_writes.sql` closes them again.

**Migrations are history, not a replayable path.** The live database is the
source of truth.

---

## 7. Reading order for someone new

1. `index.html` tail — see the loader list and the deploy stamp.
2. `app-core.js` — fallback data, samples policy and live-data state.
3. `loadDataFromSupabase()` — the only data entry point.
4. `openDestSheet()` — the smallest complete screen: markup → state → render.
5. `admin-studio.js` `openAdminPanel` + one save path — the write side.
6. `explore-model.js` — the one piece of logic extracted and unit-tested.

Skip, for now: `src/`, the shadcn primitives, `tests/explore-model` AST checks.

---

## 8. Known drift (verified on branch `cleanup/verdict`, 2026-11-01)

- **The first-visit questionnaire is OFF, and this is the only switch.** In
  `public/site/entry-flow.js` the flag is `const ENTRY_QUESTIONS_ON = false;`
  (line ~10) and `shouldShow()` returns `false` on the next line whenever it is
  false. The rest of the flow is intact: `openWhenReady()` still holds for
  `SANVIC_SPLASH_HOLD` (4500 ms) and would mount the card, but it is never
  reached. The loader in `supabase-config.js` still appends `entry-flow.js`, so
  the file runs — it just declines to show anything. A device with a valid saved
  profile was never shown it anyway. **Flip the flag to `true` to bring the
  questions back**; nothing else needs to change.
- **No login, no admin PIN** in the product. `/admin` in the React shell still
  has both, and is publicly reachable.
- **Two directories called admin.** The in-app one is the product; the React one
  is legacy.
- **`src/components/ui/` is now 9 files** (button, dialog, input, label,
  separator, sheet, skeleton, toggle, tooltip). Nothing outside that folder
  imports any of them — not `admin.tsx`, not `kmz-panel.tsx`. They are kept as
  scaffolding. 37 unused primitives and 29 npm packages that only they used were
  removed in Phase 1. `@hookform/resolvers` and `date-fns` are also unimported
  but predate this cleanup, so they were left alone.
- **`npm test`: 68 pass, 0 fail, 4 skipped.** The suite used to report one
  failure on Windows — `tests/feed.test.cjs` matched a literal `\n` and the
  working tree is CRLF (`core.autocrlf=true`, index stores LF). The tests now
  read the client through `tests/support/client.cjs`, which ignores layout, so
  the assertion passes wherever it runs without being loosened. The 4 skips are
  `tests/kmz-import.test.mjs`'s DOMParser cases.
- **Tests read behaviour, not source text.** `tests/support/client.cjs` builds
  the client from the loader lists in `index.html` and `supabase-config.js` and
  matches canonicalised snippets (`has`, `count`, `after`, `between`). This is
  what allowed `app.js` and `explore-ux.css` to be formatted at last, and it is
  what let `app.js` be split into seven files without rewriting the assertions.
- **The app is seven files, 12,611 lines, one global scope.** Split in Phase 4
  from the single 12,617-line `app.js`, keeping load order and every top-level
  binding as it was; the only difference is six blank lines Prettier removes at
  the joins (see the Phase 4 commit for the byte and AST proof). Splitting made
  it navigable, not decoupled — real decoupling means ES modules, which needs a
  bundler the product does not have. The two model files (`explore-model`,
  `admin-model`) still show the seam to move along when something needs
  extracting.
