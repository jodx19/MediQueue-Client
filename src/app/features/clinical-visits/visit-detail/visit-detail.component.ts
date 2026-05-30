import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  UpdateSOAPNoteCommand,
  AddVitalSignCommand,
  AddDiagnosisCommand,
  CreatePrescriptionCommand,
  PrescriptionItemDto,
  ClinicalVisitsClient,
  ClinicalVisitDetailDto
} from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

type TabKey = 'soap' | 'vitals' | 'diagnoses' | 'prescriptions' | 'history';

@Component({
  selector: 'app-visit-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './visit-detail.component.html',
  styleUrls: ['./visit-detail.component.scss'],
  animations: [
    trigger('tabContent', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerList', [
      transition(':enter', [
        query('.list-item', [
          style({ opacity: 0, transform: 'translateX(-10px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class VisitDetailComponent implements OnInit {
  private readonly visitsClient = inject(ClinicalVisitsClient);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  visitId = '';
  visit = signal<ClinicalVisitDetailDto | null>(null);
  activeTab = signal<TabKey>('soap');
  isLoading = signal(true);
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);

  // Form States
  readonly soap = {
    subjective: signal(''),
    objective: signal(''),
    assessment: signal(''),
    plan: signal('')
  };

  private soapUpdate$ = new Subject<void>();

  readonly vital = signal({ type: 'BloodPressure', value: '', unit: 'mmHg' });
  readonly diagnosis = signal({ icdCode: '', description: '' });
  readonly newRx = signal({ medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' });
  
  showRxForm = signal(false);

  readonly tabs = [
    { key: 'soap' as TabKey, label: 'SOAP Notes', icon: 'file-text' },
    { key: 'vitals' as TabKey, label: 'Vitals', icon: 'activity' },
    { key: 'diagnoses' as TabKey, label: 'Diagnoses', icon: 'stethoscope' },
    { key: 'prescriptions' as TabKey, label: 'Prescriptions', icon: 'pill' },
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
    // Auto-save logic for SOAP notes
    this.soapUpdate$.pipe(
      debounceTime(2000),
      distinctUntilChanged()
    ).subscribe(() => this.saveSOAP());
  }

  async ngOnInit() {
    this.visitId = this.route.snapshot.paramMap.get('id')!;
    await this.loadVisit();
  }

  private async loadVisit() {
    try {
      const result = await firstValueFrom(this.visitsClient.clinicalVisitsGET(this.visitId));
      this.visit.set(result);
      
      // Initialize form signals
      this.soap.subjective.set(result.subjective || '');
      this.soap.objective.set(result.objective || '');
      this.soap.assessment.set(result.assessment || '');
      this.soap.plan.set(result.plan || '');

    } catch (err) {
      this.notifications.error('Failed to load visit details.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onSoapChange() {
    if (this.visit()?.status === 'Finalized') return;
    this.soapUpdate$.next();
  }

  async saveSOAP() {
    if (this.visit()?.status === 'Finalized') return;
    
    this.isSaving.set(true);
    try {
      const command = new UpdateSOAPNoteCommand({ 
        visitId: this.visitId, 
        subjectiveNote: this.soap.subjective(),
        objectiveNote: this.soap.objective(),
        assessmentNote: this.soap.assessment(),
        planNote: this.soap.plan()
      });
      await firstValueFrom(this.visitsClient.soap(this.visitId, command));
      this.lastSaved.set(new Date());
    } catch (err: any) {
      console.error('Auto-save failed:', err);
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

  async addDiagnosis() {
    const d = this.diagnosis();
    if (!d.icdCode || !d.description) return;

    try {
      const command = new AddDiagnosisCommand({ 
        visitId: this.visitId, 
        icD10Code: d.icdCode,
        codeDescription: d.description
      });
      await firstValueFrom(this.visitsClient.diagnoses(this.visitId, command));
      this.notifications.success('Diagnosis added.');
      this.diagnosis.set({ icdCode: '', description: '' });
      await this.loadVisit();
    } catch (err) {
      this.notifications.error('Failed to add diagnosis.');
    }
  }

  async addPrescription() {
    const rx = this.newRx();
    if (!rx.medicationName) return;

    try {
      const item = new PrescriptionItemDto({
        medicationName: rx.medicationName,
        dosage: rx.dosage,
        frequency: rx.frequency,
        duration: rx.duration,
        instructions: rx.instructions
      });
      
      const command = new CreatePrescriptionCommand({
        visitId: this.visitId,
        items: [item]
      });

      await firstValueFrom(this.visitsClient.prescriptions(this.visitId, command));
      this.notifications.success('Prescription added.');
      this.newRx.set({ medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' });
      this.showRxForm.set(false);
      await this.loadVisit();
    } catch (err) {
      this.notifications.error('Failed to add prescription.');
    }
  }

  async finalizeVisit() {
    if (this.visit()?.status === 'Finalized') return;
    
    // Quick validation
    if (!this.soap.assessment() || !this.soap.plan()) {
      this.notifications.warning('Assessment and Plan are required before finalizing.');
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

  updateDiagnosis(key: string, value: any) {
    this.diagnosis.update(d => ({ ...d, [key]: value }));
  }

  updateNewRx(key: string, value: any) {
    this.newRx.update(r => ({ ...r, [key]: value }));
  }
}
