import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, SearchX, Home } from 'lucide-angular';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-mq-navy flex items-center justify-center p-8">
      <div class="glass p-12 text-center max-w-md">
        <lucide-icon name="search-x" class="text-mq-s400 mx-auto mb-6" [size]="64"/>
        <h1 class="text-6xl font-black text-white mb-2">404</h1>
        <h2 class="text-xl font-semibold text-white mb-2">Page Not Found</h2>
        <p class="text-mq-s400 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <a routerLink="/" class="btn-primary inline-flex items-center gap-2 !py-3 !px-6">
          <lucide-icon name="home" [size]="16"/>
          Back to Home
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
