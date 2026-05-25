import type { Metadata } from 'next';
import { VaultClient } from '@/components/vault-client';

export const metadata: Metadata = {
  title: 'Password Vault | AssetWise',
  description: 'Securely store and manage encrypted credentials for your team.',
};

export default function VaultPage() {
  return <VaultClient />;
}
