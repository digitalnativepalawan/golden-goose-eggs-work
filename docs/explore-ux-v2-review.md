# Explore UX v2 — review branch

Branch: `astra/explore-ux-v2`. Implementation is committed for review; main is unchanged. **Visual acceptance is pending**, because the browser environment rejected access to the running preview with `ERR_BLOCKED_BY_CLIENT`. No screenshots were captured and no deployment was made.

## UX decisions and behavior

| Area | Before | Implemented |
| --- | --- | --- |
| Explore | Floating panel and disconnected map behaviors | Connected 420px desktop column; 400px tablet landscape column; three sheet positions on portrait tablet/mobile |
| Directory | Separate discovery helpers and repeated marker resets | Shared search/category/barangay filtering for directory cards and map pins |
| Map | Competing scripts repeatedly reset bounds, pins and zoom controls | One map owner; visible zoom and Locate; keyboard-accessible Layers menu |
| Layers | Modes were easy to lose in interface changes | Explicit Street, Dark, Satellite and Terrain; per-session preference; independent barangay checkbox |
| Place selection | Compact/expanded detail states | Readable details, selected pin/card, safe imagery fallback, Back to places restoring filters, scroll and map view |
| Entry | Five-second splash and automatic onboarding interruption | Short splash; Explore opens by default; optional My interests onboarding |
| Data state | Optional failures could replace successful directory data | Empty live directory stays empty; failed directory requests show explicitly labeled samples and Retry |

Map modes use OpenStreetMap tiles (Street and CSS-derived Dark), OpenTopoMap (Terrain), and Esri World Imagery (Satellite). None needs a map API key in this implementation. **Esri imagery is not open data.** Public tile services have usage terms and availability limits; this is not a promise of unlimited free hosting. There is no offline tile downloader or prefetcher.

Cards expose actual category, barangay and supplied access information. Near me sorts by straight-line distance and says so. Directions opens the existing external Google Maps flow without forcing driving across island locations. Missing information is omitted or described as incomplete; existing ratings are labeled as supplied ratings, without inventing verification.

## Changed files

- `public/site/index.html`: Explore markup, map menu, detail navigation, accessible viewport and asset wiring.
- `public/site/explore-ux.css`: responsive Explore, details, navigation and map controls.
- `public/site/explore-model.js`: pure filtering, coordinate checks, media URL validation and distance calculation.
- `public/site/app.js`: shared Explore state, markers/layers/location, detail selection/return, history, loading/fallback behavior.
- `public/site/supabase-config.js`: stops loading the two competing map-polish scripts; database configuration unchanged.
- `public/site/entry-flow.js`: makes existing onboarding opt-in through My interests.
- `tests/explore-model.test.cjs`: directory and layer regression checks.

## Preserved features and admin review

Today, Community, Saved, The Hunt and TALA remain reachable. Existing authentication, admin role checks, Supabase write guards and SQL policies were not changed. No database writes, migrations or authenticated save tests were performed.

The existing backoffice writes to the same `destinations` directory used by Explore. `adminDestFormHtml` collects name, coordinates, barangay, category, description, imagery/video, local tip, featured status and optional access/rating/season/business-profile fields. `adminSaveDest` checks required fields, warns on out-of-area coordinates and reloads listings/markers after saving. `adminRequireWrite` and the `user_roles` admin lookup remain in place. Client checks are not substitutes for database RLS; deployed policies still require an authenticated review.

Existing TALA configuration code reads an `ai_key` setting into the browser and can call OpenRouter directly, despite the repository also containing a server proxy route. This pre-existing issue was outside the Explore implementation and remains unresolved. No new AI keys were added or retrieved during this work. Before production use, move AI credential handling entirely to the server and audit access to legacy settings separately.

## Validation

- `node --check public/site/app.js`, `explore-model.js`, `entry-flow.js`, and `supabase-config.js`: pass.
- `node --test tests/explore-model.test.cjs`: four passing regression tests covering multi-field filtering, empty results, invalid coordinates/URLs, independent layer switching, and successful empty data under optional-feature failure.
- `git diff --check`: pass.
- `npm run build`: pass. Existing large-bundle, Vite paths plugin and TanStack `inputValidator` deprecation warnings remain.
- Active map implementation scan: no CARTO tile URLs or key-bearing map URLs.
- Browser interaction and screenshot checks: **blocked by environment, not passed**. Live tile delivery, drag behavior, virtual keyboard, touch devices, geolocation permission flow, marker/card selection, browser Back, TALA and authenticated saves need preview acceptance.

## Required visual acceptance

Use these exact viewport sizes: 1440×900, 1024×768, 768×1024, 430×932, 390×844. At each size verify readable results, accessible controls, no clipped actions or horizontal page overflow, visible attribution and selected-marker placement. At portrait sizes check peek, browse and full sheet positions and the keyboard-open state.

Exercise Street → Dark → Satellite → Terrain; switch barangay boundaries off and back on independently; reload to verify layer preferences. Search a known live name, combine a category and barangay, test no matches and reset. Open a result and a marker, close details, and confirm the prior map/search/scroll state. Check location denial, directions, logged-out Save, TALA, and navigation to preserved screens. Capture desktop, both tablet orientations, and both mobile widths before approving main.

## Schema proposal — not implemented

| Proposed field | Admin purpose |
| --- | --- |
| `status` (draft/published/archived) | Keep incomplete records out of public Explore |
| `is_demo` | Distinguish mock records already present in the live database |
| `place_type` (business/tourist site/community service) | Separate listing type from the user-facing category |
| `verification_status`, `last_verified_at` | Show a real verification trail, rather than assuming live data is verified |
| `phone`, `website`, structured opening hours | Reliable contact and opening information |
| `fees`, `accessibility`, `access_notes` | Practical trip planning without packing every detail into a tip |
| `owner_user_id` | Ownership and future claim/review workflow, with dedicated RLS |
| Photo attribution/source/license | Credit and provenance per media asset |

Plan migration, existing-record backfill and RLS together. Do not automatically mark existing mock or real records verified. A successful database connection does not distinguish those records without explicit editorial metadata.

## Preview and handoff

Check out `astra/explore-ux-v2`, install with `npm ci`, then run `npm run dev` and open the address printed by Vite; the app is also available at `/site/index.html`. Use browser responsive mode for the acceptance matrix above. Run `npm run build` before deploying a preview through the existing hosting workflow. This change does not migrate hosting or Supabase.

Only after preview approval should the branch be merged into main. The branch has a local commit; no remote publication is claimed.
