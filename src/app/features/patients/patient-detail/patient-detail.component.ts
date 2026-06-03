import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  PatientsClient, PatientDetailDto,
  AppointmentsClient, AppointmentDto,
  ClinicalVisitsClient, ClinicalVisitSummaryDto, AttachmentDto
} from '../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { AttachmentsListComponent } from '../../../shared/components/attachments-list/attachments-list.component';

type Tab = 'overview' | 'visits' | 'appointments' | 'files';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FileUploadComponent, AttachmentsListComponent],
  templateUrl: './patient-detail.component.html',
})
export class PatientDetailComponent implements OnInit {
  private readonly patientsClient      = inject(PatientsClient);
  private readonly appointmentsClient  = inject(AppointmentsClient);
  private readonly visitsClient        = inject(ClinicalVisitsClient);
  private readonly apiErrorHandler     = inject(ApiErrorHandlerService);
  private readonly authService         = inject(AuthService);
  private readonly route               = inject(ActivatedRoute);
  public  readonly router              = inject(Router);

  patient      = signal<PatientDetailDto | null>(null);
  appointments = signal<AppointmentDto[]>([]);
  visits       = signal<ClinicalVisitSummaryDto[]>([]);
  isLoading    = signal(true);
  activeTab    = signal<Tab>('overview');
  expandedVisit = signal<string | null>(null);

  attachments = signal<AttachmentDto[]>([]);
  patientId = '';

  canDeleteAttachments = computed(() =>
    ['Admin', 'Receptionist'].includes(this.authService.currentUser()?.role ?? '')
  );

  async ngOnInit() {
    this.patientId = this.route.snapshot.paramMap.get('id')!;
    await Promise.all([this.loadPatient(), this.loadVisits(), this.loadAppointments()]);
    this.isLoading.set(false);
  }

  private async loadPatient() {
    try {
      const result = await firstValueFrom(this.patientsClient.patientsGET2(this.patientId));
      this.patient.set(result);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    }
  }

  private async loadVisits() {
    try {
      const result = await firstValueFrom(this.visitsClient.patient2(this.patientId, 1, 20));
      this.visits.set(result?.items ?? []);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    }
  }

  private async loadAppointments() {
    try {
      const result = await firstValueFrom(this.appointmentsClient.patient(this.patientId, 1, 20));
      this.appointments.set(result?.items ?? []);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    }
  }

  async loadAttachments() {
    const allAttachments: AttachmentDto[] = [];
    const seen = new Set<string>();
    for (const v of this.visits()) {
      if (!v.id) continue;
      try {
        const detail = await firstValueFrom(this.visitsClient.clinicalVisitsGET(v.id));
        for (const att of detail.attachments ?? []) {
          if (att.id && !seen.has(att.id)) {
            seen.add(att.id);
            allAttachments.push(att);
          }
        }
      } catch { /* skip failed */ }
    }
    this.attachments.set(allAttachments);
  }

  onAttachmentDeleted(id: string) {
    this.attachments.update(list => list.filter(a => a.id !== id));
  }

  setTab(tab: string) {
    this.activeTab.set(tab as Tab);
  }

  toggleVisit(id: string) {
    this.expandedVisit.set(this.expandedVisit() === id ? null : id);
  }

  getAge(dob: Date | undefined): number {
    if (!dob) return 0;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  visitStatusClass(status: string | undefined): string {
    const map: Record<string, string> = {
      'InProgress': 'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30',
      'Completed':  'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      'Cancelled':  'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-rose-500/15 text-rose-400 border border-rose-500/30',
    };
    return map[status ?? ''] ?? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-mq-700 text-mq-s400';
  }

  apptStatusClass(status: string | undefined): string {
    const map: Record<string, string> = {
      'Scheduled':  'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30',
      'CheckedIn':  'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30',
      'InSession':  'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30',
      'Completed':  'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      'Cancelled':  'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-rose-500/15 text-rose-400 border border-rose-500/30',
    };
    return map[status ?? ''] ?? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-mq-700 text-mq-s400';
  }
}
