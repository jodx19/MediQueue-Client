import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  PatientsClient, PatientDetailDto,
  AppointmentsClient, AppointmentDto,
  ClinicalVisitsClient, ClinicalVisitSummaryDto, AttachmentDto,
  AddAllergyCommand, AddChronicConditionCommand, AllergySeverity,
  UpdatePatientCommand,
} from '../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { AttachmentsListComponent } from '../../../shared/components/attachments-list/attachments-list.component';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

type Tab = 'overview' | 'visits' | 'appointments' | 'files' | 'medical';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LucideAngularModule,
    FileUploadComponent, AttachmentsListComponent,
    HasRoleDirective,
  ],
  templateUrl: './patient-detail.component.html',
})
export class PatientDetailComponent implements OnInit {
  private readonly patientsClient      = inject(PatientsClient);
  private readonly appointmentsClient  = inject(AppointmentsClient);
  private readonly visitsClient        = inject(ClinicalVisitsClient);
  private readonly apiErrorHandler     = inject(ApiErrorHandlerService);
  private readonly authService         = inject(AuthService);
  private readonly notify             = inject(NotificationService);
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

  // ── Medical tab — allergies & chronic conditions ─────────────────────
  // The medical tab exposes add/remove flows on top of PatientDetailDto's
  // pre-baked allergies/chronicConditions arrays. We refresh the patient
  // after each mutation rather than mutating the signal in place, so the
  // server remains the single source of truth.
  showAddAllergy              = signal(false);
  showAddCondition           = signal(false);
  isSubmitting                = signal(false);
  AllergySeverity = AllergySeverity; // expose enum to template

  // Add-allergy form. severity/reaction are optional — the backend accepts
  // a positive test result with just the allergen name.
  newAllergy = {
    allergen:    '',
    severity:    AllergySeverity._2, // Moderate (default) — _1 Mild .. _4 Severe
    reaction:    '',
  };

  // Add-chronic-condition form. Required: conditionName. The rest is
  // optional metadata (ICD-10 code, notes) anddefaults to empty.
  newCondition = {
    conditionName: '',
    icD10Code:     '',
    notes:         '',
  };

  readonly severityLabels: ReadonlyArray<{ value: AllergySeverity; label: string }> = [
    { value: AllergySeverity._1, label: 'Mild'        },
    { value: AllergySeverity._2, label: 'Moderate'    },
    { value: AllergySeverity._3, label: 'Severe'      },
    { value: AllergySeverity._4, label: 'Life-threatening' },
  ];

  // ── Edit mode (Overview tab) ──────────────────────────────────────────
  // UpdatePatientCommand on the backend only exposes phone / email /
  // alternativePhone. Identity fields (firstName, lastName, dateOfBirth,
  // nationalId) are intentionally NOT editable — they require an admin
  // override path that doesn't exist yet. We expose exactly what the API
  // accepts so the operator never sees a "saved ✓" that silently dropped
  // half their input.
  isEditing = signal(false);
  editForm = {
    phone:            '',
    email:            '',
    alternativePhone: '',
  };

  startEdit() {
    const p = this.patient();
    if (!p) return;
    this.editForm = {
      phone:            p.phone ?? '',
      email:            p.email ?? '',
      alternativePhone: '',
    };
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  async saveEdit() {
    this.isSubmitting.set(true);
    try {
      await firstValueFrom(this.patientsClient.patientsPUT(
        this.patientId,
        new UpdatePatientCommand({
          patientId:        this.patientId,
          phone:            this.editForm.phone.trim()    || undefined,
          email:            this.editForm.email.trim()    || undefined,
          alternativePhone: this.editForm.alternativePhone.trim() || undefined,
        }),
      ));
      this.notify.success('Patient updated successfully');
      this.isEditing.set(false);
      await this.loadPatient();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to update patient');
    } finally {
      this.isSubmitting.set(false);
    }
  }

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

  // ── Allergies ────────────────────────────────────────────────────────
  async addAllergy() {
    if (!this.newAllergy.allergen.trim()) return;
    this.isSubmitting.set(true);
    try {
      await firstValueFrom(this.patientsClient.allergiesPOST(
        this.patientId,
        new AddAllergyCommand({
          patientId: this.patientId,
          allergen:  this.newAllergy.allergen.trim(),
          severity:  this.newAllergy.severity,
          reaction:  this.newAllergy.reaction.trim() || undefined,
        }),
      ));
      this.notify.success('Allergy added');
      this.showAddAllergy.set(false);
      this.newAllergy.allergen = '';
      this.newAllergy.reaction = '';
      await this.loadPatient();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to add allergy');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async removeAllergy(allergyId: string) {
    if (!confirm('Remove this allergy from the patient record?')) return;
    try {
      await firstValueFrom(this.patientsClient.allergiesDELETE(this.patientId, allergyId));
      this.notify.success('Allergy removed');
      await this.loadPatient();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to remove allergy');
    }
  }

  // ── Chronic conditions ────────────────────────────────────────────────
  // NB: there is no chronic-conditions DELETE on the backend, so we expose
  // add-only here. Removing would require a separate endpoint.
  async addCondition() {
    if (!this.newCondition.conditionName.trim()) return;
    this.isSubmitting.set(true);
    try {
      await firstValueFrom(this.patientsClient.chronicConditions(
        this.patientId,
        new AddChronicConditionCommand({
          patientId:     this.patientId,
          conditionName: this.newCondition.conditionName.trim(),
          icD10Code:     this.newCondition.icD10Code.trim() || undefined,
          notes:         this.newCondition.notes.trim()    || undefined,
        }),
      ));
      this.notify.success('Condition added');
      this.showAddCondition.set(false);
      this.newCondition.conditionName = '';
      this.newCondition.icD10Code     = '';
      this.newCondition.notes         = '';
      await this.loadPatient();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to add condition');
    } finally {
      this.isSubmitting.set(false);
    }
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
