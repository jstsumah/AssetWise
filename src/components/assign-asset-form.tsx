
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Asset, Employee, Company } from "@/lib/types"
import { updateAsset, clearCache } from "@/lib/data"
import { useDataRefresh } from "@/hooks/use-data-refresh"
import { format } from "date-fns"
import { Textarea } from "./ui/textarea"
import { toSentenceCase, withFormat } from "@/lib/utils"

const formSchema = z.object({
  employeeId: z.string().min(1, "An employee must be selected."),
  notes: z.string().optional(),
})

type AssignAssetFormValues = z.infer<typeof formSchema>;

export function AssignAssetForm({ onFinished, employees, companies, asset }: { onFinished: () => void, employees: Employee[], companies: Company[], asset: Asset }) {
  const { toast } = useToast()
  const { refreshData } = useDataRefresh();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<AssignAssetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        employeeId: asset.assignedTo ?? undefined,
        notes: '',
    }
  })

  async function onSubmit(values: AssignAssetFormValues) {
    setIsSaving(true);
    const newHistoryEntry = {
        date: format(new Date(), 'yyyy-MM-dd'),
        assignedTo: values.employeeId,
        status: 'In Use' as const,
        notes: values.notes || 'Assigned via web interface'
    }

    try {
      await updateAsset(asset.id, { 
          assignedTo: values.employeeId,
          status: 'In Use',
          history: [...asset.history, newHistoryEntry]
      });
      toast({
        title: "Asset Assigned!",
        description: `Asset ${asset.serialNumber} has been assigned.`,
      });
      clearCache();
      refreshData();
      onFinished();
    } catch (error) {
      console.error("Failed to assign asset:", error);
      toast({
        title: "Assignment Failed",
        description: "Could not assign the asset. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign To</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees.map((employee) => {
                    const company = companies.find(c => c.id === employee.companyId);
                    return (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} {company ? `(${company.name})` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                    <Textarea placeholder="e.g. Temporary assignment for Q3 project." {...field} onChange={withFormat(field.onChange, toSentenceCase)} />
                </FormControl>
                <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onFinished} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Assign Asset
            </Button>
        </div>
      </form>
    </Form>
  )
}
