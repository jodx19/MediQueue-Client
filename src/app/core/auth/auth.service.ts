import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client as AuthClient, LoginCommand as LoginRequest, AuthResponseDto } from '../api/mediqueue-api';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserSession {
  token: string;
  email: string;
  role: 'Admin' | 'Doctor' | 'Receptionist' | 'Patient';
  firstName: string;
  lastName: string;
  doctorId?: string;
  patientId?: string;
  expiresAt: Date;
}

const ROLE_HOME: Record<string, string> = {
  Admin:        '/dashboard',
  Doctor:       '/my-queue',
  Receptionist: '/appointments',
  Patient:      '/my-portal',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authClient = inject(AuthClient);
  private readonly http = inject(HttpClient);

  private _session = signal<UserSession | null>(this.loadSession());

  readonly currentUser  = this._session.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._session());
  readonly userRole     = computed(() => this._session()?.role ?? null);
  readonly isSuperAdmin = computed(() => this._session()?.role === 'Admin');

  async login(email: string, password: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.authClient.login(new LoginRequest({ email, password }))
      );

      const session: UserSession = {
        token:     response.token!,
        email:     response.username || email,
        role:      (response.role as any) || 'Patient',
        firstName: response.username || 'User',
        lastName:  '',
        expiresAt: new Date(response.expiryTime!),
      };

      this.saveSession(session);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async patientLogin(mrn: string, dateOfBirth: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponseDto>(`${environment.apiBaseUrl}/api/Auth/patient-login`, { mrn, dateOfBirth: new Date(dateOfBirth).toISOString() })
      );

      const session: UserSession = {
        token:     response.token!,
        email:     response.username || '',
        role:      (response.role as any) || 'Patient',
        firstName: response.username || 'Patient',
        lastName:  '',
        expiresAt: new Date(response.expiryTime!),
      };

      this.saveSession(session);
    } catch (error) {
      console.error('Patient login failed:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<string> {
    const current = this._session();
    if (!current) throw new Error('No session');

    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponseDto>(`${environment.apiBaseUrl}/api/Auth/refresh-token`, {
          token: current.token,
          refreshToken: '',  // Would need to store refresh token separately
        })
      );

      const updated: UserSession = { ...current, token: response.token!, expiresAt: new Date(response.expiryTime!) };
      this.saveSession(updated);
      return response.token!;
    } catch {
      this.logout();
      throw new Error('Session expired');
    }
  }

  private saveSession(session: UserSession): void {
    sessionStorage.setItem('mq_session', JSON.stringify(session));
    this._session.set(session);
  }

  logout(): void {
    sessionStorage.removeItem('mq_session');
    this._session.set(null);
  }

  getToken(): string | null {
    return this._session()?.token ?? null;
  }

  hasRole(...roles: string[]): boolean {
    const r = this.userRole();
    return r ? roles.includes(r) : false;
  }

  getRoleHome(): string {
    return ROLE_HOME[this.userRole() ?? ''] ?? '/auth/login';
  }

  private loadSession(): UserSession | null {
    try {
      const raw = sessionStorage.getItem('mq_session');
      if (!raw) return null;

      const s = JSON.parse(raw) as UserSession;

      if (new Date(s.expiresAt) < new Date()) {
        sessionStorage.removeItem('mq_session');
        return null;
      }

      return s;
    } catch {
      return null;
    }
  }
}
