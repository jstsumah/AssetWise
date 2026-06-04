
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Employee } from '@/lib/types';
import { useToast } from './use-toast';

interface AuthContextType {
  user: Employee | null;
  firebaseUser: any | null; // Typed as any to prevent type-breaks in components expecting Firebase User object
  login: (email: string, pass: string) => Promise<string | null>;
  signup: (name: string, email: string, pass: string) => Promise<string | null>;
  logout: () => void;
  updateUser: (data: Partial<Pick<Employee, 'name' | 'jobTitle' | 'department'>>) => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapEmployeeFromDb(row: any): Employee {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    department: row.department || 'Unassigned',
    jobTitle: row.jobtitle || 'New Employee',
    avatarUrl: row.avatarurl || '',
    role: row.role as 'Admin' | 'Employee',
    active: !!row.active,
    companyId: row.companyid || ''
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Employee | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = user?.role === 'Admin';

  const handleUserSession = async (session: any) => {
    try {
      const sbUser = session?.user || null;
      if (sbUser) {
        try {
          const { data: employeeData, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', sbUser.id)
            .single();

          if (employeeData && !error) {
            const mappedEmployee = mapEmployeeFromDb(employeeData);
            if (mappedEmployee.active) {
              setUser(mappedEmployee);
              setFirebaseUser(sbUser);
            } else {
              try { await supabase.auth.signOut(); } catch(e) {}
              setUser(null);
              setFirebaseUser(null);
            }
          } else {
            // Profile not found in employees table — user signed up but admin hasn't
            // activated them yet, OR the DB trigger hasn't run.
            console.warn('[Auth] No employee profile found for user:', sbUser.email, '| Error:', error?.message);
            try { await supabase.auth.signOut(); } catch(e) {}
            setUser(null);
            setFirebaseUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          try { await supabase.auth.signOut(); } catch(e) {}
          setUser(null);
          setFirebaseUser(null);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);

    // onAuthStateChange fires INITIAL_SESSION immediately on mount, which handles
    // the initial session check. Using getSession() separately causes a race condition
    // where handleUserSession is called twice simultaneously, breaking isLoading state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      await handleUserSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });

      if (error) {
        if (error.status === 400 || error.message.includes('Invalid login credentials')) {
          return 'auth/invalid-credential';
        }
        return 'auth/unknown-error';
      }

      const sbUser = data.user;
      if (!sbUser) {
        return 'auth/user-not-found';
      }

      const { data: employeeData, error: dbError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      if (dbError || !employeeData) {
        await supabase.auth.signOut();
        return 'auth/user-not-found';
      }

      const mappedEmployee = mapEmployeeFromDb(employeeData);

      if (!mappedEmployee.active) {
        await supabase.auth.signOut();
        return 'auth/user-not-active';
      }

      setUser(mappedEmployee);
      setFirebaseUser(sbUser);
      return null;
    } catch (error) {
      console.error("Unknown login error:", error);
      return 'auth/unknown-error';
    }
  };

  const signup = async (name: string, email: string, pass: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered') || error.status === 422) {
          return 'auth/email-already-in-use';
        }
        return 'auth/unknown-error';
      }

      const newUser = data.user;
      if (!newUser) {
        return 'auth/unknown-error';
      }

      // The employee record is now created automatically via a Supabase database trigger
      // bound to auth.users (handle_new_user). We no longer need to insert it manually.

      toast({
        title: 'Account Created!',
        description: 'Your account is now pending activation by an administrator.',
        duration: 9000,
      });

      await supabase.auth.signOut();
      router.push('/login');
      return null;
    } catch (error) {
      console.error("Unknown signup error:", error);
      return 'auth/unknown-error';
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setFirebaseUser(null);
  };

  const resetPassword = async (email: string): Promise<string | null> => {
    try {
      console.log(`[Auth] Sending password reset email to: ${email}`);
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        console.error(`[Auth] Password reset error:`, error);
        return 'auth/unknown-error';
      }
      return null;
    } catch (error) {
      console.error("Unknown password reset error:", error);
      return 'auth/unknown-error';
    }
  };

  const updateUser = async (data: Partial<Pick<Employee, 'name' | 'jobTitle' | 'department'>>) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your profile.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.jobTitle !== undefined) updateData.jobtitle = data.jobTitle;
      if (data.department !== undefined) updateData.department = data.department;

      const { error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setUser(prevUser => prevUser ? { ...prevUser, ...data } as Employee : null);
      toast({
        title: 'Profile Updated!',
        description: 'Your information has been successfully updated.',
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: 'Update Failed',
        description: 'Could not update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, signup, logout, resetPassword, updateUser, isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
