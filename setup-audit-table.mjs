/**
 * AssetWise — System Audit Logs Table Setup
 * Run: node --env-file=.env setup-audit-table.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !svc) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, svc);

console.log('Checking system_audit_logs table access...');

const { count, error } = await supabase
  .from('system_audit_logs')
  .select('*', { count: 'exact', head: true });

if (error) {
  console.log('Table error or missing:', error.message);
  console.log('\nPlease run the following SQL in Supabase SQL Editor:\n');
  console.log(`
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id SERIAL PRIMARY KEY,
    userId VARCHAR(255),
    userName VARCHAR(255) NOT NULL,
    userEmail VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'System',
    details TEXT,
    companyId VARCHAR(255),
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON system_audit_logs(companyId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON system_audit_logs(userId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON system_audit_logs(createdAt);

ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_insert" ON system_audit_logs;
DROP POLICY IF EXISTS "audit_logs_select" ON system_audit_logs;

CREATE POLICY "audit_logs_insert" ON system_audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "audit_logs_select" ON system_audit_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM employees WHERE id = (auth.uid())::text AND role = 'Admin')
);
  `);
} else {
  console.log(`✅ system_audit_logs table exists and ready! Current rows: ${count}`);
}
