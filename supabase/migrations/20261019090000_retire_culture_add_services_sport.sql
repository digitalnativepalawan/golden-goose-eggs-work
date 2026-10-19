-- ═══════════════════════════════════════════════════════════════════════
-- Categories: retire Culture, add Services and Sport, Relabel Food
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   The partner asked for Resto-bar, Services and Sport in the categories,
--   and for Culture to go. The live category rows also carried the generic
--   'map-pin' icon for several categories, left over from before the admin
--   icon picker existed, which is why Explore showed identical pins.
--
-- What this does (safe to run more than once)
--   1. Food becomes "Resto-bar" (it held no places, so nothing moves).
--   2. Every category gets its intended icon instead of the generic pin.
--   3. Services and Sport are added if missing.
--   4. Culture is retired. Its only place, San Vicente Poblacion, moves to
--      Services — its description is municipal services, transport and
--      eateries, so Services reads correctly.
--   5. sort_order is set to the order visitors meet in Explore and Trails.
--
-- Nothing is deleted except the Culture category row itself. No destination
-- is removed. Re-running is a no-op.
--
-- The built-in defaults in public/site/app.js were updated to match, so a
-- fresh install and this database end up with the same taxonomy.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Food -> Resto-bar. The key stays 'food' so existing references and any
--    destination already filed under it keep working; only the label changes.
UPDATE public.destination_categories
   SET label = 'Resto-bar'
 WHERE key = 'food';

-- 2. Real icons instead of the generic map pin.
UPDATE public.destination_categories SET icon = 'waves'          WHERE key = 'beaches';
UPDATE public.destination_categories SET icon = 'palmtree'       WHERE key = 'islands';
UPDATE public.destination_categories SET icon = 'trees'          WHERE key = 'nature';
UPDATE public.destination_categories SET icon = 'compass'        WHERE key = 'adventure';
UPDATE public.destination_categories SET icon = 'bed-double'     WHERE key = 'stays';
UPDATE public.destination_categories SET icon = 'droplets'       WHERE key = 'waterfalls';
UPDATE public.destination_categories SET icon = 'utensils-crossed' WHERE key = 'food';
UPDATE public.destination_categories SET icon = 'music'          WHERE key = 'nightlife';

-- 3. New categories, only if they are not already there.
INSERT INTO public.destination_categories (key, label, color, icon, sort_order)
SELECT 'services', 'Services', '#64748b', 'landmark', 7
WHERE NOT EXISTS (SELECT 1 FROM public.destination_categories WHERE key = 'services');

INSERT INTO public.destination_categories (key, label, color, icon, sort_order)
SELECT 'sport', 'Sport', '#10b981', 'medal', 8
WHERE NOT EXISTS (SELECT 1 FROM public.destination_categories WHERE key = 'sport');

-- 4. Culture retires. Move its only place first, then drop the category.
UPDATE public.destinations SET category = 'services' WHERE category = 'culture';
DELETE FROM public.destination_categories WHERE key = 'culture';

-- 5. Display order.
UPDATE public.destination_categories SET sort_order = CASE key
         WHEN 'beaches'    THEN 0
         WHEN 'islands'    THEN 1
         WHEN 'nature'     THEN 2
         WHEN 'adventure'  THEN 3
         WHEN 'stays'      THEN 4
         WHEN 'waterfalls' THEN 5
         WHEN 'food'       THEN 6
         WHEN 'services'   THEN 7
         WHEN 'sport'      THEN 8
         WHEN 'nightlife'  THEN 9
       END
 WHERE key IN ('beaches','islands','nature','adventure','stays','waterfalls',
               'food','services','sport','nightlife');

COMMIT;
