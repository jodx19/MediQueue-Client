import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inject, Optional } from '@angular/core';
import { API_BASE_URL } from '../api/mediqueue-api';

/**
 * Manages browser Push Notification subscriptions (PWA / Service Worker).
 *
 * The service checks support at construction time and lazily subscribes when
 * the user grants notification permission.  Subscriptions are sent to the
 * backend so the server can broadcast targeted push messages.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  /** True when the browser supports Service Workers and the Notifications API. */
  readonly isSupported = signal(this.checkPushSupport());

  /** True after the user has actively granted notification permission. */
  readonly isSubscribed = signal(false);

  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Optional() @Inject(API_BASE_URL) baseUrl?: string
  ) {
    this.baseUrl = baseUrl ?? '';
    if (this.isSupported()) {
      this.initServiceWorker();
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Requests notification permission from the user and, on grant,
   * creates a PushManager subscription and sends it to the backend.
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    await this.subscribeToPush();
    return true;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private checkPushSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'Notification' in window &&
      'PushManager' in window
    );
  }

  private async initServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing     = await registration.pushManager.getSubscription();

      if (existing) {
        this.isSubscribed.set(true);
      }
    } catch {
      // Service worker may not be available in dev mode — fail silently.
    }
  }

  private async subscribeToPush(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const registration = await navigator.serviceWorker.ready;

      // NOTE: replace with the real VAPID public key from your server config.
      // The key below is a placeholder; the subscription will fail until it is
      // replaced with a genuine VAPID key pair generated with web-push or similar.
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send the subscription endpoint + keys to the backend for storage.
      await this.http.post(
        `${this.baseUrl}/api/push-subscriptions`,
        subscription.toJSON()
      ).toPromise();

      this.isSubscribed.set(true);
    } catch (err) {
      console.warn('[PushNotificationService] Subscription failed:', err);
    }
  }

  /**
   * Converts a URL-safe base-64 VAPID key to the Uint8Array format
   * required by PushManager.subscribe().
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64  = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData     = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
