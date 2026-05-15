'use client';

import { useState } from 'react';
import { Mail, LoaderCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { adminSendPasswordReset, getPasswordResetErrorMessage } from '@/lib/admin-auth';
import { useToast } from '@/hooks/use-toast';

interface SendPasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeEmail: string;
  employeeName: string;
}

export function SendPasswordResetDialog({
  open,
  onOpenChange,
  employeeEmail,
  employeeName,
}: SendPasswordResetDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendReset = async () => {
    setIsLoading(true);
    const errorCode = await adminSendPasswordReset(employeeEmail);
    setIsLoading(false);

    if (errorCode) {
      toast({
        title: 'Failed to Send Reset Link',
        description: getPasswordResetErrorMessage(errorCode),
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Reset Link Sent!',
        description: `Password reset link sent to ${employeeEmail}`,
      });
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Password Reset Link
          </AlertDialogTitle>
          <AlertDialogDescription>
            Send a password reset link to <strong>{employeeName}</strong> at <strong>{employeeEmail}</strong>?
            <br />
            <br />
            They will receive an email with a link to reset their password.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSendReset} disabled={isLoading} className="bg-primary">
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
