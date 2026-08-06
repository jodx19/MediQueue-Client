import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';

interface VerifyEmailRequest {
  userId: string;
  token: string;
}

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="verify-email-page">
      <div class="verify-email-card">

        @if (isVerifying()) {
          <!-- Loading State -->
          <div class="state-container">
            <div class="spinner"></div>
            <h2 class="state-title">Verifying your email&hellip;</h2>
            <p class="state-sub">This will only take a moment.</p>
          </div>
        } @else if (isSuccess()) {
          <!-- Success State -->
          <div class="state-container">
            <div class="state-icon success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 class="state-title">Email Verified!</h2>
            <p class="state-sub">Your account is now active. You can log in and start using MediQueue.</p>
            <button class="btn-primary" (click)="goToLogin()">Go to Login</button>
          </div>
        } @else {
          <!-- Error State -->
          <div class="state-container">
            <div class="state-icon error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h2 class="state-title">Verification Failed</h2>
            <p class="state-sub">{{ errorMessage() }}</p>
            <div class="btn-group">
              <button class="btn-primary" (click)="goToLogin()">Back to Login</button>
            </div>
          </div>
        }

        <!-- Branding -->
        <div class="brand-footer">
          <span class="brand-name">MediQueue</span>
          <span class="brand-sep">&bull;</span>
          <span class="brand-tagline">Clinic Management System</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-email-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%);
      padding: 24px;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .verify-email-card {
      width: 100%;
      max-width: 440px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 48px 40px 36px;
      backdrop-filter: blur(20px);
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
      text-align: center;
    }

    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    /* Spinner */
    .spinner {
      width: 56px;
      height: 56px;
      border: 3px solid rgba(20, 184, 166, 0.2);
      border-top-color: #14b8a6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* State icons */
    .state-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .state-icon svg {
      width: 28px;
      height: 28px;
    }

    .success-icon {
      background: rgba(16, 185, 129, 0.15);
      border: 2px solid rgba(16, 185, 129, 0.4);
      color: #10b981;
      animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .error-icon {
      background: rgba(239, 68, 68, 0.12);
      border: 2px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes pop-in {
      from { transform: scale(0.5); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }

    .state-title {
      font-size: 22px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
      letter-spacing: -0.3px;
    }

    .state-sub {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.6;
      max-width: 300px;
    }

    .btn-primary {
      margin-top: 8px;
      padding: 12px 28px;
      background: linear-gradient(135deg, #14b8a6, #0d9488);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      letter-spacing: 0.3px;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(20,184,166,0.35);
    }

    .btn-group {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Brand footer */
    .brand-footer {
      margin-top: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #475569;
      font-size: 12px;
    }

    .brand-name {
      font-weight: 700;
      color: #14b8a6;
      letter-spacing: 0.5px;
    }

    .brand-sep { font-size: 8px; }
  `]
})
export class VerifyEmailComponent implements OnInit {
  isVerifying = signal(true);
  isSuccess   = signal(false);
  errorMessage = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const userId = params['userId'];
      const token  = params['token'];

      if (!userId || !token) {
        this.errorMessage.set('Invalid verification link. Please check your email and try again.');
        this.isVerifying.set(false);
        return;
      }

      this.verifyEmail(userId, token);
    });
  }

  private async verifyEmail(userId: string, token: string): Promise<void> {
    try {
      const body: VerifyEmailRequest = { userId, token };
      await firstValueFrom(this.http.post('/api/auth/verify-email', body));
      this.isSuccess.set(true);
      this.notify.success('Email verified successfully!');
    } catch (err: any) {
      const msg = err?.error?.message
        ?? err?.message
        ?? 'Email verification failed. The link may have expired. Please request a new one.';
      this.errorMessage.set(msg);
      this.notify.error('Verification failed');
    } finally {
      this.isVerifying.set(false);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
