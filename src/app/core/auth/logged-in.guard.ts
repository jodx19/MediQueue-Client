import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const loggedInGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const role = authService.currentUser()?.role;
    
    // Redirect based on role
    const redirectMap: Record<string, string> = {
      'Admin':        '/dashboard',
      'Doctor':       '/my-queue',              // H-2: was /clinical-visits (404)
      'Receptionist': '/appointments',
      'Patient':      '/my-portal',             // H-2: was missing → fell to /dashboard
      'SuperAdmin':   '/super-admin/tenants',   // H-2: was missing → fell to /dashboard
    };

    const target = redirectMap[role!] ?? '/dashboard';
    return router.parseUrl(target);
  }

  return true;
};
