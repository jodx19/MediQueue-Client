import { Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';

/**
 * Facade that delegates to NotificationService.
 *
 * All existing components injecting ToastService continue to work
 * without changes — every method is forwarded to the signal-based
 * NotificationService under the hood.
 *
 * New code should inject NotificationService directly.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly notification = inject(NotificationService);

  success(message: string, _duration?: number) { this.notification.success(message); }
  error(message: string, _duration?: number)   { this.notification.error(message); }
  info(message: string, _duration?: number)    { this.notification.info(message); }
  warning(message: string, _duration?: number) { this.notification.warning(message); }

  show(message: string)  { this.notification.show(message); }
  showSuccess(message: string, duration?: number) { this.success(message, duration); }
  showError(message: string, duration?: number)   { this.error(message, duration); }
  showWarning(message: string, duration?: number) { this.warning(message, duration); }
  showInfo(message: string, duration?: number)    { this.info(message, duration); }

  remove(id: number) { this.notification.remove(id); }
  clear()            { this.notification.clear(); }
}
