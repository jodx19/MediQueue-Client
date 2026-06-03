import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  ClinicalVisitsClient,
  AddReferralCommand,
  MedicalSpecialty,
  ReferralUrgency,
} from '../../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../../core/services/api-error-handler.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-referrals-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EmptyStateComponent, LoadingSkeletonComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-white font-bold text-base flex items-center gap-2">
          <lucide-icon name="arrow-right-from-line" class="text-amber-400" [size]="18"/>
          Referrals
        </h3>
        @if (!readonly) {
          <button (click)="isAdding.set(!isAdding())"
                  class="btn-primary text-sm flex items-center gap-2 px-4 py-2">
            <lucide-icon name="plus" [size]="14"/>
            Add Referral
          </button>
        }
      </div>

      @if (isLoading()) {
        <app-loading-skeleton type="table" [count]="3"/>
      } @else if (items().length === 0 && !isAdding()) {
        <app-empty-state icon="arrow-right-from-line" title="No referrals"
                         description="No referrals have been made from this visit."/>
      } @else {
        @if (isAdding()) {
          <div class="mq-card-dark p-6 border-l-4 border-amber-500 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="mq-label">Specialty</label>
                <select [(ngModel)]="form.specialty" class="mq-input mq-select">
                  <option [value]="MS._1">Cardiology</option>
                  <option [value]="MS._2">Neurology</option>
                  <option [value]="MS._3">Orthopedics</option>
                  <option [value]="MS._4">Dermatology</option>
                  <option [value]="MS._5">Ophthalmology</option>
                  <option [value]="MS._6">ENT</option>
                  <option [value]="MS._7">Psychiatry</option>
                  <option [value]="MS._8">Oncology</option>
                  <option [value]="MS._9">Other</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="mq-label">Doctor Name</label>
                <input type="text" [(ngModel)]="form.doctorName" class="mq-input" placeholder="Optional"/>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="mq-label">Reason <span class="text-rose-400">*</span></label>
              <textarea [(ngModel)]="form.reason" class="mq-input" rows="2" placeholder="Reason for referral..."></textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="mq-label">Urgency</label>
                <select [(ngModel)]="form.urgency" class="mq-input mq-select">
                  <option [value]="RU._1">Routine</option>
                  <option [value]="RU._2">Urgent</option>
                  <option [value]="RU._3">Emergency</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="mq-label">Notes</label>
                <input type="text" [(ngModel)]="form.notes" class="mq-input" placeholder="Optional notes"/>
              </div>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button (click)="confirmAdd()" [disabled]="!form.reason.trim()"
                      class="btn-primary px-5 py-2.5 text-sm">Save</button>
              <button (click)="cancelAdd()" class="btn-ghost px-5 py-2.5 text-sm">Cancel</button>
            </div>
          </div>
        }

        <div class="space-y-3">
          @for (item of items(); track item.id) {
            <div class="flex items-center justify-between p-4 mq-card-dark border-l-2 border-amber-500/50 list-item">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  <span class="text-white font-medium text-sm">{{ item.referredToSpecialty }}</span>
                  <span [class]="statusBadge(item.status)">{{ item.status || 'Pending' }}</span>
                </div>
                <p class="text-mq-s400 text-xs mt-1">{{ item.reason }}</p>
                @if (item.urgency) {
                  <span class="text-mq-s500 text-[10px] mt-1 block">
                    Urgency: {{ item.urgency }} @if (item.notes) { — {{ item.notes }} }
                  </span>
                }
              </div>
              <div class="flex-shrink-0 ml-4">
                <button (click)="printReferral(item)"
                        class="btn-ghost text-xs px-3 py-1.5 text-mq-t400 hover:text-white">
                  Print Letter
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ReferralsTabComponent {
  @Input({ required: true }) visitId!: string;
  @Input() readonly = false;
  @Input() set visitData(v: any) { if (v) this.loadFromVisit(v); }

  readonly MS = MedicalSpecialty;
  readonly RU = ReferralUrgency;

  private readonly client = inject(ClinicalVisitsClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  private readonly notify = inject(NotificationService);

  items = signal<any[]>([]);
  isLoading = signal(false);
  isAdding = signal(false);

  form = { specialty: this.MS._1, doctorName: '', reason: '', urgency: this.RU._1, notes: '' };

  statusBadge(status: string): string {
    switch (status?.toLowerCase()) {
      case 'accepted':   return 'badge badge-success text-xs';
      case 'completed':  return 'badge badge-teal text-xs';
      case 'declined':   return 'badge badge-danger text-xs';
      default:           return 'badge badge-warning text-xs';
    }
  }

  loadFromVisit(visit: any) {
    this.items.set(visit?.referrals ?? []);
  }

  cancelAdd() {
    this.isAdding.set(false);
    this.form = { specialty: this.MS._1, doctorName: '', reason: '', urgency: this.RU._1, notes: '' };
  }

  async confirmAdd() {
    if (!this.form.reason.trim()) return;
    this.isLoading.set(true);
    try {
      const command = new AddReferralCommand({
        visitId: this.visitId,
        referredToSpecialty: this.form.specialty,
        reason: this.form.reason,
        urgency: this.form.urgency,
        notes: this.form.notes || undefined,
      });
      await firstValueFrom(this.client.referrals(this.visitId, command));
      this.notify.success('Referral added');
      this.cancelAdd();
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  printReferral(item: any) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Referral Letter</title>
      <style>
        body { font-family: serif; padding: 40px; max-width: 700px; margin: auto; line-height: 1.6; }
        h1 { font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 8px; }
        .letter-body { margin-top: 24px; }
        .letter-body p { margin: 8px 0; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>MediQueue Clinic — Referral Letter</h1>
      <div class="letter-body">
        <p><strong>Specialty:</strong> ${item.referredToSpecialty || 'N/A'}</p>
        <p><strong>Reason:</strong> ${item.reason || 'N/A'}</p>
        <p><strong>Urgency:</strong> ${item.urgency || 'Routine'}</p>
        ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
        ${item.id ? `<p style="margin-top:24px;font-size:12px;color:#666;">Referral ID: ${item.id}</p>` : ''}
      </div>
      <p style="margin-top:40px;font-size:12px;color:#666;border-top:1px solid #ccc;padding-top:8px;">
        Digitally signed by MediQueue EMR System
      </p>
      <script>window.print();window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  }
}
