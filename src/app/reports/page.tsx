
'use client';

import * as React from 'react';
import { getAssets, getEmployees, getCompanies } from '@/lib/data';
import { ReportsClient } from '@/components/reports-client';
import type { Asset, Employee, Company } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


export default function ReportsPage() {
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { dataVersion } = useDataRefresh();
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
          const [assetsData, employeesData, companiesData] = await Promise.all([
              getAssets(),
              getEmployees(),
              getCompanies(),
          ]);
          setAssets(assetsData);
          setEmployees(employeesData);
          setCompanies(companiesData);
        } catch (error) {
          console.error("Failed to load reports data:", error);
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
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
  }

  return <ReportsClient assets={assets} employees={employees} companies={companies} />;
}
