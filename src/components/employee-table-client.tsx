
"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import {
  ChevronsUpDown,
  ChevronDown,
  MoreHorizontal,
  PlusCircle,
  ShieldCheck,
  CheckCircle,
  UserX,
  Eye,
} from "lucide-react";

import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Employee } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmployeeForm } from "./employee-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";
import { clearCache, updateEmployee, deleteEmployee } from "@/lib/data";
import { useDataRefresh } from "@/hooks/use-data-refresh";
import { useAuth } from "@/hooks/use-auth";

export function EmployeeTableClient({
  employees,
}: {
  employees: Employee[];
}) {
  const router = useRouter();
  const { refreshData } = useDataRefresh();
  const { user: currentUser } = useAuth();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      email: false,
    });
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeactivateAlertOpen, setIsDeactivateAlertOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | undefined>(undefined);
  const { toast } = useToast();

  const openForm = (employee?: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  }

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedEmployee(undefined);
  }
  
  const openDeleteAlert = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteAlertOpen(true);
  }

  const openDeactivateAlert = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeactivateAlertOpen(true);
  }

  const closeAlerts = () => {
    setIsDeactivateAlertOpen(false);
    setIsDeleteAlertOpen(false);
    setSelectedEmployee(undefined);
  }

  const handleActivate = async (employee: Employee) => {
    try {
      await updateEmployee(employee.id, { active: true });
      toast({
        title: "User Activated",
        description: `${employee.name} can now log in to the application.`,
      });
      clearCache();
      refreshData();
    } catch (error) {
      toast({
        title: "Activation Failed",
        description: "Could not activate the user. Please try again.",
        variant: "destructive"
      });
    }
  }

  const handleDeactivate = async () => {
    if (!selectedEmployee) return;
    try {
      await updateEmployee(selectedEmployee.id, { active: false });
      toast({
        title: "User Deactivated",
        description: `${selectedEmployee.name} can no longer log in.`,
      });
      clearCache();
      refreshData();
    } catch (error) {
       toast({
        title: "Deactivation Failed",
        description: "Could not deactivate the user. Please try again.",
        variant: "destructive"
      });
    } finally {
      closeAlerts();
    }
  }
  
  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteEmployee(selectedEmployee.id);
      toast({
        title: 'Employee Deleted',
        description: `${selectedEmployee.name} has been removed. You may need to delete them from Firebase Authentication manually.`
      });
      refreshData();
    } catch (error) {
       toast({
        title: 'Deletion Failed',
        description: 'Could not delete the employee. Please try again.',
        variant: 'destructive'
      });
    } finally {
      closeAlerts();
    }
  }

  const columns: ColumnDef<Employee>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={employee.avatarUrl || undefined} alt={employee.name} />
              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{employee.name}</span>
               {employee.role === 'Admin' && <Badge variant="secondary" className="w-fit"><ShieldCheck className="mr-1 h-3 w-3 text-primary" /> Admin</Badge>}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      meta: {
        className: 'hidden lg:table-cell',
      }
    },
    {
      accessorKey: "department",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Department
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("department")}</div>,
      meta: {
        className: 'hidden md:table-cell',
      }
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("active");
        return isActive ? (
          <Badge variant="outline" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" /> Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="flex items-center gap-2">
            <UserX className="h-4 w-4 text-yellow-500" /> Inactive
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const employee = row.original;
        const isCurrentUser = currentUser?.id === employee.id;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openForm(employee)}>
                Edit Employee
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!employee.active ? (
                <DropdownMenuItem onClick={() => handleActivate(employee)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Activate User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => openDeactivateAlert(employee)} disabled={isCurrentUser}>
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate User
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(employee)} disabled={isCurrentUser}>
                  <UserX className="mr-2 h-4 w-4" />
                  Delete User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(employee.id);
                  toast({
                    title: "Copied!",
                    description: "Employee ID copied to clipboard.",
                  });
                }}
              >
                Copy Employee ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: employees,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const employee = row.original;
      const searchTerm = filterValue.toLowerCase();

      return (
        employee.name.toLowerCase().includes(searchTerm) ||
        employee.email.toLowerCase().includes(searchTerm) ||
        employee.department.toLowerCase().includes(searchTerm) ||
        employee.jobTitle.toLowerCase().includes(searchTerm)
      );
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const departments = React.useMemo(() => {
    const existingDepartments = employees.map((e) => e.department);
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
    ];
    return [...new Set([...existingDepartments, ...additionalDepartments])].sort();
  }, [employees]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>All Employees</CardTitle>
        <CardDescription>
          A list of all employees in your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
          <Input
            placeholder="Filter by name, email, department..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full md:max-w-sm"
          />
          <div className="flex w-full md:w-auto items-center gap-2">
            <Button className="w-full md:w-auto" onClick={() => openForm()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto hidden md:flex">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className={(header.column.columnDef.meta as any)?.className}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={(cell.column.columnDef.meta as any)?.className}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent 
            onInteractOutside={(e) => e.preventDefault()}
            onCloseAutoFocus={closeForm}
        >
            <DialogHeader>
            <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <DialogDescription>
                Fill in the details below to {selectedEmployee ? 'update the' : 'add a new'} employee.
            </DialogDescription>
            </DialogHeader>
            <EmployeeForm onFinished={closeForm} departments={departments} employee={selectedEmployee} />
        </DialogContent>
       </Dialog>
        <AlertDialog open={isDeactivateAlertOpen} onOpenChange={setIsDeactivateAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to deactivate this user?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will prevent {selectedEmployee?.name} from accessing the application. You can reactivate them later.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={closeAlerts}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate} className="bg-destructive hover:bg-destructive/90">Deactivate</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the employee record for {selectedEmployee?.name}. You may also need to delete them from Firebase Authentication.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={closeAlerts}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </Card>
  );
}
