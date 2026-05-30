import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  // عادية مش getters
  email    = '';
  password = '';
  showPass = false;

  isLoading = signal(false);
  error     = signal<string|null>(null);

  features = [
    { icon:'shield-check', text:'Role-based secure access' },
    { icon:'activity',     text:'Real-time clinic monitoring' },
    { icon:'zap',          text:'Instant billing & invoicing' },
    { icon:'users',        text:'Full patient management' },
  ];

  async submit() {
    if (!this.email || !this.password) return;
    this.isLoading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.email, this.password);
      const ret = this.route.snapshot.queryParams['returnUrl'];
      const map: Record<string,string> = {
        Admin: '/dashboard', Doctor: '/my-queue', Receptionist: '/appointments'
      };
      await this.router.navigateByUrl(ret || map[this.auth.userRole()??''] || '/dashboard');
    } catch(e:any) {
      this.error.set(e?.error?.detail ?? 'Invalid email or password');
    } finally {
      this.isLoading.set(false);
    }
  }
}
