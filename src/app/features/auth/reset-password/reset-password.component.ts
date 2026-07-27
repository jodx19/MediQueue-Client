import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  readonly LucideIcons = { ArrowLeft, ArrowRight, AlertCircle, CheckCircle };

  email = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  
  showPass = false;
  showConfirm = false;

  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
      if (params['token']) {
        this.token = params['token'];
      }
    });
  }

  submit() {
    if (!this.email || !this.token || !this.newPassword) return;

    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    if (this.newPassword.length < 8) {
      this.error.set('Password must be at least 8 characters long.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const payload = {
      email: this.email,
      token: this.token,
      newPassword: this.newPassword
    };

    this.http.post('http://localhost:5000/api/Auth/reset-password', payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.success.set(true);
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Failed to reset password. The PIN code may be invalid or expired.');
      }
    });
  }
}
