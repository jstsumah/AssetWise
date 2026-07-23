import type { Metadata } from 'next';
import { AuditLogsClient } from '@/components/audit-logs-client';

export const metadata: Metadata = {
  title: 'Security & Audit Logs | AssetWise',
  description: 'Monitor real-time user logins, credential accesses, and system audit events.',
};

export default function AuditLogsPage() {
  return <AuditLogsClient />;
}
