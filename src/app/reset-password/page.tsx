'use client';

import { Logo } from '@/components/icons/logo';
import { ResetPasswordForm } from '@/components/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Logo className="h-10 w-10 text-primary" />
            <span className="text-2xl font-semibold text-foreground font-headline">
              AssetWise
            </span>
          </div>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
