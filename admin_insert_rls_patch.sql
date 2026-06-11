-- =============================================================================
-- AssetWise — Admin INSERT Permissions Patch
-- Grants Admins full INSERT access across all tables.
--
-- NON-DESTRUCTIVE: uses DROP POLICY IF EXISTS before each CREATE POLICY so it
-- is safe to run multiple times without affecting other existing policies.
--
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================


-- ─── EMPLOYEES ───────────────────────────────────────────────────────────────
-- Problem: the original "employees_insert_own" policy only allows inserting a
-- row where id = auth.uid() (designed for the self-signup flow). This blocks
-- Admins from inserting employees on behalf of others.
--
-- Solution: drop the restrictive single policy and replace it with two policies:
--   1. employees_insert_self  — preserves the original self-signup behaviour
--   2. employees_insert_admin — allows any Admin to insert any employee row
-- =============================================================================

DROP POLICY IF EXISTS "employees_insert_own"   ON employees;
DROP POLICY IF EXISTS "employees_insert_self"  ON employees;
DROP POLICY IF EXISTS "employees_insert_admin" ON employees;

-- Self-signup: authenticated user may only insert their own row
CREATE POLICY "employees_insert_self" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (id = (auth.uid())::text);

-- Admin insert: any authenticated Admin may insert any employee row
CREATE POLICY "employees_insert_admin" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees AS me
      WHERE me.id = (auth.uid())::text
        AND me.role = 'Admin'
    )
  );


-- ─── COMPANIES ───────────────────────────────────────────────────────────────
-- Existing "companies_insert" already gates on Admin role; no change needed.
-- Included here for completeness / idempotency.

DROP POLICY IF EXISTS "companies_insert" ON companies;

CREATE POLICY "companies_insert" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text AND role = 'Admin'
    )
  );


-- ─── ASSETS ──────────────────────────────────────────────────────────────────
-- Existing "assets_insert" requires companyid match, which can cause issues
-- when an Admin is not yet assigned to a company. Relax to: any Admin can insert.

DROP POLICY IF EXISTS "assets_insert" ON assets;

CREATE POLICY "assets_insert" ON assets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text AND role = 'Admin'
    )
  );


-- ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────
-- Already open to all authenticated users for INSERT — no change needed.
-- Included here to confirm the policy is present and correct.

DROP POLICY IF EXISTS "activity_logs_insert" ON activity_logs;

CREATE POLICY "activity_logs_insert" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);


-- ─── VAULT ───────────────────────────────────────────────────────────────────
-- Existing "vault_insert" requires ownerid = auth.uid(), which is correct for
-- self-owned entries. Add a separate Admin policy so Admins can create entries
-- on behalf of others or for company-wide access.

DROP POLICY IF EXISTS "vault_insert"       ON vault;
DROP POLICY IF EXISTS "vault_insert_self"  ON vault;
DROP POLICY IF EXISTS "vault_insert_admin" ON vault;

-- Regular users: can only insert entries they own, within their company
CREATE POLICY "vault_insert_self" ON vault
  FOR INSERT TO authenticated
  WITH CHECK (
    ownerid = (auth.uid())::text
    AND companyid IN (
      SELECT companyid FROM employees WHERE id = (auth.uid())::text
    )
  );

-- Admins: can insert any entry within the system
CREATE POLICY "vault_insert_admin" ON vault
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text AND role = 'Admin'
    )
  );


-- ─── VAULT PASSWORD HISTORY ──────────────────────────────────────────────────
-- Already open to all authenticated users — no change needed.

DROP POLICY IF EXISTS "vault_history_insert" ON vault_password_history;

CREATE POLICY "vault_history_insert" ON vault_password_history
  FOR INSERT TO authenticated
  WITH CHECK (true);


-- =============================================================================
-- Done. Verify by running the following query to list all active policies:
--
--   SELECT tablename, policyname, cmd, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
-- =============================================================================
