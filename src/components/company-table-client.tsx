'use client';

import * as XLSX from 'xlsx';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreHorizontal, 
  PlusCircle, 
  Globe, 
  Mail, 
  Phone, 
  Building2, 
  Users, 
  MapPin, 
  ExternalLink 
} from 'lucide-react';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import { deleteCompany, importCompanies } from '@/lib/data';
import type { ImportResult } from '@/lib/data';
import type { Company, Asset, Employee } from '@/lib/types';
import { CompanyForm } from '@/components/company-form';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export function CompanyTableClient({ 
  companies, 
  assets, 
  employees 
}: { 
  companies: Company[], 
  assets: Asset[], 
  employees: Employee[] 
}) {
  const { refreshData } = useDataRefresh();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedCompany, setSelectedCompany] = React.useState<Company | undefined>(undefined);
  const [isRosterOpen, setIsRosterOpen] = React.useState(false);
  const [rosterCompany, setRosterCompany] = React.useState<Company | undefined>(undefined);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const { toast } = useToast();
  
  // Export companies to Excel to prevent data distortion (e.g. phone numbers)
  const exportToExcel = () => {
    const dataToExport = companies.map(company => ({
      'Name': company.name,
      'ID': company.id,
      'Industry': company.industry || '',
      'Website': company.website || '',
      'Email': company.email || '',
      'Phone': company.phone || '',
      'Address': company.address || '',
      'Tax ID': company.taxId || '',
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');
    XLSX.writeFile(workbook, 'companies.xlsx');
  };

  // Import companies from Excel/CSV
  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false }) as Record<string, string>[];

      // Filter out completely empty rows
      const nonEmptyRows = rows.filter(row => Object.values(row).some(val => val !== ''));

      const result = await importCompanies(nonEmptyRows);
      setImportResult(result);
      refreshData();
    } catch (err: any) {
      toast({ title: 'Import Failed', description: err?.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };
  
  const openForm = (company?: Company) => {
    setSelectedCompany(company);
    setIsFormOpen(true);
  }

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedCompany(undefined);
  };

  const openRoster = (company: Company) => {
    setRosterCompany(company);
    setIsRosterOpen(true);
  };

  const closeRoster = () => {
    setIsRosterOpen(false);
    setRosterCompany(undefined);
  };
  
  const openDeleteAlert = (company: Company) => {
    const isCompanyInUse = assets.some(asset => asset.companyId === company.id);
    if (isCompanyInUse) {
        toast({
            title: 'Deletion Blocked',
            description: 'This company cannot be deleted because it has assets associated with it.',
            variant: 'destructive'
        });
        return;
    }
    setSelectedCompany(company);
    setIsDeleteAlertOpen(true);
  }

  const closeDeleteAlert = () => {
    setIsDeleteAlertOpen(false);
    setSelectedCompany(undefined);
  }

  const handleDelete = async () => {
    if (!selectedCompany) return;
    try {
        await deleteCompany(selectedCompany.id);
        toast({ title: 'Company Deleted', description: `${selectedCompany.name} has been removed.` });
        refreshData();
    } catch (error) {
        toast({ title: 'Deletion Failed', description: 'Could not delete the company. Please try again.', variant: 'destructive' });
    } finally {
        closeDeleteAlert();
    }
  }

  return (
    <>
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle>All Companies</CardTitle>
              <CardDescription>
                Add, edit, or remove companies from your organization.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <DialogTrigger asChild>
                <Button onClick={() => openForm()}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Company
                </Button>
              </DialogTrigger>
              <Button variant="outline" onClick={exportToExcel}>Export</Button>
              <label>
                <input type="file" accept=".xlsx, .xls, .csv" style={{ display: 'none' }} onChange={importData} disabled={isImporting} />
                <Button asChild variant="outline" disabled={isImporting}>
                  <span>{isImporting ? 'Importing…' : 'Import'}</span>
                </Button>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company & Reg No.</TableHead>
                  <TableHead>Industry & Website</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-center">Employees</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.length > 0 ? (
                  companies.map((company) => {
                    const companyEmployees = employees.filter(e => e.companyId === company.id);
                    const employeeCount = companyEmployees.length;

                    return (
                      <TableRow key={company.id}>
                        {/* Company & Reg No */}
                        <TableCell>
                          <div className="font-semibold text-foreground text-sm">{company.name}</div>
                          {company.taxId ? (
                            <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                              ID: {company.taxId}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground/60 mt-0.5 italic">
                              No Reg No.
                            </div>
                          )}
                        </TableCell>

                        {/* Industry & Website */}
                        <TableCell>
                          <div className="space-y-1">
                            {company.industry ? (
                              <div className="flex items-center gap-1.5 text-xs text-foreground">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span>{company.industry}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/50 italic block">No industry</span>
                            )}

                            {company.website ? (
                              <a
                                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Globe className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                <span className="truncate max-w-[140px]">{company.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-55 flex-shrink-0" />
                              </a>
                            ) : null}
                          </div>
                        </TableCell>

                        {/* Contact Info */}
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            {company.email ? (
                              <div className="flex items-center gap-1.5 text-foreground">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="truncate max-w-[160px]">{company.email}</span>
                              </div>
                            ) : null}
                            
                            {company.phone ? (
                              <div className="flex items-center gap-1.5 text-foreground">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span>{company.phone}</span>
                              </div>
                            ) : null}

                            {!company.email && !company.phone && (
                              <span className="text-muted-foreground/50 italic">No contact info</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Address */}
                        <TableCell>
                          {company.address ? (
                            <div className="flex items-start gap-1 text-xs text-muted-foreground max-w-[180px] line-clamp-2">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">{company.address}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">No address</span>
                          )}
                        </TableCell>

                        {/* Total Employees */}
                        <TableCell className="text-center">
                          <button
                            onClick={() => openRoster(company)}
                            className="inline-flex items-center gap-1.5 justify-center hover:opacity-80 transition-opacity"
                          >
                            <Badge variant={employeeCount > 0 ? "default" : "secondary"} className="cursor-pointer gap-1 py-1 px-2.5 text-xs font-medium">
                              <Users className="h-3 w-3" />
                              {employeeCount} {employeeCount === 1 ? 'Employee' : 'Employees'}
                            </Badge>
                          </button>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openRoster(company)}>
                                View Employees
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openForm(company)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteAlert(company)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No companies found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={closeForm}
        className="sm:max-w-[600px]"
      >
        <DialogHeader>
          <DialogTitle>{selectedCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
          <DialogDescription>
            {selectedCompany ? `Update the information for ${selectedCompany.name}.` : 'Add a new company to the system.'}
          </DialogDescription>
        </DialogHeader>
        <CompanyForm onFinished={closeForm} company={selectedCompany} />
      </DialogContent>
    </Dialog>
      
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the company record for {selectedCompany?.name}.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteAlert}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {/* Employee Roster dialog */}
    <Dialog open={isRosterOpen} onOpenChange={setIsRosterOpen}>
      <DialogContent className="sm:max-w-[600px] p-6 max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-headline">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Employees at {rosterCompany?.name}</span>
          </DialogTitle>
          <DialogDescription>
            Registered members of {rosterCompany?.name}. Total: {rosterCompany ? employees.filter(e => e.companyId === rosterCompany.id).length : 0}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {rosterCompany && (
            (() => {
              const roster = employees.filter(e => e.companyId === rosterCompany.id);
              if (roster.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                    <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <h3 className="font-semibold text-sm">No Employees Registered</h3>
                    <p className="text-xs text-muted-foreground max-w-[250px] mt-1">
                      There are currently no staff members associated with {rosterCompany.name}.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {roster.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-muted">
                          {employee.avatarUrl ? (
                            <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{employee.name}</span>
                            <Badge variant={employee.role === 'Admin' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 leading-normal">
                              {employee.role}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {employee.jobTitle} &bull; <span className="italic">{employee.department}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 font-mono">
                            <Mail className="h-3 w-3 text-muted-foreground/60" />
                            <span>{employee.email}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Badge
                          variant={employee.active ? "default" : "secondary"}
                          className={`text-xs ${employee.active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-muted text-muted-foreground hover:bg-muted'}`}
                        >
                          {employee.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={closeRoster}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Import Result Summary Dialog */}
    <Dialog open={!!importResult} onOpenChange={(open) => { if (!open) setImportResult(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Complete</DialogTitle>
          <DialogDescription>
            {importResult?.inserted} inserted · {importResult?.skipped} skipped · {importResult?.failed} failed
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-64 overflow-y-auto text-sm">
          {(importResult?.skippedRows?.length ?? 0) > 0 && (
            <div>
              <p className="font-semibold text-yellow-600 mb-1">Skipped (already exist)</p>
              <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                {importResult?.skippedRows.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
          {(importResult?.failedRows?.length ?? 0) > 0 && (
            <div>
              <p className="font-semibold text-destructive mb-1">Failed</p>
              <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                {importResult?.failedRows.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
          {(importResult?.skippedRows?.length ?? 0) === 0 && (importResult?.failedRows?.length ?? 0) === 0 && (
            <p className="text-muted-foreground">All rows were imported successfully.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
