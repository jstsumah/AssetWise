'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useState } from 'react';
import { LoaderCircle, ArrowLeft } from 'lucide-react';

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const errorCode = await resetPassword(values.email);
    setIsLoading(false);

    if (errorCode) {
      let description = 'An unknown error occurred. Please try again.';
      switch (errorCode) {
        case 'auth/user-not-found':
          description = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          description = 'The email address is invalid.';
          break;
        case 'auth/too-many-requests':
          description = 'Too many reset requests. Please try again later.';
          break;
        default:
          description = 'Failed to send password reset email. Please try again later.';
          break;
      }
      toast({
        title: 'Password Reset Failed',
        description,
        variant: 'destructive',
      });
    } else {
      setIsSubmitted(true);
      toast({
        title: 'Reset Email Sent!',
        description: 'Check your email for instructions to reset your password.',
      });
    }
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Reset Email Sent</CardTitle>
          <CardDescription>
            We&apos;ve sent you an email with instructions to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Alert>
            <AlertDescription>
              Please check your email (and spam folder) for a message from Supabase. The link in that email will allow you to reset your password.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                      disabled={isLoading}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <LoaderCircle className="animate-spin mr-2" />}
              Send Reset Link
            </Button>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full" type="button">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
