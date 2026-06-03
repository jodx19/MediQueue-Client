import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  UpdateSOAPNoteCommand,
  AddVitalSignCommand,
  ClinicalVisitsClient,
  ClinicalVisitDetailDto
} from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import {
  DiagnosesTabComponent,
  PrescriptionsTabComponent,
  LabRequestsTabComponent,
  ImagingRequestsTabComponent,
  ProceduresTabComponent,
  ReferralsTabComponent,
} from '../components';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { FormErrorComponent } from '../../../shared/components/form-error/form-error.component';
import { SoapFormService, SoapFormShape } from '../services/soap-form.service';
import { FormGroup } from '@angular/forms';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';

type TabKey = 'soap' | 'vitals' | 'diagnoses' | 'prescriptions' | 'labs' | 'imaging' | 'procedures' | 'referrals' | 'history';

@Component({
  selector: 'app-visit-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, EmptyStateComponent, FormErrorComponent, DiagnosesTabComponent, PrescriptionsTabComponent, LabRequestsTabComponent, ImagingRequestsTabComponent, ProceduresTabComponent, ReferralsTabComponent],
  providers: [SoapFormService],
  templateUrl: './visit-detail.component.html',
  styleUrls: ['./visit-detail.component.scss']
})
export class VisitDetailComponent implements OnInit, HasUnsavedChanges {
  private readonly visitsClient = inject(ClinicalVisitsClient);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly soapFormService = inject(SoapFormService);
  readonly router = inject(Router);

  visitId = '';
  visit = signal<ClinicalVisitDetailDto | null>(null);
  activeTab = signal<TabKey>('soap');
  isLoading = signal(true);
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
  autoSaveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  readonly isReadonly = computed(() => {
    const s = this.visit()?.status;
    return s === 'Completed' || s === 'Finalized';
  });

  soapForm!: FormGroup<SoapFormShape>;

  readonly vital = signal({ type: 'BloodPressure', value: '', unit: 'mmHg' });

  readonly tabs = [
    { key: 'soap' as TabKey, label: 'SOAP Notes', icon: 'file-text' },
    { key: 'vitals' as TabKey, label: 'Vitals', icon: 'activity' },
    { key: 'diagnoses' as TabKey, label: 'Diagnoses', icon: 'stethoscope' },
    { key: 'prescriptions' as TabKey, label: 'Prescriptions', icon: 'pill' },
    { key: 'labs' as TabKey, label: 'Labs', icon: 'flask-conical' },
    { key: 'imaging' as TabKey, label: 'Imaging', icon: 'scan' },
    { key: 'procedures' as TabKey, label: 'Procedures', icon: 'syringe' },
    { key: 'referrals' as TabKey, label: 'Referrals', icon: 'arrow-right-from-line' },
    { key: 'history' as TabKey, label: 'History', icon: 'history' },
  ];

  readonly vitalTypes = [
    { label: 'Blood Pressure', value: 'BloodPressure', unit: 'mmHg' },
    { label: 'Heart Rate', value: 'HeartRate', unit: 'bpm' },
    { label: 'Temperature', value: 'Temperature', unit: '°C' },
    { label: 'Weight', value: 'Weight', unit: 'kg' },
    { label: 'SpO2', value: 'SpO2', unit: '%' },
  ];

  constructor() {
    this.soapForm = this.soapFormService.buildSoapForm();

    effect(() => {
      const visit = this.visit();
      if (visit) {
        this.soapForm.patchValue({
          subjective: visit.subjective ?? '',
          objective: visit.objective ?? '',
          assessment: visit.assessment ?? '',
          plan: visit.plan ?? '',
        }, { emitEvent: false });
        this.soapFormService.lastSavedSnapshot.set(this.soapForm.getRawValue());
      }
    });

    this.soapForm.valueChanges.subscribe(() => {
      if (this.visit()?.status === 'Finalized') return;
      this.autoSaveStatus.set('saving');
      this.soapFormService.scheduleAutoSave(
        this.visitId,
        this.soapForm,
        (dto: UpdateSOAPNoteCommand) => this.saveSoap(dto),
      );
    });
  }

  async ngOnInit() {
    this.visitId = this.route.snapshot.paramMap.get('id')!;
    await this.loadVisit();
  }

  canDeactivate(): boolean {
    if (this.soapFormService.isDirty(this.soapForm)) {
      return confirm('\u0644\u062F\u064A\u0643 \u062A\u063A\u064A\u064A\u0631\u0627\u062A \u063A\u064A\u0631 \u0645\u062D\u0641\u0648\u0638\u0629. \u0647\u0644 \u062A\u0631\u064A\u062F \u0627\u0644\u0645\u063A\u0627\u062F\u0631\u0629\u061F');
    }
    return true;
  }

  private async loadVisit() {
    try {
      const result = await firstValueFrom(this.visitsClient.clinicalVisitsGET(this.visitId));
      this.visit.set(result);
    } catch (err) {
      this.notifications.error('Failed to load visit details.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveSoap(dto: UpdateSOAPNoteCommand) {
    this.isSaving.set(true);
    try {
      dto.visitId = this.visitId;
      await firstValueFrom(this.visitsClient.soap(this.visitId, dto));
      this.lastSaved.set(new Date());
      this.autoSaveStatus.set('saved');
      this.soapFormService.lastSavedSnapshot.set(this.soapForm.getRawValue());
      this.soapForm.markAsPristine();
      setTimeout(() => {
        if (this.autoSaveStatus() === 'saved') this.autoSaveStatus.set('idle');
      }, 3000);
    } catch (err: any) {
      this.autoSaveStatus.set('error');
      this.notifications.error('Auto-save failed');
    } finally {
      this.isSaving.set(false);
    }
  }

  async addVital() {
    const v = this.vital();
    if (!v.value) return;

    try {
      const command = new AddVitalSignCommand({
        visitId: this.visitId,
        vitalSignType: v.type as any,
        value: parseFloat(v.value) || 0,
        unit: v.unit,
      });
      await firstValueFrom(this.visitsClient.vitalSigns(this.visitId, command));
      this.notifications.success('Vital sign recorded.');
      this.vital.set({ type: 'BloodPressure', value: '', unit: 'mmHg' });
      await this.loadVisit();
    } catch (err) {
      this.notifications.error('Failed to record vital.');
    }
  }

  async finalizeVisit() {
    if (this.visit()?.status === 'Finalized') return;

    if (this.soapForm.invalid) {
      this.soapForm.markAllAsTouched();
      this.notifications.warning('Please fill all required SOAP fields before finalizing.');
      return;
    }

    if (!confirm('Finalize this clinical visit? This will lock the records and generate an invoice.')) return;

    try {
      this.isSaving.set(true);
      await firstValueFrom(this.visitsClient.finalize(this.visitId));
      this.notifications.success('Visit finalized successfully.');
      await this.loadVisit();
    } catch (err) {
      this.notifications.error('Failed to finalize visit.');
    } finally {
      this.isSaving.set(false);
    }
  }

  getVitalIcon(type: string): string {
    switch(type) {
      case 'BloodPressure': return 'heart';
      case 'HeartRate': return 'activity';
      case 'Temperature': return 'thermometer';
      case 'Weight': return 'scale';
      case 'SpO2': return 'droplets';
      default: return 'activity';
    }
  }

  updateVital(key: string, value: any) {
    this.vital.update(v => ({ ...v, [key]: value }));
  }

  onAddToInvoice(procedure: any) {
    this.router.navigate(['/invoices/create'], {
      queryParams: {
        visitId: this.visitId,
        patientId: (this.visit() as any)?.patientId,
      },
    });
  }
}
