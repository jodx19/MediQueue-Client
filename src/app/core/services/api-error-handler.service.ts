import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from './notification.service';
import { ApiError } from '../models/api-response.model';

/** Maps HTTP status codes to user-facing messages (English / Arabic fallback). */
const HTTP_STATUS_MESSAGES: Record<number, { en: string; ar: string }> = {
  0:    { en: 'Connection failed. Please check your internet connection.', ar: 'فشل الاتصال. يرجى التحقق من اتصال الإنترنت.' },
  400:  { en: 'Invalid request. Please check your input.', ar: 'طلب غير صالح. يرجى التحقق من الإدخال.' },
  401:  { en: 'Session expired. Please login again.', ar: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.' },
  403:  { en: 'You do not have permission for this action.', ar: 'ليس لديك صلاحية لهذا الإجراء.' },
  404:  { en: 'Resource not found.', ar: 'المورد غير موجود.' },
  409:  { en: 'Conflict. The resource may already exist.', ar: 'تعارض. المورد قد يكون موجوداً بالفعل.' },
  422:  { en: 'Validation failed. Please review your input.', ar: 'فشل التحقق. يرجى مراجعة الإدخال.' },
  429:  { en: 'Too many requests. Please wait a moment.', ar: 'طلبات كثيرة. يرجى الانتظار لحظة.' },
  500:  { en: 'Server error. Our team has been notified.', ar: 'خطأ في الخادم. تم إبلاغ الفريق.' },
  502:  { en: 'Service temporarily unavailable.', ar: 'الخدمة غير متاحة مؤقتاً.' },
  503:  { en: 'Service is under maintenance.', ar: 'الخدمة قيد الصيانة.' },
};

/**
 * Centralised handler that converts errors into user-friendly notifications.
 *
 * Detects `ApiError`, `HttpErrorResponse`, and generic `Error` instances
 * and displays the appropriate message via the signal-based `NotificationService`.
 */
@Injectable({ providedIn: 'root' })
export class ApiErrorHandlerService {
  private readonly notify = inject(NotificationService);

  /**
   * Inspect `error` and show a suitable notification.
   * Call from `catch` blocks in components / services.
   */
  handle(error: unknown, locale: 'en' | 'ar' = 'en'): void {
    if (error instanceof ApiError) {
      this.handleApiError(error);
    } else if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error, locale);
    } else if (error instanceof Error) {
      this.notify.error(error.message);
    } else {
      this.notify.error('An unexpected error occurred.');
    }
  }

  /**
   * Collect every error detail into a single string so the user sees all of them.
   */
  private handleApiError(apiError: ApiError): void {
    const parts: string[] = [apiError.message];
    if (apiError.errors?.length) {
      parts.push(...apiError.errors);
    }
    this.notify.error(parts.join(' · '));
  }

  private handleHttpError(httpError: HttpErrorResponse, locale: 'en' | 'ar'): void {
    const mapping = HTTP_STATUS_MESSAGES[httpError.status];
    if (mapping) {
      this.notify.error(mapping[locale]);
    } else if (httpError.status >= 500) {
      this.notify.error(
        locale === 'ar'
          ? 'خطأ في الخادم. تم إبلاغ الفريق.'
          : 'Server error. Our team has been notified.',
      );
    } else if (httpError.error?.detail) {
      this.notify.error(httpError.error.detail);
    } else {
      this.notify.error(httpError.message || 'An unexpected error occurred.');
    }
  }
}
