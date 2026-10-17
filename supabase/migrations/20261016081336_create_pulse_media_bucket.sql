-- ═══════════════════════════════════════════════════════════════════════
-- Pulse media storage bucket
-- ═══════════════════════════════════════════════════════════════════════
--
-- Why
--   Pulse posts carry a photo. Uploading it as base64 into
--   `pulse_posts.image_url` filled the table with 27 MB of inline data and
--   made the feed and the admin list time out. Photos now go to Storage and
--   only the URL is stored in the row; the `guard_pulse_image_url`
--   migration is what stops base64 from coming back.
--
-- Access
--   The bucket is public to READ (so <img src> works with no auth).
--   Anyone holding the publishable key may INSERT - this is the accepted
--   trade-off recorded as finding 11 in docs/security-audit.md, the same
--   shape as the existing `destination-images` bucket: uploads are bounded
--   by the bucket's file size limit and mime allow-list.
--   Only admins may update or delete.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. The bucket itself.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pulse-media', 'pulse-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Anyone may upload into this bucket (INSERT only - no update, no delete).
DROP POLICY IF EXISTS "Anyone can upload pulse media" ON storage.objects;
CREATE POLICY "Anyone can upload pulse media" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'pulse-media');

-- 3. Admins may do everything else.
DROP POLICY IF EXISTS "Admins manage pulse media" ON storage.objects;
CREATE POLICY "Admins manage pulse media" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'pulse-media' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'pulse-media' AND public.has_role(auth.uid(), 'admin'));

COMMIT;
