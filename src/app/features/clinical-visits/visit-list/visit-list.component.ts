import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClinicalVisitsClient, ClinicalVisitSummaryDto } from '../../../core/api/mediqueue-api';
import { firstValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { pageEnter } from '../../../shared/animations/page-animations';

@Component({
  selector: 'app-visit-list',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, LoadingSkeletonComponent, BadgeComponent, EmptyStateComponent],
  animations: [pageEnter],
  template: `
    <app-page-header title="Clinical Visits" subtitle="My patient visits" [hasActions]="false" />

    @if (isLoading()) {
      <app-loading-skeleton [count]="4" />
    } @else if (visits().length === 0) {
      <app-empty-state title="No visits assigned" message="Visits are created when appointments are started." />
    } @else {
      <div class="visits-list" @pageEnter>
        @for (visit of visits(); track visit.id) {
          <div class="visit-card" (click)="open(visit.id!)">
            <div class="visit-card__date">
              <span class="day">{{ visit.startedAt | date:'d' }}</span>
              <span class="month">{{ visit.startedAt | date:'MMM' }}</span>
            </div>
            <div class="visit-card__info">
              <div class="visit-patient">{{ visit.patientName }}</div>
              <div class="visit-reason">{{ visit.chiefComplaint ?? 'General Consultation' }}</div>
            </div>
            <app-badge [label]="visit.status ?? 'InProgress'" [variant]="statusVariant(visit.status)" />
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .visits-list { display: flex; flex-direction: column; gap: 12px; }
    .visit-card {
      display: flex; align-items: center; gap: 20px;
      background: #1E293B; border: 1px solid rgba(148,163,184,0.12);
      border-radius: 14px; padding: 16px 20px;
      cursor: pointer; transition: all 150ms; box-shadow: 0 1px 3px rgba(0,0,0,0.30);
    }
    .visit-card:hover { border-color: #0D9488; box-shadow: 0 4px 16px rgba(0,0,0,0.30); }
    .visit-card__date {
      display: flex; flex-direction: column; align-items: center;
      width: 44px; padding: 8px; background: rgba(13,148,136,0.15);
      border-radius: 10px; flex-shrink: 0;
    }
    .day { font-size: 24px; font-weight: 700; color: #0D9488; line-height: 1; }
    .month { font-size: 11px; color: #0D9488; font-weight: 600; text-transform: uppercase; }
    .visit-card__info { flex: 1; }
    .visit-patient { font-weight: 600; font-size: 15px; color: #F1F5F9; }
    .visit-reason { font-size: 13px; color: #94A3B8; margin-top: 2px; }
  `],
})
export class VisitListComponent implements OnInit {
  private readonly visitsClient = inject(ClinicalVisitsClient);
  readonly router = inject(Router);

  visits = signal<ClinicalVisitSummaryDto[]>([]);
  isLoading = signal(true);

  async ngOnInit() {
    try {
      const result = await firstValueFrom(this.visitsClient.clinicalVisitsPOST());
      this.visits.set((result as any).items ?? result ?? []);
    } finally {
      this.isLoading.set(false);
    }
  }

  open(id: string) { this.router.navigate(['/clinical-visits', id]); }

  statusVariant(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'default' {
    const map: Record<string, any> = {
      'Finalized': 'success', 'InProgress': 'info', 'Cancelled': 'danger',
    };
    return map[status ?? ''] ?? 'default';
  }
}
