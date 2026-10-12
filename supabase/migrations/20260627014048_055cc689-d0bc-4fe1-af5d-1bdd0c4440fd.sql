GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_likes TO authenticated;
GRANT SELECT ON public.pulse_posts TO anon;
GRANT SELECT ON public.pulse_comments TO anon;
GRANT SELECT ON public.pulse_likes TO anon;
GRANT ALL ON public.pulse_posts TO service_role;
GRANT ALL ON public.pulse_comments TO service_role;
GRANT ALL ON public.pulse_likes TO service_role;

ALTER TABLE public.pulse_likes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.pulse_likes ADD CONSTRAINT pulse_likes_unique UNIQUE (post_id, user_id);