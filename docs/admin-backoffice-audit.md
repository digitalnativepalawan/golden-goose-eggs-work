# SANVIC Backoffice audit and implementation notes

Last updated: 2026-10-26

## Scope of the audit

The following were inspected before changing behavior:

- `src/routes/index.tsx`, `src/routes/__root.tsx`, `src/routes/admin.tsx`, and `src/routes/api/admin.ts`
- `src/integrations/supabase/*`, including generated types and server-only service-role client
- `public/site/index.html`, `public/site/app.js`, `public/site/kmz-import.js`, `public/site/explore-model.js`
- `public/site/supabase-config.js`, `.env.example`, `vercel.json`, `vite.config.ts`
- every SQL migration in `supabase/migrations`, plus `supabase/scripts/01_backend_health_check.sql`
- baseline `npm test`, `npm run lint`, `npm run build`, and `npx tsc --noEmit`

## Architecture and data flow

There are two admin surfaces:

1. **The in-site Backoffice** (`public/site/index.html` + `public/site/app.js`). This is opened
   from the public site's Staff admin control. It shares the visitor's Supabase client,
   reads the live tables, and writes through a signed-in session. RLS policies
   that call `public.has_role(auth.uid(), 'admin')` are the actual security gate.
   This surface already edits `destinations`, `destination_categories`, `site_settings`,
   Tala, Today, Tribes, Events, My Sanvic, Hunt and Pulse content.

2. **The React `/admin` route**. This is a separate passcode-gated raw table/media
   browser. Its `/api/admin` endpoint uses a server-side service-role key and must
   remain server-only. It is useful for advanced/developer work but is not the
   day-to-day content editor.

At runtime, `/` redirects into the static `public/site/index.html`. That page loads
Supabase with the publishable key and fetches the content tables. The public map,
Explore list, Today, Tribes, Events and Hunt all use these live rows. Destination
photos and videos are stored in public Supabase Storage buckets; only public URLs
are stored in database rows.

## What already worked

- Real Supabase-backed place editing and map marker rebuilding.
- Multiple destination images (`image` is the cover, `images` is the gallery).
- Detailed place records through `place_details`, `place_contacts`, `place_links`,
  `amenities`, and `place_amenities`.
- Category colours/icons sourced from `destination_categories`.
- KMZ/KML import, with duplicate and out-of-area review.
- Supabase Auth + RLS for content writes; no service-role key in browser code.
- Existing editors for the other live content areas.

## Gaps found

- No useful landing page, workspace-wide search, recent edits, or content status.
- Too many undifferentiated tabs; small controls and horizontal tab wrapping on phones.
- Long place form with a non-sticky save area; re-renders could reset field values.
- No draggable map pin, no geocoder result list, and no marker/public-card preview.
- Coordinate validation only happened during save via a generic alert.
- No Draft / Published / Archived model. Every row was public, and the React KMZ
  importer attempted to write a `status` column not present in the generated types.
- `destinations.lat` / `lng` were non-nullable, making it impossible to save a
  coordinate-less draft.
- Photo uploads had no reliable upload progress or retry, no explicit camera
  input, limited reorder affordances, and weak file/URL validation.
- A browser-native `title` tooltip on many admin controls caused opaque white
  tooltip boxes on mobile.
- `npm run lint` already failed on 6,144 formatting errors before this work.

## Decisions

- Improve the existing in-site Backoffice rather than replace it with a second
  React editor. Keep all existing tabs and write paths available.
- Keep `/admin` and `/api/admin` as advanced tooling, with a prominent link to the
  task-oriented editor. Do not expose the service-role key.
- Use an additive migration for publishing. Existing rows keep their public
  behavior by defaulting to `published`; coordinate columns become nullable so a
  draft can be saved before its pin is set.
- Do not seed fake activity or mock content. Dashboard metrics are computed from
  live rows and from real edits made in the current browser.
- Keep uploaded media in the existing `destination-images` bucket and store only
  its public URL on the place record.

## Implementation plan

1. Add `public/site/admin-model.js`, a pure/testable rule module for statuses,
   validation, filtering, change summaries, image validation and safe URLs.
2. Add an additive SQL migration and verification script for publishing columns,
   audit timestamps, RLS visibility, and nullable draft coordinates.
3. Add `public/site/admin-ux.css`, loaded last, to override the legacy wrapping
   tabs with a phone drawer, collapsible tablet rail, and persistent desktop
   sidebar. Add safe-area-aware sticky form actions and 44px touch targets.
4. Extend the Backoffice with Home, Map & pins, Photos, Categories and grouped
   navigation. Reuse existing renderers for all other content sections.
5. Refactor place editing state so search, filters and previews never discard
   form values. Add inline validation, status transitions, archive/undo and
   clear save status.
6. Add a Leaflet pin editor with place search, draggable pin, coordinate sync,
   category-colour marker preview, and public-listing preview.
7. Replace the shared media gallery with a device-first workflow: library and
   camera inputs, drag/drop, safe paste, optimization, progress, retry, remove,
   reorder, explicit cover, and Supabase public URLs only.
8. Add unit tests for the pure rules and static responsive/accessibility checks.
   Run tests, type check, production build, and a dev-server smoke test.

## Deployment requirement

The SQL migration in `supabase/migrations/20261026120000_destination_publishing.sql`
must be applied in the Supabase SQL Editor before draft/publish/archive controls
become active. It is additive and defaults existing rows to `published`. The UI
detects when the columns are unavailable and explains that publishing support is
pending rather than pretending a draft was hidden.

## Implemented in this pass

### Workspace and navigation
- Added a real Admin home with live-content search, published/draft/archived counts,
  needs-attention items, content inventory, quick actions and recent edits from
  real database timestamps plus actual edits made in the browser.
- Added task-first navigation: Home, Places, Map & pins, Photos, Categories,
  Site content, Tribes, Events, Today, My Sanvic, The Hunt, Pulse posts,
  Tala answers, TALA AI, plus a link to the existing advanced `/admin` tools.
- Added a phone navigation drawer, collapsible tablet rail, persistent desktop
  sidebar, keyboard Escape handling, visible focus, 44px+ touch targets,
  safe-area padding, `visualViewport`-aware height and keyboard-safe sticky
  Save/Cancel actions.

### Places, map and publishing
- Kept all existing place fields and related tables. Added search, status,
  category, area and sort filters; published/draft/archived pills; archive/undo,
  unpublish, publish, restore and confirmed permanent delete.
- Rebuilt the editor as status-aware, sectioned forms with a live public-listing
  preview, changed-field summary, marker colour/visibility preview and inline
  validation. Form values and unsaved photos survive filtering/re-rendering.
- Added a Leaflet pin editor with OpenStreetMap/Nominatim search, draggable pin,
  tap-to-set, device location, direct coordinate editing, San Vicente bounds
  guidance and explicit “clear pin”.
- Added an additive `destinations` publishing migration. Existing rows default
  to `published`; coordinates become nullable for drafts; public reads are
  restricted to published rows while admins can still read all statuses.
- KMZ/KML imports now create drafts when publishing columns are available and
  gracefully fall back to the old insert shape before migration.

### Photos
- Added library and camera inputs, multiple selection, desktop drag/drop,
  cautious paste, MIME/size validation, SVG rejection, HEIC decode checks,
  client-side optimization, real XHR progress, success/failure, retry,
  remove and full reorder/cover controls.
- Uploads go to the existing public `destination-images` bucket via the
  signed-in user's access token. Only public Supabase URLs are stored;
  `blob:`, `data:` and local paths are rejected. Existing photos are preserved
  unless explicitly removed or replaced.
- Added a Photos library that lists real bucket files, shows where they are
  used, attaches them as a cover or gallery image to a chosen place, and only
  allows deletion of unused files.

### Safety and compatibility
- Preserved the existing Supabase Auth + RLS model and the server-only
  service-role API used by `/admin`. No secret key was added to client code.
- Existing Tala, AI, Pulse, Site, Today, Tribes, Events, My Sanvic and Hunt
  renderers are reused.
- Removed native `title` tooltips from admin controls and icon-only controls,
  replacing them with visible labels or `aria-label` where needed.
- Added a live region for save/navigation announcements and unsaved-change
  warnings for tab switches, close, cancel and browser unload.

## Verification

- `npm test`: **38 tests, 34 pass, 4 skipped, 0 fail**. New tests cover admin
  rules, responsive/accessibility markup and the publishing migration.
- `npx tsc --noEmit`: **pass**.
- `npm run build`: **pass** (client, SSR and Nitro production bundles).
- Dev-server smoke test: `/`, `/site/index.html`, `/site/admin-model.js`,
  `/site/admin-studio.js`, `/site/admin-ux.css`, `/site/app.js`,
  `/site/kmz-import.js`, and `/admin` all returned HTTP 200.
- Headless Chromium responsive/workflow test using the shipped scripts and
  stubbed Supabase/Storage responses:
  - Phone 390×844: Home, drawer, Places, form, map canvas, camera input,
    sticky actions, 48px save target and no horizontal scrolling verified.
  - Tablet 820×1180: collapsed 76px rail and expanded 230px rail verified.
  - Desktop 1440×900: 248px persistent navigation, hidden toggle and no
    horizontal scrolling verified.
  - Workflow: entered a name, moved a pin to `10.512345,119.265432`, saw the
    public preview update, uploaded a simulated device photo, saved as
    `published`, and confirmed the record and public URL survived a second
    `loadDataFromSupabase()` refresh and appeared in the public directory.
  - The only browser console errors came from the sandbox blocking the
    unrelated Open-Meteo weather request.
- `npm run lint`: still fails because the repository already contained thousands
  of Prettier violations in large legacy files (6,144 before this work). New
  standalone files and tests were formatted; selected lint on the new files
  passes. A repository-wide formatting pass was intentionally not mixed into
  this feature change.

## Deployment and decisions needing your input

1. **Apply the SQL migration.** Run
   `supabase/migrations/20261026120000_destination_publishing.sql` once in the
   Supabase SQL Editor, then run `supabase/scripts/03_verify_admin_publishing.sql`.
   Until then, the Studio explains that publishing states are pending and keeps
   every existing place live. Drafts created after the migration stay hidden.
2. **Deploy the static client and React shell together.** The new
   `admin-model.js`, `admin-studio.js` and `admin-ux.css` files must ship with
   `index.html`; the deploy stamp was bumped to invalidate old caches.
3. **Sign in with a Supabase account that has the `admin` role.** The task
   editor writes through RLS and does not need `SUPABASE_SERVICE_ROLE_KEY`.
   The advanced `/admin` route still needs `ADMIN_PIN`,
   `ADMIN_SESSION_SECRET` and the server-only service-role key.
4. **Decide the long-term fate of `/admin`.** It is retained as advanced raw
   table/media tooling and now links to the Content Studio. If your team never
   uses raw tables, it can be hidden after the Studio has been used in
   production for a few release cycles.
5. **Live-device confirmation.** The automated browser test exercised the real
   upload/save code path with simulated Storage responses. A final manual test
   on an iPhone and Android device is still needed for each browser's camera
   picker, HEIC handling and on-screen keyboard behavior.
