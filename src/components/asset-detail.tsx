
'use client'

import * as React from 'react';
import { getAssetById, getEmployees, getCompanyById, getCompanies } from '@/lib/data';
import type { Asset, Employee, Company, Assignment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import { PurchaseDate } from './purchase-date';
import { Circle, HardDrive, HelpCircle, Laptop, Smartphone, Tablet } from 'lucide-react';
import Link from 'next/link';

const statusConfig: Record<
  Asset['status'],
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  'In Use': { label: 'In Use', icon: Circle, color: 'text-green-500' },
  Available: { label: 'Available', icon: Circle, color: 'text-blue-500' },
  'In Repair': { label: 'In Repair', icon: Circle, color: 'text-yellow-500' },
  Decommissioned: { label: 'Decommissioned', icon: Circle, color: 'text-gray-500' },
};

const defaultStatusConfig = { label: 'Unknown', icon: HelpCircle, color: 'text-muted-foreground' };

const categoryIcons: Record<Asset['category'], React.ReactNode> = {
  Laptop: <Laptop className="h-4 w-4" />,
  Desktop: <HardDrive className="h-4 w-4" />,
  Phone: <Smartphone className="h-4 w-4" />,
  Tablet: <Tablet className="h-4 w-4" />,
  Other: <Circle className="h-4 w-4" />,
};


function HistoryRow({ assignment, employee }: { assignment: Assignment; employee?: Employee }) {
    return (
        <TableRow>
            <TableCell>
                {employee ? (
                     <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Link href={`/employees/${employee.id}`} className="hover:underline">
                            {employee.name}
                        </Link>
                    </div>
                ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                )}
            </TableCell>
            <TableCell><Badge variant="outline">{assignment.status}</Badge></TableCell>
            <TableCell><PurchaseDate date={assignment.date} /></TableCell>
            <TableCell className="hidden md:table-cell">{assignment.notes}</TableCell>
        </TableRow>
    )
}

export function AssetDetail({ assetId }: { assetId: string }) {
  const [asset, setAsset] = React.useState<Asset | null>(null);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [company, setCompany] = React.useState<Company | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { dataVersion } = useDataRefresh();

  React.useEffect(() => {
    async function loadData() {
      if (!assetId) return;

      setIsLoading(true);
      try {
        const [assetData, employeesData, companiesData] = await Promise.all([
          getAssetById(assetId),
          getEmployees(),
          getCompanies(),
        ]);
        
        setAsset(assetData || null);
        setEmployees(employeesData);

        if (assetData) {
            const companyData = await getCompanyById(assetData.companyId, companiesData);
            setCompany(companyData || null);
        }

      } catch (error) {
        console.error("Failed to load asset detail data:", error)
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [assetId, dataVersion]);

  const getEmployeeById = (id: string): Employee | undefined => employees.find(e => e.id === id);

  if (isLoading || !asset) {
    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-10 w-24" />
            </div>
            <Separator />
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-32" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-80" />
                </div>
            </div>
        </div>
    )
  }

  const currentEmployee = asset.assignedTo ? getEmployeeById(asset.assignedTo) : undefined;
  const statusInfo = statusConfig[asset.status] || defaultStatusConfig;
  const categoryIcon = categoryIcons[asset.category] || categoryIcons['Other'];


  return (
    <>
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex items-start justify-between space-y-2">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Asset: {asset.brand} {asset.model}
            </h1>
            <p className="text-muted-foreground font-mono">{asset.serialNumber}</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 text-base py-1 px-3">
          <statusInfo.icon className={`h-3 w-3 ${statusInfo.color} fill-current`} />
          <span>{statusInfo.label}</span>
        </Badge>
      </div>
      <Separator />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Asset Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-24">Tag No:</span>
                        <span className="font-mono">{asset.tagNo}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-24">Category:</span>
                        <span className="flex items-center gap-1">{categoryIcon} {asset.category}</span>
                     </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-24">Company:</span>
                        <span>{company?.name ?? 'N/A'}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-24">Value:</span>
                        <span>KES {asset.assetValue.toLocaleString()}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-24">Purchased:</span>
                        <span><PurchaseDate date={asset.purchaseDate} /></span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-24">Warranty:</span>
                        <span><PurchaseDate date={asset.warrantyExpiry} /></span>
                     </div>
                     {asset.remarks && (
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">Remarks:</span>
                            <p className="text-sm bg-muted/50 p-2 rounded-md">{asset.remarks}</p>
                        </div>
                     )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Current Holder</CardTitle>
                </CardHeader>
                <CardContent>
                    {currentEmployee ? (
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={currentEmployee.avatarUrl || undefined} alt={currentEmployee.name} />
                                <AvatarFallback>{currentEmployee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <Link href={`/employees/${currentEmployee.id}`} className="font-semibold hover:underline">{currentEmployee.name}</Link>
                                <p className="text-sm text-muted-foreground">{currentEmployee.jobTitle}</p>
                                <p className="text-sm text-muted-foreground">{currentEmployee.department}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">This asset is not currently assigned to anyone.</p>
                    )}
                </CardContent>
            </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assignment History</CardTitle>
            <CardDescription>A complete log of this asset's assignments.</CardDescription>
          </CardHeader>
          <CardContent>
            {asset.history && asset.history.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="hidden md:table-cell">Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {asset.history.slice().reverse().map((assignment, index) => {
                                const employee = getEmployeeById(assignment.assignedTo);
                                return <HistoryRow key={index} assignment={assignment} employee={employee} />
                            })}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No assignment history for this asset.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
