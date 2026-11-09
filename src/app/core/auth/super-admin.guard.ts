import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();

  // Allow if role is SuperAdmin, or if email matches configured superAdminEmail fallback
  const isSuper = user?.role === 'SuperAdmin' || 
    (!!environment.superAdminEmail && 
     environment.superAdminEmail !== 'REPLACE_WITH_SUPERADMIN_EMAIL' && 
     user?.email?.toLowerCase() === environment.superAdminEmail.toLowerCase());

  if (isSuper) {
    return true;
  }

  return router.parseUrl('/dashboard');
};
