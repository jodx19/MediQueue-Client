import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="forbidden-container">
      <div class="content" @fadeSlideIn>
        <div class="icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You don't have the required permissions to view this page.</p>
        <div class="actions">
          <button (click)="goHome()" class="btn btn-primary">Go to My Home</button>
          <button (click)="logout()" class="btn btn-ghost">Sign Out</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forbidden-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0A0F1E;
      text-align: center;
      padding: 24px;
    }
    .content {
      max-width: 400px;
      padding: 40px;
      background: #1E293B;
      border: 1px solid rgba(148,163,184,0.12);
      border-radius: 24px;
      box-shadow: 0 20px 80px rgba(0,0,0,0.60);
    }
    .icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #F1F5F9;
      margin-bottom: 12px;
    }
    p {
      color: #94A3B8;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `]
})
export class ForbiddenComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  goHome() {
    const role = this.authService.currentUser()?.role;
    const redirectMap: any = {
      'Admin': '/dashboard',
      'Doctor': '/clinical-visits',
      'Receptionist': '/appointments',
    };
    this.router.navigate([redirectMap[role!] ?? '/']);
  }

  logout() {
    this.authService.logout();
  }
}
