import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  const isPatientPortal = state.url.includes('my-') || state.url.includes('patient');
  const redirectPath = isPatientPortal ? '/patient-login' : '/auth/login';

  // Save current URL for redirect after successful login
  return router.createUrlTree([redirectPath], {
    queryParams: { returnUrl: state.url },
  });
};
