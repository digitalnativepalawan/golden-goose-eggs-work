-- The PIN-gated Backoffice (client-side, anon key) stores TALA live-AI config
-- (ai_enabled / ai_model / ai_key) and the default response in tala_settings.
-- The 20260627051015 migration locked writes to authenticated admins, which
-- made every Backoffice save return 401. Restore anon write matching how the
-- rest of the admin panel already works (destinations, site_settings etc.).

DROP POLICY IF EXISTS "Anon write tala_settings" ON public.tala_settings;

CREATE POLICY "Anon write tala_settings" ON public.tala_settings
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Belt & braces: ensure the anon role actually has the table grants.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tala_settings TO anon, authenticated;