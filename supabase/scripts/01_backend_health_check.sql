-- ═══════════════════════════════════════════════════════════════════════
-- SANVIC backend health check (READ-ONLY, changes nothing)
-- ═══════════════════════════════════════════════════════════════════════
-- How to use:
--   Supabase Dashboard → SQL Editor → New query → paste this whole file → Run.
--   You get one table, worst problems first:
--     FAIL = broken or unsafe, fix it
--     WARN = worth a look
--     PASS = fine
-- Safe to run any time; it only reads catalog tables and counts rows.
-- ═══════════════════════════════════════════════════════════════════════

WITH
expected_tables(t) AS (VALUES
  ('destinations'), ('destination_categories'), ('nearby_places'), ('site_settings'),
  ('tala_settings'), ('tala_responses'), ('tala_suggestions'), ('today_content'),
  ('tribes'), ('events'), ('my_sanvic_upcoming'), ('hunt_rewards'), ('hunt_settings'),
  ('pulse_categories'), ('pulse_posts'), ('pulse_comments'), ('pulse_likes'),
  ('saved_places'), ('traveler_profiles'), ('notifications'), ('user_settings'),
  ('user_roles')
),
-- Edited only from the Backoffice: visitors read, admins write.
content_tables(t) AS (VALUES
  ('destinations'), ('destination_categories'), ('nearby_places'), ('site_settings'),
  ('tala_settings'), ('tala_responses'), ('tala_suggestions'), ('today_content'),
  ('tribes'), ('events'), ('my_sanvic_upcoming'), ('hunt_rewards'), ('hunt_settings'),
  ('pulse_categories')
),
-- Tables whose rows may contain media URLs.
media_tables(t) AS (VALUES
  ('destinations'), ('destination_categories'), ('today_content'), ('tribes'),
  ('events'), ('my_sanvic_upcoming'), ('hunt_rewards'), ('site_settings'), ('nearby_places')
),
expected_functions(f, required) AS (VALUES
  ('has_role', true), ('get_public_profiles', true),
  ('admin_update_pulse_post', true), ('admin_delete_pulse_post', true),
  ('admin_update_pulse_comment', true), ('admin_delete_pulse_comment', true),
  ('admin_set_user_moderation', true),
  ('admin_list_tables', false), ('admin_table_schema', false)
),
expected_buckets(b) AS (VALUES ('destination-images'), ('destination-videos')),

tbl AS (
  SELECT e.t, c.oid, c.relrowsecurity
  FROM expected_tables e
  LEFT JOIN pg_class c
    ON c.relname = e.t AND c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
),
open_write AS (
  -- Write policies that let someone with no login change data.
  SELECT p.*
  FROM pg_policies p
  WHERE p.cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
    AND p.roles && ARRAY['anon', 'public']::name[]
    AND coalesce(p.qual, 'true') = 'true'
    AND coalesce(p.with_check, 'true') = 'true'
),

checks AS (

  -- 1. Tables exist, RLS on, row counts
  SELECT 1 AS sort, 'Tables' AS area, t AS item,
    CASE WHEN oid IS NULL OR NOT relrowsecurity THEN 'FAIL' ELSE 'PASS' END AS status,
    CASE
      WHEN oid IS NULL THEN 'Missing; the app reads this table'
      WHEN NOT relrowsecurity THEN 'RLS is OFF, so anyone with the public key can read and change every row'
      ELSE 'exists, RLS on, '
        || (xpath('/row/c/text()',
              query_to_xml(format('SELECT count(*) AS c FROM public.%I', t), false, true, '')))[1]::text
        || ' rows'
    END AS detail
  FROM tbl

  UNION ALL
  -- 2. Content tables: public read + admin-only write
  SELECT 2, 'Content access', c.t,
    CASE
      WHEN EXISTS (SELECT 1 FROM open_write o WHERE o.schemaname = 'public' AND o.tablename = c.t) THEN 'FAIL'
      WHEN NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.t
                         AND p.cmd IN ('SELECT', 'ALL') AND p.roles && ARRAY['anon', 'public']::name[]) THEN 'FAIL'
      WHEN NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.t
                         AND p.cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
                         AND (coalesce(p.qual, '') || coalesce(p.with_check, '')) ILIKE '%has_role%') THEN 'WARN'
      ELSE 'PASS'
    END,
    CASE
      WHEN EXISTS (SELECT 1 FROM open_write o WHERE o.schemaname = 'public' AND o.tablename = c.t)
        THEN 'ANYONE can change this without logging in (policy: '
          || (SELECT string_agg(o.policyname, ', ') FROM open_write o WHERE o.schemaname = 'public' AND o.tablename = c.t)
          || '). Run migration 20261014000000_lock_down_content_writes.sql'
      WHEN NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.t
                         AND p.cmd IN ('SELECT', 'ALL') AND p.roles && ARRAY['anon', 'public']::name[])
        THEN 'Visitors cannot read this; that part of the site will look empty'
      WHEN NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.t
                         AND p.cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
                         AND (coalesce(p.qual, '') || coalesce(p.with_check, '')) ILIKE '%has_role%')
        THEN 'No admin write policy; Backoffice saves will fail'
      ELSE 'visitors read, admins write'
    END
  FROM content_tables c
  WHERE to_regclass(format('public.%I', c.t)) IS NOT NULL

  UNION ALL
  -- 3. Open write policies on user-generated tables (expected for guest posting/likes)
  SELECT 3, 'Guest writes', o.tablename || ' → ' || o.policyname, 'WARN',
    'No login needed to ' || o.cmd || '. Fine if guests may do this; otherwise require auth'
  FROM open_write o
  WHERE o.schemaname = 'public' AND o.tablename NOT IN (SELECT t FROM content_tables)

  UNION ALL
  -- 4. Secrets that must never sit in a publicly readable table
  SELECT 4, 'Secrets', 'tala_settings / site_settings',
    CASE WHEN n > 0 THEN 'FAIL' ELSE 'PASS' END,
    CASE WHEN n > 0
      THEN n || ' row(s) look like an API key (ai_key / sk-… / sb_secret_…). Delete them and revoke the key'
      ELSE 'no API keys stored in public settings tables' END
  FROM (
    SELECT
      CASE WHEN to_regclass('public.tala_settings') IS NULL THEN 0 ELSE
        (xpath('/row/c/text()', query_to_xml(
          $q$SELECT count(*) AS c FROM public.tala_settings
             WHERE (key IN ('ai_key','openrouter_key','api_key') AND coalesce(value,'') <> '')
                OR value ~ '^(sk-|sb_secret_)'$q$, false, true, '')))[1]::text::int END
      +
      CASE WHEN to_regclass('public.site_settings') IS NULL THEN 0 ELSE
        (xpath('/row/c/text()', query_to_xml(
          $q$SELECT count(*) AS c FROM public.site_settings s WHERE s::text ~ '(sk-or-|sb_secret_)'$q$,
          false, true, '')))[1]::text::int END
      AS n
  ) s

  UNION ALL
  -- 5. Database functions used by the app
  SELECT 5, 'Functions', ef.f,
    CASE
      WHEN p.oid IS NULL THEN CASE WHEN ef.required THEN 'FAIL' ELSE 'WARN' END
      WHEN ef.f LIKE 'admin\_%' AND ef.required AND p.prosrc NOT ILIKE '%has_role%' THEN 'FAIL'
      WHEN ef.f LIKE 'admin\_%' AND ef.required AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE') THEN 'WARN'
      ELSE 'PASS'
    END,
    CASE
      WHEN p.oid IS NULL AND ef.required THEN 'Missing; the app calls this'
      WHEN p.oid IS NULL THEN 'Optional /admin helper not installed (the admin panel falls back to a built-in list)'
      WHEN ef.f LIKE 'admin\_%' AND ef.required AND p.prosrc NOT ILIKE '%has_role%'
        THEN 'Does NOT check the admin role, so anyone who can call it can moderate'
      WHEN ef.f LIKE 'admin\_%' AND ef.required AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
        THEN 'Signed-in admins cannot call it; Backoffice moderation buttons will fail'
      ELSE 'present' || CASE WHEN p.prosecdef THEN ', security definer' ELSE '' END
    END
  FROM expected_functions ef
  LEFT JOIN pg_proc p ON p.proname = ef.f AND p.pronamespace = 'public'::regnamespace

  UNION ALL
  -- 6. Storage buckets + whether media was re-uploaded
  SELECT 6, 'Storage', eb.b,
    CASE WHEN sb.id IS NULL THEN 'FAIL'
         WHEN NOT sb.public THEN 'WARN'
         WHEN (SELECT count(*) FROM storage.objects o WHERE o.bucket_id = eb.b) = 0 THEN 'WARN'
         ELSE 'PASS' END,
    CASE WHEN sb.id IS NULL THEN 'Bucket missing; uploads to it will fail'
         WHEN NOT sb.public THEN 'Bucket is private; visitors cannot load these files'
         ELSE (SELECT count(*) FROM storage.objects o WHERE o.bucket_id = eb.b)::text || ' file(s)'
           || CASE WHEN (SELECT count(*) FROM storage.objects o WHERE o.bucket_id = eb.b) = 0
                   THEN '; media from the old project still needs re-uploading' ELSE '' END
    END
  FROM expected_buckets eb
  LEFT JOIN storage.buckets sb ON sb.id = eb.b

  UNION ALL
  SELECT 6, 'Storage', 'policy: ' || o.policyname, 'FAIL',
    'Anyone can ' || o.cmd || ' files in storage without logging in'
  FROM open_write o
  WHERE o.schemaname = 'storage' AND o.tablename = 'objects'

  UNION ALL
  -- 7. Media URLs still pointing at a different (old/Lovable) Supabase project
  SELECT 7, 'Old media links', m.t,
    CASE WHEN n > 0 THEN 'WARN' ELSE 'PASS' END,
    CASE WHEN n > 0
      THEN n || ' row(s) link to files on another Supabase project; those images break once it is gone'
      ELSE 'all links point at this project (or elsewhere)' END
  FROM (
    SELECT mt.t,
      -- khbtdhvoghdlicgicidgkc = this (new) project. Any other *.supabase.co
      -- host in a row is a link into the old Lovable-era project.
      (xpath('/row/c/text()', query_to_xml(format(
        $q$SELECT count(*) AS c FROM public.%I x
           WHERE x::text ~ 'https://(?!khbtdhvoghdlicgicidgkc\.)[a-z0-9]{15,30}\.supabase\.co'$q$,
        mt.t), false, true, '')))[1]::text::int AS n
    FROM media_tables mt
    WHERE to_regclass(format('public.%I', mt.t)) IS NOT NULL
  ) m

  UNION ALL
  -- 8. Auth: is anyone able to use the Backoffice?
  SELECT 8, 'Auth', 'users',
    'PASS',
    (SELECT count(*) FROM auth.users)::text || ' login user(s), '
      || (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '30 days')::text
      || ' signed in during the last 30 days'

  UNION ALL
  SELECT 8, 'Auth', 'admins',
    CASE WHEN coalesce(a.emails, '') = '' THEN 'FAIL' ELSE 'PASS' END,
    CASE
      WHEN to_regclass('public.user_roles') IS NULL
        THEN 'public.user_roles is missing, so nobody can be an admin'
      WHEN coalesce(a.emails, '') = ''
        THEN 'Nobody has the admin role, so the Backoffice cannot save anything. Run supabase/scripts/02_make_admin.sql'
      ELSE 'admin(s): ' || a.emails
    END
  FROM (
    SELECT CASE WHEN to_regclass('public.user_roles') IS NULL THEN NULL ELSE
      (xpath('/row/e/text()', query_to_xml(
        $q$SELECT string_agg(coalesce(u.email, r.user_id::text), ', ') AS e
           FROM public.user_roles r LEFT JOIN auth.users u ON u.id = r.user_id
           WHERE r.role::text = 'admin'$q$, false, true, '')))[1]::text END AS emails
  ) a
)

SELECT status, area, item, detail
FROM checks
ORDER BY CASE status WHEN 'FAIL' THEN 0 WHEN 'WARN' THEN 1 ELSE 2 END, sort, item;
