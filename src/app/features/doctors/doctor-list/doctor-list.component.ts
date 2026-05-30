import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { DoctorsClient, DoctorSummaryDto } from '../../../core/api/mediqueue-api';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './doctor-list.component.html',
})
export class DoctorListComponent implements OnInit {
  private readonly doctorsClient = inject(DoctorsClient);
  public  readonly router        = inject(Router);

  isLoading = signal(true);
  doctors   = signal<DoctorSummaryDto[]>([]);

  async ngOnInit() {
    try {
      const result = await firstValueFrom(this.doctorsClient.doctorsGET());
      const data = result?.items ?? [];
      this.doctors.set(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load doctors', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getInitials(d: DoctorSummaryDto): string {
    return `${(d.fullName ?? 'D')[0]}`.toUpperCase();
  }
}
