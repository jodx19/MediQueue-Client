import { Injectable, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  type: 'appointment' | 'visit' | 'invoice' | 'system';
  message: string;
  createdAt: Date;
  isRead: boolean;
}

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private readonly auth          = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  private hub?: HubConnection;
  readonly connectionState = signal<'connected'|'connecting'|'disconnected'>('disconnected');
  readonly notificationCount = signal(0);
  readonly recentEvents = signal<AppNotification[]>([]);

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

    this.hub.on('AppointmentBooked', (data: any) => {
      this.addEvent({
        id: Date.now().toString(),
        type: 'appointment',
        message: `New appointment: ${data.patientName} with ${data.doctorName}`,
        createdAt: new Date(),
        isRead: false,
      });
      this.notifications.info(`New appointment: ${data.patientName}`);
      this.incrementCount();
    });

    this.hub.on('VisitStarted', (data: any) => {
      this.addEvent({
        id: Date.now().toString(),
        type: 'visit',
        message: `Visit started: ${data.patientName} — Dr. ${data.doctorName}`,
        createdAt: new Date(),
        isRead: false,
      });
      this.notifications.success(`Visit started: ${data.patientName}`);
      this.incrementCount();
    });

    this.hub.on('InvoicePaid', (data: any) => {
      this.addEvent({
        id: Date.now().toString(),
        type: 'invoice',
        message: `Invoice #${data.invoiceNumber} paid — EGP ${data.amount}`,
        createdAt: new Date(),
        isRead: false,
      });
      this.notifications.success(`Invoice paid: EGP ${data.amount}`);
      this.incrementCount();
    });

    this.hub.onreconnecting(() => this.connectionState.set('connecting'));
    this.hub.onreconnected(() => this.connectionState.set('connected'));
    this.hub.onclose(() => this.connectionState.set('disconnected'));

    try {
      await this.hub.start();
      this.connectionState.set('connected');
    } catch (err) {
      this.connectionState.set('disconnected');
      console.error('SignalR failed to connect:', err);
    }
  }

  private addEvent(event: AppNotification) {
    this.recentEvents.update(events => [event, ...events].slice(0, 50));
  }

  clearNotifications(): void {
    this.notificationCount.set(0);
  }

  private incrementCount(): void {
    this.notificationCount.update(n => n + 1);
  }

  async disconnect(): Promise<void> {
    await this.hub?.stop();
    this.connectionState.set('disconnected');
  }
}
