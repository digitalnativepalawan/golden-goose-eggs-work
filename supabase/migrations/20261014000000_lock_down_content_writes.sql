-- ═══════════════════════════════════════════════════════════════════════
-- SECURITY: lock down content writes + remove the leaked OpenRouter key
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   Several content tables (and the destination-images bucket) were writable
--   by ANYONE holding the public/publishable key, which ships inside the site.
--   That meant any visitor could edit or wipe destinations, inject HTML into
--   the hero title, delete media, or read/replace the OpenRouter API key
--   stored in tala_settings.ai_key.
--
-- What this does (safe to run more than once)
--   1. Content tables  -> everyone can READ, only users with the 'admin' role
--                         in public.user_roles can INSERT/UPDATE/DELETE.
--                         Every existing policy on these tables is dropped first,
--                         so whatever state the live database is in, it ends up
--                         in exactly this state.
--   2. tala_settings   -> deletes the 'ai_key' row and blocks it from coming back.
--                         The key now lives only on the server (OPENROUTER_API_KEY).
--   3. Storage         -> destination-images / destination-videos buckets exist and
--                         are public to view; only admins can upload/replace/delete.
--   4. Admin RPCs      -> signed-in users may call them; each one already checks
--                         has_role(auth.uid(),'admin') inside.
--
-- User-generated tables (pulse_posts, pulse_comments, pulse_likes, saved_places,
-- traveler_profiles, notifications, user_settings) are NOT touched here.
--
-- BEFORE RUNNING: make sure your own login has the admin role, otherwise the
-- Backoffice will become read-only for you too. See supabase/scripts/02_make_admin.sql.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Content tables: public read, admin-only write ─────────────────────
DO $$
DECLARE
  t text;
  p record;
  content_tables text[] := ARRAY[
    'destinations',
    'destination_categories',
    'nearby_places',
    'site_settings',
    'tala_settings',
    'tala_responses',
    'tala_suggestions',
    'today_content',
    'tribes',
    'events',
    'my_sanvic_upcoming',
    'hunt_rewards',
    'hunt_settings',
    'pulse_categories'
  ];
BEGIN
  FOREACH t IN ARRAY content_tables LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE NOTICE 'Skipping %, table does not exist', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Drop every existing policy (old "Anon write ..." / "Public write ..." etc.)
    FOR p IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
      'Public read ' || t, t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated '
      'USING (public.has_role(auth.uid(), ''admin'')) '
      'WITH CHECK (public.has_role(auth.uid(), ''admin''))',
      'Admins write ' || t, t);

    -- Table privileges: belt and braces on top of RLS.
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- ── 2. Remove the OpenRouter key from the public settings table ──────────
DELETE FROM public.tala_settings WHERE key = 'ai_key';

ALTER TABLE public.tala_settings DROP CONSTRAINT IF EXISTS tala_settings_no_secrets;
ALTER TABLE public.tala_settings
  ADD CONSTRAINT tala_settings_no_secrets
  CHECK (key NOT IN ('ai_key', 'openrouter_key', 'api_key'));

-- ── 3. Storage: buckets + admin-only uploads ─────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('destination-images', 'destination-images', true),
       ('destination-videos', 'destination-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (coalesce(qual, '') || coalesce(with_check, '')) ~ 'destination-(images|videos)'
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- Public buckets serve files by URL without any policy, so visitors still see
-- every image/video. These policies only govern the storage API.
CREATE POLICY "Admins list destination media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('destination-images', 'destination-videos')
         AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload destination media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('destination-images', 'destination-videos')
              AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update destination media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('destination-images', 'destination-videos')
         AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id IN ('destination-images', 'destination-videos')
              AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete destination media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('destination-images', 'destination-videos')
         AND public.has_role(auth.uid(), 'admin'));

-- ── 4. Admin moderation RPCs: callable by signed-in users (role checked inside)

-- Bug fix: the previous body compared an unqualified `post_id` column with
-- the `post_id` parameter, which PL/pgSQL rejects ("column reference post_id
-- is ambiguous"), so deleting a Pulse post from the Backoffice always failed.
-- Same signature and parameter name (the site calls it with { post_id }).
CREATE OR REPLACE FUNCTION public.admin_delete_pulse_post(post_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  DELETE FROM public.pulse_comments c WHERE c.post_id = admin_delete_pulse_post.post_id;
  DELETE FROM public.pulse_likes    l WHERE l.post_id = admin_delete_pulse_post.post_id;
  DELETE FROM public.pulse_posts    p WHERE p.id      = admin_delete_pulse_post.post_id;
END; $$;

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.admin_update_pulse_comment(bigint, text)',
    'public.admin_delete_pulse_comment(bigint)',
    'public.admin_update_pulse_post(bigint, text, text)',
    'public.admin_delete_pulse_post(bigint)',
    'public.admin_set_user_moderation(uuid, boolean, boolean, text)'
  ] LOOP
    IF to_regprocedure(f) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
    ELSE
      RAISE NOTICE 'Skipping %, function does not exist', f;
    END IF;
  END LOOP;
END $$;

COMMIT;
