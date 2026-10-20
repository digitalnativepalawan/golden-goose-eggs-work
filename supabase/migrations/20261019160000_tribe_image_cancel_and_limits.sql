-- ═══════════════════════════════════════════════════════════════════════
-- Tribe creation, round 3: image, cancel-your-own, and sane limits
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   A partner tapped Create three times and ended up with three identical
--   tribes and no way to remove the two he did not want. Four things were
--   missing: an image on a tribe, a way for the author (and only the author) to
--   cancel one, a daily cap, and a duplicate guard.
--
-- How the cancel works
--   Visitors have no login, so "the author" is proved with a secret capability
--   instead of an identity: every tribe carries a random delete_token, the
--   browser that created it keeps that token locally, and cancel_tribe() deletes
--   the row only when the token matches. Nobody else can cancel it, not even by
--   guessing the tribe id.
--
-- What this does (safe to run more than once)
--   1. tribes gains delete_token and image_url.
--   2. A before-insert guard: max two tribes per device in 24 hours, and no
--      second tribe with the same name, place and time. Admin rows are skipped
--      because they carry no device_id.
--   3. cancel_tribe(uuid, uuid) — deletes the tribe and its messages and
--      members, only when the token matches.
--   4. A public tribe-images bucket that visitors may upload to, capped at 5 MB
--      and images only.
--
-- No row is modified and no existing policy is weakened.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.tribes ADD COLUMN IF NOT EXISTS delete_token uuid DEFAULT gen_random_uuid();
ALTER TABLE public.tribes ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Limits. Only visitor-created rows are counted (device_id present).
CREATE OR REPLACE FUNCTION public.tribes_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  recent int;
  dupe int;
BEGIN
  IF NEW.device_id IS NULL OR length(NEW.device_id) < 4 THEN
    RETURN NEW;                                  -- an admin-created tribe
  END IF;

  SELECT count(*) INTO recent
    FROM public.tribes
   WHERE device_id = NEW.device_id
     AND created_at > now() - interval '24 hours';
  IF recent >= 2 THEN
    RAISE EXCEPTION 'TRIBE_LIMIT'
      USING HINT = 'You can start two tribes a day. Try again tomorrow.';
  END IF;

  SELECT count(*) INTO dupe
    FROM public.tribes
   WHERE device_id = NEW.device_id
     AND lower(coalesce(title,''))      = lower(coalesce(NEW.title,''))
     AND lower(coalesce(where_text,'')) = lower(coalesce(NEW.where_text,''))
     AND lower(coalesce(when_text,''))  = lower(coalesce(NEW.when_text,''))
     AND created_at > now() - interval '30 days';
  IF dupe > 0 THEN
    RAISE EXCEPTION 'TRIBE_DUPLICATE'
      USING HINT = 'You already have a tribe with the same name and the same plan.';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tribes_guard_trg ON public.tribes;
CREATE TRIGGER tribes_guard_trg BEFORE INSERT ON public.tribes
  FOR EACH ROW EXECUTE FUNCTION public.tribes_guard();

-- 3. Cancel your own tribe, proved by the token the creating browser holds.
CREATE OR REPLACE FUNCTION public.cancel_tribe(p_tribe_id uuid, p_token uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  removed int;
BEGIN
  DELETE FROM public.tribes WHERE id = p_tribe_id AND delete_token = p_token;
  GET DIAGNOSTICS removed = ROW_COUNT;
  IF removed > 0 THEN
    DELETE FROM public.tribe_messages WHERE tribe_id = p_tribe_id;
    DELETE FROM public.tribe_members  WHERE tribe_id = p_tribe_id;
  END IF;
  RETURN removed > 0;
END $$;

REVOKE ALL ON FUNCTION public.cancel_tribe(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_tribe(uuid, uuid) TO anon, authenticated;

-- 4. Somewhere for a tribe photo to live, open to visitors but bounded.
INSERT INTO storage.buckets (id, name, public)
VALUES ('tribe-images', 'tribe-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Anyone can read tribe images" ON storage.objects;
CREATE POLICY "Anyone can read tribe images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'tribe-images');

DROP POLICY IF EXISTS "Visitors can upload tribe images" ON storage.objects;
CREATE POLICY "Visitors can upload tribe images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'tribe-images'
    AND coalesce((metadata->>'size')::int, 0) <= 5242880
    AND coalesce(metadata->>'mimetype', '') LIKE 'image/%'
  );
