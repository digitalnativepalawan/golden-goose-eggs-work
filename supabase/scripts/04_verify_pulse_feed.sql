-- ═══════════════════════════════════════════════════════════════════════
-- Verify the Pulse feed is ready
-- ═══════════════════════════════════════════════════════════════════════
-- Run in Supabase → SQL Editor after
--   1. supabase/migrations/20261030120000_pulse_feed_schema.sql
--   2. supabase/migrations/20261026120000_destination_publishing.sql
--   3. supabase/migrations/20261016063448_lock_down_content_writes.sql
--
-- Every row below should read PASS. Anything that reads MISSING is what the
-- feed or the Backoffice will trip over next, and the fix column says which
-- script adds it.
-- ═══════════════════════════════════════════════════════════════════════

WITH checks(area, item, ok, fix) AS (
  VALUES
    -- Feed tables
    ('feed', 'table pulse_posts',    to_regclass('public.pulse_posts')    IS NOT NULL, '20261030120000_pulse_feed_schema.sql'),
    ('feed', 'table pulse_comments', to_regclass('public.pulse_comments') IS NOT NULL, '20261030120000_pulse_feed_schema.sql'),
    ('feed', 'table pulse_likes',    to_regclass('public.pulse_likes')    IS NOT NULL, '20261030120000_pulse_feed_schema.sql'),

    -- Columns the feed reads
    ('feed', 'pulse_posts.display_name',  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pulse_posts' AND column_name='display_name'),  '20261030120000_pulse_feed_schema.sql'),
    ('feed', 'pulse_posts.is_anonymous',  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pulse_posts' AND column_name='is_anonymous'),  '20261030120000_pulse_feed_schema.sql'),
    ('feed', 'pulse_posts.admin_post',    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pulse_posts' AND column_name='admin_post'),    '20261030120000_pulse_feed_schema.sql'),
    ('feed', 'pulse_posts.location_text', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pulse_posts' AND column_name='location_text'), '20261030120000_pulse_feed_schema.sql'),
    ('feed', 'pulse_posts.image_url',     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pulse_posts' AND column_name='image_url'),     '20261030120000_pulse_feed_schema.sql'),

    -- RLS: readable by anyone, writable without an account
    ('feed', 'RLS on pulse_posts',            (SELECT relrowsecurity FROM pg_class WHERE oid='public.pulse_posts'::regclass),  '20261030120000_pulse_feed_schema.sql'),
    ('feed', 'anyone may read posts',         EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pulse_posts' AND cmd='SELECT' AND qual='true'), '20261030120000_pulse_feed_schema.sql'),
    ('feed', 'anyone may create posts',       EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pulse_posts' AND cmd='INSERT'), '20261030120000_pulse_feed_schema.sql'),
    ('feed', 'anyone may create replies',     EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pulse_comments' AND cmd='INSERT'), '20261030120000_pulse_feed_schema.sql'),
    ('feed', 'anyone may like',               EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pulse_likes' AND cmd='INSERT'), '20261030120000_pulse_feed_schema.sql'),

    -- Storage for post photos
    ('feed', 'bucket pulse-media exists',     EXISTS (SELECT 1 FROM storage.buckets WHERE id='pulse-media'), '20261030120000_pulse_feed_schema.sql'),

    -- Backoffice publishing
    ('admin', 'destinations.status column',   EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='destinations' AND column_name='status'), '20261026120000_destination_publishing.sql'),
    ('admin', 'destinations.published_at',    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='destinations' AND column_name='published_at'), '20261026120000_destination_publishing.sql'),
    ('admin', 'destinations.archived_at',     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='destinations' AND column_name='archived_at'), '20261026120000_destination_publishing.sql'),
    ('admin', 'status allows draft/published/archived', EXISTS (SELECT 1 FROM pg_constraint WHERE conname='destinations_status_allowed'), '20261026120000_destination_publishing.sql'),
    ('admin', 'admin_delete_pulse_post RPC',  EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='admin_delete_pulse_post'), '20261016063448_lock_down_content_writes.sql')
)
SELECT
  area,
  item,
  CASE WHEN ok THEN 'PASS' ELSE 'MISSING' END AS result,
  CASE WHEN ok THEN '' ELSE fix END AS run_this
FROM checks
ORDER BY (ok)::int, area, item;
