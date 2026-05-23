import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-mq-slate flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden animate-[fadeIn_0.5s_ease-out]">
      <!-- Background Ambient Blurs -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-mq-teal/20 blur-[120px] rounded-full"></div>
        <div class="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-blue-400/10 blur-[120px] rounded-full"></div>
      </div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <a routerLink="/" class="flex justify-center mb-2 hover:scale-105 transition-transform">
          <div class="w-16 h-16 rounded-2xl bg-mq-navy flex items-center justify-center shadow-lg shadow-mq-navy/30 relative overflow-hidden">
            <div class="absolute right-0 top-0 w-12 h-12 bg-mq-teal/40 blur-md rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" class="relative z-10">
              <path d="M20 8C14 8 10 13 10 20C10 27 14 32 20 32C26 32 30 27 30 20" stroke="white" stroke-width="3" stroke-linecap="round"/>
              <circle cx="28" cy="12" r="4" fill="#14B8A6"/>
            </svg>
          </div>
        </a>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-mq-navy tracking-tight">
          Welcome back
        </h2>
        <p class="mt-2 text-center text-sm text-gray-500 font-medium">
          Sign in to your MediQueue workspace.
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div class="bg-white py-8 px-4 shadow-2xl shadow-mq-navy/5 sm:rounded-3xl sm:px-10 border border-gray-100">
          <form class="space-y-6" (ngSubmit)="login()">
            
            @if (errorMsg()) {
              <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium text-center animate-[fadeIn_0.3s_ease-out]">
                {{ errorMsg() }}
              </div>
            }

            <div>
              <label for="email" class="block text-sm font-bold text-gray-700">Email address</label>
              <div class="mt-2 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                </div>
                <input id="email" name="email" type="email" autocomplete="email" required [(ngModel)]="email"
                  class="appearance-none block w-full pl-10 px-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mq-teal/50 focus:border-mq-teal sm:text-sm transition-all font-medium text-gray-900">
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-bold text-gray-700">Password</label>
              <div class="mt-2 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input id="password" name="password" type="password" autocomplete="current-password" required [(ngModel)]="password"
                  class="appearance-none block w-full pl-10 px-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mq-teal/50 focus:border-mq-teal sm:text-sm transition-all font-medium text-gray-900">
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" class="h-4 w-4 text-mq-teal focus:ring-mq-teal border-gray-300 rounded cursor-pointer transition-colors">
                <label for="remember-me" class="ml-2 block text-sm text-gray-900 font-medium cursor-pointer">
                  Remember me
                </label>
              </div>

              <div class="text-sm">
                <a href="#" class="font-bold text-mq-teal hover:text-mq-teal-dark transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button type="submit" [disabled]="loading()"
                class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-mq-teal/30 text-sm font-bold text-white bg-mq-teal hover:bg-mq-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mq-teal transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none">
                @if(loading()) {
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Authenticating...
                } @else {
                  Sign in securely
                }
              </button>
            </div>
            
            <div class="mt-6 text-center border-t border-gray-100 pt-6">
              <p class="text-xs text-gray-400 font-medium">Use demo credentials: admin&#64;mediqueue.com / password</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  errorMsg = signal('');

  async login() {
    this.loading.set(true);
    this.errorMsg.set('');

    try {
      await this.authService.login(this.email, this.password);
      await this.router.navigateByUrl(this.authService.getRoleHome());
    } catch {
      this.errorMsg.set('Invalid credentials or server error. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
