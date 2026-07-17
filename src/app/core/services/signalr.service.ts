import { Injectable, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private readonly auth          = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  private hub?: HubConnection;
  readonly connectionState = signal<'connected'|'connecting'|'disconnected'>('disconnected');
  readonly notificationCount = signal(0);
  readonly notificationsList = signal<NotificationItem[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('mediqueue_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notificationsList.set(parsed);
        const unreadCount = parsed.filter((n: any) => !n.read).length;
        this.notificationCount.set(unreadCount);
      }
    } catch (e) {
      // ignore
    }
  }

  private saveToStorage(list: NotificationItem[]) {
    try {
      localStorage.setItem('mediqueue_notifications', JSON.stringify(list));
      const unreadCount = list.filter(n => !n.read).length;
      this.notificationCount.set(unreadCount);
    } catch (e) {
      // ignore
    }
  }

  addNotification(message: string, type: 'info' | 'success' | 'warning' = 'info') {
    const newItem: NotificationItem = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type
    };
    const updated = [newItem, ...this.notificationsList()].slice(0, 20); // keep last 20
    this.notificationsList.set(updated);
    this.saveToStorage(updated);
  }

  markAllAsRead() {
    const updated = this.notificationsList().map(n => ({ ...n, read: true }));
    this.notificationsList.set(updated);
    this.saveToStorage(updated);
  }

  clearNotifications(): void {
    this.notificationsList.set([]);
    this.saveToStorage([]);
  }

  async connect(): Promise<void> {
    if (this.hub?.state === HubConnectionState.Connected) return;

    this.connectionState.set('connecting');

    this.hub = new HubConnectionBuilder()
      .withUrl(environment.signalrHubUrl, {
        accessTokenFactory: () => this.auth.getToken() ?? '',
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    // ═══ Events from Backend (ClinicHub)
    this.hub.on('AppointmentBooked', (data: any) => {
      const msg = `New Appointment: ${data.patientName} with Dr. ${data.doctorName}`;
      this.notifications.info(msg);
      this.addNotification(msg, 'info');
    });

    this.hub.on('VisitStarted', (data: any) => {
      const msg = `Visit Started: ${data.patientName} — Dr. ${data.doctorName}`;
      this.notifications.success(msg);
      this.addNotification(msg, 'success');
    });

    this.hub.on('InvoicePaid', (data: any) => {
      const msg = `Payment Received: Invoice #${data.invoiceNumber} — EGP ${data.amount.toLocaleString()}`;
      this.notifications.success(msg);
      this.addNotification(msg, 'success');
    });

    // ═══ Reconnection handlers
    this.hub.onreconnecting(() => this.connectionState.set('connecting'));
    this.hub.onreconnected(() => this.connectionState.set('connected'));
    this.hub.onclose(() => this.connectionState.set('disconnected'));

    try {
      await this.hub.start();
      this.connectionState.set('connected');
    } catch (err) {
      this.connectionState.set('disconnected');
    }
  }

  async disconnect(): Promise<void> {
    await this.hub?.stop();
    this.connectionState.set('disconnected');
  }
}
