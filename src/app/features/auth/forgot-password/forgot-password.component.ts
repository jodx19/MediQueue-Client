import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  readonly LucideIcons = { ArrowLeft, ArrowRight, AlertCircle, CheckCircle };

  email = '';
  
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  private http = inject(HttpClient);
  private router = inject(Router);

  submit() {
    if (!this.email) return;

    this.isLoading.set(true);
    this.error.set(null);

    const payload = { email: this.email };

    this.http.post('http://localhost:5000/api/Auth/forgot-password', payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Failed to process request. Please try again.');
      }
    });
  }
}
