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

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowed = (route.data['roles'] as string[] | undefined) ?? [];

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (allowed.length === 0 || auth.hasRole(...allowed)) {
    return true;
  }

  return router.createUrlTree([roleHome(auth.userRole())]);
};
