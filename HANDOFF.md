# HANDOFF

Rewritten 2026-11-09. A new session — or a business partner — can pick up from
here without re-deriving anything. For the code map, read
`docs/tech-stack-and-code-tree.md`; this file is the state of the project.

---

## 1. Where things stand

The repo is clean and green on branch `arena/afee70dd-golden-goose-eggs-work`
(HEAD `6f03786`):

| Check                 | Result                                                       |
| --------------------- | ------------------------------------------------------------ |
| `npm ci`              | 348 packages                                                  |
| `npm run lint`        | 0 errors, 2 `react-refresh` warnings (unimported shadcn files) |
| `npx tsc --noEmit`    | clean                                                         |
| `npm test`            | 72 assertions: 68 pass, 4 skipped (no DOMParser), 0 fail      |
| `npm run build`       | succeeds (Nitro → `.output/`)                                 |
| `npx prettier --check .` | clean                                                      |

There is no blocking "fill in the secret key" step any more. The product writes
with the publishable key, and the Backoffice works without a login.

---

## 2. Two surfaces. This is the single most important thing to know.

| | Surface | Status | What it is |
|---|---|---|---|
| **`public/site/`** | **The product.** Static HTML/CSS/JS, no build step, 22,657 lines. | **Live — this is what ships.** | Map, Explore, Today, Tribes/Pulse, Events, The Hunt, place sheets, the in-app Backoffice, KMZ import. |
| **`src/`** | React 19 + TanStack Start shell. | **Development only** under the current `vercel.json`. | `/` redirect into the static client, the passcode `/admin` table/media/KMZ browser, the shadcn scaffolding, the Tala dev endpoint. |

If a task is about what a visitor sees, the answer is almost always in
`public/site/`. If it is about the passcode admin tooling, it is in `src/`.

---

## 3. What is done

- Data migrated to Supabase project `khbtdhvoghdlicgidgkc`, verified row by row
- Security pass: DB password rotated, tokens revoked, originals private, RLS intact
- Lovable scaffolding and branding removed; no third-party attribution left behind
- Static client repointed at the new project
- README, `docs/tech-stack-and-code-tree.md`, `AGENTS.md` and this handoff brought
  in line with the measured repo (2026-11-09)
- The old 12,617-line `app.js` split into seven ordered files without behaviour
  change; two pure models (`explore-model.js`, `admin-model.js`) extracted and
  unit-tested
- Dead scripts removed, search matching fixed, everything Prettier can reach is
  formatted
- Admin built: passcode `/admin`, table browser with inline editing, media
  manager, KMZ import with preview and review (dev surface)
- In-app Backoffice built: no login, publishing states, photos, categories, site
  text, Tala, Today, Tribes, Events, My Sanvic, Hunt, Pulse moderation
- Tala: keyword client replies plus an optional OpenRouter proxy with rate
  limiting and a model saved in `tala_settings`
- Deploy pinned down to a static Vercel upload of `public/site` plus one function

## 4. What is not done (launch checklist)

- ⬜ **Turn on first-visit onboarding** — `ENTRY_QUESTIONS_ON = false` in
  `public/site/entry-flow.js`. That is the only switch.
- ⬜ **Re-upload media** — image and video binaries were never migrated; a
  database dump restores the rows that reference them, never the files.
- ⬜ **Decide the fate of the React `/admin`** — it is not in the production
  deploy. Either keep it as a dev tool or remove it before launch. It is the
  only credential gate left in the repo, and its passcode is a convenience lock,
  not real security (the PIN is readable in the page source; the service-role
  key never reaches the browser).
- ⬜ **Screenshots** — `docs/screenshots/` only has its README; the four views
  listed there still need capturing.
- ⬜ **Auth providers** (magic link, Google) and redirect URLs are not configured.
  Only needed if photo uploads should work outside a manually signed-in session.
- ⬜ **Site-wide theming** — palette and font controls. Per-place marker colours
  already exist (`destinations.color`); global theming does not.
- ⬜ Optional tidy-up: `@hookform/resolvers`, `date-fns` and `zod` are unimported
  direct dependencies; the 9 shadcn primitives are unimported too.

---

## 5. Running it

```bash
npm ci
cp .env.example .env     # public values already point at the live project
npm run dev              # Vite on 8080, or the next free port
```

| | |
|---|---|
| Product | `http://localhost:8080/site/index.html` |
| Shell redirect | `http://localhost:8080/` |
| Backoffice | Admin button in the dock, three taps on the SANVIC.PH logo, or `?admin=1` |
| Passcode admin | `http://localhost:8080/admin` (needs `ADMIN_PIN` in `.env`) |

`npm run build` produces `.output/` for a full Nitro deploy, but `vercel.json`
does not use it. Bump `SANVIC_DEPLOY_VERSION` in `public/site/index.html` for any
deploy that changes JS.

---

## 6. Deployment and secrets

- **Vercel**, static: `outputDirectory: "public/site"`, `buildCommand: null`,
  one function at `api/tala.js`, `/api/tala-chat` rewritten to it.
- Set **`OPENROUTER_API_KEY`** in Vercel → Project → Settings → Environment
  Variables for live Tala. Without it the endpoint reports `configured: false`
  and the client falls back to keyword replies.
- Optional admin-tool variables: `ADMIN_PIN`, `ADMIN_SESSION_SECRET`,
  `SUPABASE_SERVICE_ROLE_KEY`. Server-side only — never `VITE_`-prefixed.
- `.env` and database backups are git-ignored. Keep it that way. The passcode and
  any service-role key that was ever written into a document should be treated as
  compromised and rotated rather than copied forward.

---

## 7. Background: the other app

A separate Next.js rewrite called **`sanvicph`** exists outside this repository,
last seen on the previous development machine at
`…/Default Project/sanvicph/`. It is **not** in use and targets a different
schema (`site_content`, `content_items`, `places`, `media`). Its richer backoffice
(owners & Pro, traveller media, onboarding, location map editor) lives there.

Nothing was deleted. If that backoffice is wanted, start from `sanvicph` and port
it onto `destinations` and friends — do not rebuild it from scratch.
`src/lib/kmz-parser.ts` in this repo is already a port of its KMZ parser.

---

## 8. Ground rules

- Never commit `.env`, a secret key or the database password.
- Do not "fix" the static client by adding a framework. It has no bundler by
  design.
- Keep `index.html`'s loader order and bump the deploy stamp when JS changes.
- When deployment, the stack or the file layout changes, update
  `docs/tech-stack-and-code-tree.md`, `README.md` and `AGENTS.md` in the same
  commit. They are checked against the tree, not against memory.
- The live database is the source of truth. `supabase/migrations/` is history and
  will not replay cleanly.
