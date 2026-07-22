import {
  Component, OnInit, AfterViewInit, inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import {
  DashboardClient, ClinicStatsDto, RevenueReportDto, DailyRevenueDto,
} from '../../core/api/mediqueue-api';
import { NotificationService } from '../../core/services/notification.service';
import { ExportService } from '../../core/services/export.service';

type ChartInstance = { destroy(): void };

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit, AfterViewInit {
  private readonly dashboardClient = inject(DashboardClient);
  private readonly notify  = inject(NotificationService);
  private readonly exporter = inject(ExportService);

  // ── State ──────────────────────────────────────────────────────────────
  dateFrom  = signal('');
  dateTo    = signal('');
  stats     = signal<ClinicStatsDto | null>(null);
  revenue   = signal<RevenueReportDto | null>(null);
  isLoading = signal(true);
  loadError = signal<string | null>(null);

  private revenueChart?: ChartInstance;
  private pendingChartBuild = false;

  // ── Lifecycle ──────────────────────────────────────────────────────────
  async ngOnInit() {
    // Default to current month so the first paint is meaningful.
    const now   = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    this.dateFrom.set(this.toDateInput(first));
    this.dateTo.set(this.toDateInput(now));
    await this.loadData();
  }

  ngAfterViewInit() {
    // If data arrived before the view was ready, kick off the chart now.
    if (this.pendingChartBuild) {
      this.pendingChartBuild = false;
      setTimeout(() => this.buildChart(), 0);
    }
  }

  // ── Data loading ───────────────────────────────────────────────────────
  async loadData() {
    if (!this.dateFrom() || !this.dateTo()) return;
    this.isLoading.set(true);
    this.loadError.set(null);
    try {
      const from = new Date(this.dateFrom());
      const to   = new Date(this.dateTo());
      // Inclusive end-of-day so the last day's revenue is captured.
      to.setHours(23, 59, 59, 999);

      const [stats, revenue] = await Promise.all([
        firstValueFrom(this.dashboardClient.stats()),
        firstValueFrom(this.dashboardClient.revenueReport(from, to)),
      ]);

      this.stats.set(stats);
      this.revenue.set(revenue);

      // Defer chart build so the canvas is in the DOM (template uses @if).
      setTimeout(() => this.buildChart(), 50);
    } catch (err: any) {
      const msg = err?.error?.detail
               ?? err?.error?.message
               ?? err?.message
               ?? 'Failed to load reports';
      this.loadError.set(msg);
      this.notify.error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Chart ──────────────────────────────────────────────────────────────
  private buildChart() {
    const canvas = document.getElementById('revenue-chart') as HTMLCanvasElement | null;
    if (!canvas || !this.revenue()) return;

    // Lazy-load Chart.js so the homepage bundle stays lean.
    import('chart.js/auto').then(({ default: Chart }) => {
      this.revenueChart?.destroy();

      const daily = this.revenue()?.dailyRevenue ?? [];
      const labels = daily.map(d => this.formatDate(d.date));
      const values = daily.map(d => d.amount ?? 0);

      this.revenueChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label:           'Revenue (EGP)',
            data:            values,
            backgroundColor: 'rgba(13,148,136,0.6)',
            borderColor:     '#0D9488',
            borderWidth:     1.5,
            borderRadius:    6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => `EGP ${Number(ctx.parsed.y ?? 0).toLocaleString()}`,
              },
            },
          },
          scales: {
            x: {
              grid:  { color: 'rgba(255,255,255,0.04)' },
              ticks: { color: '#94A3B8', font: { size: 11 } },
            },
            y: {
              grid:  { color: 'rgba(255,255,255,0.04)' },
              ticks: {
                color: '#94A3B8',
                callback: (v: any) => `EGP ${(+v / 1000).toFixed(0)}k`,
              },
            },
          },
        },
      } as any);
    }).catch(() => this.notify.error('Failed to render chart'));
  }

  // ── Export ─────────────────────────────────────────────────────────────
  async exportRevenue(format: 'excel' | 'pdf') {
    if (!this.revenue()) return;
    const daily = this.revenue()?.dailyRevenue ?? [];
    if (daily.length === 0) {
      this.notify.warning('No revenue data to export for this range');
      return;
    }

    const rows = daily.map(d => ({
      Date:    this.formatDate(d.date),
      Revenue: `EGP ${Number(d.amount ?? 0).toLocaleString()}`,
    }));

    try {
      if (format === 'excel') {
        await this.exporter.exportToExcel(rows, 'Revenue_Report');
      } else {
        await this.exporter.exportToPDF(
          ['Date', 'Revenue'],
          rows.map(r => [r.Date, r.Revenue]),
          'Revenue_Report',
          'Revenue Report',
        );
      }
      this.notify.success('Export ready!');
    } catch {
      this.notify.error('Export failed');
    }
  }

  // ── Computed summary ───────────────────────────────────────────────────
  readonly totalRevenue = computed(() => {
    const daily = this.revenue()?.dailyRevenue ?? [];
    return daily.reduce((sum, d) => sum + (d.amount ?? 0), 0);
  });

  readonly dailyAvg = computed(() => {
    const daily = this.revenue()?.dailyRevenue ?? [];
    return daily.length ? this.totalRevenue() / daily.length : 0;
  });

  readonly peakPeriod = computed(() => {
    const daily = this.revenue()?.dailyRevenue ?? [];
    if (!daily.length) return '—';
    let maxIdx = 0;
    let maxVal = -Infinity;
    daily.forEach((d, i) => {
      const v = d.amount ?? 0;
      if (v > maxVal) { maxVal = v; maxIdx = i; }
    });
    return this.formatDate(daily[maxIdx].date);
  });

  readonly totalPatients = computed(() => this.stats()?.totalPatients ?? 0);

  // ── Helpers ────────────────────────────────────────────────────────────
  private toDateInput(d: Date): string {
    // yyyy-MM-dd without timezone drift
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatDate(value: Date | string | undefined): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
