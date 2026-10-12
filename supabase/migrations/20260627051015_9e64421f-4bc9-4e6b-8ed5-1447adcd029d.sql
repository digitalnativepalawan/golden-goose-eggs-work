
-- 1. Role infrastructure
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Lock writes on content tables (keep public read)
DROP POLICY IF EXISTS "Public write destinations" ON public.destinations;
CREATE POLICY "Admins write destinations" ON public.destinations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public write tala_responses" ON public.tala_responses;
CREATE POLICY "Admins write tala_responses" ON public.tala_responses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public write tala_settings" ON public.tala_settings;
CREATE POLICY "Admins write tala_settings" ON public.tala_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public write tala_suggestions" ON public.tala_suggestions;
CREATE POLICY "Admins write tala_suggestions" ON public.tala_suggestions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public write pulse categories" ON public.pulse_categories;
CREATE POLICY "Admins write pulse categories" ON public.pulse_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Storage bucket writes -> admin only (public read kept)
DROP POLICY IF EXISTS "Public upload destination images" ON storage.objects;
DROP POLICY IF EXISTS "Public update destination images" ON storage.objects;
DROP POLICY IF EXISTS "Public delete destination images" ON storage.objects;
DROP POLICY IF EXISTS "Public upload destination videos" ON storage.objects;
DROP POLICY IF EXISTS "Public update destination videos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete destination videos" ON storage.objects;

CREATE POLICY "Admins upload destination images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'destination-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update destination images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'destination-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete destination images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'destination-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload destination videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'destination-videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update destination videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'destination-videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete destination videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'destination-videos' AND public.has_role(auth.uid(), 'admin'));

-- 4. traveler_profiles: hide moderation_note from public
DROP POLICY IF EXISTS "Public read profiles" ON public.traveler_profiles;

CREATE POLICY "Owner reads own profile" ON public.traveler_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins read all profiles" ON public.traveler_profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public-safe view (no moderation fields, no last_seen privacy leak risk avoided by excluding email etc.)
CREATE OR REPLACE VIEW public.traveler_profiles_public
WITH (security_invoker = true) AS
SELECT id, display_name, avatar_url, bio, created_at
FROM public.traveler_profiles;

GRANT SELECT ON public.traveler_profiles_public TO anon, authenticated;

-- Allow anon/authenticated to read the underlying rows ONLY through the view's projected columns.
-- security_invoker=true means the view runs as the caller, so we need a SELECT policy that lets
-- anyone read rows (the view itself only projects safe columns).
CREATE POLICY "Public read profiles via view" ON public.traveler_profiles
  FOR SELECT TO anon, authenticated USING (true);

-- The above re-opens read of all columns to anon. Revert by removing it and using a SECURITY DEFINER
-- function instead — switch strategy:
DROP POLICY "Public read profiles via view" ON public.traveler_profiles;

CREATE OR REPLACE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE(id uuid, display_name text, avatar_url text, bio text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, display_name, avatar_url, bio
  FROM public.traveler_profiles
  WHERE id = ANY(_ids);
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO anon, authenticated, service_role;

-- Drop the view since we're using the RPC instead
DROP VIEW IF EXISTS public.traveler_profiles_public;

-- 5. Lock down admin RPCs - only admins can execute
REVOKE EXECUTE ON FUNCTION public.admin_update_pulse_comment(bigint, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_pulse_comment(bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_pulse_post(bigint, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_pulse_post(bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_moderation(uuid, boolean, boolean, text) FROM PUBLIC, anon, authenticated;

-- Wrap each admin function body with a role check
CREATE OR REPLACE FUNCTION public.admin_update_pulse_comment(comment_id bigint, new_text text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.pulse_comments SET text_content = new_text WHERE id = comment_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_pulse_comment(comment_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  DELETE FROM public.pulse_comments WHERE id = comment_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_update_pulse_post(post_id bigint, new_text text, new_category text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.pulse_posts SET text_content = new_text, category = new_category WHERE id = post_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_pulse_post(post_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  DELETE FROM public.pulse_comments WHERE post_id = admin_delete_pulse_post.post_id;
  DELETE FROM public.pulse_likes WHERE post_id = admin_delete_pulse_post.post_id;
  DELETE FROM public.pulse_posts WHERE id = admin_delete_pulse_post.post_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_user_moderation(target_user_id uuid, muted boolean, banned boolean, note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.traveler_profiles
    SET is_muted = muted, is_banned = banned, moderation_note = COALESCE(note, moderation_note)
    WHERE id = target_user_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_update_pulse_comment(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_pulse_comment(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_pulse_post(bigint, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_pulse_post(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_moderation(uuid, boolean, boolean, text) TO authenticated;
