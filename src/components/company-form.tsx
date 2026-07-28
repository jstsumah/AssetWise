
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
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import type { Company } from "@/lib/types"
import { updateCompany, addCompany, clearCache } from "@/lib/data"
import { useDataRefresh } from "@/hooks/use-data-refresh"
import { toTitleCase, withFormat } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters long."),
  website: z.string().url("Please enter a valid URL (e.g. https://example.com).").or(z.literal("")),
  email: z.string().email("Please enter a valid email address.").or(z.literal("")),
  phone: z.string().min(5, "Phone number must be at least 5 digits.").or(z.literal("")),
  industry: z.string().min(2, "Industry must be at least 2 characters.").or(z.literal("")),
  address: z.string().min(5, "Address must be at least 5 characters.").or(z.literal("")),
  taxId: z.string().min(3, "Tax ID must be at least 3 characters.").or(z.literal("")),
})

type CompanyFormValues = z.infer<typeof formSchema>;

export function CompanyForm({ onFinished, company }: { onFinished: () => void, company?: Company }) {
  const { toast } = useToast()
  const { refreshData } = useDataRefresh();
  const [isSaving, setIsSaving] = React.useState(false);

  const isEditing = !!company;

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: toTitleCase(company?.name ?? ""),
      website: company?.website ?? "",
      email: company?.email ?? "",
      phone: company?.phone ?? "",
      industry: toTitleCase(company?.industry ?? ""),
      address: toTitleCase(company?.address ?? ""),
      taxId: company?.taxId ?? "",
    },
  })

  async function onSubmit(values: CompanyFormValues) {
    setIsSaving(true);
    // Clean empty values to keep the database tidy
    const cleanedValues = {
      name: values.name.trim(),
      website: values.website.trim() || undefined,
      email: values.email.trim() || undefined,
      phone: values.phone.trim() || undefined,
      industry: values.industry.trim() || undefined,
      address: values.address.trim() || undefined,
      taxId: values.taxId.trim() || undefined,
    };

    try {
      if (isEditing && company) {
        await updateCompany(company.id, cleanedValues);
        toast({
          title: "Company Updated!",
          description: `Successfully updated ${cleanedValues.name}.`,
        });
      } else {
        await addCompany(cleanedValues);
        toast({
          title: "Company Added!",
          description: `Successfully added ${cleanedValues.name}.`,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Stark Industries" {...field} onChange={withFormat(field.onChange, toTitleCase)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Technology, Finance" {...field} onChange={withFormat(field.onChange, toTitleCase)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. https://stark.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. contact@stark.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. +1 (555) 019-9238" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax ID / Registration No.</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. EIN-12-3456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Office Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 10880 Malibu Point, CA" {...field} onChange={withFormat(field.onChange, toTitleCase)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onFinished} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Company"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
