
'use client'

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAssets, getEmployees, getEmployeeById, getCompanies } from '@/lib/data';
import type { Asset, Employee, Company } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProfileForm } from '@/components/profile-form';

export function EmployeeProfile({ employeeId }: { employeeId: string }) {
  const { user: currentUser } = useAuth();
  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [allAssets, setAllAssets] = React.useState<Asset[]>([]);
  const [allEmployees, setAllEmployees] = React.useState<Employee[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const { dataVersion } = useDataRefresh();

  const isViewingOwnProfile = currentUser?.id === employeeId;

  React.useEffect(() => {
    async function loadData() {
      if (!employeeId) return;

      setIsLoading(true);
      try {
        const [assetsData, employeesData, employeeData, companiesData] = await Promise.all([
            getAssets(),
            getEmployees(),
            getEmployeeById(employeeId),
            getCompanies()
        ]);
        setAllAssets(assetsData);
        setAllEmployees(employeesData);
        setEmployee(employeeData || null);
        setCompanies(companiesData);
      } catch (error) {
        console.error("Failed to load profile page data:", error)
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [employeeId, dataVersion]);

  const assignedAssets = React.useMemo(() => {
    if (!employee) return [];
    return allAssets.filter(asset => asset.assignedTo === employee.id);
  }, [employee, allAssets]);

  const closeForm = () => setIsFormOpen(false);

  const departments = React.useMemo(() => {
    const existingDepartments = allEmployees.map((e) => e.department);
    const additionalDepartments = [
      "Procurement",
      "IT",
      "Camp Manager",
      "Chef",
      "Accounts",
      "Human Resource",
      "Transport",
      "Workshop",
      "Reservations",
      "Security",
      "Maintenance",
      "Nurse",
      "Sustainability",
      "CWC Liason",
      "Store Keeper",
      "Food & Beverage",
      "House Keeping",
      "Front Office",
      "Guest Relations",
      "Masseuse",
    ];
    return [...new Set([...existingDepartments, ...additionalDepartments])].sort();
  }, [allEmployees]);
  
  if (isLoading || !employee) {
    return (
        <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Separator />
            <div className="grid gap-6 lg:grid-cols-3">
                <Skeleton className="lg:col-span-1 h-48" />
                <Skeleton className="lg:col-span-2 h-64" />
            </div>
        </div>
    )
  }

  const userInitial = employee?.name ? employee.name.charAt(0).toUpperCase() : 'U';
  const pageTitle = isViewingOwnProfile ? "My Profile" : `Profile: ${employee.name}`;

  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {pageTitle}
        </h1>
        {isViewingOwnProfile && (
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button>Edit Profile</Button>
                </DialogTrigger>
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                    onCloseAutoFocus={closeForm}
                >
                    <DialogHeader>
                        <DialogTitle>Edit Your Profile</DialogTitle>
                        <DialogDescription>
                            Update your personal information.
                        </DialogDescription>
                    </DialogHeader>
                    <ProfileForm onFinished={closeForm} user={employee} departments={departments} />
                </DialogContent>
            </Dialog>
        )}
      </div>
      <Separator />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-4">
                 <Avatar className="h-20 w-20">
                    <AvatarImage src={employee.avatarUrl || undefined} alt={employee.name} />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl">{employee.name}</CardTitle>
                    <CardDescription>{employee.jobTitle}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{employee.email}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p className="text-sm">{employee.department}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">Company</p>
                <p className="text-sm">{companies.find(c => c.id === employee.companyId)?.name || 'N/A'}</p>
            </div>
             <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <div className="text-sm">
                    <Badge variant={employee.role === 'Admin' ? 'default' : 'secondary'}>{employee.role}</Badge>
                </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assigned Assets</CardTitle>
            <CardDescription>A list of assets currently assigned to this employee.</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedAssets.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Serial Number</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="hidden md:table-cell">Model</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignedAssets.map(asset => (
                                <TableRow key={asset.id}>
                                    <TableCell className="font-mono">{asset.serialNumber}</TableCell>
                                    <TableCell>{asset.category}</TableCell>
                                    <TableCell className="hidden md:table-cell">{asset.brand} {asset.model}</TableCell>
                                    <TableCell className="text-right"><Badge variant="outline">{asset.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">This employee has no assets assigned to them.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    
    </>
  );
}
