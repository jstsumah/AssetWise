
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Employee } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LoaderCircle } from 'lucide-react';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { clearCache } from '@/lib/data';
import { useDataRefresh } from '@/hooks/use-data-refresh';
import { toTitleCase, withFormat } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
});

type ProfileFormValues = z.infer<typeof formSchema>;

export function ProfileForm({ user, onFinished, departments }: { user: Employee, onFinished: () => void, departments: string[] }) {
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const { refreshData } = useDataRefresh();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: toTitleCase(user.name),
      jobTitle: toTitleCase(user.jobTitle),
      department: user.department,
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    setIsSaving(true);
    const updateData: Partial<Employee> = {
      name: values.name,
      jobTitle: values.jobTitle,
      department: values.department,
    };

    try {
      await updateUser(updateData);
      clearCache();
      refreshData();
      onFinished();
    } catch (error) {
        toast({
            title: 'Update Failed',
            description: 'Could not update your profile. Please try again.',
            variant: 'destructive',
        });
    } finally {
      setIsSaving(false);
    }
  }
  
  const displayAvatarSrc = user.avatarUrl;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="flex items-center gap-4">
             <Avatar className="h-24 w-24">
                <AvatarImage src={displayAvatarSrc || undefined} alt={user.name} data-ai-hint="person avatar" />
                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
             <div className='w-full space-y-2'>
                <p className='text-sm text-muted-foreground'>To change your avatar, please contact an administrator.</p>
             </div>
        </div>


        <Separator />
        
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. Jane Doe" {...field} onChange={withFormat(field.onChange, toTitleCase)} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
       
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. Software Engineer" {...field} onChange={withFormat(field.onChange, toTitleCase)} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
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
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <LoaderCircle className="animate-spin mr-2" />}
              Save Changes
            </Button>
        </div>
      </form>
    </Form>
  )
}
