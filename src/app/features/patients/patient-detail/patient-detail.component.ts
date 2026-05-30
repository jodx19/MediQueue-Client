import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  PatientsClient, PatientDetailDto,
  AppointmentsClient, AppointmentDto,
  ClinicalVisitsClient, ClinicalVisitSummaryDto
} from '../../../core/api/mediqueue-api';

type Tab = 'overview' | 'visits' | 'appointments';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './patient-detail.component.html',
})
export class PatientDetailComponent implements OnInit {
  private readonly patientsClient      = inject(PatientsClient);
  private readonly appointmentsClient  = inject(AppointmentsClient);
  private readonly visitsClient        = inject(ClinicalVisitsClient);
  private readonly route               = inject(ActivatedRoute);
  public  readonly router              = inject(Router);

  patient      = signal<PatientDetailDto | null>(null);
  appointments = signal<AppointmentDto[]>([]);
  visits       = signal<ClinicalVisitSummaryDto[]>([]);
  isLoading    = signal(true);
  activeTab    = signal<Tab>('overview');
  expandedVisit = signal<string | null>(null);

  patientId = '';

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
      console.error('Failed to load patient', err);
    }
  }

  private async loadVisits() {
    try {
      const result = await firstValueFrom(this.visitsClient.patient2(this.patientId, 1, 20));
      this.visits.set(result?.items ?? []);
    } catch (err) {
      console.error('Failed to load visits', err);
    }
  }

  private async loadAppointments() {
    try {
      const result = await firstValueFrom(this.appointmentsClient.patient(this.patientId, 1, 20));
      this.appointments.set(result?.items ?? []);
    } catch (err) {
      console.error('Failed to load appointments', err);
    }
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
