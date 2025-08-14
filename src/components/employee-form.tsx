
import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import type { Employee } from "@/lib/types"
import { updateEmployee, clearCache, createEmployee } from "@/lib/data"
import { LoaderCircle } from "lucide-react"
import { useDataRefresh } from "@/hooks/use-data-refresh"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  role: z.enum(["Admin", "Employee"]),
})

export function EmployeeForm({ onFinished, departments, employee }: { onFinished: () => void, departments: string[], employee?: Employee }) {
  const { toast } = useToast()
  const { refreshData } = useDataRefresh();
  const [isSaving, setIsSaving] = React.useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: employee?.name ?? "",
      email: employee?.email ?? "",
      department: employee?.department ?? "",
      jobTitle: employee?.jobTitle ?? "",
      role: employee?.role ?? "Employee",
    },
  })

  const isEditing = !!employee;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      if (isEditing && employee) {
        // We only pass the fields that are actually editable in this form.
        // We don't want to allow changing the email here.
        const { name, department, jobTitle, role } = values;
        await updateEmployee(employee.id, { name, department, jobTitle, role });
        toast({
            title: "Employee Updated!",
            description: `Successfully updated ${values.name} in the system.`,
        });
      } else {
        await createEmployee(values);
        toast({
            title: "Employee Added!",
            description: `Successfully added ${values.name} to the system. An email will need to be created in Firebase Authentication for them.`,
        });
      }
      clearCache();
      refreshData();
      onFinished();
    } catch (error) {
       toast({
        title: isEditing ? "Update Failed" : "Creation Failed",
        description: `Could not save ${values.name}. Please try again.`,
        variant: "destructive"
      })
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="e.g. name@example.com" {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {departments.map((department) => (
                            <SelectItem key={department} value={department}>{department}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
         <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Employee">Employee</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
            />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <LoaderCircle className="animate-spin mr-2" />}
              {isEditing ? 'Save Changes' : 'Add Employee'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
