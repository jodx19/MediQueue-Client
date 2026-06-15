import { Component, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

interface CmdItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  keywords: string;
}

@Component({
  selector: 'app-cmd-k',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Backdrop -->
    @if (isOpen()) {
      <div class="fixed inset-0 bg-mq-navy/60 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[15vh]"
           (click)="close()">
        <!-- Modal -->
        <div class="w-full max-w-xl bg-mq-800 border border-mq-700 rounded-2xl shadow-2xl overflow-hidden"
             (click)="$event.stopPropagation()">
          <!-- Search Input -->
          <div class="flex items-center gap-3 px-5 py-4 border-b border-mq-700">
            <lucide-icon name="search" class="text-mq-s400 flex-shrink-0" [size]="18"/>
            <input #searchInput
                   type="text"
                   [(ngModel)]="query"
                   (ngModelChange)="filterItems()"
                   placeholder="Search pages, patients, actions..."
                   class="flex-1 bg-transparent text-white text-base placeholder-mq-s500 outline-none border-none"
                   autofocus/>
            <kbd class="hidden sm:inline-flex items-center px-2 py-1 rounded-lg bg-mq-700 text-mq-s400 text-xs font-mono border border-mq-600">
              ESC
            </kbd>
          </div>

          <!-- Results -->
          <div class="max-h-80 overflow-y-auto custom-scrollbar">
            @if (filteredItems().length > 0) {
              @for (item of filteredItems(); track item.id; let i = $index) {
                <button (click)="navigate(item)"
                        [ngClass]="{'bg-mq-teal/10': selectedIndex() === i}"
                        class="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-mq-700/50 transition-colors">
                  <lucide-icon [name]="item.icon" class="text-mq-t400 flex-shrink-0" [size]="16"/>
                  <span class="text-white text-sm flex-1">{{ item.label }}</span>
                  <span class="text-mq-s500 text-xs">{{ item.keywords }}</span>
                </button>
              }
            } @else {
              <div class="px-5 py-12 text-center">
                <lucide-icon name="search-x" class="text-mq-s500 mx-auto mb-2" [size]="24"/>
                <p class="text-mq-s400 text-sm">No results found</p>
                <p class="text-mq-s500 text-xs mt-1">Try a different search term</p>
              </div>
            }
          </div>

          <!-- Footer hints -->
          <div class="flex items-center gap-4 px-5 py-3 border-t border-mq-700 bg-mq-850">
            <span class="flex items-center gap-1.5 text-mq-s500 text-xs">
              <kbd class="px-1.5 py-0.5 rounded bg-mq-700 text-mq-s400 text-[10px] font-mono">??</kbd>
              Navigate
            </span>
            <span class="flex items-center gap-1.5 text-mq-s500 text-xs">
              <kbd class="px-1.5 py-0.5 rounded bg-mq-700 text-mq-s400 text-[10px] font-mono">?</kbd>
              Open
            </span>
            <span class="flex items-center gap-1.5 text-mq-s500 text-xs">
              <kbd class="px-1.5 py-0.5 rounded bg-mq-700 text-mq-s400 text-[10px] font-mono">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
  `]
})
export class CmdKComponent {
  private readonly router = inject(Router);

  isOpen = signal(false);
  query = signal('');
  selectedIndex = signal(0);
  filteredItems = signal<CmdItem[]>([]);

  private readonly allItems: CmdItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', route: '/dashboard', keywords: 'home overview stats' },
    { id: 'patients', label: 'Patients', icon: 'users', route: '/patients', keywords: 'list directory register' },
    { id: 'appointments', label: 'Appointments', icon: 'calendar', route: '/appointments', keywords: 'schedule booking visits' },
    { id: 'invoices', label: 'Invoices', icon: 'receipt', route: '/invoices', keywords: 'billing payments revenue' },
    { id: 'invoices-create', label: 'Create Invoice', icon: 'file-plus', route: '/invoices/create', keywords: 'new bill charge' },
    { id: 'revenue', label: 'Revenue Report', icon: 'bar-chart-3', route: '/invoices/revenue', keywords: 'earnings analytics' },
    { id: 'doctors', label: 'Doctors', icon: 'stethoscope', route: '/doctors', keywords: 'physicians specialists' },
    { id: 'my-queue', label: 'My Queue', icon: 'list-ordered', route: '/my-queue', keywords: 'waiting patients triage' },
    { id: 'reports', label: 'Reports & Analytics', icon: 'bar-chart-4', route: '/reports', keywords: 'statistics insights data' },
    { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings', keywords: 'configuration preferences' },
    { id: 'super-admin', label: 'Staff Management', icon: 'shield', route: '/super-admin', keywords: 'admin users roles' },
  ];

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    // Cmd+K or Ctrl+K to open
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.toggle();
      return;
    }

    if (!this.isOpen()) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update(i => Math.min(i + 1, this.filteredItems().length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        const selected = this.filteredItems()[this.selectedIndex()];
        if (selected) this.navigate(selected);
        break;
    }
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen.set(true);
    this.query.set('');
    this.filteredItems.set([...this.allItems]);
    this.selectedIndex.set(0);
  }

  close() {
    this.isOpen.set(false);
  }

  filterItems() {
    const q = this.query().toLowerCase().trim();
    if (!q) {
      this.filteredItems.set([...this.allItems]);
    } else {
      this.filteredItems.set(
        this.allItems.filter(item =>
          item.label.toLowerCase().includes(q) ||
          item.keywords.toLowerCase().includes(q) ||
          item.route.toLowerCase().includes(q)
        )
      );
    }
    this.selectedIndex.set(0);
  }

  navigate(item: CmdItem) {
    this.close();
    this.router.navigateByUrl(item.route);
  }
}