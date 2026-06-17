-- =============================================================================
-- AssetWise Relational Database Schema & Migration Script (Non-Destructive)
-- Target: PostgreSQL / MySQL Compatible
--
-- This script designs and updates the relational database structure for AssetWise,
-- representing all collections including the new Password Vault and its
-- encrypted history archival fields.
--
-- Running this script is completely NON-DESTRUCTIVE:
-- 1. Tables are created only if they do not already exist.
-- 2. Alteration blocks are used to safely append new columns to pre-existing
--    tables without dropping or modifying current rows.
-- =============================================================================

-- ─── 1. COMPANIES TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    industry VARCHAR(100),
    address TEXT,
    taxId VARCHAR(100)
);

-- Safe Column Upgrades for Companies
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='website') THEN
        ALTER TABLE companies ADD COLUMN website VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='email') THEN
        ALTER TABLE companies ADD COLUMN email VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='phone') THEN
        ALTER TABLE companies ADD COLUMN phone VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='industry') THEN
        ALTER TABLE companies ADD COLUMN industry VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='address') THEN
        ALTER TABLE companies ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='taxid') THEN
        ALTER TABLE companies ADD COLUMN taxId VARCHAR(100);
    END IF;
END $$;


-- ─── 2. EMPLOYEES TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255) NOT NULL DEFAULT 'Unassigned',
    jobTitle VARCHAR(255) NOT NULL DEFAULT 'New Employee',
    avatarUrl TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'Employee' CHECK (role IN ('Admin', 'Employee')),
    active BOOLEAN NOT NULL DEFAULT FALSE,
    companyId VARCHAR(255),
    CONSTRAINT fk_employee_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL
);

-- Safe Column Upgrades for Employees
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='role') THEN
        ALTER TABLE employees ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'Employee' CHECK (role IN ('Admin', 'Employee'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='active') THEN
        ALTER TABLE employees ADD COLUMN active BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='companyid') THEN
        ALTER TABLE employees ADD COLUMN companyId VARCHAR(255);
        ALTER TABLE employees ADD CONSTRAINT fk_employee_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ─── 3. ASSETS TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(255) PRIMARY KEY,
    serialNumber VARCHAR(255) NOT NULL,
    tagNo VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Laptop', 'Desktop', 'Phone', 'Tablet', 'Other')),
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    purchaseDate DATE NOT NULL,
    warrantyExpiry DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'In Use', 'In Repair', 'Decommissioned')),
    assignedTo VARCHAR(255),
    photoUrl TEXT,
    assetValue DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    remarks TEXT,
    companyId VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(100),
    CONSTRAINT fk_asset_employee FOREIGN KEY (assignedTo) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

-- Safe Column Upgrades for Assets
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='assetvalue') THEN
        ALTER TABLE assets ADD COLUMN assetValue DECIMAL(12, 2) NOT NULL DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='companyid') THEN
        ALTER TABLE assets ADD COLUMN companyId VARCHAR(255);
        ALTER TABLE assets ADD CONSTRAINT fk_asset_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='phonenumber') THEN
        ALTER TABLE assets ADD COLUMN phoneNumber VARCHAR(100);
    END IF;
END $$;

-- ─── 4. RECENT ACTIVITY & ASSIGNMENT LOGS TABLE ─────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    assetId VARCHAR(255) NOT NULL,
    assetSerial VARCHAR(255) NOT NULL,
    employeeId VARCHAR(255),
    employeeName VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(50) NOT NULL CHECK (action IN ('Assigned', 'Returned')),
    notes TEXT,
    CONSTRAINT fk_activity_asset FOREIGN KEY (assetId) REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_activity_employee FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE SET NULL
);

-- ─── 5. PASSWORD VAULT TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    encryptedPassword TEXT NOT NULL,                     -- AES-GCM base64 ciphertext
    iv VARCHAR(50) NOT NULL,                             -- AES-GCM base64 initialization vector
    url TEXT,
    notes TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Login', 'Wi-Fi', 'API Key', 'SSH Key', 'Database', 'Phone Email', 'Other')),
    accessLevel VARCHAR(50) NOT NULL DEFAULT 'owner' CHECK (accessLevel IN ('owner', 'admins', 'company')),
    ownerId VARCHAR(255) NOT NULL,
    ownerName VARCHAR(255) NOT NULL,
    companyId VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vault_employee FOREIGN KEY (ownerId) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_vault_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

-- Safe Constraint Upgrades for Vault
DO $$ 
DECLARE
    constraint_name text;
BEGIN 
    SELECT conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'vault' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%category%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE vault DROP CONSTRAINT ' || constraint_name;
    END IF;
    
    ALTER TABLE vault ADD CONSTRAINT vault_category_check CHECK (category IN ('Login', 'Wi-Fi', 'API Key', 'SSH Key', 'Database', 'Phone Email', 'Other'));
END $$;

-- ─── 6. PASSWORD HISTORY (FAIL-SAFE ARCHIVE) TABLE ──────────────────────────
CREATE TABLE IF NOT EXISTS vault_password_history (
    id SERIAL PRIMARY KEY,
    vaultEntryId VARCHAR(255) NOT NULL,
    encryptedPassword TEXT NOT NULL,                     -- Legacy AES-GCM base64 ciphertext
    iv VARCHAR(50) NOT NULL,                             -- Legacy AES-GCM base64 IV
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_vault FOREIGN KEY (vaultEntryId) REFERENCES vault(id) ON DELETE CASCADE
);

-- Create highly performing indexes for searching credentials securely
CREATE INDEX IF NOT EXISTS idx_vault_company ON vault(companyId);
CREATE INDEX IF NOT EXISTS idx_vault_owner ON vault(ownerId);
CREATE INDEX IF NOT EXISTS idx_vault_category ON vault(category);
CREATE INDEX IF NOT EXISTS idx_password_history_entry ON vault_password_history(vaultEntryId);

-- ─── 7. APP BACKUPS TABLE (JSON ENGINE) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_name VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    record_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    trigger_type VARCHAR(50) NOT NULL DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS idx_app_backups_created_at ON app_backups(created_at);

-- NOTE: Supabase Storage Buckets ('backups') should be created via the Supabase Dashboard
-- or via the Storage API. Below is the equivalent raw SQL to insert the bucket if running as superuser:
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('backups', 'backups', false) 
-- ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Row Level Security (RLS) Policies
-- This unified block secures all tables and supersedes previous policy patches.
-- =============================================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_backups ENABLE ROW LEVEL SECURITY;

-- ─── 1. EMPLOYEES ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "employees_select" ON employees;
DROP POLICY IF EXISTS "employees_insert_own" ON employees;
DROP POLICY IF EXISTS "employees_insert_self" ON employees;
DROP POLICY IF EXISTS "employees_insert_admin" ON employees;
DROP POLICY IF EXISTS "employees_update" ON employees;
DROP POLICY IF EXISTS "employees_delete_admin" ON employees;

CREATE POLICY "employees_select" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees_insert_self" ON employees FOR INSERT TO authenticated WITH CHECK (id = (auth.uid())::text);
CREATE POLICY "employees_insert_admin" ON employees FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM employees AS me WHERE me.id = (auth.uid())::text AND me.role = 'Admin')
);
CREATE POLICY "employees_update" ON employees FOR UPDATE TO authenticated USING (
  id = (auth.uid())::text OR EXISTS (SELECT 1 FROM employees AS me WHERE me.id = (auth.uid())::text AND me.role = 'Admin')
);
CREATE POLICY "employees_delete_admin" ON employees FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM employees AS me WHERE me.id = (auth.uid())::text AND me.role = 'Admin')
);

-- ─── 2. COMPANIES ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;

CREATE POLICY "companies_select" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "companies_insert" ON companies FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));
CREATE POLICY "companies_update" ON companies FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));
CREATE POLICY "companies_delete" ON companies FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));

-- ─── 3. ASSETS ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "assets_select" ON assets;
DROP POLICY IF EXISTS "assets_insert" ON assets;
DROP POLICY IF EXISTS "assets_update" ON assets;
DROP POLICY IF EXISTS "assets_delete" ON assets;

CREATE POLICY "assets_select" ON assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "assets_insert" ON assets FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));
CREATE POLICY "assets_update" ON assets FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));
CREATE POLICY "assets_delete" ON assets FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));

-- ─── 4. ACTIVITY LOGS ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "activity_logs_select" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert" ON activity_logs;

CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ─── 5. VAULT (ADMINS ONLY) ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "vault_select" ON vault;
DROP POLICY IF EXISTS "vault_insert" ON vault;
DROP POLICY IF EXISTS "vault_insert_self" ON vault;
DROP POLICY IF EXISTS "vault_insert_admin" ON vault;
DROP POLICY IF EXISTS "vault_update" ON vault;
DROP POLICY IF EXISTS "vault_delete" ON vault;

CREATE POLICY "vault_select" ON vault FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));
CREATE POLICY "vault_insert" ON vault FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));
CREATE POLICY "vault_update" ON vault FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));
CREATE POLICY "vault_delete" ON vault FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));

-- ─── 6. VAULT PASSWORD HISTORY (ADMINS ONLY) ─────────────────────────────────
DROP POLICY IF EXISTS "vault_history_select" ON vault_password_history;
DROP POLICY IF EXISTS "vault_history_insert" ON vault_password_history;

CREATE POLICY "vault_history_select" ON vault_password_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));
CREATE POLICY "vault_history_insert" ON vault_password_history FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin'));

-- ─── 7. APP BACKUPS ──────────────────────────────────────────────────────────
-- RLS enabled (via ALTER TABLE above) but NO policies defined.
-- This ensures ONLY the Supabase Service Role (backend APIs) can read/write.
-- Standard authenticated users have 0 access.
