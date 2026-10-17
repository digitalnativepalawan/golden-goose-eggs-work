-- ═══════════════════════════════════════════════════════════════════════
-- Remove the third-party "Dreamlit" access to this database
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   A login role `dreamlit_app` held SELECT on auth.users, every public
--   table and ALL storage objects, plus a storage policy
--   `dreamlit_dreamlit_app_select_policy` with USING (true) - so it could
--   read even the non-public `owner-private` bucket. It owned a `dreamlit`
--   schema (error_log, event_log, version) and two functions.
--
--   It was live: 5 open connections as `dreamlit_app` with
--   application_name = Cloudflare Hyperdrive, reaching Postgres directly and
--   bypassing PostgREST and row-level security entirely. `event_log` held 0
--   rows and no triggers were installed, so nothing had ever been recorded.
--
--   Removed with David's approval. Full detail: docs/security-audit.md
--   finding 10, and docs/projects/golden-goose-eggs.md.
--
-- Safe to run more than once: every step is guarded, so on a fresh database
-- (where the role never existed) this migration is a no-op.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Close any live sessions held by the role, otherwise DROP ROLE fails.
DO $$
DECLARE
  r record;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dreamlit_app') THEN
    FOR r IN
      SELECT pg_terminate_backend(pid) AS terminated
      FROM pg_stat_activity
      WHERE usename = 'dreamlit_app'
        AND pid <> pg_backend_pid()
    LOOP
      -- nothing to do; the loop exists only to run the terminate above
    END LOOP;
  END IF;
END $$;

-- 2. Drop the storage policy that granted blanket read on every object.
DROP POLICY IF EXISTS "dreamlit_dreamlit_app_select_policy" ON storage.objects;

-- 3. Revoke the role's grants, drop everything it owns, then drop the role.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dreamlit_app') THEN
    EXECUTE 'REVOKE ALL ON SCHEMA public FROM dreamlit_app';
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM dreamlit_app';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM dreamlit_app';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM dreamlit_app';
    EXECUTE 'DROP OWNED BY dreamlit_app CASCADE';
    EXECUTE 'DROP ROLE dreamlit_app';
  END IF;
END $$;

-- 4. Drop the schema it created.
DROP SCHEMA IF EXISTS dreamlit CASCADE;

COMMIT;
