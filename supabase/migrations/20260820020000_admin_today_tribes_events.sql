-- ═══════════════════════════════════════════════════════
-- ADMIN TABLES for Today, Tribes, Events sections
-- All writable by anon key (PIN-gated backoffice).
-- ═══════════════════════════════════════════════════════

-- 1. Today content (TALA pick, events, locals, notices, weather)
CREATE TABLE IF NOT EXISTS today_content (
  key text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '[]',
  updated_at timestamz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.today_content TO anon, authenticated;
DROP POLICY IF EXISTS "Anon write today_content" ON public.today_content;
CREATE POLICY "Anon write today_content" ON public.today_content
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Tribes (used in Pulse + My Sanvic)
CREATE TABLE IF NOT EXISTS tribes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  where_text text DEFAULT '',
  when_text text DEFAULT '',
  sub text DEFAULT '',
  thumb_url text DEFAULT '',
  joined int DEFAULT 0,
  extra int DEFAULT 0,
  cap int DEFAULT 0,
  tags text[] DEFAULT '{}',
  spots int,
  seats_open int,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribes TO anon, authenticated;
DROP POLICY IF EXISTS "Anon write tribes" ON public.tribes;
CREATE POLICY "Anon write tribes" ON public.tribes
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Events (used in Pulse + My Sanvic)
CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  org text DEFAULT '',
  where_text text DEFAULT '',
  when_text text DEFAULT '',
  price text DEFAULT '',
  tags text[] DEFAULT '{}',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO anon, authenticated;
DROP POLICY IF EXISTS "Anon write events" ON public.events;
CREATE POLICY "Anon write events" ON public.events
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
