# SANVIC

San Vicente, Palawan travel hub. Interactive map, place directory, Pulse
(tribes/events/feed), Today with the Tala assistant, The Hunt, and an in-app
Backoffice.

## Two surfaces — read this first

| Surface                                               | Path           | Ships?                                              |
| ----------------------------------------------------- | -------------- | --------------------------------------------------- |
| **The product** — static HTML/CSS/JS, no build step   | `public/site/` | **Yes.** `vercel.json` serves this folder verbatim. |
| **React/TanStack shell** — SSR, `/`, `/api/tala-chat` | `src/`         | **No.** Dev only under the current `vercel.json`.   |

If a change affects what visitors see, it belongs in `public/site/`.

## Stack

- **Product**: vanilla ES5-style JS in one shared global scope, hand-written CSS,
  Leaflet 1.9.4 + OpenStreetMap/Esri/OpenTopo tiles, `@supabase/supabase-js` v2
  UMD — Leaflet, Supabase and fonts all come from CDNs, so they are not in
  `package.json`
- **Dev shell**: React 19, TanStack Start/Router, TanStack Query, Vite 8,
  Tailwind 4, Radix/shadcn primitives, TypeScript 5.8
- **Data**: Supabase (Postgres 17 + RLS + Storage), 31 tables queried by the
  client; `supabase/migrations/` is history, not a replayable path
- **AI**: `api/tala.js` → `server/tala.js` → OpenRouter, key in
  `OPENROUTER_API_KEY`
- **Tooling**: npm, `node --test`, ESLint 9, Prettier 3

## Local development

```bash
npm ci
cp .env.example .env   # public values only; points at the live Supabase project
npm run dev            # Vite, port 8080 (or the next free port)
npm test               # node --test tests/*.test.*
npm run lint && npx tsc --noEmit
npm run build          # Nitro → .output/ (not used by the Vercel deploy)
```

`/` renders the React shell and redirects to `/site/index.html`. You can also
open `http://localhost:8080/site/index.html` directly.

## Configuration

- `public/site/supabase-config.js` — public project URL and publishable key.
  Safe to ship; RLS is the control plane.
- `.env` — git-ignored. Feeds the React shell and the Tala proxy. `.env.example`
  is committed and contains only public values.

Never commit a secret key or the database password. Never give a secret a
`VITE_` prefix.

## Conventions that bite

- **Bump `SANVIC_DEPLOY_VERSION` in `public/site/index.html` for any deploy that
  changes JS.** Every script is fetched with `?v=<stamp>`.
- **Load order in `index.html` matters.** The scripts share one global scope and
  expect `sb` to exist first. `async=false` is deliberate.
- **`supabase-config.js` appends** `entry-flow.js`, `personalize.js` and
  `pulse-demo-content.js`; the rest are listed in `index.html`.
- **`admin-studio.js` overrides `window.openAdminPanel`** from
  `app-backoffice.js`. Change the override, not the shadowed copy.
- **Tests read behaviour, not source text.** `tests/support/client.cjs` rebuilds
  the client from the loader lists and matches canonicalised snippets. New app
  scripts must be registered in a loader or the tests cannot see them.
- **`src/routeTree.gen.ts` is generated** — do not edit it by hand.
- **Prettier ignores** `public/site/index.html`, `barangays.geojson.js`,
  `supabase/`, `vercel.json` and several app scripts (see `.prettierignore`).
  Formatting is not a reason to rewrite those files.
- **First-visit onboarding is off** (`ENTRY_QUESTIONS_ON = false` in
  `entry-flow.js`). Flip it to `true` before public launch.
- **No visitor accounts.** Identity is a random id in `localStorage`
  (`personId()`).

## Database and storage

- The live database is the source of truth; migrations are a historical record.
- Storage buckets: `destination-images`, `destination-videos`, `media`,
  `traveler-experiences`, `pulse-media`.
- Content writes are open to `anon` (Backoffice, no login). Storage uploads
  require an authenticated admin session.
- A database dump restores rows that point at media, never the media itself.

## Deploy

Vercel, no build step: `outputDirectory: "public/site"`, one function at
`api/tala.js`, `/api/tala-chat` rewritten to it. Set `OPENROUTER_API_KEY` in the
project's environment variables for live AI.

Full detail: `docs/tech-stack-and-code-tree.md`. Open work: `HANDOFF.md`.
