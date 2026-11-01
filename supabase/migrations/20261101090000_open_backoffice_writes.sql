-- ═══════════════════════════════════════════════════════════════════════
-- OPEN THE BACKOFFICE: no accounts, no sign-in, writes allowed
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   The site no longer has a login of any kind. There is no magic link, no
--   email+password, no Google/Apple, no 4-digit admin PIN, no session and no
--   "read-only" banner. The Backoffice opens from the header gear (or a triple
--   click on the brand) and it writes.
--
--   That only works if the database agrees. Until now every content table was
--   locked to `authenticated` + public.has_role(auth.uid(),'admin') by
--   20261016063448_lock_down_content_writes.sql, and anon had INSERT/UPDATE/
--   DELETE revoked outright. Deleting the login without this migration would
--   leave a Backoffice that opens and then silently fails to save anything.
--
-- What this does
--   1. Content tables -> read stays public, and anon may now INSERT/UPDATE/
--      DELETE exactly as the admin role could. Table grants to anon restored.
--   2. destinations  -> the old "published only" read rule is replaced by a
--      plain public read. Every row is 'published' today (column default), so
--      nothing changes in practice, and the Backoffice can see drafts again.
--   3. Storage       -> anon may upload/replace/delete in the destination and
--      pulse buckets, so photos and videos can be added without a session.
--
--   NOT touched: user_roles, traveler_profiles, notifications, and the
--   user-generated tables (pulse_posts, pulse_comments, pulse_likes,
--   saved_places, tribe_members, tribe_messages, event_interest,
--   event_messages, today_interest, place_tips). Those already allow the
--   device-based writes the site uses.
--
-- WHAT THIS MEANS, PLAINLY
--   Anyone who reads the page source can now write to these tables. That is
--   the deliberate trade for "no sign-in while we build". To close it again,
--   re-run the policy block from 20261016063448_lock_down_content_writes.sql
--   (it drops and recreates policies), then put the admin sign-in back.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Content tables: public read, open write ───────────────────────────
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
    'hunt_riddles',
    'pulse_categories',
    'place_details',
    'place_contacts',
    'place_links',
    'place_amenities',
    'amenities'
  ];
BEGIN
  FOREACH t IN ARRAY content_tables LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE NOTICE 'Skipping %, table does not exist', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Drop the admin-only write policy (and anything similarly named) so there
    -- is exactly one write policy left, no matter what state the DB is in.
    FOR p IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND policyname LIKE 'Admins write %'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Open write ' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated '
      'USING (true) WITH CHECK (true)',
      'Open write ' || t, t);

    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- ── 2. destinations: drafts visible, not just published ──────────────────
DROP POLICY IF EXISTS "Public read published destinations" ON public.destinations;
DROP POLICY IF EXISTS "Public read destinations" ON public.destinations;
CREATE POLICY "Public read destinations" ON public.destinations
  FOR SELECT TO anon, authenticated USING (true);

-- "Admins read all destinations" is now redundant but harmless; drop it so the
-- access model has one obvious answer.
DROP POLICY IF EXISTS "Admins read all destinations" ON public.destinations;

-- ── 3. Storage: photos and videos without a session ──────────────────────
DROP POLICY IF EXISTS "Admins list destination media" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload destination media" ON storage.objects;
DROP POLICY IF EXISTS "Admins update destination media" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete destination media" ON storage.objects;

DROP POLICY IF EXISTS "Open manage destination media" ON storage.objects;
CREATE POLICY "Open manage destination media" ON storage.objects
  FOR ALL TO anon, authenticated
  USING (bucket_id IN ('destination-images', 'destination-videos', 'media', 'tribe-images'))
  WITH CHECK (bucket_id IN ('destination-images', 'destination-videos', 'media', 'tribe-images'));

DROP POLICY IF EXISTS "Open manage pulse media" ON storage.objects;
CREATE POLICY "Open manage pulse media" ON storage.objects
  FOR ALL TO anon, authenticated
  USING (bucket_id = 'pulse-media')
  WITH CHECK (bucket_id = 'pulse-media');

COMMIT;
