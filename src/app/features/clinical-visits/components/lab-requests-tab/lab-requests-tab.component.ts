import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  ClinicalVisitsClient,
  AddLabRequestCommand,
} from '../../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../../core/services/api-error-handler.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-lab-requests-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EmptyStateComponent, LoadingSkeletonComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-white font-bold text-base flex items-center gap-2">
          <lucide-icon name="flask-conical" class="text-cyan-400" [size]="18"/>
          Lab Requests
        </h3>
        @if (!readonly) {
          <button (click)="isAdding.set(!isAdding())"
                  class="btn-primary text-sm flex items-center gap-2 px-4 py-2">
            <lucide-icon name="plus" [size]="14"/>
            Request Lab Test
          </button>
        }
      </div>

      @if (isLoading()) {
        <app-loading-skeleton type="table" [count]="3"/>
      } @else if (items().length === 0 && !isAdding()) {
        <app-empty-state icon="flask-conical" title="No lab requests"
                         description="No laboratory tests have been ordered for this visit."/>
      } @else {
        @if (isAdding()) {
          <div class="mq-card-dark p-6 border-l-4 border-cyan-500 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="mq-label">Test Name <span class="text-rose-400">*</span></label>
                <input type="text" [(ngModel)]="form.testName" class="mq-input" placeholder="e.g. Complete Blood Count"/>
              </div>
              <div class="space-y-1.5">
                <label class="mq-label">Urgency</label>
                <select [(ngModel)]="form.urgency" class="mq-input mq-select">
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="STAT">STAT</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="mq-label">Instructions / Notes</label>
                <textarea [(ngModel)]="form.instructions" class="mq-input" rows="2" placeholder="Lab instructions..."></textarea>
              </div>
              <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 text-sm text-mq-s400 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="form.fastingRequired"
                         class="w-4 h-4 rounded bg-mq-navy border-mq-700 text-mq-teal focus:ring-0"/>
                  Fasting required
                </label>
              </div>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button (click)="confirmAdd()" [disabled]="!form.testName.trim()"
                      class="btn-primary px-5 py-2.5 text-sm">Save</button>
              <button (click)="cancelAdd()" class="btn-ghost px-5 py-2.5 text-sm">Cancel</button>
            </div>
          </div>
        }

        <div class="space-y-3">
          @for (item of items(); track item.id) {
            <div class="flex items-center justify-between p-4 mq-card-dark border-l-2 border-cyan-500/50 list-item">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  <span class="text-white font-medium text-sm">{{ item.testName }}</span>
                  <span [class]="statusBadge(item.status)">{{ item.status }}</span>
                </div>
                @if (item.instructions) {
                  <p class="text-mq-s400 text-xs mt-1">{{ item.instructions }}</p>
                }
                <span class="text-mq-s500 text-[10px] mt-1 block">
                  Requested: {{ item.requestedAt | date:'MMM d, y, h:mm a' }}
                </span>
              </div>
              @if (!readonly && item.status !== 'Completed' && item.status !== 'Cancelled') {
                <button (click)="markComplete(item)"
                        class="btn-ghost text-xs px-3 py-1.5 text-mq-t400 hover:text-white">
                  Mark Complete
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class LabRequestsTabComponent {
  @Input({ required: true }) visitId!: string;
  @Input() readonly = false;
  @Input() set visitData(v: any) { if (v) this.loadFromVisit(v); }

  private readonly client = inject(ClinicalVisitsClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  private readonly notify = inject(NotificationService);

  items = signal<any[]>([]);
  isLoading = signal(false);
  isAdding = signal(false);

  form = { testName: '', urgency: 'Routine', instructions: '', fastingRequired: false };

  statusBadge(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'badge badge-success text-xs';
      case 'cancelled': return 'badge badge-gray text-xs';
      default: return 'badge badge-warning text-xs';
    }
  }

  loadFromVisit(visit: any) {
    this.items.set(visit?.labRequests ?? []);
  }

  cancelAdd() {
    this.isAdding.set(false);
    this.form = { testName: '', urgency: 'Routine', instructions: '', fastingRequired: false };
  }

  async confirmAdd() {
    if (!this.form.testName.trim()) return;
    this.isLoading.set(true);
    try {
      const command = new AddLabRequestCommand({
        visitId: this.visitId,
        testName: this.form.testName,
        instructions: this.form.instructions || undefined,
      });
      await firstValueFrom(this.client.labRequests(this.visitId, command));
      this.notify.success('Lab request added');
      this.cancelAdd();
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  markComplete(item: any) {
    /** TODO: call lab-request update endpoint when available */
    this.notify.info('Lab complete status update — endpoint pending');
  }
}
