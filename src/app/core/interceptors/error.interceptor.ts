import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          authService.logout();
          notifications.warning('Session expired. Please sign in again.');
          break;
        case 403:
          router.navigate(['/forbidden']);
          notifications.error('You do not have permission to perform this action.');
          break;
        case 422:
          const validationErrors = error.error?.errors;
          if (validationErrors) {
            const messages = Object.values(validationErrors).flat().join(', ');
            notifications.error(`Validation: ${messages}`);
          }
          break;
        case 500:
          notifications.error('Server error. Please try again later.');
          break;
      }
      return throwError(() => error);
    })
  );
};
