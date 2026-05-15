'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { LoaderCircle, ArrowLeft, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { auth } from '@/lib/firebase';

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

type PageState = 'verifying' | 'ready' | 'invalid' | 'success' | 'submitting';

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [pageState, setPageState] = useState<PageState>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!oobCode) {
      setErrorMessage('No reset code found. Please request a new password reset link.');
      setPageState('invalid');
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setVerifiedEmail(email);
        setPageState('ready');
      })
      .catch((error) => {
        const code: string = error?.code ?? '';
        if (code === 'auth/expired-action-code') {
          setErrorMessage('This password reset link has expired. Please request a new one.');
        } else if (code === 'auth/invalid-action-code') {
          setErrorMessage('This password reset link is invalid or has already been used. Please request a new one.');
        } else {
          setErrorMessage('Unable to verify the reset link. Please request a new password reset.');
        }
        setPageState('invalid');
      });
  }, [oobCode]);

  async function onSubmit(values: FormValues) {
    if (!oobCode) return;
    setPageState('submitting');

    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      setPageState('success');
    } catch (error: any) {
      const code: string = error?.code ?? '';
      let msg = 'Failed to reset your password. Please try again.';
      if (code === 'auth/expired-action-code') {
        msg = 'This reset link has expired. Please request a new password reset.';
      } else if (code === 'auth/invalid-action-code') {
        msg = 'This reset link is invalid or has already been used. Please request a new one.';
      } else if (code === 'auth/weak-password') {
        msg = 'The password is too weak. Please choose a stronger password.';
      }
      setErrorMessage(msg);
      setPageState('invalid');
    }
  }

  // ── Verifying ──────────────────────────────────────────────────────────────
  if (pageState === 'verifying') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Verifying Reset Link</CardTitle>
          <CardDescription>Please wait while we verify your reset link…</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // ── Invalid / expired ──────────────────────────────────────────────────────
  if (pageState === 'invalid') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-2xl text-destructive">
            <XCircle className="h-6 w-6" />
            Link Invalid
          </CardTitle>
          <CardDescription>We could not verify your password reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full">Request New Reset Link</Button>
          </Link>
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

  // ── Success ────────────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Password Reset Successful
          </CardTitle>
          <CardDescription>Your password has been updated.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Your password has been successfully reset. You can now log in with your new password.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ── Ready / Submitting ─────────────────────────────────────────────────────
  const isSubmitting = pageState === 'submitting';

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>
              {verifiedEmail
                ? `Creating a new password for ${verifiedEmail}`
                : 'Enter and confirm your new password below.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 chars, 1 uppercase, 1 number"
                        {...field}
                        disabled={isSubmitting}
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter your new password"
                        {...field}
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirm((v) => !v)}
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="animate-spin mr-2 h-4 w-4" />}
              {isSubmitting ? 'Resetting…' : 'Reset Password'}
            </Button>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full" type="button" disabled={isSubmitting}>
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

// Wrap in Suspense because useSearchParams() requires it in Next.js App Router
export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Loading…</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          </CardContent>
        </Card>
      }
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
}
