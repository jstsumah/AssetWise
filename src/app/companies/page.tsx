
'use client';

import * as React from 'react';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import { getCompanies, getAssets } from '@/lib/data';
import type { Company, Asset } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CompanyTableClient } from '@/components/company-table-client';

export default function CompaniesPage() {
  const { dataVersion } = useDataRefresh();
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [companiesData, assetsData] = await Promise.all([
            getCompanies(),
            getAssets()
        ]);
        setCompanies(companiesData);
        setAssets(assetsData);
      } catch (error) {
        console.error('Failed to load companies data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [dataVersion]);

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
      <CompanyTableClient companies={companies} assets={assets} />
    </div>
  );
}
