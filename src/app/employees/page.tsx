
'use client';

import * as React from 'react';
import { getEmployees, getCompanies } from '@/lib/data';
import { EmployeeTableClient } from '@/components/employee-table-client';
import type { Employee, Company } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { dataVersion } = useDataRefresh();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
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
          const [employeesData, companiesData] = await Promise.all([
            getEmployees(),
            getCompanies()
          ]);
          setEmployees(employeesData);
          setCompanies(companiesData);
        } catch (error) {
          console.error("Failed to load employees:", error);
        } finally {
          setIsLoading(false);
        }
    }
    // Only load data if user is admin
    if (!authLoading && isAdmin) {
      loadData();
    }
  }, [dataVersion, authLoading, isAdmin])

  if (isLoading) {
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold font-headline mb-4">Employee Management</h1>
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
    )
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold font-headline mb-4">Employee Management</h1>
      <EmployeeTableClient employees={employees} companies={companies} />
    </div>
  );
}
