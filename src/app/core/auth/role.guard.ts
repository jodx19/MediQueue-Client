import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

function roleHome(role: string | null | undefined): string {
  const map: Record<string, string> = {
    Admin: '/dashboard',
    Doctor: '/my-queue',
    Receptionist: '/appointments',
    Patient: '/my-portal',
  };
  return map[role ?? ''] ?? '/auth/login';
}

/**
 * Modern Functional Guard for Role-based Access Control
 * Usage in routes: canActivate: [roleGuard(['Admin', 'Doctor'])]
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // If no roles specified, allow access (or could be strict and deny)
    if (allowedRoles.length === 0) return true;

    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/auth/login']);
    }

    if (auth.hasRole(...allowedRoles)) {
      return true;
    }

    // Redirect to their specific home based on role
    const userRole = auth.userRole();
    return router.createUrlTree([roleHome(userRole)]);
  };
};
