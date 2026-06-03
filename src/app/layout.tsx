
'use client'

import * as React from 'react';
import { Inter, Space_Grotesk } from 'next/font/google';
import { usePathname, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { DataRefreshProvider } from '@/hooks/use-data-refresh';
import { ThemeProvider, useTheme } from '@/hooks/use-theme';


const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSpaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});


function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    // Wait until the auth state is fully determined before running any redirect logic.
    if (isLoading) {
      return;
    }

    const isAuthPage = 
      pathname === '/login' || 
      pathname === '/signup' || 
      pathname === '/forgot-password' || 
      pathname === '/reset-password';
    
    // Redirect to home if a logged-in user is trying to access login/signup/forgot-password.
    // IMPORTANT: Do NOT redirect away from /reset-password, because Supabase's password recovery
    // mechanism actively logs the user in via a temporary session so they can set a new password.
    if (user && isAuthPage && pathname !== '/reset-password') {
      router.push('/');
    }
    
    // Redirect to login if a non-logged-in user is trying to access a protected page.
    if (!user && !isAuthPage) {
      router.push('/login');
    }

  }, [user, isLoading, pathname, router]);

  // Always show a loading screen while the auth state is being determined.
  // This is the key to preventing the login loop and hydration errors.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const isAuthPage = 
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname === '/forgot-password' || 
    pathname === '/reset-password';

  // If there's a user and we're on a protected page, show the app shell.
  if (user && !isAuthPage) {
    return (
        <>
        <AppShell>{children}</AppShell>
        <Toaster />
        </>
    );
  }

  // If we are on an auth page and the user is NOT logged in, show the auth page content.
  // Exception: If they ARE logged in AND on /reset-password, also show it so they can reset their password!
  if ((!user && isAuthPage) || (user && pathname === '/reset-password')) {
    return (
        <>
            {children}
            <Toaster />
        </>
    );
  }
  
  // This state occurs while the redirect in useEffect is being processed.
  // Showing a consistent loader prevents content flashing.
  return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontInter.variable,
          fontSpaceGrotesk.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <AuthProvider>
              <DataRefreshProvider>
                <AppContent>{children}</AppContent>
              </DataRefreshProvider>
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
