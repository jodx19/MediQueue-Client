import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

/** Shape of token data inside the ApiResponse wrapper. */
interface RefreshTokenData {
  token: string;
  refreshToken: string;
  expiryTime: string;
}

/* ── Module-level refresh-cycle guard ── */

let isRefreshing = false;

/** Resolver functions waiting for the new token. */
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: () => void;
}> = [];

function attachToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function forceLogout(auth: AuthService, router: Router): void {
  auth.logout();
  router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
}

function startRefresh(auth: AuthService, http: HttpClient, router: Router): void {
  isRefreshing = true;
  const refreshUrl = `${environment.apiBaseUrl}/api/auth/refresh-token`;
  const body = { token: auth.getToken(), refreshToken: auth.refreshToken() };

  http.post<ApiResponse<RefreshTokenData>>(refreshUrl, body).subscribe({
    next(wrapper: ApiResponse<RefreshTokenData>) {
      isRefreshing = false;
      if (wrapper.isSuccess && wrapper.data) {
        const { token, refreshToken, expiryTime } = wrapper.data;
        auth.updateTokens(token, refreshToken, expiryTime);
        const q = pendingQueue;
        pendingQueue = [];
        q.forEach((r) => r.resolve(token));
      } else {
        const q = pendingQueue;
        pendingQueue = [];
        q.forEach((r) => r.reject());
        forceLogout(auth, router);
      }
    },
    error() {
      isRefreshing = false;
      const q = pendingQueue;
      pendingQueue = [];
      q.forEach((r) => r.reject());
      forceLogout(auth, router);
    },
  });
}

/**
 * Intercepts 401 responses and silently refreshes the JWT token.
 *
 * Must be registered AFTER `errorInterceptor` in the `withInterceptors`
 * array so that 401 responses are handled here first.
 */
export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const http = inject(HttpClient);
  const router = inject(Router);

  // Avoid infinite loops on auth endpoints
  const url = req.url.toLowerCase();
  if (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/refresh-token') ||
    url.includes('/api/auth/patient-login')
  ) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (!auth.getToken() || !auth.refreshToken()) {
        forceLogout(auth, router);
        return throwError(() => error);
      }

      if (isRefreshing) {
        return new Observable<HttpEvent<unknown>>((subscriber) => {
          pendingQueue.push({
            resolve(token: string) {
              next(attachToken(req, token)).subscribe({
                next: (v: HttpEvent<unknown>) => subscriber.next(v),
                error: (e: unknown) => subscriber.error(e),
                complete: () => subscriber.complete(),
              });
            },
            reject() {
              subscriber.error(error);
            },
          });
        });
      }

      const originalRequest = req;
      startRefresh(auth, http, router);

      return new Observable<HttpEvent<unknown>>((subscriber) => {
        pendingQueue.push({
          resolve(token: string) {
            next(attachToken(originalRequest, token)).subscribe({
              next: (v: HttpEvent<unknown>) => subscriber.next(v),
              error: (e: unknown) => subscriber.error(e),
              complete: () => subscriber.complete(),
            });
          },
          reject() {
            subscriber.error(error);
          },
        });
      });
    }),
  );
};
