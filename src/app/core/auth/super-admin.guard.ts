import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();

  // Safety: if superAdminEmail is not configured → deny access
  if (!environment.superAdminEmail ||
      environment.superAdminEmail === 'REPLACE_WITH_SUPERADMIN_EMAIL') {
    console.warn('[superAdminGuard] SuperAdmin email not configured — denying access');
    return router.parseUrl('/dashboard');
  }

  const isSuper = user?.email === environment.superAdminEmail;

  if (isSuper) {
    return true;
  }

  return router.parseUrl('/dashboard');
};
