import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { TenantService } from './core/services/tenant.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet/>
    <app-toast/>
  `
})
export class AppComponent {
  title = 'mediqueue-client';
  private tenantService = inject(TenantService);

  constructor() {
    // Resolve tenant from hostname on startup
    // This runs before any route guard
    this.tenantService.resolveFromHostname();
  }
}
