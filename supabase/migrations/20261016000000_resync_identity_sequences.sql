-- ═══════════════════════════════════════════════════════════════════════
-- FIX: resync every identity/serial sequence to its table's max(id)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   The database was restored from a dump, which copies rows but does NOT
--   advance the sequences that generate ids. Verified live state before the
--   fix:
--
--     destinations            seq_last=1    max_id=35   -> next id 2 collides
--     destination_categories  seq_last=null max_id=9
--     nearby_places           seq_last=null max_id=14
--     pulse_posts             seq_last=null max_id=10
--     ...
--
--   Effect: EVERY "add new record" insert failed with
--     23505 duplicate key value violates unique constraint "<table>_pkey"
--   so the map editor's Add button could never work.
--
-- What this does (safe to run more than once)
--   For every column in the public schema that gets its default from a
--   sequence (both SERIAL and GENERATED ... AS IDENTITY), set the sequence so
--   the next value returned is max(id) + 1.
--
--   setval(seq, max(id) + 1, false)  ->  is_called = false
--   means the NEXT nextval() returns exactly max(id) + 1.
--   Empty tables are set to 1 so the first row gets id 1.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl, a.attname AS col
    FROM pg_class c
    JOIN pg_attribute a ON a.attrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND pg_get_serial_sequence(format('public.%I', c.relname), a.attname) IS NOT NULL
  LOOP
    EXECUTE format(
      'SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE((SELECT max(%I) FROM public.%I), 0) + 1, false)',
      'public.' || r.tbl, r.col, r.col, r.tbl);
    RAISE NOTICE 'resynced %.%', r.tbl, r.col;
  END LOOP;
END $$;
