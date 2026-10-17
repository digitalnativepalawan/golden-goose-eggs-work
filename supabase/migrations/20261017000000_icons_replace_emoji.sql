-- Replace every emoji used as a UI icon with a Lucide icon name.
--
-- The admin icon picker, the Today "sea & weather" verdicts, the Today local
-- tips and the nearby_places rows all used to store an emoji as the icon.
-- The client now renders a Lucide SVG for any value that matches an icon
-- name, and falls back to printing the raw value as text — so this migration
-- is cosmetic for correctness, but keeps the stored data consistent.
--
-- Applied to production on 2026-10-17; kept here so a fresh environment ends
-- up with the same values.

-- ── nearby_places.icon ────────────────────────────────────────────────
update public.nearby_places set icon = case icon
  when '🍜' then 'rice'
  when '🍤' then 'utensils'
  when '🍽️' then 'utensils'
  when '🍝' then 'utensils'
  when '🦐' then 'utensils'
  when '🍕' then 'pizza'
  when '🛒' then 'shopping-cart'
  when '💱' then 'banknote'
  when '🛵' then 'scooter'
  when '👕' then 'shirt'
  when '🤿' then 'waves'
  when '🐟' then 'fish'
  when '🛶' then 'sailboat'
  when '☕' then 'coffee'
  else icon
end
where icon in ('🍜','🍤','🍽️','🍝','🦐','🍕','🛒','💱','🛵','👕','🤿','🐟','🛶','☕');

-- ── today_content: weather verdict icons ──────────────────────────────
update public.today_content
set data = (
  select jsonb_agg(
    case elem->>'label'
      when 'Island hopping' then jsonb_set(elem, '{icon}', '"palmtree"')
      when 'Surf'           then jsonb_set(elem, '{icon}', '"waves"')
      when 'Rain risk'      then jsonb_set(elem, '{icon}', '"cloud-rain"')
      when 'Tide'           then jsonb_set(elem, '{icon}', '"droplets"')
      else elem
    end
    order by ord
  )
  from jsonb_array_elements(data) with ordinality as t(elem, ord)
)
where key = 'weather' and jsonb_typeof(data) = 'array';

-- ── today_content: local tip badges ───────────────────────────────────
update public.today_content
set data = (
  select jsonb_agg(
    case elem->>'biz'
      when 'Long Beach Grill' then jsonb_set(elem, '{badge}', '"fish"')
      when 'Nauti Beach Bar'  then jsonb_set(elem, '{badge}', '"martini"')
      when 'Aling Rosa Bakery' then jsonb_set(elem, '{badge}', '"croissant"')
      else elem
    end
    order by ord
  )
  from jsonb_array_elements(data) with ordinality as t(elem, ord)
)
where key = 'locals' and jsonb_typeof(data) = 'array';

-- ── tribes.title / events.title ───────────────────────────────────────
-- Strip a trailing emoji from the demo titles that were seeded with one.
update public.tribes set title = btrim(regexp_replace(title, '\s*[\U0001F000-\U0001FAFF\u2600-\u27BF]\s*$', ''))
where title ~ '[\U0001F000-\U0001FAFF\u2600-\u27BF]\s*$';

update public.events set title = btrim(regexp_replace(title, '^\s*[\U0001F000-\U0001FAFF\u2600-\u27BF]\s*', ''))
where title ~ '^\s*[\U0001F000-\U0001FAFF\u2600-\u27BF]';
