
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAssets, getCompanies, getEmployees } from '@/lib/data';
import type { Asset, Company, Employee } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q');

  const [results, setResults] = React.useState<{ assets: Asset[], employees: Employee[], companies: Company[] }>({ assets: [], employees: [], companies: [] });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!query) {
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const [assetsData, employeesData, companiesData] = await Promise.all([
          getAssets(),
          getEmployees(),
          getCompanies(),
        ]);

        const lowerCaseQuery = query.toLowerCase();

        const filteredAssets = assetsData.filter(asset => 
          asset.serialNumber.toLowerCase().includes(lowerCaseQuery) ||
          asset.tagNo.toLowerCase().includes(lowerCaseQuery) ||
          asset.brand.toLowerCase().includes(lowerCaseQuery) ||
          asset.model.toLowerCase().includes(lowerCaseQuery)
        );

        const filteredEmployees = employeesData.filter(employee =>
          employee.name.toLowerCase().includes(lowerCaseQuery) ||
          employee.email.toLowerCase().includes(lowerCaseQuery) ||
          employee.department.toLowerCase().includes(lowerCaseQuery)
        );

        const filteredCompanies = companiesData.filter(company =>
          company.name.toLowerCase().includes(lowerCaseQuery)
        );

        setResults({ assets: filteredAssets, employees: filteredEmployees, companies: filteredCompanies });

      } catch (error) {
        console.error("Failed to perform search:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [query]);

  if (!query) {
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold font-headline mb-4">Search</h1>
            <p className="text-muted-foreground">Please enter a search term in the search bar above to begin.</p>
        </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <h1 className="text-2xl font-bold font-headline mb-4">Searching for &quot;{query}&quot;...</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const totalResults = results.assets.length + results.employees.length + results.companies.length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold font-headline mb-4">Search Results for &quot;{query}&quot;</h1>
      {totalResults === 0 ? (
        <p className="text-muted-foreground">No results found.</p>
      ) : (
        <>
        {results.assets.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Assets ({results.assets.length})</CardTitle>
                    <CardDescription>Assets matching your search query.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tag No</TableHead>
                                <TableHead>Serial</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {results.assets.map(asset => (
                            <TableRow key={asset.id}>
                                <TableCell className="font-mono">{asset.tagNo}</TableCell>
                                <TableCell className="font-mono">{asset.serialNumber}</TableCell>
                                <TableCell>{asset.brand} {asset.model}</TableCell>
                                <TableCell><Badge variant="outline">{asset.status}</Badge></TableCell>
                                <TableCell>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={`/assets?search=${asset.serialNumber}`}>View</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
        {results.employees.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Employees ({results.employees.length})</CardTitle>
                    <CardDescription>Employees matching your search query.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {results.employees.map(employee => (
                            <TableRow key={employee.id}>
                               <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>{employee.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{employee.email}</TableCell>
                                <TableCell>{employee.department}</TableCell>
                                <TableCell>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={`/employees/${employee.id}`}>View Profile</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
        {results.companies.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Companies ({results.companies.length})</CardTitle>
                    <CardDescription>Companies matching your search query.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {results.companies.map(company => (
                            <TableRow key={company.id}>
                                <TableCell>{company.name}</TableCell>
                                <TableCell>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href="/companies">View</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
        </>
      )}
    </div>
  );
}
