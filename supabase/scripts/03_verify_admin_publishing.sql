-- SANVIC admin publishing verification (READ-ONLY, changes nothing).
-- Run in Supabase Dashboard → SQL Editor after applying
-- 20261026120000_destination_publishing.sql. Every row should say PASS.

WITH cols AS (
  SELECT column_name, is_nullable, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'destinations'
), checks AS (
  SELECT 1 AS sort, 'Status column' AS area,
    CASE WHEN EXISTS (SELECT 1 FROM cols WHERE column_name = 'status' AND data_type = 'text')
      THEN 'PASS' ELSE 'FAIL' END AS status,
    CASE WHEN EXISTS (SELECT 1 FROM cols WHERE column_name = 'status')
      THEN 'destinations.status exists' ELSE 'Migration has not been applied' END AS detail
  UNION ALL
  SELECT 2, 'Audit columns',
    CASE WHEN (SELECT count(*) FROM cols WHERE column_name IN ('published_at','archived_at')) = 2
      THEN 'PASS' ELSE 'FAIL' END,
    'published_at / archived_at are present'
  UNION ALL
  SELECT 3, 'Nullable draft coordinates',
    CASE WHEN (SELECT count(*) FROM cols WHERE column_name IN ('lat','lng') AND is_nullable = 'YES') = 2
      THEN 'PASS' ELSE 'FAIL' END,
    'Blank coordinates can be saved on a draft; the public map skips them'
  UNION ALL
  SELECT 4, 'Status check',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public' AND t.relname = 'destinations'
        AND c.conname = 'destinations_status_allowed'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Only draft, published and archived are accepted'
  UNION ALL
  SELECT 5, 'Timestamp trigger',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'destinations_publishing_metadata_trg' AND NOT tgisinternal
    ) THEN 'PASS' ELSE 'FAIL' END,
    'updated_at / published_at / archived_at are maintained automatically'
  UNION ALL
  SELECT 6, 'Public read',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'destinations'
        AND cmd = 'SELECT' AND coalesce(qual, '') ILIKE '%published%'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'destinations'
        AND cmd = 'SELECT' AND coalesce(qual, '') = 'true'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Visitors can read published places only; no blanket SELECT policy remains'
  UNION ALL
  SELECT 7, 'Admin reads',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'destinations'
        AND cmd = 'SELECT' AND coalesce(qual, '') ILIKE '%has_role%'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Admins can see drafts and archived listings in the Backoffice'
  UNION ALL
  SELECT 8, 'Admin writes',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'destinations'
        AND cmd IN ('ALL','INSERT','UPDATE','DELETE')
        AND coalesce(qual, '') ILIKE '%has_role%'
    ) THEN 'PASS' ELSE 'FAIL' END,
    'Only users with the admin role can create, edit or delete listings'
)
SELECT area, status, detail
FROM checks
ORDER BY sort;
