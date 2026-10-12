
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies
           WHERE schemaname = 'public' AND tablename IN ('pulse_posts','pulse_comments','pulse_likes')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

CREATE POLICY "Anyone can read pulse posts"     ON public.pulse_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can create pulse posts"   ON public.pulse_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authors can update own posts"    ON public.pulse_posts FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Authors can delete own posts"    ON public.pulse_posts FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Anyone can read pulse comments"  ON public.pulse_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create pulse comments" ON public.pulse_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authors can delete own comments" ON public.pulse_comments FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Anyone can read pulse likes"     ON public.pulse_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can like"                 ON public.pulse_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can unlike by device"     ON public.pulse_likes FOR DELETE USING (true);
