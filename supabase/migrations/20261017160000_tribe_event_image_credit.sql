-- ═══════════════════════════════════════════════════════════════════════
-- Photo attribution for Pulse tribes and events
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   Pulse cards carry photos: a tribe shows a thumbnail, an event shows one.
--   The photos that actually match San Vicente come from Wikimedia Commons,
--   and almost every Commons licence that permits commercial use - CC BY 2.0,
--   CC BY 3.0, CC BY 4.0, CC BY-SA 4.0 - makes attribution a condition of that
--   permission. Migration 20261017140000 solved this for the directory with
--   destinations.image_credit; tribes and events had nowhere to put it, so a
--   photo could be shown on a card with no way to meet the obligation.
--
--   `image_credit` is that place on both tables: one short line naming the
--   author and the licence, written by the admin, rendered small and dim under
--   the photo. A photo with no credit line simply renders none, so public
--   domain and CC0 images - and the owner's own photos - need nothing.
--
--   Both columns are nullable and additive: existing rows keep working and no
--   existing behaviour changes. The same length and data-URI guards used on
--   destinations.image_credit apply here.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.tribes
  ADD COLUMN IF NOT EXISTS image_credit text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_credit text;

ALTER TABLE public.tribes
  DROP CONSTRAINT IF EXISTS tribes_image_credit_max_len;

ALTER TABLE public.tribes
  ADD CONSTRAINT tribes_image_credit_max_len
  CHECK (image_credit IS NULL OR length(image_credit) <= 300);

ALTER TABLE public.tribes
  DROP CONSTRAINT IF EXISTS tribes_image_credit_not_data_uri;

ALTER TABLE public.tribes
  ADD CONSTRAINT tribes_image_credit_not_data_uri
  CHECK (image_credit IS NULL OR image_credit !~* '^data:');

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_image_credit_max_len;

ALTER TABLE public.events
  ADD CONSTRAINT events_image_credit_max_len
  CHECK (image_credit IS NULL OR length(image_credit) <= 300);

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_image_credit_not_data_uri;

ALTER TABLE public.events
  ADD CONSTRAINT events_image_credit_not_data_uri
  CHECK (image_credit IS NULL OR image_credit !~* '^data:');

COMMENT ON COLUMN public.tribes.image_credit IS
  'Attribution line for the tribe thumbnail, e.g. "Photo: Jane Doe, Wikimedia Commons, CC BY 4.0". Required by the CC BY / CC BY-SA licences used for Commons photos; empty when the licence requires none.';

COMMENT ON COLUMN public.events.image_credit IS
  'Attribution line for the event photo, e.g. "Photo: Jane Doe, Wikimedia Commons, CC BY 4.0". Required by the CC BY / CC BY-SA licences used for Commons photos; empty when the licence requires none.';

COMMIT;
