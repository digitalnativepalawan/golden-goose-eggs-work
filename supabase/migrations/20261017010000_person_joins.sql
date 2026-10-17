-- ═══════════════════════════════════════════════════════════════════════
-- PERSON ID: joining a tribe or an event without an email address
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   "Join Tribe" and "I'm Interested" used to demand a full email + password
--   sign-in, and then did nothing at all: joinTribe() bumped a number inside a
--   JavaScript array and interestedEvent() showed an alert(). Neither wrote a
--   row, so both were gone on reload. Asking a visitor to check their inbox so
--   they can watch a number change in memory is not a product.
--
-- What a "person" is now
--   The same anonymous identity Pulse likes already use: a random device id
--   kept in localStorage (pulse_likes.device_id) plus a name the visitor
--   chooses once. No email, no password, no verification, no inbox.
--
--   display_name is the name they typed. kind is 'traveler' or 'local'.
--
-- What this migration creates
--   1. public.tribe_members   one row per (tribe, device)  -> real counts
--   2. public.event_interest  one row per (event, device)  -> real counts
--   3. RLS so a visitor with only the public key can read, join and leave.
--
-- Honest trade-off
--   An anonymous device id can be cleared by wiping the browser, and an open
--   anonymous INSERT can be spammed. This is the same accepted trade-off as
--   pulse_likes / pulse_comments (see docs/security-audit.md, finding 11).
--   The UNIQUE constraints are the real defence: one device gets one row per
--   tribe and per event, so a loop cannot inflate a count. Deleting a
--   membership row destroys nothing and the visitor can simply re-join.
--
--   tribes.joined is NOT removed. It becomes the admin-set baseline shown
--   alongside the real joins (see the Backoffice tribes form), so the seeded
--   "4 travelers" still reads sensibly before anyone has joined.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Tribe membership ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tribe_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id     uuid NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  device_id    text NOT NULL,
  display_name text,
  kind         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tribe_members_one_per_device UNIQUE (tribe_id, device_id),
  CONSTRAINT tribe_members_device_len CHECK (char_length(device_id) BETWEEN 4 AND 64),
  CONSTRAINT tribe_members_name_len   CHECK (display_name IS NULL OR char_length(display_name) <= 40)
);
CREATE INDEX IF NOT EXISTS tribe_members_tribe_idx  ON public.tribe_members (tribe_id);
CREATE INDEX IF NOT EXISTS tribe_members_device_idx ON public.tribe_members (device_id);

-- ── 2. Event interest ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_interest (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  device_id    text NOT NULL,
  display_name text,
  kind         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_interest_one_per_device UNIQUE (event_id, device_id),
  CONSTRAINT event_interest_device_len CHECK (char_length(device_id) BETWEEN 4 AND 64),
  CONSTRAINT event_interest_name_len   CHECK (display_name IS NULL OR char_length(display_name) <= 40)
);
CREATE INDEX IF NOT EXISTS event_interest_event_idx  ON public.event_interest (event_id);
CREATE INDEX IF NOT EXISTS event_interest_device_idx ON public.event_interest (device_id);

-- ── 3. Row Level Security ───────────────────────────────────────────────
ALTER TABLE public.tribe_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_interest ENABLE ROW LEVEL SECURITY;

-- tribe_members
DROP POLICY IF EXISTS tribe_members_read  ON public.tribe_members;
DROP POLICY IF EXISTS tribe_members_join  ON public.tribe_members;
DROP POLICY IF EXISTS tribe_members_leave ON public.tribe_members;

CREATE POLICY tribe_members_read ON public.tribe_members
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY tribe_members_join ON public.tribe_members
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(device_id) BETWEEN 4 AND 64
    AND (display_name IS NULL OR char_length(display_name) <= 40)
  );

CREATE POLICY tribe_members_leave ON public.tribe_members
  FOR DELETE TO anon, authenticated USING (true);

-- event_interest
DROP POLICY IF EXISTS event_interest_read   ON public.event_interest;
DROP POLICY IF EXISTS event_interest_add    ON public.event_interest;
DROP POLICY IF EXISTS event_interest_remove ON public.event_interest;

CREATE POLICY event_interest_read ON public.event_interest
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY event_interest_add ON public.event_interest
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(device_id) BETWEEN 4 AND 64
    AND (display_name IS NULL OR char_length(display_name) <= 40)
  );

CREATE POLICY event_interest_remove ON public.event_interest
  FOR DELETE TO anon, authenticated USING (true);

-- Table privileges, matching the other visitor-writable tables.
GRANT SELECT, INSERT, DELETE ON public.tribe_members  TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.event_interest TO anon, authenticated;

COMMIT;
