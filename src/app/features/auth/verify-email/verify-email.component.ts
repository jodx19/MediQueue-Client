import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Inject, Optional } from '@angular/core';
import { API_BASE_URL } from '../../../core/api/mediqueue-api';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="verify-page">
      <div class="verify-card">
        <!-- Logo mark -->
        <div class="logo-ring">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1
              4.07 14.3 19.79 19.79 0 0 1 1 5.67 2 2 0 0 1 2.96 3.5h3a2 2 0 0 1 2 1.72
              12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 10.33a16 16 0 0 0 5.58
              5.58l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </div>

        @if (state() === 'loading') {
          <div class="state-loading">
            <div class="spinner"></div>
            <h2>Verifying your email…</h2>
            <p>Please wait while we confirm your address.</p>
          </div>
        }

        @if (state() === 'success') {
          <div class="state-success">
            <div class="icon-wrap success">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2>Email Verified!</h2>
            <p>Your email address has been successfully confirmed. You can now log in.</p>
            <button (click)="goToLogin()" class="btn-primary">Go to Login</button>
          </div>
        }

        @if (state() === 'error') {
          <div class="state-error">
            <div class="icon-wrap error">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2>Verification Failed</h2>
            <p>{{ errorMessage() }}</p>
            <button (click)="goToLogin()" class="btn-secondary">Back to Login</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .verify-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2744 100%);
      padding: 1.5rem;
    }

    .verify-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      backdrop-filter: blur(20px);
      border-radius: 1.5rem;
      padding: 3rem 2.5rem;
      width: 100%;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }

    .logo-ring {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0D9488, #0891B2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 2rem;
      color: #fff;
      box-shadow: 0 0 32px rgba(13,148,136,0.4);
    }

    h2 {
      font-family: 'Inter', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 0.75rem;
    }

    p {
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0 0 1.75rem;
    }

    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(13,148,136,0.2);
      border-top-color: #0D9488;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }

    .icon-wrap.success {
      background: rgba(16,185,129,0.12);
      border: 2px solid rgba(16,185,129,0.3);
      color: #10b981;
    }

    .icon-wrap.error {
      background: rgba(239,68,68,0.12);
      border: 2px solid rgba(239,68,68,0.3);
      color: #ef4444;
    }

    .btn-primary, .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 2rem;
      border-radius: 0.625rem;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #0D9488, #0891B2);
      color: #fff;
      box-shadow: 0 4px 14px rgba(13,148,136,0.35);
    }

    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

    .btn-secondary {
      background: rgba(255,255,255,0.07);
      color: #cbd5e1;
      border: 1px solid rgba(255,255,255,0.12);
    }

    .btn-secondary:hover { background: rgba(255,255,255,0.12); }
  `]
})
export class VerifyEmailComponent implements OnInit {

  state        = signal<'loading' | 'success' | 'error'>('loading');
  errorMessage = signal('An unexpected error occurred. Please try again.');

  private readonly baseUrl: string;

  constructor(
    private readonly route:  ActivatedRoute,
    private readonly router: Router,
    private readonly http:   HttpClient,
    @Optional() @Inject(API_BASE_URL) baseUrl?: string
  ) {
    this.baseUrl = baseUrl ?? '';
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const userId = params['userId'];
      const token  = params['token'];

      if (!userId || !token) {
        this.errorMessage.set('The verification link is missing required parameters.');
        this.state.set('error');
        return;
      }

      this.verifyEmail(userId, token);
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  private verifyEmail(userId: string, token: string): void {
    this.http.post(
      `${this.baseUrl}/api/Auth/verify-email`,
      { userId, verificationToken: token }
    ).subscribe({
      next: () => this.state.set('success'),
      error: (err: any) => {
        const msg =
          err?.error?.detail ??
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'The verification link is invalid or has expired.';
        this.errorMessage.set(msg);
        this.state.set('error');
      }
    });
  }
}
