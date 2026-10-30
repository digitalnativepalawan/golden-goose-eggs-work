# SANVIC — Tech Stack & Code Tree

Verified against the working tree at `aa9743a` (branch
`arena/793d4dfe-golden-goose-eggs-work`), 2026-10-30. **154 tracked files.**

SANVIC is an interactive destination guide and community platform for San Vicente,
Palawan. It is one repository containing **two layers**:

1. a thin **React 19 / TanStack Start shell** (`src/`) that provides SSR, routing
   and three server endpoints, and
2. the actual application — a large, **vanilla-JS single-page client** in
   `public/site/`, served as static files and mounted by the shell.

That split is the single most important structural fact about this codebase:
almost all UI and product logic lives in `public/site/app.js` (9,202 lines) and
`public/site/index.html` (2,438 lines), **not** in React.

---

## 1. Tech stack

### Runtime & language

| Layer           | Choice                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------- |
| Language        | TypeScript 5.8 (strict) + TSX for the shell, plain ES2022 JavaScript (no build step) for the client |
| Runtime         | Node.js 22 locally (README claims Node 24), ESM everywhere (`"type": "module"`)                     |
| Package manager | npm (`package-lock.json`) **and** Bun (`bun.lock`, `bunfig.toml` with a 24 h supply-chain guard)    |
| Path alias      | `@/*` → `src/*`                                                                                     |

### Frontend shell (`src/`)

| Concern        | Library / version                                                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI runtime     | React 19.2 + React DOM 19.2                                                                                                                                                                                                      |
| Meta-framework | TanStack Start 1.168 (SSR entry overridden to `src/server.ts`)                                                                                                                                                                   |
| Routing        | TanStack Router 1.170, file-based (`src/routes/`), `routeTree.gen.ts` generated                                                                                                                                                  |
| Server state   | TanStack Query 5.83 (installed; barely used — the client queries Supabase directly)                                                                                                                                              |
| Build          | Vite 8 + `@lovable.dev/vite-tanstack-config` (bundles TanStack Start, React, Tailwind, tsconfig-paths, Nitro, component tagger)                                                                                                  |
| SSR output     | Nitro 3 beta, Cloudflare-compatible default target                                                                                                                                                                               |
| Styling        | Tailwind CSS 4 via `@tailwindcss/vite`, tokens in `src/styles.css`, `tw-animate-css`                                                                                                                                             |
| Components     | 46 Radix/shadcn primitives in `src/components/ui/` (`class-variance-authority`, `clsx`, `tailwind-merge`, `cmdk`, `vaul`, `sonner`, `embla-carousel`, `react-day-picker`, `react-hook-form` + `zod`, `recharts`, `lucide-react`) |

### Client (`public/site/`)

| Concern      | Choice                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------- |
| Architecture | Hand-written vanilla JS modules, no bundler, no framework — loaded by `index.html` in order |
| Maps         | Leaflet 1.9.4 **from unpkg CDN** (not an npm dependency)                                    |
| Basemaps     | OSM street/dark tiles, Esri World Imagery (satellite), OpenTopoMap (terrain)                |
| Geodata      | PSA Dec-2023 barangay boundaries, pre-converted to `barangays.geojson.js`                   |
| Live data    | Open-Meteo (weather), Nominatim + Overpass (geocoding/POIs), Wikimedia Commons              |
| Backend SDK  | `@supabase/supabase-js` 2 UMD **from unpkg**, configured in `supabase-config.js`            |
| Fonts        | Google Fonts (Cormorant Garamond + DM Sans)                                                 |
| Icons        | Lucide icon paths inlined into `app.js`; notices in `THIRD-PARTY-NOTICES.md`                |

### Backend & data

| Concern               | Choice                                                                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database              | Supabase / PostgreSQL 17, region `ap-southeast-2`                                                                                                                                                                |
| Access control        | Row Level Security everywhere + 65 `CREATE POLICY` statements across migrations                                                                                                                                  |
| Client access         | `@supabase/supabase-js` 2.108 (anon publishable key, RLS enforced)                                                                                                                                               |
| Server access         | Service-role key, server-only (`src/integrations/supabase/client.server.ts`)                                                                                                                                     |
| PostgREST types       | `src/integrations/supabase/types.ts` (972 lines, generated)                                                                                                                                                      |
| SQL functions         | `has_role`, `get_public_profiles`, `tribes_guard`, `cancel_tribe`, `admin_update_pulse_post`, `admin_delete_pulse_post`, `admin_update_pulse_comment`, `admin_delete_pulse_comment`, `admin_set_user_moderation` |
| Storage buckets       | `destination-images`, `destination-videos`, `media`, `traveler-experiences`, `pulse-media`                                                                                                                       |
| AI concierge ("Tala") | OpenRouter chat-completions proxy in `server/tala.js`; key stays server-side in `OPENROUTER_API_KEY`; prompt + knowledge base built server-side; per-IP rate limit; gated by `tala_settings.ai_enabled`          |

### Tooling & deployment

| Concern       | Choice                                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint / format | ESLint 9 (flat config) + Prettier 3                                                                                                                        |
| Tests         | `node --test` (built-in runner) — 3 files, no framework                                                                                                    |
| Deploy        | Two paths: TanStack Start/Nitro/Cloudflare build, **or** Vercel static host of `public/site` + one Vercel Function (`api/tala.js`), wired by `vercel.json` |
| Secrets       | `.env` (git-ignored) — `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PIN`, `OPENROUTER_API_KEY`; `.env.example` holds public values only                             |

### Dependency reality check

- **Leaflet and supabase-js are CDN-loaded**, so they do not appear in
  `package.json`. Anything relying on `npm install` alone will not include them.
- **Recharts is effectively dead weight** — only `src/components/ui/chart.tsx`
  references it, and nothing imports `chart.tsx`.
- **`src/components/ui/` is mostly unused.** Only 9 primitives are imported
  anywhere (`button`, `dialog`, `input`, `label`, `separator`, `sheet`,
  `skeleton`, `toggle`, `tooltip`); the rest is shadcn scaffolding.
- TanStack Query is installed but the client talks to Supabase with the raw SDK.

---

## 2. Request flow

```
Browser
  │
  ├─ GET /                → TanStack route src/routes/index.tsx
  │                          → window.location.replace("/site/index.html?v=<BUILD_VERSION>")
  │                          (an iframe of the same URL is the SSR/no-JS fallback)
  │                          → public/site/index.html + 12 JS modules
  │                              → supabase-js (anon, RLS) ──► Supabase Postgres/Storage/Realtime
  │                              → Open-Meteo / Nominatim / Overpass / tile CDNs
  │
  ├─ GET /admin           → src/routes/admin.tsx  (passcode gate, noindex)
  │                          → POST /api/admin    → service-role Supabase client
  │
  └─ POST /api/tala-chat  → src/routes/api/tala-chat.ts   (vite dev)
                             or api/tala.js via vercel.json rewrite (prod)
                                → server/tala.js → OpenRouter
```

Because `/` redirects to `/site/index.html`, the React layer is essentially a
launcher plus two operational endpoints. Real product surface area is the
static client.

---

## 3. Code tree

```
golden-goose-eggs-work/
├── public/site/                     # THE CLIENT — vanilla JS SPA, ~14k of 16.6k LOC
│   ├── index.html                   # 2,438 lines: every view, sheet and modal
│   ├── app.js                       # 9,202 lines: map engine, routing, views, data
│   ├── explore-model.js             # pure Explore state model (unit-tested)
│   ├── entry-flow.js                # onboarding / entry gate
│   ├── entry-polish.js              # entry-flow refinements
│   ├── personalize.js               # locale, units, preferences
│   ├── barangay-marker-polish.js    # barangay boundary markers
│   ├── map-pin-boost.js             # marker performance tuning
│   ├── pulse-demo-content.js        # Tribes/Pulse seed content
│   ├── kmz-import.js                # KMZ upload + preview UI
│   ├── admin-model.js               # pure Backoffice rules (publishing, validation)
│   ├── admin-studio.js              # SANVIC Studio: task-oriented Backoffice layer
│   ├── admin-ux.css                 # Backoffice layout (phone drawer → desktop)
│   ├── barangays.geojson.js         # PSA Dec-2023 barangay geometry (32 KB)
│   ├── supabase-config.js           # public project URL + publishable key
│   ├── explore-ux.css               # Explore-specific styling
│   └── assets/
│       ├── sanvic-logo.png / .jpeg
│       ├── san-vicente-{boayan,long-beach,port-barton,waterfalls}.jpg
│       └── pulse/                   # 6 Tribes/Pulse photos
│
├── src/                             # REACT SHELL
│   ├── routes/
│   │   ├── __root.tsx               # document shell, SEO meta, error boundary
│   │   ├── index.tsx                # redirect → /site/index.html
│   │   ├── admin.tsx                # passcode-gated backoffice (tables, media, KMZ)
│   │   ├── README.md                # file-based routing conventions
│   │   └── api/
│   │       ├── admin.ts             # service-role admin API, HMAC session tokens
│   │       └── tala-chat.ts         # Tala proxy for `vite dev`
│   ├── components/
│   │   ├── admin/kmz-panel.tsx      # KMZ import review UI
│   │   └── ui/                      # 46 shadcn/Radix primitives (mostly unused)
│   ├── integrations/supabase/
│   │   ├── client.ts                # browser client (anon key)
│   │   ├── client.server.ts         # service-role client (server only)
│   │   ├── auth-middleware.ts       # session middleware
│   │   ├── auth-attacher.ts         # attaches auth to server functions
│   │   └── types.ts                 # generated DB types (972 lines)
│   ├── lib/
│   │   ├── admin-helpers.ts         # client helpers for /api/admin
│   │   ├── kmz-parser.ts            # KMZ/KML parsing (ported from sanvicph)
│   │   ├── buildVersion.ts          # deploy cache-busting stamp
│   │   ├── error-capture.ts
│   │   ├── error-page.ts            # SSR error HTML
│   │   └── utils.ts                 # cn()
│   ├── hooks/use-mobile.tsx
│   ├── styles.css                   # Tailwind 4 design tokens
│   ├── server.ts                    # SSR entry (wired via vite.config)
│   ├── start.ts                     # TanStack Start instance + error middleware
│   ├── router.tsx                   # router factory
│   └── routeTree.gen.ts             # generated — do not edit
│
├── server/
│   ├── tala.js                      # shared OpenRouter proxy (352 lines)
│   └── tala.d.ts                    # types for the Vercel Function import
├── api/
│   └── tala.js                      # Vercel Function → server/tala.js
│
├── supabase/
│   ├── migrations/                  # 30 historical SQL files (NOT replayable)
│   ├── scripts/
│   │   ├── 01_backend_health_check.sql
│   │   ├── 02_make_admin.sql
│   │   └── 03_verify_admin_publishing.sql
│   ├── seed_images.sql
│   └── config.toml
│
├── tests/                           # node --test, no framework, 43 assertions
│   ├── explore-model.test.cjs       # unit tests for explore-model.js (skips without typescript)
│   ├── map-tools.test.cjs           # map-tool switch, dot sizes, tile ceilings
│   ├── admin-model.test.cjs         # Backoffice publishing/validation rules
│   ├── admin-ui.test.cjs            # Backoffice markup + a11y contracts
│   ├── kmz-import.test.mjs
│   └── tala-server.test.mjs
│
├── docs/
│   ├── tech-stack-and-code-tree.md  # this file
│   ├── admin-backoffice-audit.md    # Backoffice audit and publishing workflow
│   ├── explore-ux-v2-review.md
│   ├── images/explore-map.png
│   └── screenshots/README.md
│
├── .env.example                     # public Supabase values only
├── AGENTS.md                        # working notes / conventions
├── HANDOFF.md                       # current state, blockers, security notes
├── README.md                        # product-facing README (partly stale)
├── THIRD-PARTY-NOTICES.md
├── bunfig.toml / bun.lock           # Bun install policy + lockfile
├── package.json / package-lock.json
├── components.json                  # shadcn config
├── eslint.config.js / .prettierrc / .prettierignore
├── tsconfig.json
├── vercel.json                      # static public/site + /api rewrite + cache headers
├── vite.config.ts                   # Lovable config wrapper + allowedHosts
└── .gitignore
```

### File size distribution

| Bucket              | Files        | Notes                                      |
| ------------------- | ------------ | ------------------------------------------ |
| `src/` (shell)      | 70           | 52 `.tsx` (46 are UI primitives)           |
| `supabase/`         | 33           | 29 migrations, 2 ops scripts, seed, config |
| `public/`           | 25           | 13 client files + 12 images                |
| `tests/`            | 3            | 21 assertions total                        |
| Code (excl. UI kit) | 16,604 lines | `app.js` alone is 55% of it                |

Largest tracked files: `public/site/app.js` (476 KB), `public/site/index.html`
(264 KB), `docs/images/explore-map.png` (228 KB), Pulse JPEGs (up to 224 KB).

---

## 4. Data layer

Base tables were created in the original project before this repo's migration
history begins, so `supabase/migrations/` only shows later additions. The
migrations plus every table the client actually queries add up to ~32 public
tables: `destinations`, `destination_categories`, `nearby_places`, `amenities`,
the place detail tables (`place_details`, `place_contacts`, `place_links`,
`place_amenities`, `place_tips`), Pulse (`pulse_posts`, `pulse_comments`,
`pulse_likes`, `pulse_categories`), Tribes (`tribes`, `tribe_members`,
`tribe_messages`, `events`, `event_interest`, `event_messages`), the Hunt
(`hunt_settings`, `hunt_riddles`, `hunt_rewards`), Today (`today_content`,
`today_interest`), `my_sanvic_upcoming`, `saved_places`, `traveler_profiles`,
`user_roles`, `site_settings`, and the Tala tables (`tala_settings`,
`tala_responses`, `tala_suggestions`).

Newest migrations (Oct 2026) cover: destination Google Business URLs, a
content-write lockdown, identity sequence resync, removal of dreamlit tooling,
the `pulse-media` bucket, image-URL guarding, emoji→icons, person joins, missing
FK indexes, image credits, Today/Tribe/event interest + chat, category palette
and useful stops, Hunt riddles, and `event_messages` (event detail chat).

**Migrations are a historical record, not a replayable path.** The PostgreSQL
dump is the source of truth; media lives in Storage and must be re-uploaded
separately.

---

## 5. Commands

| Command                     | Effect                                                         |
| --------------------------- | -------------------------------------------------------------- |
| `npm install`               | install (Bun users: `bun install`, 24 h release guard applies) |
| `npm run dev`               | Vite dev server → `/` redirects to the client                  |
| `npm run build` / `preview` | TanStack Start/Nitro build                                     |
| `npm run lint`              | ESLint                                                         |
| `npm run format`            | Prettier                                                       |
| `npm test`                  | `node --test tests/*.test.*`                                   |

`npm test` currently reports **1 failure** in a clean checkout: `tests/explore-model.test.cjs`
does `require("typescript")`, so it fails until dependencies are installed
(16 pass, 4 skipped, 1 environment-only failure).

---

## 6. Drift to fix in `README.md`

The product README is out of date in several places:

- Says **11 migrations** — there are **30**.
- Says **22 tables** — the static client alone queries **32** distinct tables.
- Code tree omits `src/routes/admin.tsx`, `src/routes/api/admin.ts`,
  `src/lib/admin-helpers.ts`, `src/lib/kmz-parser.ts`,
  `src/components/admin/kmz-panel.tsx`, `src/start.ts`,
  `public/site/kmz-import.js`, `api/tala.js`, `server/tala.js`, and the two extra
  test files.
- Says **50 RLS policies** — migrations contain **65** `CREATE POLICY` statements.
- Says **8 functions** — there are **9**.
- Lists Leaflet under npm dependencies; it is actually loaded from unpkg.
- Says "Vitest-style test harness"; it is `node --test`.
- Says **50 accessible primitives**; there are 46 and only 9 are imported.
- `vite.config.ts` still has `allowedHosts` for `.trycloudflare.com` (review
  tunnel) plus `.e2b.app` (this sandbox).

---

## 7. Security posture (do not weaken)

- Publishable/anon key is embedded in the client **by design**; RLS is the
  control plane.
- Service-role key, `ADMIN_PIN` and `OPENROUTER_API_KEY` exist only in `.env`
  / server env; `/api/admin` and `server/tala.js` never ship them to the browser.
- The admin passcode is a convenience lock. Admin sessions are HMAC-signed,
  short-lived bearer tokens validated server-side — not real user accounts.
  Replace with auth before public launch.
- Tala's endpoint caps input size, refuses cross-site browser calls, rate-limits
  per IP, and pins the model to `tala_settings.ai_model` unless an admin session
  asks to override.
