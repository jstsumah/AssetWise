-- =============================================================================
-- AssetWise — Bootstrap Script
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- PURPOSE: This script sets up the database trigger AND creates a default
-- company so the app can be used. Run this ONCE before signing up.
-- =============================================================================

-- ─── STEP 1: Install the auth trigger (auto-creates employee on signup) ───────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.employees (
    id,
    name,
    email,
    department,
    jobtitle,
    avatarurl,
    role,
    active,
    companyid
  )
  VALUES (
    new.id::text,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'Unassigned',
    'New Employee',
    '',
    'Employee',
    false,
    null
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── STEP 2: Create a default company ────────────────────────────────────────
INSERT INTO public.companies (id, name, industry)
VALUES ('default-company', 'My Organization', 'General')
ON CONFLICT (id) DO NOTHING;

-- ─── VERIFICATION ─────────────────────────────────────────────────────────────
-- After running this, go to the app and SIGN UP a new account.
-- Then come back and run the STEP 3 below (replacing the email).

-- ─── STEP 3: Activate first admin (run AFTER signing up via the app) ─────────
-- Replace 'your-email@example.com' with the email you signed up with:
--
-- UPDATE public.employees
-- SET
--   active    = true,
--   role      = 'Admin',
--   companyid = 'default-company'
-- WHERE email = 'your-email@example.com';
--
-- Then log in — you should have full admin access.
