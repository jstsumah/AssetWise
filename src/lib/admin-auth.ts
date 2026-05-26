import { supabase } from './supabase';

/**
 * Send a password reset email to a user (admin function)
 * This function allows admins to send password reset emails to employees
 * @param email - The email address to send reset link to
 * @returns error code or null if successful
 */
export async function adminSendPasswordReset(email: string): Promise<string | null> {
  try {
    console.log(`[AdminAuth] Sending password reset email to: ${email}`);
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';
        
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      console.error(`[AdminAuth] Failed to send password reset: ${error.message}`);
      return 'auth/unknown-error';
    }
    console.log(`[AdminAuth] Password reset email sent successfully to: ${email}`);
    return null;
  } catch (error: any) {
    console.error(`[AdminAuth] Unknown error during password reset:`, error);
    return 'auth/unknown-error';
  }
}

/**
 * Get a user-friendly error message for password reset errors
 */
export function getPasswordResetErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/invalid-email': 'The email address is invalid.',
    'auth/too-many-requests': 'Too many reset requests. Please try again later.',
    'auth/missing-email': 'Email address is required.',
    'auth/internal-error': 'An internal error occurred. Please try again.',
  };

  return errorMessages[errorCode] || 'Failed to send password reset email. Please try again.';
}
