-- ═══════════════════════════════════════════════════════
-- MEDIA: multiple images + video for tribes, events, destinations
-- ═══════════════════════════════════════════════════════

-- Tribes: add images array + video fields
ALTER TABLE public.tribes ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.tribes ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.tribes ADD COLUMN IF NOT EXISTS video_type text;  -- 'youtube' | 'upload' | null

-- Events: add images array + video fields
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS video_type text;

-- Destinations: add images array (existing 'image' stays as cover)
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Ensure storage bucket exists + anon write policy
INSERT INTO storage.buckets (id, name, public) VALUES ('destination-images', 'destination-images', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Anon manage destination images" ON storage.objects;
CREATE POLICY "Anon manage destination images" ON storage.objects
  FOR ALL TO anon, authenticated
  USING (bucket_id = 'destination-images')
  WITH CHECK (bucket_id = 'destination-images');
