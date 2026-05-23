import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, AlertTriangle, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-mq-navy flex items-center justify-center p-8">
      <div class="glass p-12 text-center max-w-md">
        <lucide-icon name="alert-triangle" class="text-amber-400 mx-auto mb-6" [size]="64"/>
        <h1 class="text-6xl font-black text-white mb-2">500</h1>
        <h2 class="text-xl font-semibold text-white mb-2">Server Error</h2>
        <p class="text-mq-s400 text-sm mb-8">Something went wrong on our end. Please try again later.</p>
        <div class="flex gap-3 justify-center">
          <button (click)="location.reload()" class="btn-primary inline-flex items-center gap-2 !py-3 !px-6">
            <lucide-icon name="refresh-cw" [size]="16"/>
            Try Again
          </button>
          <a routerLink="/" class="btn-secondary inline-flex items-center gap-2 !py-3 !px-6">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  `
})
export class ServerErrorComponent {
  location = window.location;
}
