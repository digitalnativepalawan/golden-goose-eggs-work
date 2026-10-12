## Scope
Front-end only. Edits to `public/site/index.html`, `public/site/app.js`, and inline CSS. No DB, no ID renames, no route changes.

## 1. Organic 3-position sheet gesture (Explore + Today)
- Replace current click-only toggle with pointer/touch drag handler on the `.sheet-handle` (and top ~40px of sheet header) for both `#exploreSheet` and `#todaySheet`.
- Track `pointerdown → pointermove → pointerup` with a `translateY` follow (1:1 finger tracking), then snap on release using velocity + nearest-position rule.
- Snap targets (shared constants):
  - `peek` = 168px visible
  - `mid`  = 50vh
  - `full` = 100dvh (fallback 100vh)
- Add `data-snap="peek|mid|full"` on sheet root; CSS drives transforms via that attribute; JS only writes the attribute + inline transform during drag.
- Inner scroll containers (`.explore-scroll`, `.today-scroll`) get `overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch;` and are the only scroll owners when `data-snap="full"` or `"mid"`.
- Prevent rubber-band: `touch-action: none` on drag handle; `touch-action: pan-y` on inner scroll region; block drag when inner scrollTop > 0 and user pulls down.

## 2. Spacious horizontal carousels — "For You" + "Nearby From You"
In Explore sheet, restructure Section 1 (`For You`) and Section 2 (`Nearby From You`) into `.sv-carousel` rails:
```css
.sv-carousel { display:flex; flex-wrap:nowrap; overflow-x:auto; scroll-snap-type:x mandatory; gap:16px; padding:4px 20px 12px; scrollbar-width:none; }
.sv-carousel::-webkit-scrollbar { display:none; }
.sv-carousel > .sv-card { flex: 0 0 62%; max-width:280px; scroll-snap-align:start; aspect-ratio: 4/5; }
```
- Cards render as image-dominant tiles: full-bleed image (object-fit:cover), gradient overlay bottom, category chip top-left, save-heart top-right, title + `📍 barangay` + `distance` at bottom.
- ~2 cards visible per viewport; horizontal scroll reveals 7+ items pulled from existing `destinations` / `nearby_places` (no data schema change).
- Renderers `renderExploreForYou()` and `renderExploreNearby()` rebuilt to emit the new markup; keep existing click → open detail sheet.

## 3. Editorial copy fixes
- **FOR YOU subtitle**: remove `For [Name] —` concat. Add module-scope:
  ```js
  const FOR_YOU_VIBES = ["San Vicente's shades","Salty hair, slow hours","Where the map fades","Off the grid, on the pulse","Low-tide secrets","Raw and unwritten"];
  ```
  Pick once at init (`FOR_YOU_VIBES[Math.floor(Math.random()*FOR_YOU_VIBES.length)]`) → inject into subtitle node. Cache pick in a module-level variable so re-renders don't reshuffle.
- **AREAS & BARANGAYS subtitle**: static string `San Vicente's shades`. Guard renderer so it never overwrites with old copy.
- **ALL PLACES subtitle**: replace `The obvious places and the ones people forget to tell you` with `All places & experiences`.

## 4. Global glassmorphic sheet rule
Append near end of `<style>` in `index.html`:
```css
#explorePanel, #todayPanel, #mySanvicPanel, #pulsePanel, #huntPanel,
#talaSheet, #exploreSheet, #todaySheet, .detail-sheet {
  background: rgba(10,16,26,0.75) !important;
  backdrop-filter: blur(16px) saturate(120%);
  -webkit-backdrop-filter: blur(16px) saturate(120%);
}
```
(IDs cross-checked against current markup before writing; existing solid backgrounds overridden via `!important`.)

## 5. Guardrails
- No changes to Supabase tables, RPCs, or endpoints.
- No DOM ID renames; existing dock nav + `openExplorePanel()` / `openTodaySheet()` entry points still work — they just set `data-snap` instead of a boolean open state.
- Verify at 390×844, 820×1180, 1280×800 via Playwright: (a) drag sheet 1:1, releases snap to 168px / 50vh / 100dvh; (b) For You + Nearby scroll horizontally with ~2 cards visible and snap; (c) subtitles read correctly; (d) map neon dots visibly glow through open sheets; (e) no page-level scrollbars.
