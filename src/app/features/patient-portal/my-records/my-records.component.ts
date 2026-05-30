import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';
import { 
  ClinicalVisitsClient, 
  ClinicalVisitSummaryDto, 
  ClinicalVisitDetailDto 
} from '../../../core/api/mediqueue-api';

@Component({
  selector: 'app-my-records',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './my-records.component.html',
})
export class MyRecordsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly visitsClient = inject(ClinicalVisitsClient);

  isLoading = signal(true);
  visits = signal<ClinicalVisitSummaryDto[]>([]);

  // Detailed modal view
  selectedVisit = signal<ClinicalVisitDetailDto | null>(null);
  isLoadingDetail = signal(false);
  showDetailModal = signal(false);
  activeTab = signal<'summary' | 'vitals' | 'diagnoses' | 'prescriptions' | 'orders'>('summary');

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
        console.error('Failed to load clinical records:', err);
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
        console.error('Failed to load visit details:', err);
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
