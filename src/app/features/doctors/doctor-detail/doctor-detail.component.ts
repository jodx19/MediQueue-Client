import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DoctorsClient, DoctorDto } from '../../../core/api/mediqueue-api';
import { firstValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { pageEnter } from '../../../shared/animations/page-animations';

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, PageHeaderComponent, LoadingSkeletonComponent],
  animations: [pageEnter],
  templateUrl: './doctor-detail.component.html',
})
export class DoctorDetailComponent implements OnInit {
  private readonly doctorsClient = inject(DoctorsClient);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  doctor = signal<DoctorDto | null>(null);
  isLoading = signal(true);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      const result = await firstValueFrom(this.doctorsClient.doctorsGET2(id));
      this.doctor.set(result);
    } finally {
      this.isLoading.set(false);
    }
  }
}
