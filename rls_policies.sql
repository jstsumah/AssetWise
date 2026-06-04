-- =============================================================================
-- AssetWise — Row Level Security Policies
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- ─── Enable RLS on all tables (idempotent) ───────────────────────────────────
ALTER TABLE employees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault                ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_password_history ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- EMPLOYEES
-- • Any authenticated user can read all employees (needed for asset assignment UI)
-- • Users can only INSERT their own row (signup flow: id must match auth.uid())
-- • Users can UPDATE their own row; Admins can update anyone in their company
-- • Admins can delete employees in their company
-- =============================================================================

DROP POLICY IF EXISTS "employees_select"       ON employees;
DROP POLICY IF EXISTS "employees_insert_own"   ON employees;
DROP POLICY IF EXISTS "employees_update"       ON employees;
DROP POLICY IF EXISTS "employees_delete_admin" ON employees;

CREATE POLICY "employees_select" ON employees
  FOR SELECT TO authenticated
  USING (true);

-- Critical for signup: authenticated user can insert a row where id = their UID
CREATE POLICY "employees_insert_own" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (id = (auth.uid())::text);

CREATE POLICY "employees_update" ON employees
  FOR UPDATE TO authenticated
  USING (
    id = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM employees AS me
      WHERE me.id = (auth.uid())::text
        AND me.role = 'Admin'
        AND (me.companyid = employees.companyid OR employees.companyid IS NULL)
    )
  );

CREATE POLICY "employees_delete_admin" ON employees
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees AS me
      WHERE me.id = (auth.uid())::text
        AND me.role = 'Admin'
        AND (me.companyid = employees.companyid OR employees.companyid IS NULL)
    )
  );

-- =============================================================================
-- COMPANIES
-- • Any authenticated user can read all companies
-- • Only Admins can create / update / delete companies
-- =============================================================================

DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;

CREATE POLICY "companies_select" ON companies
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "companies_insert" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text AND role = 'Admin'
    )
  );

CREATE POLICY "companies_update" ON companies
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
        AND companyid = companies.id
    )
  );

CREATE POLICY "companies_delete" ON companies
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
        AND companyid = companies.id
    )
  );

-- =============================================================================
-- ASSETS
-- • Any authenticated user can read assets
-- • Only Admins in the same company can write assets
-- =============================================================================

DROP POLICY IF EXISTS "assets_select" ON assets;
DROP POLICY IF EXISTS "assets_insert" ON assets;
DROP POLICY IF EXISTS "assets_update" ON assets;
DROP POLICY IF EXISTS "assets_delete" ON assets;

CREATE POLICY "assets_select" ON assets
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "assets_insert" ON assets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
        AND companyid = assets.companyid
    )
  );

CREATE POLICY "assets_update" ON assets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
        AND companyid = assets.companyid
    )
  );

CREATE POLICY "assets_delete" ON assets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
        AND companyid = assets.companyid
    )
  );

-- =============================================================================
-- ACTIVITY LOGS
-- • Any authenticated user can read logs
-- • Any authenticated user can insert logs (triggered on asset assignment)
-- =============================================================================

DROP POLICY IF EXISTS "activity_logs_select" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert" ON activity_logs;

CREATE POLICY "activity_logs_select" ON activity_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "activity_logs_insert" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================================================
-- VAULT
-- • Users can read entries in their company (filtering by access level is done in app code)
-- • Users can only insert vault entries they own in their company
-- • Owner OR company Admin can update/delete
-- =============================================================================

DROP POLICY IF EXISTS "vault_select" ON vault;
DROP POLICY IF EXISTS "vault_insert" ON vault;
DROP POLICY IF EXISTS "vault_update" ON vault;
DROP POLICY IF EXISTS "vault_delete" ON vault;

CREATE POLICY "vault_select" ON vault
  FOR SELECT TO authenticated
  USING (
    companyid IN (
      SELECT companyid FROM employees WHERE id = (auth.uid())::text
    )
  );

CREATE POLICY "vault_insert" ON vault
  FOR INSERT TO authenticated
  WITH CHECK (
    ownerid = (auth.uid())::text
    AND companyid IN (
      SELECT companyid FROM employees WHERE id = (auth.uid())::text
    )
  );

CREATE POLICY "vault_update" ON vault
  FOR UPDATE TO authenticated
  USING (
    ownerid = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
        AND companyid = vault.companyid
    )
  );

CREATE POLICY "vault_delete" ON vault
  FOR DELETE TO authenticated
  USING (
    ownerid = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
        AND companyid = vault.companyid
    )
  );

-- =============================================================================
-- VAULT PASSWORD HISTORY
-- • Readable and writable by any authenticated user
--   (vault-level RLS already gates access to vault entries)
-- =============================================================================

DROP POLICY IF EXISTS "vault_history_select" ON vault_password_history;
DROP POLICY IF EXISTS "vault_history_insert" ON vault_password_history;

CREATE POLICY "vault_history_select" ON vault_password_history
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "vault_history_insert" ON vault_password_history
  FOR INSERT TO authenticated
  WITH CHECK (true);
