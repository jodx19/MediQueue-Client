import { Component, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { AttachmentDto } from '../../../core/api/mediqueue-api';
import { AttachmentService, ATTACHMENT_CATEGORIES } from '../../../core/services/attachment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FileSizePipe } from '../../pipes/file-size.pipe';

@Component({
  selector: 'app-attachments-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FileSizePipe],
  template: `
    <div class="space-y-4">
      <!-- Filter chips -->
      <div class="flex flex-wrap gap-2">
        <button
          (click)="filter.set(null)"
          [class]="'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ' + (
            !filter() ? 'bg-mq-teal/15 text-mq-teal border-mq-teal/40' : 'bg-mq-800 text-mq-s400 border-mq-700'
          )"
        >
          All ({{ attachments().length }})
        </button>
        @for (cat of categories; track cat.value) {
          <button
            (click)="filter.set(cat.value)"
            [class]="'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ' + (
              filter() === cat.value ? 'bg-mq-teal/15 text-mq-teal border-mq-teal/40' : 'bg-mq-800 text-mq-s400 border-mq-700'
            )"
          >
            {{ cat.label }}
          </button>
        }
      </div>

      <!-- Grid -->
      @if (filtered().length === 0) {
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <lucide-icon name="file" class="text-mq-s400 mb-3" [size]="28"/>
          <p class="text-mq-s400 text-sm">No attachments found</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          @for (att of filtered(); track att.id) {
            <div class="bg-mq-800 border border-mq-700 rounded-xl p-4 hover:border-mq-600 transition-all group">
              <!-- Header -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-mq-teal/10 flex items-center justify-center flex-shrink-0">
                    <lucide-icon [name]="getIcon(att)" [size]="14" class="text-mq-teal"/>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm text-mq-text font-medium truncate">{{ att.fileName }}</p>
                    <p class="text-xs text-mq-s400">{{ att.fileSize | fileSize }}</p>
                  </div>
                </div>
                @if (showDelete()) {
                  @if (confirmingDeleteId() === att.id) {
                    <!-- Inline delete confirmation -->
                    <div class="flex items-center gap-1 flex-shrink-0">
                      <span class="text-xs text-rose-400">حذف؟</span>
                      <button
                        (click)="confirmDelete(att.id!)"
                        class="text-xs text-rose-400 hover:text-rose-300 font-semibold px-1"
                      >
                        نعم
                      </button>
                      <button
                        (click)="cancelDelete()"
                        class="text-xs text-mq-s400 hover:text-white px-1"
                      >
                        لا
                      </button>
                    </div>
                  } @else {
                    <button
                      (click)="requestDelete(att.id!)"
                      class="opacity-0 group-hover:opacity-100 transition-opacity text-mq-s400 hover:text-rose-400"
                    >
                      <lucide-icon name="trash-2" [size]="14"/>
                    </button>
                  }
                }
              </div>

              <!-- Meta -->
              <div class="flex items-center justify-between text-xs text-mq-s400">
                <span class="capitalize">{{ att.type || 'Other' }}</span>
                <span>{{ att.uploadedAt | date:'MMM d, y' }}</span>
              </div>

              @if (att.description) {
                <p class="text-xs text-mq-s400 mt-2 truncate">{{ att.description }}</p>
              }

              <!-- Actions -->
              <div class="flex items-center gap-2 mt-3 pt-3 border-t border-mq-700">
                <a
                  [href]="attachmentService.getFileUrl(att)"
                  target="_blank"
                  class="flex-1 text-center py-1.5 rounded-lg text-xs font-medium bg-mq-teal/10 text-mq-teal hover:bg-mq-teal/20 transition-all"
                >
                  <lucide-icon name="eye" [size]="12" class="mr-1"/>
                  Preview
                </a>
                <a
                  [href]="attachmentService.getFileUrl(att)"
                  download="{{ att.fileName }}"
                  class="flex-1 text-center py-1.5 rounded-lg text-xs font-medium bg-mq-700 text-mq-s300 hover:text-mq-text transition-all"
                >
                  <lucide-icon name="download" [size]="12" class="mr-1"/>
                  Download
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AttachmentsListComponent {
  protected readonly attachmentService = inject(AttachmentService);
  private readonly notification = inject(NotificationService);

  readonly attachments = input<AttachmentDto[]>([]);
  readonly showDelete = input(true);

  readonly deleted = output<string>();
  readonly categories = ATTACHMENT_CATEGORIES;
  readonly filter = signal<string | null>(null);
  readonly confirmingDeleteId = signal<string | null>(null);

  readonly filtered = computed(() => {
    const f = this.filter();
    if (!f) return this.attachments();
    return this.attachments().filter(a => a.type === f);
  });

  getIcon(att: AttachmentDto): string {
    const type = att.type ?? '';
    if (type.includes('Lab') || type === 'LabResult') return 'flask-conical';
    if (type.includes('Imaging') || type === 'ImagingReport') return 'image';
    if (type.includes('Prescription')) return 'pill';
    if (type.includes('Consent')) return 'file-signature';
    if (type.includes('Insurance')) return 'id-card';
    if (type.includes('National')) return 'passport';
    if (type.includes('Referral')) return 'arrow-right-from-line';
    return 'file';
  }

  requestDelete(attachmentId: string): void {
    this.confirmingDeleteId.set(attachmentId);
  }

  async confirmDelete(attachmentId: string): Promise<void> {
    try {
      await firstValueFrom(this.attachmentService.deleteAttachment(attachmentId));
      this.notification.success('Attachment deleted');
      this.deleted.emit(attachmentId);
      this.confirmingDeleteId.set(null);
    } catch {
      this.notification.error('Failed to delete attachment');
      this.confirmingDeleteId.set(null);
    }
  }

  cancelDelete(): void {
    this.confirmingDeleteId.set(null);
  }
}
