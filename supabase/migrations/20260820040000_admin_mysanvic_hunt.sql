-- My Sanvic: curated upcoming items
CREATE TABLE IF NOT EXISTS public.my_sanvic_upcoming (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  badge text NOT NULL DEFAULT '',
  badge_style text DEFAULT 'solid',
  title text NOT NULL DEFAULT '',
  meta text DEFAULT '',
  cta text DEFAULT 'View',
  action text DEFAULT '',
  action_id text DEFAULT '',
  images jsonb DEFAULT '[]'::jsonb,
  video_url text,
  video_type text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- The Hunt: configurable rewards
CREATE TABLE IF NOT EXISTS public.hunt_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  badge text DEFAULT '',
  dest_id text DEFAULT '',
  images jsonb DEFAULT '[]'::jsonb,
  video_url text,
  video_type text,
  points_required int DEFAULT 100,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- The Hunt: configurable settings
CREATE TABLE IF NOT EXISTS public.hunt_settings (
  key text PRIMARY KEY,
  value jsonb DEFAULT '{}'::jsonb
);

-- Anon access policies
ALTER TABLE public.my_sanvic_upcoming ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon read upcoming" ON public.my_sanvic_upcoming;
CREATE POLICY "Anon read upcoming" ON public.my_sanvic_upcoming FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Anon write upcoming" ON public.my_sanvic_upcoming;
CREATE POLICY "Anon write upcoming" ON public.my_sanvic_upcoming FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.hunt_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon read hunt rewards" ON public.hunt_rewards;
CREATE POLICY "Anon read hunt rewards" ON public.hunt_rewards FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Anon write hunt rewards" ON public.hunt_rewards;
CREATE POLICY "Anon write hunt rewards" ON public.hunt_rewards FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.hunt_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon read hunt settings" ON public.hunt_settings;
CREATE POLICY "Anon read hunt settings" ON public.hunt_settings FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Anon write hunt settings" ON public.hunt_settings;
CREATE POLICY "Anon write hunt settings" ON public.hunt_settings FOR ALL TO anon USING (true) WITH CHECK (true);
