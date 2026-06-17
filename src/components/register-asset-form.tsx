
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, LoaderCircle } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import type { Asset, Company } from "@/lib/types"
import { addAsset, clearCache, updateAsset, addVaultEntry } from "@/lib/data"
import { useDataRefresh } from "@/hooks/use-data-refresh"
import { Textarea } from "./ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { deriveKey, encryptPassword } from "@/lib/crypto"

const formSchema = z.object({
  serialNumber: z.string().min(1, "Serial number is required"),
  tagNo: z.string().min(1, "Tag number is required"),
  category: z.enum(["Laptop", "Desktop", "Phone", "Tablet", "Other"]),
  companyId: z.string().min(1, "Company is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  purchaseDate: z.date({
    required_error: "A purchase date is required.",
  }),
  assetValue: z.coerce.number().min(0, "Asset value must be a positive number."),
  remarks: z.string().optional(),
  phoneNumber: z.string().optional(),
  emailAddress: z.string().optional(),
  emailPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.category === "Phone") {
    if (!data.phoneNumber || data.phoneNumber.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required for phone devices",
        path: ["phoneNumber"],
      });
    }
  }
})

type RegisterAssetFormValues = z.infer<typeof formSchema>;

export function RegisterAssetForm({ onFinished, companies, asset, assets }: { onFinished: () => void, companies: Company[], asset?: Asset | null, assets: Asset[] }) {
  const { toast } = useToast()
  const { refreshData } = useDataRefresh();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  const isEditing = !!asset;

  const form = useForm<RegisterAssetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: asset?.serialNumber ?? "",
      tagNo: asset?.tagNo ?? "",
      brand: asset?.brand ?? "",
      model: asset?.model ?? "",
      category: asset?.category ?? undefined,
      companyId: asset?.companyId ?? undefined,
      purchaseDate: asset?.purchaseDate ? new Date(asset.purchaseDate) : undefined,
      assetValue: asset?.assetValue ?? 0,
      remarks: asset?.remarks ?? "",
      phoneNumber: asset?.phoneNumber ?? "",
      emailAddress: "",
      emailPassword: "",
    },
  })

  async function onSubmit(values: RegisterAssetFormValues) {
    setIsSaving(true);
    
    // Check for duplicate tagNo
    const tagConflict = assets.find(a => a.tagNo && a.tagNo.toLowerCase() === values.tagNo.toLowerCase());
    if (tagConflict && (!isEditing || tagConflict.id !== asset.id)) {
      toast({
        title: "Duplicate Tag Number",
        description: `The tag "${values.tagNo}" is already assigned to another asset (${tagConflict.serialNumber}). Please use a unique tag.`,
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    // Manual validation for Email/Password when registering a new phone
    if (values.category === 'Phone' && !isEditing) {
      if (!values.emailAddress || values.emailAddress.trim().length === 0) {
        form.setError('emailAddress', { type: 'manual', message: 'Email address is required for phone devices' });
        setIsSaving(false);
        return;
      }
      if (!values.emailPassword || values.emailPassword.trim().length === 0) {
        form.setError('emailPassword', { type: 'manual', message: 'Email password is required for phone devices' });
        setIsSaving(false);
        return;
      }
    }

    const assetData = {
      serialNumber: values.serialNumber,
      tagNo: values.tagNo,
      category: values.category,
      companyId: values.companyId,
      brand: values.brand,
      model: values.model,
      purchaseDate: format(values.purchaseDate, 'yyyy-MM-dd'),
      assetValue: values.assetValue,
      remarks: values.remarks,
      phoneNumber: values.category === 'Phone' ? values.phoneNumber : undefined,
    };

    try {
      if (isEditing && asset) {
        await updateAsset(asset.id, assetData);
        toast({
          title: "Asset Updated!",
          description: `Asset ${values.serialNumber} has been updated.`,
        });
      } else {
        await addAsset(assetData);
        toast({
          title: "Asset Registered!",
          description: `Asset ${values.serialNumber} has been added to the inventory.`,
        });

        // Trigger vault entry if category is Phone
        if (values.category === 'Phone' && values.emailAddress && values.emailPassword) {
          try {
            const cryptoKey = await deriveKey(values.companyId);
            const { encryptedPassword, iv } = await encryptPassword(values.emailPassword, cryptoKey);
            
            const vaultPayload = {
              title: `Phone Email: ${values.brand} ${values.model} (${values.serialNumber})`,
              username: values.emailAddress,
              encryptedPassword,
              iv,
              url: '',
              notes: `Auto-generated credential for Phone Asset Serial: ${values.serialNumber}. Phone Number: ${values.phoneNumber || 'N/A'}.`,
              category: 'Phone Email' as any,
              accessLevel: 'admins' as any,
              ownerId: user?.id || 'system',
              ownerName: user?.name || 'System',
              companyId: values.companyId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            await addVaultEntry(vaultPayload);
            toast({
              title: "Credentials Saved",
              description: "Associated email credentials have been securely encrypted and saved to the Password Vault.",
            });
          } catch (vaultErr: any) {
            console.error("Failed to auto-create vault entry:", vaultErr);
            toast({
              title: "Credentials Save Failed",
              description: "Asset was registered, but email credentials could not be saved to the Vault.",
              variant: "destructive"
            });
          }
        }
      }
      clearCache();
      refreshData();
      onFinished();
    } catch (error) {
      console.error("Failed to save asset:", error);
      toast({
        title: isEditing ? "Update Failed" : "Registration Failed",
        description: "Could not save the asset. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. SN-LAP-005" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="tagNo"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tag No</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. ASSET-001" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Laptop">Laptop</SelectItem>
                  <SelectItem value="Desktop">Desktop</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Tablet">Tablet</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Dell" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. XPS 15" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Purchase Date</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP")
                        ) : (
                            <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
                control={form.control}
                name="assetValue"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Asset Value (KES)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g. 1500" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
         <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Remarks (Optional)</FormLabel>
                <FormControl>
                    <Textarea placeholder="e.g. Screen has a minor scratch." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        {form.watch("category") === "Phone" && (
          <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium text-sm text-muted-foreground">Phone Attributes</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +254 712 345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEditing && (
                <>
                  <FormField
                    control={form.control}
                    name="emailAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Associated Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="e.g. phone@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emailPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Associated Email Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password for vault" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onFinished} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Register Asset'}
            </Button>
        </div>
      </form>
    </Form>
  )
}
