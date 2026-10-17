-- ═══════════════════════════════════════════════════════════════════════
-- Guard pulse_posts.image_url against base64 payloads
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   Nine posts held 28,374,748 characters (27 MB) of base64 written straight
--   into `pulse_posts.image_url` by a FileReader.readAsDataURL() upload path.
--   The feed and the admin list both select that column, so every read pulled
--   27 MB and the authenticated role hit its 8-second statement timeout.
--
--   The upload path now writes to the `pulse-media` bucket and stores a URL.
--   These two CHECK constraints make the old shape impossible to reintroduce,
--   at the database level, regardless of which client writes the row.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. A URL, not a data URI.
ALTER TABLE public.pulse_posts DROP CONSTRAINT IF EXISTS pulse_posts_image_url_not_data_uri;
ALTER TABLE public.pulse_posts ADD CONSTRAINT pulse_posts_image_url_not_data_uri
  CHECK (image_url IS NULL OR image_url !~* '^data:');

-- 2. A sane maximum length for a URL.
ALTER TABLE public.pulse_posts DROP CONSTRAINT IF EXISTS pulse_posts_image_url_max_len;
ALTER TABLE public.pulse_posts ADD CONSTRAINT pulse_posts_image_url_max_len
  CHECK (image_url IS NULL OR length(image_url) <= 2048);

COMMIT;
