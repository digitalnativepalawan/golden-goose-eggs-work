-- ═══════════════════════════════════════════════════════════════════════
-- Destination publishing: real drafts, published listings and archives
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   The Backoffice previously loaded every destinations row onto the public
--   map. Staff had no way to prepare a listing privately, unpublish one, or
--   archive it without deleting it. A React KMZ importer already tried to
--   write `status = 'draft'`, but the column did not exist.
--
-- What this does (safe to run more than once)
--   1. Adds status, published_at and archived_at. Every existing row keeps its
--      current public behaviour by defaulting to `published`.
--   2. Makes lat/lng nullable so a draft can be saved before its pin is set.
--      The public map already skips places without valid coordinates.
--   3. Maintains updated_at / published_at / archived_at with one trigger.
--   4. Replaces permissive public SELECT policies with published-only reads.
--      Signed-in admins keep read access to drafts and archives.
--   5. Leaves all existing content and admin-only write policies intact.
--
-- Apply once in Supabase Dashboard → SQL Editor before using publish states.
-- No service-role secret is needed by the Backoffice to use these columns.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.destinations
  DROP CONSTRAINT IF EXISTS destinations_status_allowed;
ALTER TABLE public.destinations
  ADD CONSTRAINT destinations_status_allowed
  CHECK (status IN ('draft', 'published', 'archived'));

-- The public map checks coordinates before creating a marker. Let a draft be
-- saved with no pin, but keep both columns numeric and bounded.
ALTER TABLE public.destinations ALTER COLUMN lat DROP NOT NULL;
ALTER TABLE public.destinations ALTER COLUMN lng DROP NOT NULL;

UPDATE public.destinations
SET published_at = COALESCE(published_at, created_at, now())
WHERE status = 'published' AND published_at IS NULL;

UPDATE public.destinations
SET archived_at = COALESCE(archived_at, COALESCE(updated_at, created_at), now())
WHERE status = 'archived' AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS destinations_status_sort_idx
  ON public.destinations (status, sort_order, id);

CREATE OR REPLACE FUNCTION public.set_destination_publishing_metadata()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS NULL OR NEW.status NOT IN ('draft', 'published', 'archived') THEN
    NEW.status := 'published';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
  END IF;

  NEW.updated_at := now();

  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    NEW.published_at := COALESCE(NEW.published_at, now());
  END IF;

  IF NEW.status = 'archived' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'archived') THEN
    NEW.archived_at := now();
  ELSIF NEW.status <> 'archived' THEN
    NEW.archived_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS destinations_publishing_metadata_trg ON public.destinations;
CREATE TRIGGER destinations_publishing_metadata_trg
BEFORE INSERT OR UPDATE ON public.destinations
FOR EACH ROW EXECUTE FUNCTION public.set_destination_publishing_metadata();

COMMENT ON COLUMN public.destinations.status IS
  'draft = hidden from visitors, published = live on the public map, archived = hidden but retained for restore.';
COMMENT ON COLUMN public.destinations.published_at IS
  'First/current transition to published; maintained by destinations_publishing_metadata_trg.';
COMMENT ON COLUMN public.destinations.archived_at IS
  'Set while archived; cleared when restored to draft or published.';

-- Remove only read-side policies. Admin-only FOR ALL write policies that call
-- has_role() are preserved. This makes the public SELECT deterministic even if
-- an older permissive SELECT policy is still present.
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname, cmd, coalesce(qual, '') AS qual
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'destinations' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.destinations', p.policyname);
  END LOOP;

  -- A legacy blanket FOR ALL policy would override published-only reads.
  FOR p IN
    SELECT policyname, cmd, coalesce(qual, '') AS qual, roles
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'destinations' AND cmd = 'ALL'
      AND (coalesce(qual, '') !~* 'has_role' OR roles && ARRAY['anon', 'public']::name[])
  LOOP
    EXECUTE format('DROP POLICY %I ON public.destinations', p.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Public read published destinations" ON public.destinations;
CREATE POLICY "Public read published destinations" ON public.destinations
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins read all destinations" ON public.destinations;
CREATE POLICY "Admins read all destinations" ON public.destinations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Belt and braces: ensure admin write access exists after the policy cleanup.
DROP POLICY IF EXISTS "Admins manage destinations" ON public.destinations;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'destinations'
      AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
      AND coalesce(qual, '') ~* 'has_role'
  ) THEN
    CREATE POLICY "Admins manage destinations" ON public.destinations
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

GRANT SELECT ON public.destinations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.destinations TO authenticated;

COMMIT;
