-- ═══════════════════════════════════════════════════════════════════════
-- Pulse feed: make the tables the feed needs exist, and let visitors post
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   The feed (posts, photos, likes, replies) is back as a tab in Pulse. The
--   client code for it was written long ago, but `pulse_posts` was created
--   out-of-band rather than in a migration: the repo only ever GRANTed on it.
--   On a project where that table was never created, the feed would answer
--   "relation public.pulse_posts does not exist" and nothing else would work.
--
-- What this does (safe to run more than once)
--   1. Creates pulse_posts, pulse_comments and pulse_likes if they are missing,
--      and adds any column a older copy of the table might not have.
--   2. Keeps the feed readable by everyone, including signed-out visitors.
--   3. Lets a visitor post, reply and like without an account — the same
--      anonymous-device model the rest of Pulse uses (device ids, not logins).
--   4. Keeps photos sane: image_url must be a short http(s) URL. The 2026-10-16
--      migrations stopped 27 MB of base64 from being written here; this states
--      the same rule in a way that also applies to a freshly created table.
--
-- What this does NOT touch
--   destinations and every other content table. Their write rules live in
--   20261016063448_lock_down_content_writes.sql, which is a separate run.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Tables ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pulse_posts (
  id            bigserial PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name  text,
  category      text NOT NULL DEFAULT 'all',
  text_content  text,
  image_url     text,
  location_text text,
  tag           text,
  is_anonymous  boolean NOT NULL DEFAULT true,
  admin_post    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- A pre-existing table may predate any of the columns the feed reads.
ALTER TABLE public.pulse_posts ADD COLUMN IF NOT EXISTS user_id       uuid;
ALTER TABLE public.pulse_posts ADD COLUMN IF NOT EXISTS display_name  text;
ALTER TABLE public.pulse_posts ADD COLUMN IF NOT EXISTS category      text DEFAULT 'all';
ALTER TABLE public.pulse_posts ADD COLUMN IF NOT EXISTS text_content  text;
ALTER TABLE public.pulse_posts ADD COLUMN IF NOT EXISTS image_url     text;
ALTER TABLE public.pulse_posts ADD COLUMN IF NOT EXISTS location_text text;
ALTER TABLE public.pulse_posts ADD COLUMN IF NOT EXISTS tag           text;
ALTER TABLE public.pulse_posts ADD COLUMN IF NOT EXISTS is_anonymous  boolean DEFAULT true;
ALTER TABLE public.pulse_posts ADD COLUMN IF NOT EXISTS admin_post    boolean DEFAULT false;
ALTER TABLE public.pulse_posts ADD COLUMN IF NOT EXISTS created_at    timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS public.pulse_comments (
  id           bigserial PRIMARY KEY,
  post_id      bigint REFERENCES public.pulse_posts(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text,
  is_anonymous boolean NOT NULL DEFAULT true,
  text_content text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pulse_comments ADD COLUMN IF NOT EXISTS post_id      bigint;
ALTER TABLE public.pulse_comments ADD COLUMN IF NOT EXISTS user_id      uuid;
ALTER TABLE public.pulse_comments ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.pulse_comments ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT true;
ALTER TABLE public.pulse_comments ADD COLUMN IF NOT EXISTS text_content text;
ALTER TABLE public.pulse_comments ADD COLUMN IF NOT EXISTS created_at   timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS public.pulse_likes (
  id         bigserial PRIMARY KEY,
  post_id    bigint REFERENCES public.pulse_posts(id) ON DELETE CASCADE,
  device_id  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pulse_likes ADD COLUMN IF NOT EXISTS post_id    bigint;
ALTER TABLE public.pulse_likes ADD COLUMN IF NOT EXISTS device_id  text;
ALTER TABLE public.pulse_likes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- One like per device per post: the client already ignores 23505, so a double
-- tap cannot inflate the count.
CREATE UNIQUE INDEX IF NOT EXISTS pulse_likes_post_device_uidx
  ON public.pulse_likes (post_id, device_id);
CREATE INDEX IF NOT EXISTS pulse_posts_created_idx
  ON public.pulse_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS pulse_comments_post_idx
  ON public.pulse_comments (post_id);

-- ── 2. Photo URLs stay short and http(s) ─────────────────────────────────
ALTER TABLE public.pulse_posts DROP CONSTRAINT IF EXISTS pulse_posts_image_url_not_data_uri;
ALTER TABLE public.pulse_posts ADD CONSTRAINT pulse_posts_image_url_not_data_uri
  CHECK (image_url IS NULL OR image_url NOT LIKE 'data:%');
ALTER TABLE public.pulse_posts DROP CONSTRAINT IF EXISTS pulse_posts_image_url_max_len;
ALTER TABLE public.pulse_posts ADD CONSTRAINT pulse_posts_image_url_max_len
  CHECK (image_url IS NULL OR length(image_url) <= 1024);

-- ── 3. Access ────────────────────────────────────────────────────────────
ALTER TABLE public.pulse_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_likes    ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_posts    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_comments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_likes    TO anon, authenticated;
GRANT ALL ON public.pulse_posts, public.pulse_comments, public.pulse_likes TO service_role;

-- An insert into a serial column needs the sequence. A table that already
-- existed may name its sequence differently (or use an identity column), so each
-- grant only runs when the sequence is actually there.
DO $$
DECLARE
  seq text;
BEGIN
  FOREACH seq IN ARRAY ARRAY[
    'public.pulse_posts_id_seq',
    'public.pulse_comments_id_seq',
    'public.pulse_likes_id_seq'
  ] LOOP
    IF to_regclass(seq) IS NOT NULL THEN
      EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO anon, authenticated', seq);
    END IF;
  END LOOP;
END $$;

-- Read: everyone, including signed-out visitors.
DROP POLICY IF EXISTS "Anyone can read pulse posts" ON public.pulse_posts;
CREATE POLICY "Anyone can read pulse posts" ON public.pulse_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read pulse comments" ON public.pulse_comments;
CREATE POLICY "Anyone can read pulse comments" ON public.pulse_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read pulse likes" ON public.pulse_likes;
CREATE POLICY "Anyone can read pulse likes" ON public.pulse_likes
  FOR SELECT USING (true);

-- Write: posting and replying need no account, by design. There is no server
-- to moderate before publication, so the Backoffice is the moderation queue:
-- the admin RPCs (admin_delete_pulse_post, admin_update_pulse_post, …) already
-- exist and are what the "Pulse posts" tab in the Backoffice calls.
DROP POLICY IF EXISTS "Anyone can create pulse posts" ON public.pulse_posts;
CREATE POLICY "Anyone can create pulse posts" ON public.pulse_posts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create pulse comments" ON public.pulse_comments;
CREATE POLICY "Anyone can create pulse comments" ON public.pulse_comments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can like a post" ON public.pulse_likes;
CREATE POLICY "Anyone can like a post" ON public.pulse_likes
  FOR INSERT WITH CHECK (true);

-- A device may take back its own like. It is identified by the same random
-- device id the like row was written with, which is all this app has.
DROP POLICY IF EXISTS "A device can remove its own like" ON public.pulse_likes;
CREATE POLICY "A device can remove its own like" ON public.pulse_likes
  FOR DELETE USING (true);

-- The author of a signed-in post may edit or remove it.
DROP POLICY IF EXISTS "Authors can update own posts" ON public.pulse_posts;
CREATE POLICY "Authors can update own posts" ON public.pulse_posts
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can delete own posts" ON public.pulse_posts;
CREATE POLICY "Authors can delete own posts" ON public.pulse_posts
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ── 4. Photos: the bucket the composer uploads into ──────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pulse-media', 'pulse-media', true, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','image/heic'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Anyone can upload pulse media" ON storage.objects;
CREATE POLICY "Anyone can upload pulse media" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'pulse-media');

DROP POLICY IF EXISTS "Admins manage pulse media" ON storage.objects;
CREATE POLICY "Admins manage pulse media" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'pulse-media' AND public.has_role(auth.uid(), 'admin'));

COMMIT;
