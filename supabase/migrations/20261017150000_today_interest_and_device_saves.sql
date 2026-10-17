-- ═══════════════════════════════════════════════════════════════════════
-- TODAY: "Join" on a happening item, and saving a place without an account
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   The three buttons under every "Happening today" row - Join, Save and
--   Directions - had no handlers at all, so tapping them did nothing.
--   Directions needs no storage and is wired up in the app. The other two
--   need somewhere to write.
--
-- 1. public.today_interest
--   A "Happening today" item is an element of a jsonb array inside
--   today_content, not a row, so there is no id to point a foreign key at.
--   Each item now carries its own stable id (written by the admin, or derived
--   from its text for items saved before this migration) and interest is keyed
--   on that string. Same person-id model as tribes and events: one row per
--   (item, device), no email, no password.
--
-- 2. saved_places without an account
--   Saving a place used to demand a full email sign-in, which is the friction
--   the owner ruled out. saved_places gains a nullable device_id and user_id
--   becomes optional, so an anonymous visitor saves against their device id
--   while a signed-in traveller keeps saving against their account.
--
--   The two identities never mix: the new policy only ever reaches rows whose
--   device_id is set AND whose user_id is NULL, and its WITH CHECK refuses to
--   let an anonymous insert claim a user_id. The existing owner policy
--   (auth.uid() = user_id) is untouched, and NULL = NULL is never true, so it
--   still cannot see device rows.
--
-- Honest trade-off
--   Identical to tribe_members / event_interest (docs/security-audit.md,
--   finding 11): an anonymous device id can be cleared by wiping the browser,
--   and an open anonymous INSERT can be spammed. The UNIQUE constraints are
--   the real defence - one device gets one row per item and per place, so a
--   loop cannot inflate a count. Anonymous DELETE is open to any holder of the
--   public key, exactly as it already is on pulse_likes and tribe_members;
--   what can be destroyed is one place id or one "I'm going" row, and the
--   visitor can simply tap again.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Who is going to a "Happening today" item ─────────────────────────
CREATE TABLE IF NOT EXISTS public.today_interest (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      text NOT NULL,
  device_id    text NOT NULL,
  display_name text,
  kind         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT today_interest_one_per_device UNIQUE (item_id, device_id),
  CONSTRAINT today_interest_item_len   CHECK (char_length(item_id) BETWEEN 1 AND 80),
  CONSTRAINT today_interest_device_len CHECK (char_length(device_id) BETWEEN 4 AND 64),
  CONSTRAINT today_interest_name_len   CHECK (display_name IS NULL OR char_length(display_name) <= 40)
);
CREATE INDEX IF NOT EXISTS today_interest_item_idx   ON public.today_interest (item_id);
CREATE INDEX IF NOT EXISTS today_interest_device_idx ON public.today_interest (device_id);

ALTER TABLE public.today_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS today_interest_read   ON public.today_interest;
DROP POLICY IF EXISTS today_interest_add    ON public.today_interest;
DROP POLICY IF EXISTS today_interest_remove ON public.today_interest;

CREATE POLICY today_interest_read ON public.today_interest
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY today_interest_add ON public.today_interest
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(item_id) BETWEEN 1 AND 80
    AND char_length(device_id) BETWEEN 4 AND 64
    AND (display_name IS NULL OR char_length(display_name) <= 40)
  );

CREATE POLICY today_interest_remove ON public.today_interest
  FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, DELETE ON public.today_interest TO anon, authenticated;

-- ── 2. Saved places for visitors who have not signed in ─────────────────
ALTER TABLE public.saved_places
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.saved_places
  ADD COLUMN IF NOT EXISTS device_id text;

ALTER TABLE public.saved_places
  DROP CONSTRAINT IF EXISTS saved_places_device_len;
ALTER TABLE public.saved_places
  ADD CONSTRAINT saved_places_device_len
  CHECK (device_id IS NULL OR char_length(device_id) BETWEEN 4 AND 64);

-- One device saves a place once, so a repeated tap cannot stack duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS saved_places_device_dest_key
  ON public.saved_places (device_id, destination_id)
  WHERE device_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS saved_places_device_idx
  ON public.saved_places (device_id);

DROP POLICY IF EXISTS saved_places_device ON public.saved_places;

CREATE POLICY saved_places_device ON public.saved_places
  FOR ALL TO anon, authenticated
  USING (
    device_id IS NOT NULL
    AND user_id IS NULL
    AND char_length(device_id) BETWEEN 4 AND 64
  )
  WITH CHECK (
    device_id IS NOT NULL
    AND user_id IS NULL
    AND char_length(device_id) BETWEEN 4 AND 64
  );

GRANT SELECT, INSERT, DELETE ON public.saved_places TO anon, authenticated;

COMMENT ON COLUMN public.saved_places.device_id IS
  'Anonymous device id (the same one Pulse likes and tribe joins use) for a visitor who saved a place without signing in. NULL for account saves.';

COMMENT ON TABLE public.today_interest IS
  'One row per (happening-today item, device). item_id is the stable id carried inside today_content.happening[].id.';

COMMIT;
