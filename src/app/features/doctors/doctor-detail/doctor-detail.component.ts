import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  DoctorsClient, DoctorDto, WorkingShiftDto,
  AddWorkingShiftCommand, DayOfWeek,
} from '../../../core/api/mediqueue-api';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { pageEnter } from '../../../shared/animations/page-animations';

type Tab = 'profile' | 'schedule';

// Friendly mapping between DayOfWeek enum values and labels.
// The API exposes DayOfWeek as _0.._6 (Sunday-Saturday) to mirror .NET's
// System.DayOfWeek — keep this table as the single source of truth.
const DAY_LABELS: ReadonlyArray<{ value: DayOfWeek; label: string }> = [
  { value: DayOfWeek._0, label: 'Sunday'    },
  { value: DayOfWeek._1, label: 'Monday'    },
  { value: DayOfWeek._2, label: 'Tuesday'   },
  { value: DayOfWeek._3, label: 'Wednesday' },
  { value: DayOfWeek._4, label: 'Thursday'  },
  { value: DayOfWeek._5, label: 'Friday'    },
  { value: DayOfWeek._6, label: 'Saturday'  },
];

function dayLabel(value: DayOfWeek | undefined): string {
  if (value === undefined || value === null) return '—';
  return DAY_LABELS.find(d => d.value === value)?.label ?? String(value);
}

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LucideAngularModule,
    LoadingSkeletonComponent,
  ],
  animations: [pageEnter],
  templateUrl: './doctor-detail.component.html',
})
export class DoctorDetailComponent implements OnInit {
  private readonly doctorsClient = inject(DoctorsClient);
  private readonly notify         = inject(NotificationService);
  private readonly route         = inject(ActivatedRoute);
  public  readonly router        = inject(Router);

  // ── Doctor state ─────────────────────────────────────────────────────
  doctor    = signal<DoctorDto | null>(null);
  isLoading = signal(true);
  activeTab = signal<Tab>('profile');
  doctorId  = '';

  // ── Schedule state ───────────────────────────────────────────────────
  // NB: the API exposes per-day availability via availability(id, date) and
  // per-day add/delete via shiftsPOST / shiftsDELETE. There is no GET that
  // returns the entire schedule across all days, so we maintain a local
  // dictionary keyed by DayOfWeek that we hydrate by polling availability()
  // for the next 7 days. This gives the operators a believable weekly view
  // while staying within the existing endpoint surface.
  shiftsByDay        = signal<Partial<Record<DayOfWeek, WorkingShiftDto>>>({});
  isShiftsLoading    = signal(false);
  isSubmitting        = signal(false);
  showAddShift        = signal(false);
  deleteTarget        = signal<DayOfWeek | null>(null);
  readonly dayLabels  = DAY_LABELS;

  // ── Add-shift form ────────────────────────────────────────────────────
  newShift = {
    dayOfWeek: DayOfWeek._1, // Monday by default
    startTime: '08:00',
    endTime:   '16:00',
    slotDurationMinutes: 30,
  };

  async ngOnInit() {
    this.doctorId = this.route.snapshot.paramMap.get('id')!;
    try {
      const result = await firstValueFrom(this.doctorsClient.doctorsGET2(this.doctorId));
      this.doctor.set(result);
      // Hydrate schedule in the background — don't block first paint.
      void this.loadShifts();
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Schedule hydration ───────────────────────────────────────────────
  // Walks the next 7 calendar days, calling availability() for each and
  // collapsing the result onto a DayOfWeek keyed map. Doesn't run on the
  // critical render path; failure of any single day degrades to "no shift
  // for that day" without aborting the rest.
  async loadShifts() {
    if (!this.doctorId) return;
    this.isShiftsLoading.set(true);
    try {
      const map: Partial<Record<DayOfWeek, WorkingShiftDto>> = {};
      const today = new Date();
      // Apply each promise independently so one slow/failed day does not
      // reject the whole batch.
      await Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          return firstValueFrom(this.doctorsClient.availability(this.doctorId, d))
            .then(av => {
              if (av?.workingShift) {
                map[av.workingShift.dayOfWeek ?? (d.getDay() as DayOfWeek)] = av.workingShift;
              }
            })
            .catch(() => { /* silent per-day degrade */ });
        }),
      );
      this.shiftsByDay.set(map);
    } finally {
      this.isShiftsLoading.set(false);
    }
  }

  // ── Add / delete shifts ──────────────────────────────────────────────
  async addShift() {
    if (!this.doctorId) return;
    this.isSubmitting.set(true);
    try {
      await firstValueFrom(this.doctorsClient.shiftsPOST(
        this.doctorId,
        new AddWorkingShiftCommand({
          dayOfWeek:          this.newShift.dayOfWeek,
          startTime:          this.newShift.startTime,
          endTime:            this.newShift.endTime,
          slotDurationMinutes: this.newShift.slotDurationMinutes,
        }),
      ));
      this.notify.success('Shift added successfully');
      this.showAddShift.set(false);
      await this.loadShifts();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to add shift');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  confirmDelete(day: DayOfWeek) {
    this.deleteTarget.set(day);
  }

  cancelDelete() {
    this.deleteTarget.set(null);
  }

  async deleteShift() {
    const day = this.deleteTarget();
    if (!day || !this.doctorId) return;
    this.isSubmitting.set(true);
    try {
      await firstValueFrom(this.doctorsClient.shiftsDELETE(this.doctorId, day));
      this.notify.success('Shift removed');
      this.deleteTarget.set(null);
      await this.loadShifts();
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to remove shift');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // ── View helpers ─────────────────────────────────────────────────────
  dayLabel = dayLabel;

  // Sorted list of days so the grid renders Sun→Sat regardless of the map
  // insertion order (matters because availability() can hydrate in any order).
  readonly sortedDays = computed<DayOfWeek[]>(() =>
    this.dayLabels.map(d => d.value),
  );

  // Whether ANY day has a shift — computed so the empty-state branch in the
  // template can decide without an inline arrow (Angular templates forbid
  // arrow functions in bindings).
  readonly hasAnyShift = computed(() =>
    this.sortedDays().some(d => !!this.shiftsByDay()[d]),
  );
}
