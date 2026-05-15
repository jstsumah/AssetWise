import type { Employee } from './types';

/**
 * Check if a user has admin privileges
 */
export function isAdmin(user: Employee | null): boolean {
  return user?.role === 'Admin';
}

/**
 * Check if a user has admin privileges (throws error if not)
 * Use this for operations that require admin access
 */
export function requireAdmin(user: Employee | null): void {
  if (!isAdmin(user)) {
    throw new Error('Admin privileges required for this operation');
  }
}

/**
 * Check if an employee is active and can access the system
 */
export function isUserActive(user: Employee | null): boolean {
  return user?.active === true;
}

/**
 * Check if user owns a resource
 */
export function isResourceOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}
