import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';
import { FormErrorComponent } from '../../../shared/components/form-error/form-error.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, FormErrorComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  showPass = false;
  isLoading = signal(false);
  error     = signal<string|null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  features = [
    { icon:'shield-check', text:'Role-based secure access' },
    { icon:'activity',     text:'Real-time clinic monitoring' },
    { icon:'zap',          text:'Instant billing & invoicing' },
    { icon:'users',        text:'Full patient management' },
  ];

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.isLoading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(email, password);
      const ret = this.route.snapshot.queryParams['returnUrl'];
      const map: Record<string, string> = {
        Admin:        '/dashboard',
        Doctor:       '/my-queue',
        Receptionist: '/appointments',
        Patient:      '/my-portal',
        SuperAdmin:   '/super-admin/tenants',
      };
      await this.router.navigateByUrl(ret || map[this.auth.userRole()??''] || '/dashboard');
    } catch(e:any) {
      this.error.set(e?.error?.detail ?? 'Invalid email or password');
    } finally {
      this.isLoading.set(false);
    }
  }
}
