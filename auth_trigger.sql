-- =============================================================================
-- AssetWise — Auto-Create Employee Profile Trigger
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- 1. Create the trigger function
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
    new.id::text, -- Cast UUID to text for the VARCHAR(255) column
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), -- fallback to email prefix if no name
    new.email,
    'Unassigned',
    'New Employee',
    '',
    'Employee',
    false,
    null
  )
  -- If the profile already exists (e.g. created manually), do nothing
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- 2. Bind the trigger to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. (Optional but recommended) Run this to backfill any users 
--    that are in auth.users but missing from public.employees
INSERT INTO public.employees (id, name, email, department, jobtitle, avatarurl, role, active, companyid)
SELECT 
  id::text, -- Cast UUID to text
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 
  email, 
  'Unassigned', 
  'New Employee', 
  '', 
  'Employee', 
  false, 
  null
FROM auth.users
WHERE id::text NOT IN (SELECT id FROM public.employees) -- Fixed the type mismatch error here
ON CONFLICT (id) DO NOTHING;
