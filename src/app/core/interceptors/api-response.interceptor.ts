import {
  HttpInterceptorFn,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiError } from '../models/api-response.model';

/** URLs whose responses must NEVER be unwrapped (auth flow reads the full payload). */
const SKIP_URLS: readonly string[] = [
  '/api/auth/login',
  '/api/auth/refresh-token',
  '/api/auth/patient-login',
];

function shouldSkip(url: string): boolean {
  const lower = url.toLowerCase();
  return SKIP_URLS.some((u) => lower.includes(u));
}

/**
 * Intercepts every HTTP response and unwraps the backend `ApiResponse<T>` envelope.
 *
 * - **Blob responses (NSwag clients)** – the envelope is unwrapped: `data` replaces the
 *   blob body so that NSwag's `fromJS()` receives the DTO directly.
 * - **JSON responses (raw HttpClient)** – the envelope is unwrapped:
 *   `isSuccess === true` → body replaced with `response.data`;
 *   `isSuccess === false` → a structured `ApiError` is thrown.
 * - Auth endpoints are skipped so that `AuthService` keeps reading the full payload.
 *
 * Must be registered AFTER `refreshTokenInterceptor` in the interceptor chain.
 */
export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
  if (shouldSkip(req.url)) {
    return next(req);
  }

  return new Observable<HttpEvent<unknown>>((subscriber) => {
    next(req).subscribe({
      next(event: HttpEvent<unknown>) {
        if (event instanceof HttpResponse && event.body != null) {
          handleEnvelope(event, subscriber);
          return;
        }
        subscriber.next(event);
        subscriber.complete();
      },
      error(err: unknown) {
        subscriber.error(err);
      },
      complete() {
        subscriber.complete();
      },
    });
  });
};

/**
 * Inspect the response body for an `ApiResponse` envelope and take action.
 *
 * **Blob body (NSwag)** – unwrap `data` on success, throw on failure.
 * **Plain-object body (raw HttpClient)** – unwrap on success, throw on failure.
 */
function handleEnvelope(
  event: HttpResponse<unknown>,
  subscriber: {
    next: (value: HttpEvent<unknown>) => void;
    error: (err: unknown) => void;
    complete: () => void;
  },
): void {
  const body = event.body;

  /* ── Blob path (NSwag clients) – unwrap data ──────────────────── */
  if (body instanceof Blob) {
    const ct = event.headers.get('content-type') ?? '';
    if (!ct.includes('application/json') && !ct.includes('/json')) {
      subscriber.next(event);
      subscriber.complete();
      return;
    }

    body
      .text()
      .then((text: string) => {
        try {
          const parsed: Record<string, unknown> = JSON.parse(text);
          if (isEnvelope(parsed)) {
            if (parsed['isSuccess'] === true) {
              const newBody = JSON.stringify(parsed['data']);
              subscriber.next(
                event.clone({ body: new Blob([newBody], { type: 'application/json' }) }),
              );
            } else {
              subscriber.error(
                new ApiError(
                  (parsed['message'] as string) || 'Request failed',
                  (parsed['errors'] as string[]) ?? null,
                ),
              );
            }
            subscriber.complete();
            return;
          }
        } catch {
          /* ignore – pass through */
        }
        subscriber.next(event);
        subscriber.complete();
      })
      .catch(() => {
        subscriber.next(event);
        subscriber.complete();
      });
    return;
  }

  /* ── Plain-object path (raw HttpClient) – unwrap ──────────────── */
  if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    if (!isEnvelope(obj)) {
      subscriber.next(event);
      subscriber.complete();
      return;
    }

    if (obj['isSuccess'] === true) {
      subscriber.next(event.clone({ body: obj['data'] }));
    } else {
      subscriber.error(
        new ApiError(
          (obj['message'] as string) || 'Request failed',
          (obj['errors'] as string[]) ?? null,
        ),
      );
      return;
    }
    subscriber.complete();
    return;
  }

  /* ── Non-envelope body (string, number, file, etc.) ───────────── */
  subscriber.next(event);
  subscriber.complete();
}

/** Returns `true` when `value` looks like a backend `ApiResponse` envelope. */
function isEnvelope(value: Record<string, unknown>): boolean {
  return 'isSuccess' in value;
}
