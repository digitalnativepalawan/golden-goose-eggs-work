# HANDOFF

Written at a natural break. A new session — or a business partner — can pick up
from here without re-deriving anything.

---

## 1. The one thing that blocks everything

The admin can read and preview, but **cannot write** until the secret key is
filled in.

Open `C:\dev\golden-goose-eggs\.env` and replace:

```
SUPABASE_SERVICE_ROLE_KEY=
```

with the **secret key** (`sb_secret_…`) from
Supabase Dashboard → Project → Settings → API Keys → *Copy* next to the secret key.

`ADMIN_PIN=5309` is already set. Nothing else needs changing.

---

## 2. There are two apps. This is the single most important thing to know.

| | App | Status | Database |
|---|---|---|---|
| **`golden-goose-eggs`** | **The original.** Vite + TanStack Start shell, with the real SANVIC client in `public/site/`. | **Active. This is what we are building.** | Your migrated data — 22 tables, 134 rows |
| `sanvicph` | A separate Next.js rewrite. | Not in use. | Different schema, does not match |

The full backoffice that was described earlier — dashboard, site text,
onboarding, locations, community, discover, media, travellers, **owners & Pro**,
KMZ import, owner portal — **lives in `sanvicph`**, not in this repo:

```
C:\Users\growp\OneDrive\Documents\Default Project\sanvicph\
├── components\admin\
│   ├── admin-app.tsx              (56 KB — the whole backoffice)
│   ├── kmz-import-panel.tsx
│   ├── location-map-editor.tsx
│   ├── inline-media-picker.tsx
│   ├── traveler-media-panel.tsx
│   └── owners-panel.tsx
├── components\owners\owner-portal.tsx
└── lib\ admin-server.ts, admin-seed.ts, kmz-parser.ts, kmz-seed.ts, owner-server.ts
```

**Nothing was deleted.** If the original backoffice is wanted, start from
`sanvicph` — do not rebuild from scratch. Note it targets a different schema
(`site_content`, `content_items`, `places`, `media`), so porting it to this app
means remapping it onto `destinations` and friends.

**KMZ parsing has already been ported** from that repo into this one at
`src/lib/kmz-parser.ts`, so that work does not need repeating.

---

## 3. What is done

- ✅ Data migrated to the new Supabase project `khbtdhvoghdlicgidgkc`
  (22 tables, 134 rows, 50 RLS policies, 1 auth user) and verified row by row
- ✅ Security pass: DB password rotated, **all access tokens revoked**,
  original repo made private, RLS intact
- ✅ Repo moved off cloud sync to `C:\dev\golden-goose-eggs`
- ✅ `.env` and the 21 MB database backup excluded from git
- ✅ Lovable scaffolding and branding removed — zero references left in `src/`
- ✅ Static client repointed to the new Supabase project
- ✅ Proper README with tech stack, languages, code tree, org profile
- ✅ Admin built: passcode gate, table browser with inline editing, media
  manager (upload / delete / copy URL), **KMZ import** with preview and review
- ✅ KMZ parser verified against a real test file

## 4. What is not done

- ⬜ Secret key in `.env` → **admin writes stay blocked until this is done**
- ⬜ Image and video files were never migrated — a database dump restores the
  rows that reference media, never the media itself
- ⬜ Site-wide theming: palette + font controls. `destinations.color` already
  exists per place, so marker colours are covered; global theming is not built
- ⬜ Auth providers (magic link, Google) and redirect URLs not configured
- ⬜ No permanent hosting yet

---

## 5. Running it

```powershell
cd C:\dev\golden-goose-eggs
npm install
npm run dev
```

The dev server picks a port; it has been running on **8080**.

| | |
|---|---|
| Site | http://localhost:8080 |
| Admin | http://localhost:8080/admin — passcode `5309` |
| Same WiFi | http://10.135.148.194:8080 |
| Partner tunnel | `https://inner-islands-shots-blah.trycloudflare.com` |

⚠️ The tunnel dies if that machine sleeps or closes. There is no permanent URL
yet — deploy to Vercel or Cloudflare when one is needed.

---

## 6. Repository

`digitalnativepalawan/golden-goose-eggs-work` — **private**, we have full write
access.

The original `digitalnativepalawan/golden-goose-eggs` is **private** and
untouched. Lovable is untouched.

⚠️ `vite.config.ts` currently has `allowedHosts: [".trycloudflare.com"]` added
for the review tunnel. Remove it before any public launch.

---

## 7. Security state — do not undo any of this

- Database password: **rotated**
- Access tokens: **all revoked**, none exist
- Both originals are **private**
- `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PIN` live only in `.env`, never in git

The passcode is a **convenience lock only** — it is readable in the page
source. Real protection is that every admin action runs through `/api/admin`,
which holds the secret key server-side and never sends it to the browser.
Replace it with real user accounts before public launch.