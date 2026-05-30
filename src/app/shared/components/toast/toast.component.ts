import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  animations: [
    trigger('toast', [
      transition(':enter', [
        style({ opacity:0, transform:'translateX(100%)' }),
        animate('350ms cubic-bezier(0.34,1.56,0.64,1)',
          style({ opacity:1, transform:'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in',
          style({ opacity:0, transform:'translateX(100%)' }))
      ])
    ])
  ],
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  readonly notify = inject(NotificationService);
  readonly toasts = this.notify.toasts;

  iconMap: Record<string,string> = {
    success: 'check-circle',
    error:   'x-circle',
    warning: 'alert-triangle',
    info:    'info',
  };
  colorMap: Record<string,string> = {
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    error:   'text-rose-400 bg-rose-500/10 border-rose-500/25',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    info:    'text-mq-t400 bg-mq-teal/10 border-mq-teal/25',
  };
}
