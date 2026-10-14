-- ═══════════════════════════════════════════════════════════════════════
-- Give a login the admin role (needed to save anything in the Backoffice)
-- ═══════════════════════════════════════════════════════════════════════
-- 1. Sign in to the site once with this email (the email link or Google),
--    so the user exists in Authentication → Users.
-- 2. Change the email on the line marked  <<< below.
-- 3. Supabase Dashboard → SQL Editor → paste → Run.
-- The result lists everyone who currently has the admin role.
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  admin_email text := 'you@example.com';   -- <<< CHANGE THIS
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(admin_email));
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No login found for %. Sign in to the site with that email first, then run this again.', admin_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

SELECT u.email, r.role, r.created_at AS admin_since
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id
WHERE r.role = 'admin'
ORDER BY r.created_at;

-- To remove someone later:
--   DELETE FROM public.user_roles
--   WHERE role = 'admin'
--     AND user_id = (SELECT id FROM auth.users WHERE email = 'them@example.com');
