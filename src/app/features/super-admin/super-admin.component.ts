import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { AuthClient, RegisterCommand } from '../../core/api/mediqueue-api';
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
  private readonly http = inject(HttpClient);
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
      const result = await firstValueFrom(this.http.get<any[]>('/api/users'));
      this.staffList.set((result ?? []).map(u => ({
        firstName: u.firstName ?? u.userName,
        lastName: u.lastName ?? '',
        email: u.email,
        role: u.role,
        status: u.isActive ? 'Active' : 'Inactive'
      })));
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to load staff');
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
      // Pass role as extra property — backend accepts it via RegisterCommand
      (command as any).role = this.newStaff.role;

      await firstValueFrom(this.authClient.register(command));
      this.notify.success('Staff account created successfully');
      this.closeModal();
      await this.loadStaff();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to create staff account');
    } finally {
      this.isLoading.set(false);
    }
  }

  deactivateStaff(email: string) {
    if (confirm(`Are you sure you want to deactivate ${email}?`)) {
      this.staffList.update(list => list.map(s => s.email === email ? { ...s, status: 'Inactive' } : s));
    }
  }
}
