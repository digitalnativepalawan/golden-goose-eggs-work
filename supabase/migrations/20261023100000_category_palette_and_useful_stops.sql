-- ═══════════════════════════════════════════════════════════════════════
-- Categories: the partner's palette, and Useful Stops
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   The partner sent his own palette: seven colours that belong to one family,
--   against the ten unrelated hues that were there. His words: "the actual color
--   palette make a graphic mess". He also asked for a Useful Stops category for
--   the practical places — sari-sari stores, 24 hour shops, vulcanizers, small
--   fuel refilling stations — which had nowhere to go before.
--
-- What this does (safe to run more than once)
--   1. Every existing category takes one of his colours.
--   2. Four categories take his labels, which read better than ours did:
--      Nature -> Natural Spots, Adventure -> Adventure Locations,
--      Stays -> Accommodations, Resto-bar -> Resto Bar.
--   3. Useful Stops is added, with his lime.
--   4. The four categories he did not name (Islands, Waterfalls, Sport,
--      Nightlife) keep working but are coloured inside the same family, so the
--      whole set still reads as one palette.
--   5. sort_order is set to the order visitors meet in Explore and the Trails.
--
-- Keys are untouched: 'food', 'stays', 'nature' and 'adventure' still hold the
-- places they held, so nothing is orphaned. No destination is modified.
-- ═══════════════════════════════════════════════════════════════════════

UPDATE public.destination_categories SET label = 'Resto Bar',           color = '#FF8F52' WHERE key = 'food';
UPDATE public.destination_categories SET label = 'Accommodations',      color = '#4DE3C1' WHERE key = 'stays';
UPDATE public.destination_categories SET label = 'Natural Spots',       color = '#7DDF83' WHERE key = 'nature';
UPDATE public.destination_categories SET label = 'Beaches',             color = '#E6D599' WHERE key = 'beaches';
UPDATE public.destination_categories SET label = 'Adventure Locations', color = '#FF7A5C' WHERE key = 'adventure';
UPDATE public.destination_categories SET label = 'Services',            color = '#7FA8FF' WHERE key = 'services';
UPDATE public.destination_categories SET color = '#6FD3E8' WHERE key = 'islands';
UPDATE public.destination_categories SET color = '#7FE3D0' WHERE key = 'waterfalls';
UPDATE public.destination_categories SET color = '#FFC46B' WHERE key = 'sport';
UPDATE public.destination_categories SET color = '#B98CFF' WHERE key = 'nightlife';

INSERT INTO public.destination_categories (key, label, color, icon, sort_order)
SELECT 'stops', 'Useful Stops', '#D4FF72', 'shopping-bag', 8
WHERE NOT EXISTS (SELECT 1 FROM public.destination_categories WHERE key = 'stops');

UPDATE public.destination_categories SET sort_order = CASE key
         WHEN 'beaches'    THEN 0
         WHEN 'islands'    THEN 1
         WHEN 'nature'     THEN 2
         WHEN 'adventure'  THEN 3
         WHEN 'stays'      THEN 4
         WHEN 'waterfalls' THEN 5
         WHEN 'food'       THEN 6
         WHEN 'services'   THEN 7
         WHEN 'stops'      THEN 8
         WHEN 'sport'      THEN 9
         WHEN 'nightlife'  THEN 10
       END
 WHERE key IN ('beaches','islands','nature','adventure','stays','waterfalls',
               'food','services','stops','sport','nightlife');
