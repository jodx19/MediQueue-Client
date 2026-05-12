import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Client, LoginCommand } from '../api/mediqueue-api';

export interface UserSession {
  token: string;
  email: string;
  role: 'Admin' | 'Doctor' | 'Receptionist';
  expiresAt: Date;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client = inject(Client);
  private readonly router = inject(Router);

  readonly currentUser = signal<UserSession | null>(this.loadFromStorage());
  readonly isLoggedIn = signal<boolean>(!!this.loadFromStorage());

  async login(email: string, password: string): Promise<UserSession> {
    const response = await firstValueFrom(
      this.client.login(new LoginCommand({ email, password }))
    );

    console.log('Login successful, role:', response.role);
    
    // Normalize role string (handle 'Admin', 'admin', 1, etc.)
    let role: any = response.role;
    if (role === 1 || role === '1' || (typeof role === 'string' && role.toLowerCase() === 'admin')) role = 'Admin';
    if (role === 2 || role === '2' || (typeof role === 'string' && role.toLowerCase() === 'doctor')) role = 'Doctor';
    if (role === 3 || role === '3' || (typeof role === 'string' && role.toLowerCase() === 'receptionist')) role = 'Receptionist';

    const session: UserSession = {
      token: response.token!,
      email: response.username || '',
      role: role || 'Admin',
      expiresAt: new Date(response.expiryTime!),
    };

    localStorage.setItem('mq_session', JSON.stringify(session));
    this.currentUser.set(session);
    this.isLoggedIn.set(true);

    const redirectMap: Record<string, string> = {
      'Admin': '/dashboard',
      'Doctor': '/clinical-visits',
      'Receptionist': '/appointments',
    };

    if (session.email === 'ma7moudmostafa19@gmail.com') {
      this.router.navigate(['/super-admin']);
    } else {
      const target = redirectMap[session.role] ?? '/dashboard';
      console.log('Redirecting to:', target);
      this.router.navigate([target]);
    }
    return session;
  }

  logout() {
    localStorage.removeItem('mq_session');
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  hasRole(...roles: string[]): boolean {
    const role = this.currentUser()?.role;
    return role ? roles.includes(role) : false;
  }

  private loadFromStorage(): UserSession | null {
    try {
      const raw = localStorage.getItem('mq_session');
      if (!raw) return null;
      const session = JSON.parse(raw) as UserSession;
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem('mq_session');
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }
}
