
ALTER TABLE public.pulse_posts ADD COLUMN IF NOT EXISTS display_name text;

ALTER TABLE public.pulse_comments ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.pulse_comments ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.pulse_likes ADD COLUMN IF NOT EXISTS device_id text;
ALTER TABLE public.pulse_likes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.pulse_likes DROP CONSTRAINT IF EXISTS pulse_likes_post_id_user_id_key;
ALTER TABLE public.pulse_likes DROP CONSTRAINT IF EXISTS pulse_likes_unique;
CREATE UNIQUE INDEX IF NOT EXISTS pulse_likes_post_device_uidx ON public.pulse_likes (post_id, device_id) WHERE device_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pulse_likes_post_user_uidx ON public.pulse_likes (post_id, user_id) WHERE user_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_posts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_comments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_likes TO anon, authenticated;
GRANT ALL ON public.pulse_posts, public.pulse_comments, public.pulse_likes TO service_role;
