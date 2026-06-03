import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthClient, RegisterCommand } from '../../core/api/mediqueue-api';
import { UsersApiService } from '../../core/services/users-api.service';
import { ApiErrorHandlerService } from '../../core/services/api-error-handler.service';
import { NotificationService } from '../../core/services/notification.service';
import { firstValueFrom } from 'rxjs';
import { pageEnter, fadeSlideIn } from '../../shared/animations/page-animations';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './super-admin.component.html',
  styleUrl: './super-admin.component.scss',
  animations: [pageEnter, fadeSlideIn]
})
export class SuperAdminComponent implements OnInit {
  private readonly authClient = inject(AuthClient);
  private readonly usersApi = inject(UsersApiService);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  private readonly notify = inject(NotificationService);

  staffList = signal<any[]>([]);
  isLoading = signal(false);
  isModalOpen = signal(false);
  
  newStaff = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Admin'
  };

  roles = ['Admin', 'Doctor', 'Receptionist'];

  ngOnInit() {
    this.loadStaff();
  }

  async loadStaff() {
    this.isLoading.set(true);
    try {
      const result = await firstValueFrom(this.usersApi.getAll());
      this.staffList.set((result ?? []).map(u => ({
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        email: u.email,
        role: u.role,
        status: u.isActive ? 'Active' : 'Inactive'
      })));
    } catch (err: any) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  openModal() {
    this.newStaff = { firstName: '', lastName: '', email: '', password: 'TempPassword123!', role: 'Admin' };
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async createAccount() {
    this.isLoading.set(true);
    try {
      const command = new RegisterCommand({
        username: this.newStaff.email,
        email: this.newStaff.email,
        password: this.newStaff.password,
        firstName: this.newStaff.firstName,
        lastName: this.newStaff.lastName,
        phoneNumber: '01000000000',
      });
      (command as any).role = this.newStaff.role;

      await firstValueFrom(this.authClient.register(command));
      this.notify.success('Staff account created successfully');
      this.closeModal();
      await this.loadStaff();
    } catch (err: any) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deactivateStaff(email: string) {
    if (!confirm(`Are you sure you want to deactivate ${email}?`)) return;
    this.isLoading.set(true);
    try {
      await firstValueFrom(this.usersApi.deactivate(email));
      this.notify.success(`Staff account ${email} deactivated successfully`);
      await this.loadStaff();
    } catch (err: any) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }
}