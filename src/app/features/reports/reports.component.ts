import { Component, inject, signal, computed, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { DashboardClient } from '../../core/api/api-facade.service';
import { ExportService } from '../../core/services/export.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 bg-mq-navy min-h-screen" [@pageEnter]>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-black text-white">Reports & Analytics</h1>
          <p class="text-mq-s400 text-sm mt-1">Business intelligence for your clinic</p>
        </div>
      </div>
      <div class="glass p-4 flex flex-wrap items-center gap-4 mb-6 rounded-2xl border border-mq-700/50">
        <lucide-icon name="calendar" class="text-mq-s400" [size]="18"/>
        <div>
          <label class="text-xs text-mq-s400 block mb-1">From</label>
          <input type="date" [(ngModel)]="dateFrom" (change)="loadData()"
                 class="bg-mq-800 border border-mq-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-mq-teal-400"/>
        </div>
        <div>
          <label class="text-xs text-mq-s400 block mb-1">To</label>
          <input type="date" [(ngModel)]="dateTo" (change)="loadData()"
                 class="bg-mq-800 border border-mq-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-mq-teal-400"/>
        </div>
        <div class="ml-auto flex gap-2">
          <button (click)="exportRevenue('excel')"
                  class="flex items-center gap-2 px-4 py-2 text-xs rounded-xl border border-mq-700 text-mq-s400 hover:text-white hover:bg-white/5 transition-all">
            <lucide-icon name="table" [size]="14"/>
            Export Excel
          </button>
          <button (click)="exportRevenue('pdf')"
                  class="flex items-center gap-2 px-4 py-2 text-xs rounded-xl bg-mq-teal text-white hover:bg-mq-teal/90 transition-all">
            <lucide-icon name="download" [size]="14"/>
            Export PDF
          </button>
        </div>
      </div>
      @if (isLoading()) {
        <div class="h-72 skeleton rounded-2xl"></div>
      } @else {
        <div class="mq-card-dark p-6 mb-6 rounded-2xl border border-mq-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-white font-semibold">Revenue Trend</h3>
            <span class="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
              Total: EGP {{ totalRevenue() | number:'1.0-0' }}
            </span>
          </div>
          <div class="h-64">
            <canvas id="report-chart"></canvas>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="mq-card-dark p-5 rounded-2xl border border-mq-700">
            <p class="text-mq-s400 text-xs uppercase tracking-wider mb-2">Total Revenue</p>
            <p class="text-3xl font-black text-emerald-400">EGP {{ totalRevenue() | number:'1.0-0' }}</p>
          </div>
          <div class="mq-card-dark p-5 rounded-2xl border border-mq-700">
            <p class="text-mq-s400 text-xs uppercase tracking-wider mb-2">Peak Period</p>
            <p class="text-xl font-bold text-white">{{ peakPeriod() }}</p>
          </div>
          <div class="mq-card-dark p-5 rounded-2xl border border-mq-700">
            <p class="text-mq-s400 text-xs uppercase tracking-wider mb-2">Daily Average</p>
            <p class="text-3xl font-black text-mq-teal-400">EGP {{ dailyAverage() | number:'1.0-0' }}</p>
          </div>
        </div>
      }
    </div>
  `,
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('500ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class ReportsComponent implements OnInit, AfterViewInit {
  private readonly dashClient = inject(DashboardClient);
  private readonly exporter   = inject(ExportService);
  private readonly notify     = inject(NotificationService);

  dateFrom     = signal('');
  dateTo       = signal('');
  revenueData  = signal<any>(null);
  isLoading    = signal(true);

  private revenueChart?: any;

  readonly totalRevenue = computed(() => {
    const vals = this.revenueData()?.values ?? [];
    return vals.reduce((a: number, b: number) => a + b, 0);
  });

  readonly peakPeriod = computed(() => {
    const data = this.revenueData();
    if (!data?.labels?.length) return 'N/A';
    const vals = data.values as number[];
    const maxIdx = vals.indexOf(Math.max(...vals));
    return data.labels[maxIdx] ?? 'N/A';
  });

  readonly dailyAverage = computed(() => {
    const total = this.totalRevenue();
    if (!this.dateFrom() || !this.dateTo()) return total;
    const days = Math.max(1, Math.ceil((new Date(this.dateTo()).getTime() - new Date(this.dateFrom()).getTime()) / 86400000));
    return Math.round(total / days);
  });

  async ngOnInit() {
    const today = new Date();
    const month = new Date(today.getFullYear(), today.getMonth(), 1);
    this.dateTo.set(today.toISOString().split('T')[0]);
    this.dateFrom.set(month.toISOString().split('T')[0]);
    await this.loadData();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initChart(), 200);
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const r = await this.dashClient.revenueReport(new Date(this.dateFrom()), new Date(this.dateTo()));
      this.revenueData.set(r);
      setTimeout(() => this.initChart(), 100);
    } catch (err: any) {
      this.notify.error(err?.error?.detail ?? 'Failed to load report');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async initChart() {
    const ctx = document.getElementById('report-chart') as HTMLCanvasElement;
    if (!ctx || !this.revenueData()) return;

    try {
      const { default: Chart } = await import('chart.js/auto');
      this.revenueChart?.destroy();
      this.revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.revenueData()?.labels ?? [],
          datasets: [{
            label: 'Revenue (EGP)',
            data:  this.revenueData()?.values ?? [],
            backgroundColor: 'rgba(13,148,136,0.6)',
            borderColor: '#0D9488',
            borderWidth: 1.5,
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => `EGP ${(+ctx.parsed.y).toLocaleString()}`,
              },
            },
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94A3B8' } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94A3B8', callback: (v: any) => `${(+v / 1000).toFixed(0)}k` } },
          },
        },
      });
    } catch {}
  }

  async exportRevenue(format: 'excel' | 'pdf') {
    const data = this.revenueData();
    if (!data) return;

    const rows = (data.labels ?? []).map((label: string, i: number) => ({
      Period: label,
      Revenue: `EGP ${data.values?.[i]?.toLocaleString() ?? 0}`,
    }));

    try {
      if (format === 'excel') {
        await this.exporter.exportToExcel(rows, 'Revenue_Report', 'Revenue');
      } else {
        await this.exporter.exportToPDF(
          ['Period', 'Revenue (EGP)'],
          (data.labels ?? []).map((l: string, i: number) => [l, `EGP ${data.values?.[i]?.toLocaleString() ?? 0}`]),
          'Revenue_Report',
          `Revenue Report — ${this.dateFrom()} to ${this.dateTo()}`
        );
      }
      this.notify.success('Export ready!');
    } catch (err: any) {
      this.notify.error('Export failed');
    }
  }
}
