'use client';

import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { Logo } from '@/components/icons/logo';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo className="h-12 w-12 text-primary" />
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
