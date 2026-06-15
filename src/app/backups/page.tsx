'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { BackupsClient } from '@/components/backups-client';

export default function BackupsPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  // Redirect non-admins away
  React.useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="text-lg">Loading Backups & Security Module...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Backups & Recovery
        </h1>
      </div>
      <BackupsClient />
    </div>
  );
}
