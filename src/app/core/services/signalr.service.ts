import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  private connection?: signalR.HubConnection;

  async connect() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalrHubUrl, {
        accessTokenFactory: () => this.authService.getToken() ?? '',
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on('AppointmentBooked', (data: any) => {
      this.notifications.info(`New appointment booked for ${data.patientName}`);
    });

    this.connection.on('VisitStarted', (data: any) => {
      this.notifications.info(`Patient ${data.patientName} has arrived — Dr. ${data.doctorName}`);
    });

    this.connection.on('InvoicePaid', (data: any) => {
      this.notifications.success(`Invoice #${data.invoiceNumber} paid — EGP ${data.amount}`);
    });

    try {
      await this.connection.start();
      console.log('SignalR connected to /hubs/clinic');
    } catch (err) {
      console.error('SignalR connection failed:', err);
    }
  }

  async disconnect() {
    await this.connection?.stop();
  }
}
