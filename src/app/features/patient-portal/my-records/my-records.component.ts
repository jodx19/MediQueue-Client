import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ClipboardList, FileText, Download } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-my-records',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('500ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="space-y-6" [@pageEnter]>
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-black text-white">Medical Records</h1>
      </div>

      <div class="glass p-12 text-center">
        <lucide-icon name="clipboard-list" class="text-mq-s400 mx-auto mb-4" [size]="48"/>
        <h3 class="text-white font-semibold text-lg mb-2">No medical records yet</h3>
        <p class="text-mq-s400 text-sm max-w-md mx-auto">
          Your medical history, visit summaries, and prescriptions will appear here after your first appointment.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="mq-card-dark p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-mq-teal/10 flex items-center justify-center">
            <lucide-icon name="file-text" class="text-mq-teal-400" [size]="24"/>
          </div>
          <div>
            <h4 class="text-white font-semibold text-sm">Download Summary</h4>
            <p class="text-mq-s400 text-xs">Complete medical history PDF</p>
          </div>
        </div>
        <div class="mq-card-dark p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <lucide-icon name="download" class="text-purple-400" [size]="24"/>
          </div>
          <div>
            <h4 class="text-white font-semibold text-sm">Lab Reports</h4>
            <p class="text-mq-s400 text-xs">Download lab results</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MyRecordsComponent {}
