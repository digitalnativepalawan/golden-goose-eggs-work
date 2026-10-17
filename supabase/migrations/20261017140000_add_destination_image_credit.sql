-- ═══════════════════════════════════════════════════════════════════════
-- Photo attribution for destination images
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   Some of the photos in the directory come from Wikimedia Commons. Almost
--   every Commons licence that permits commercial use - CC BY 2.0, CC BY 3.0,
--   CC BY 4.0, CC BY-SA 4.0 - makes attribution a condition of that
--   permission. The in-client admin already surfaces the author and licence
--   when a Commons photo is chosen, but there was nowhere to store it, so the
--   obligation could not actually be met on the live site.
--
--   `image_credit` is that place. It holds one short line, written by the
--   admin, naming the author and the licence. The site renders it beneath the
--   photo in the place detail sheet.
--
--   This is a nullable, additive column: existing rows keep working and no
--   existing behaviour changes.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS image_credit text;

-- Bounded, and never a data: URI, matching the guards already used on
-- pulse_posts.image_url.
ALTER TABLE public.destinations
  DROP CONSTRAINT IF EXISTS destinations_image_credit_max_len;
ALTER TABLE public.destinations
  ADD CONSTRAINT destinations_image_credit_max_len
  CHECK (image_credit IS NULL OR length(image_credit) <= 300);

ALTER TABLE public.destinations
  DROP CONSTRAINT IF EXISTS destinations_image_credit_not_data_uri;
ALTER TABLE public.destinations
  ADD CONSTRAINT destinations_image_credit_not_data_uri
  CHECK (image_credit IS NULL OR image_credit !~* '^data:');

COMMENT ON COLUMN public.destinations.image_credit IS
  'Attribution line shown with the photo, e.g. "Photo: Jane Doe, Wikimedia Commons, CC BY 4.0". Required by the CC BY / CC BY-SA licences used for Commons photos.';

COMMIT;
