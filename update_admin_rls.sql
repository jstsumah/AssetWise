-- =============================================================================
-- Script to update RLS policies, allowing Admins to update records on all tables
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- EMPLOYEES: Users can update their own row; Admins can update ANY employee
DROP POLICY IF EXISTS "employees_update" ON employees;
CREATE POLICY "employees_update" ON employees
  FOR UPDATE TO authenticated
  USING (
    id = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM employees AS me
      WHERE me.id = (auth.uid())::text
        AND me.role = 'Admin'
    )
  );

-- COMPANIES: Admins can update ANY company
DROP POLICY IF EXISTS "companies_update" ON companies;
CREATE POLICY "companies_update" ON companies
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
    )
  );

-- ASSETS: Admins can update ANY asset
DROP POLICY IF EXISTS "assets_update" ON assets;
CREATE POLICY "assets_update" ON assets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
    )
  );

-- ACTIVITY LOGS: Admins can update ANY activity log
DROP POLICY IF EXISTS "activity_logs_update" ON activity_logs;
CREATE POLICY "activity_logs_update" ON activity_logs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
    )
  );

-- VAULT: Owner OR any Admin can update
DROP POLICY IF EXISTS "vault_update" ON vault;
CREATE POLICY "vault_update" ON vault
  FOR UPDATE TO authenticated
  USING (
    ownerid = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
    )
  );

-- VAULT PASSWORD HISTORY: Admins can update
DROP POLICY IF EXISTS "vault_history_update" ON vault_password_history;
CREATE POLICY "vault_history_update" ON vault_password_history
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = (auth.uid())::text
        AND role = 'Admin'
    )
  );
