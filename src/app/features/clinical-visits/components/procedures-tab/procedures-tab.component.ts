import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  ClinicalVisitsClient,
  AddProcedureCommand,
} from '../../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../../core/services/api-error-handler.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-procedures-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EmptyStateComponent, LoadingSkeletonComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-white font-bold text-base flex items-center gap-2">
          <lucide-icon name="syringe" class="text-rose-400" [size]="18"/>
          Procedures
        </h3>
        @if (!readonly) {
          <button (click)="isAdding.set(!isAdding())"
                  class="btn-primary text-sm flex items-center gap-2 px-4 py-2">
            <lucide-icon name="plus" [size]="14"/>
            Add Procedure
          </button>
        }
      </div>

      @if (isLoading()) {
        <app-loading-skeleton type="table" [count]="3"/>
      } @else if (items().length === 0 && !isAdding()) {
        <app-empty-state icon="syringe" title="No procedures"
                         description="No procedures recorded for this visit."/>
      } @else {
        @if (isAdding()) {
          <div class="mq-card-dark p-6 border-l-4 border-rose-500 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="mq-label">Procedure Name <span class="text-rose-400">*</span></label>
                <input type="text" [(ngModel)]="form.name" class="mq-input" placeholder="e.g. Wound debridement"/>
              </div>
              <div class="space-y-1.5">
                <label class="mq-label">CPT Code</label>
                <input type="text" [(ngModel)]="form.cptCode" class="mq-input" placeholder="e.g. 11042"/>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="mq-label">Description</label>
                <textarea [(ngModel)]="form.description" class="mq-input" rows="2" placeholder="Procedure details..."></textarea>
              </div>
              <div class="space-y-1.5">
                <label class="mq-label">Duration (minutes)</label>
                <input type="number" [(ngModel)]="form.durationMinutes" class="mq-input" placeholder="30"/>
              </div>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button (click)="confirmAdd()" [disabled]="!form.name.trim()"
                      class="btn-primary px-5 py-2.5 text-sm">Save</button>
              <button (click)="cancelAdd()" class="btn-ghost px-5 py-2.5 text-sm">Cancel</button>
            </div>
          </div>
        }

        <div class="space-y-3">
          @for (item of items(); track item.id) {
            <div class="flex items-center justify-between p-4 mq-card-dark border-l-2 border-rose-500/50 list-item">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  @if (item.cptCode) {
                    <span class="font-mono text-rose-400 text-xs font-bold px-2 py-0.5 rounded bg-rose-500/10">{{ item.cptCode }}</span>
                  }
                  <span class="text-white font-medium text-sm">{{ item.description }}</span>
                </div>
                @if (item.fee) {
                  <span class="text-mq-s400 text-xs mt-1 block">Fee: EGP {{ item.fee }}</span>
                }
              </div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-4">
                <button (click)="addToInvoice.emit(item)"
                        class="btn-ghost text-xs px-3 py-1.5 text-mq-t400 hover:text-white">
                  Add to Invoice
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ProceduresTabComponent {
  @Input({ required: true }) visitId!: string;
  @Input() readonly = false;
  @Input() set visitData(v: any) { if (v) this.loadFromVisit(v); }
  @Output() addToInvoice = new EventEmitter<any>();

  private readonly client = inject(ClinicalVisitsClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);
  private readonly notify = inject(NotificationService);

  items = signal<any[]>([]);
  isLoading = signal(false);
  isAdding = signal(false);

  form = { name: '', cptCode: '', description: '', durationMinutes: 0 };

  loadFromVisit(visit: any) {
    this.items.set(visit?.procedures ?? []);
  }

  cancelAdd() {
    this.isAdding.set(false);
    this.form = { name: '', cptCode: '', description: '', durationMinutes: 0 };
  }

  async confirmAdd() {
    if (!this.form.name.trim()) return;
    this.isLoading.set(true);
    try {
      const command = new AddProcedureCommand({
        visitId: this.visitId,
        cptCode: this.form.cptCode || undefined,
        description: this.form.name + (this.form.description ? ': ' + this.form.description : ''),
        fee: 0,
      });
      await firstValueFrom(this.client.procedures(this.visitId, command));
      this.notify.success('Procedure added');
      this.cancelAdd();
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }
}
