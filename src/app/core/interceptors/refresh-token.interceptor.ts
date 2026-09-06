import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, from, switchMap } from 'rxjs';
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

/** Milliseconds before expiry to proactively refresh the token. */
const PROACTIVE_REFRESH_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

function attachToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function forceLogout(auth: AuthService, router: Router): void {
  auth.logout();
  router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
}

function doRefresh(
  auth: AuthService,
  http: HttpClient,
  router: Router
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (isRefreshing) {
      // Already in progress — join the queue
      pendingQueue.push({ resolve, reject });
      return;
    }

    isRefreshing = true;
    const refreshUrl = `${environment.apiBaseUrl}/api/auth/refresh-token`;
    const body = { token: auth.getToken(), refreshToken: auth.refreshToken() };

    http.post<ApiResponse<RefreshTokenData>>(refreshUrl, body).subscribe({
      next(wrapper: ApiResponse<RefreshTokenData>) {
        isRefreshing = false;
        if (wrapper.isSuccess && wrapper.data) {
          const { token, refreshToken, expiryTime } = wrapper.data;
          auth.updateTokens(token, refreshToken, expiryTime);

          // Resolve the initiating caller
          resolve(token);

          // Flush the queue
          const q = pendingQueue;
          pendingQueue = [];
          q.forEach(r => r.resolve(token));
        } else {
          reject();
          const q = pendingQueue;
          pendingQueue = [];
          q.forEach(r => r.reject());
          forceLogout(auth, router);
        }
      },
      error() {
        isRefreshing = false;
        reject();
        const q = pendingQueue;
        pendingQueue = [];
        q.forEach(r => r.reject());
        forceLogout(auth, router);
      },
    });
  });
}

/**
 * Intercepts HTTP requests to handle JWT token lifecycle:
 *
 * 1. **Proactive refresh**: If the access token expires within 2 minutes,
 *    silently refreshes it BEFORE sending the request — no 401 needed.
 *
 * 2. **Reactive refresh**: If a 401 is received (e.g. clock skew, revoked
 *    token), attempts a silent refresh and retries the original request.
 *
 * Must be registered AFTER `authInterceptor` so the Bearer header is already
 * attached before we decide whether to proactively refresh.
 */
export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const http   = inject(HttpClient);
  const router = inject(Router);

  // Never intercept auth endpoints to avoid infinite loops
  const url = req.url.toLowerCase();
  if (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/refresh-token') ||
    url.includes('/api/auth/patient-login')
  ) {
    return next(req);
  }

  const session = auth.currentUser();

  // ── Proactive refresh ────────────────────────────────────────────────────
  // If the token is about to expire within the threshold window, refresh it
  // before sending the request so the user never sees a 401.
  if (session?.token && session?.refreshToken) {
    const expiresAt  = new Date(session.expiresAt).getTime();
    const now        = Date.now();
    const timeLeft   = expiresAt - now;
    const isExpired  = timeLeft <= 0;
    const soonExpiry = timeLeft <= PROACTIVE_REFRESH_THRESHOLD_MS;

    if (isExpired || soonExpiry) {
      return from(doRefresh(auth, http, router)).pipe(
        switchMap(newToken => next(attachToken(req, newToken))),
        catchError(() => {
          forceLogout(auth, router);
          return throwError(() => new Error('Token refresh failed'));
        })
      );
    }
  }

  // ── Reactive refresh on 401 ──────────────────────────────────────────────
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (!auth.getToken() || !auth.refreshToken()) {
        forceLogout(auth, router);
        return throwError(() => error);
      }

      return new Observable<HttpEvent<unknown>>(subscriber => {
        pendingQueue.push({
          resolve(token: string) {
            next(attachToken(req, token)).subscribe({
              next:     (v: HttpEvent<unknown>) => subscriber.next(v),
              error:    (e: unknown) => subscriber.error(e),
              complete: () => subscriber.complete(),
            });
          },
          reject() {
            subscriber.error(error);
          },
        });

        doRefresh(auth, http, router).catch(() => {
          // already handled inside doRefresh (forceLogout + queue rejection)
        });
      });
    })
  );
};
