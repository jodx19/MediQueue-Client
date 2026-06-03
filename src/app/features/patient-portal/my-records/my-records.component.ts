import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';
import { 
  ClinicalVisitsClient, 
  ClinicalVisitSummaryDto, 
  ClinicalVisitDetailDto 
} from '../../../core/api/mediqueue-api';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { AttachmentsListComponent } from '../../../shared/components/attachments-list/attachments-list.component';

@Component({
  selector: 'app-my-records',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FileUploadComponent, AttachmentsListComponent],
  templateUrl: './my-records.component.html',
})
export class MyRecordsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly visitsClient = inject(ClinicalVisitsClient);
  private readonly apiErrorHandler = inject(ApiErrorHandlerService);

  isLoading = signal(true);
  visits = signal<ClinicalVisitSummaryDto[]>([]);

  // Detailed modal view
  selectedVisit = signal<ClinicalVisitDetailDto | null>(null);
  isLoadingDetail = signal(false);
  showDetailModal = signal(false);
  activeTab = signal<'summary' | 'vitals' | 'diagnoses' | 'prescriptions' | 'orders' | 'attachments'>('summary');

  ngOnInit() {
    this.loadRecords();
  }

  loadRecords() {
    const patientId = this.auth.currentUser()?.patientId;
    if (!patientId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.visitsClient.patient2(patientId, 1, 100).subscribe({
      next: (res: any) => {
        if (res && res.items) {
          this.visits.set(res.items);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.apiErrorHandler.handle(err);
        this.isLoading.set(false);
      }
    });
  }

  viewDetails(visitId: string) {
    this.isLoadingDetail.set(true);
    this.showDetailModal.set(true);
    this.activeTab.set('summary');

    this.visitsClient.clinicalVisitsGET(visitId).subscribe({
      next: (res: any) => {
        if (res) {
          this.selectedVisit.set(res);
        }
        this.isLoadingDetail.set(false);
      },
      error: (err: any) => {
        this.apiErrorHandler.handle(err);
        this.isLoadingDetail.set(false);
        this.showDetailModal.set(false);
      }
    });
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedVisit.set(null);
  }
}
