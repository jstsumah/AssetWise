
'use client';

import * as React from 'react';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import { getCompanies, getAssets, getEmployees } from '@/lib/data';
import type { Company, Asset, Employee } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CompanyTableClient } from '@/components/company-table-client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function CompaniesPage() {
  const { dataVersion } = useDataRefresh();
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect non-admins away from this page
  React.useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [companiesData, assetsData, employeesData] = await Promise.all([
             getCompanies(),
             getAssets(),
             getEmployees()
        ]);
        setCompanies(companiesData);
        setAssets(assetsData);
        setEmployees(employeesData);
      } catch (error) {
        console.error('Failed to load companies data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    // Only load data if user is admin
    if (!authLoading && isAdmin) {
      loadData();
    }
  }, [dataVersion, authLoading, isAdmin]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <h1 className="text-2xl font-bold font-headline mb-4">Company Management</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
     <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold font-headline mb-4">Company Management</h1>
      <CompanyTableClient companies={companies} assets={assets} employees={employees} />
    </div>
  );
}
