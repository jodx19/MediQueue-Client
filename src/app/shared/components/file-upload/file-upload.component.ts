import { Component, inject, input, output, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { from, EMPTY, Subscription, concatMap, tap, catchError } from 'rxjs';
import {
  AttachmentService,
  ATTACHMENT_CATEGORIES,
  UploadProgress,
} from '../../../core/services/attachment.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="space-y-4">
      @if (allowCategoryChange()) {
        <div>
          <label class="mq-label">Category</label>
          <div class="flex flex-wrap gap-2 mt-1.5">
            @for (cat of categories; track cat.value) {
              <button
                type="button"
                (click)="selectedCategory.set(cat.value)"
                [class]="'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ' + (
                  selectedCategory() === cat.value
                    ? 'bg-mq-teal/15 text-mq-teal border-mq-teal/40'
                    : 'bg-mq-800 text-mq-s400 border-mq-700 hover:border-mq-600'
                )"
              >
                <lucide-icon [name]="cat.icon" [size]="12" class="mr-1"/>
                {{ CATEGORY_LABELS[cat.value] }}
              </button>
            }
          </div>
        </div>
      }

      <div
        class="relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer"
        [class]="isDragOver() ? 'border-mq-teal bg-mq-teal/5' : 'border-mq-700 hover:border-mq-600 bg-mq-800/50'"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave()"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        <input
          #fileInput
          type="file"
          class="hidden"
          [accept]="allowedMime"
          (change)="onFilesSelected($event)"
          [multiple]="multiple()"
        />
        <lucide-icon name="upload" [size]="32" class="text-mq-s400 mb-3"/>
        <p class="text-mq-text text-sm font-medium">Drop files here or click to browse</p>
        <p class="text-mq-s400 text-xs mt-1">JPEG, PNG, WebP, PDF — Max 10 MB each</p>
      </div>

      @for (item of queue(); track item.file.name) {
        <div class="bg-mq-800 rounded-xl border border-mq-700 p-4 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <lucide-icon
                [name]="item.state === 'done' ? 'check-circle' : item.state === 'error' ? 'x-circle' : 'file'"
                [class]="item.state === 'done' ? 'text-emerald-400' : item.state === 'error' ? 'text-rose-400' : 'text-mq-s400'"
                [size]="16"
              />
              <span class="text-sm text-mq-text truncate">{{ item.file.name }}</span>
            </div>
            @if (item.state === 'error') {
              <button (click)="retry(item.file)" class="text-xs text-mq-teal hover:underline">Retry</button>
            }
          </div>
          @if (item.state === 'uploading') {
            <div class="w-full h-1.5 bg-mq-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-mq-teal rounded-full transition-all duration-300"
                [style.width.%]="item.progress"
              ></div>
            </div>
          }
          @if (item.errorMessage) {
            <p class="text-xs text-rose-400">{{ item.errorMessage }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class FileUploadComponent implements OnDestroy {
  private readonly attachmentService = inject(AttachmentService);
  private readonly notification = inject(NotificationService);
  private uploadSubs: Subscription[] = [];

  readonly patientId = input.required<string>();
  readonly clinicalVisitId = input<string>();
  readonly allowCategoryChange = input(true);
  readonly multiple = input(true);

  readonly uploaded = output<UploadProgress>();
  readonly completed = output<void>();

  readonly categories = ATTACHMENT_CATEGORIES;
  readonly allowedMime = 'image/jpeg,image/png,image/webp,application/pdf';
  readonly selectedCategory = signal('LabResult');
  readonly queue = signal<ItemState[]>([]);
  readonly isDragOver = signal(false);

  readonly CATEGORY_LABELS: Record<string, string> = {
    LabResult:     'نتيجة تحليل',
    ImagingReport: 'تقرير أشعة',
    Prescription:  'روشتة',
    Referral:      'خطاب إحالة',
    Consent:       'موافقة علاج',
    InsuranceCard: 'بطاقة تأمين',
    NationalId:    'بطاقة هوية',
    Other:         'أخرى',
  };

  ngOnDestroy() {
    this.uploadSubs.forEach(s => s.unsubscribe());
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave() {
    this.isDragOver.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragOver.set(false);
    const files = e.dataTransfer?.files;
    if (files) this.processFiles(Array.from(files));
  }

  onFilesSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) this.processFiles(Array.from(input.files));
    input.value = '';
  }

  private processFiles(files: File[]) {
    const validFiles: File[] = [];

    for (const file of files) {
      const error = this.attachmentService.validateFile(file);
      this.queue.update(q => [
        ...q,
        { file, state: error ? 'error' : 'pending', progress: 0, errorMessage: error ?? undefined },
      ]);
      if (!error) validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const sub = from(validFiles).pipe(
      concatMap(file => {
        this.queue.update(q =>
          q.map(i => i.file.name === file.name ? { ...i, state: 'uploading' as const, progress: 0 } : i)
        );
        return this.attachmentService.uploadWithProgress(
          file,
          this.patientId(),
          this.selectedCategory() as any,
          this.clinicalVisitId(),
        ).pipe(
          tap((p: UploadProgress) => {
            this.queue.update(q =>
              q.map(i =>
                i.file.name === p.fileName
                  ? { ...i, progress: p.progress, state: p.state, errorMessage: p.errorMessage, attachmentId: p.attachmentId }
                  : i
              )
            );
            if (p.state === 'done') this.uploaded.emit(p);
          }),
          catchError(() => {
            this.queue.update(q =>
              q.map(i =>
                i.file.name === file.name
                  ? { ...i, state: 'error' as const, errorMessage: 'Upload failed' }
                  : i
              )
            );
            return EMPTY;
          }),
        );
      }),
    ).subscribe({
      complete: () => {
        const allDone = this.queue().every(i => i.state === 'done' || i.state === 'error');
        if (allDone) this.completed.emit();
      },
    });

    this.uploadSubs.push(sub);
  }

  retry(file: File) {
    this.queue.update(q =>
      q.map(i =>
        i.file.name === file.name
          ? { ...i, state: 'pending', progress: 0, errorMessage: undefined }
          : i
      )
    );
    this.processFiles([file]);
  }
}

interface ItemState {
  file: File;
  state: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  errorMessage?: string;
  attachmentId?: string;
}
