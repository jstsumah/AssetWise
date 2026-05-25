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
    name VARCHAR(255) NOT NULL
);

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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='companyId') THEN
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
    CONSTRAINT fk_asset_employee FOREIGN KEY (assignedTo) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

-- Safe Column Upgrades for Assets
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='assetValue') THEN
        ALTER TABLE assets ADD COLUMN assetValue DECIMAL(12, 2) NOT NULL DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='companyId') THEN
        ALTER TABLE assets ADD COLUMN companyId VARCHAR(255);
        ALTER TABLE assets ADD CONSTRAINT fk_asset_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE;
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
    category VARCHAR(50) NOT NULL CHECK (category IN ('Login', 'Wi-Fi', 'API Key', 'SSH Key', 'Database', 'Other')),
    accessLevel VARCHAR(50) NOT NULL DEFAULT 'owner' CHECK (accessLevel IN ('owner', 'admins', 'company')),
    ownerId VARCHAR(255) NOT NULL,
    ownerName VARCHAR(255) NOT NULL,
    companyId VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vault_employee FOREIGN KEY (ownerId) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_vault_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

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
