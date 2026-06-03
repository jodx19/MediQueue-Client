import { Injectable, Inject, inject, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL, AttachmentDto } from '../api/mediqueue-api';
import { NotificationService } from './notification.service';

export type AttachmentCategory =
  | 'LabResult'
  | 'ImagingReport'
  | 'Prescription'
  | 'Referral'
  | 'Consent'
  | 'InsuranceCard'
  | 'NationalId'
  | 'Other';

export const ATTACHMENT_CATEGORIES: { value: AttachmentCategory; label: string; icon: string }[] = [
  { value: 'LabResult',      label: 'Lab Result',      icon: 'flask-conical' },
  { value: 'ImagingReport',  label: 'Imaging Report',  icon: 'image' },
  { value: 'Prescription',   label: 'Prescription',    icon: 'pill' },
  { value: 'Referral',       label: 'Referral',        icon: 'arrow-right-from-line' },
  { value: 'Consent',        label: 'Consent Form',    icon: 'file-signature' },
  { value: 'InsuranceCard',  label: 'Insurance Card',  icon: 'id-card' },
  { value: 'NationalId',     label: 'National ID',     icon: 'passport' },
  { value: 'Other',          label: 'Other',           icon: 'file' },
];

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadProgress {
  fileName: string;
  progress: number;
  state: 'pending' | 'uploading' | 'done' | 'error';
  attachmentId?: string;
  errorMessage?: string;
}

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private readonly http = inject(HttpClient);
  private readonly notification = inject(NotificationService);
  private baseUrl = '';

  constructor(@Inject(API_BASE_URL) baseUrl?: string) {
    this.baseUrl = baseUrl ?? '';
  }

  validateFile(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not supported. Allowed: JPEG, PNG, WebP, PDF`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds the 10 MB limit`;
    }
    return null;
  }

  /** Alias for validateFile() — returns null on valid, error string on invalid. */
  validate(file: File): string | null {
    return this.validateFile(file);
  }

  upload(
    file: File,
    patientId: string,
    category?: AttachmentCategory,
    clinicalVisitId?: string,
    description?: string,
  ): Observable<HttpEvent<string>> {
    const formData = new FormData();
    formData.append('File', file, file.name);

    let url = `${this.baseUrl}/api/Attachments/upload?PatientId=${encodeURIComponent(patientId)}`;
    if (category) url += `&Type=${encodeURIComponent(category)}`;
    if (clinicalVisitId) url += `&ClinicalVisitId=${encodeURIComponent(clinicalVisitId)}`;
    if (description) url += `&Description=${encodeURIComponent(description)}`;

    return this.http.post(url, formData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'text',
    });
  }

  uploadWithProgress(
    file: File,
    patientId: string,
    category?: AttachmentCategory,
    clinicalVisitId?: string,
    description?: string,
  ): Observable<UploadProgress> {
    const fileName = file.name;
    return this.upload(file, patientId, category, clinicalVisitId, description).pipe(
      map((event: HttpEvent<string>): UploadProgress => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            return {
              fileName,
              progress: event.total ? Math.round((100 * event.loaded) / event.total) : 0,
              state: 'uploading',
            };
          case HttpEventType.Response:
            return {
              fileName,
              progress: 100,
              state: 'done',
              attachmentId: event.body ?? undefined,
            };
          default:
            return { fileName, progress: 0, state: 'pending' };
        }
      }),
    );
  }

  deleteAttachment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/Attachments/${id}`);
  }

  getFileUrl(attachment: AttachmentDto): string {
    return attachment.fileUrl ?? `${this.baseUrl}/api/Attachments/${attachment.id}/file`;
  }

  canPreview(contentType: string | undefined): boolean {
    if (!contentType) return false;
    return ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(contentType);
  }
}
