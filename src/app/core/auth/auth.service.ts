import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthClient, LoginCommand as LoginRequest, AuthResponseDto } from '../api/mediqueue-api';
import { TenantService } from '../services/tenant.service';
import { firstValueFrom } from 'rxjs';

export interface UserSession {
  token: string;
  refreshToken: string;
  email: string;
  role: 'Admin' | 'Doctor' | 'Receptionist' | 'Patient';
  name: string;
  doctorId?: string;
  patientId?: string;
  expiresAt: Date;
}

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authClient = inject(AuthClient);
  private readonly tenantService = inject(TenantService);

  private _session = signal<UserSession | null>(this.loadSession());

  readonly currentUser  = this._session.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._session());
  readonly userRole     = computed(() => this._session()?.role ?? null);
  readonly isSuperAdmin = computed(() => this._session()?.role === 'Admin');
  readonly refreshToken = computed(() => this._session()?.refreshToken ?? null);

  async login(email: string, password: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.authClient.login(new LoginRequest({ email, password }))
      );

      const decoded = decodeJwt(response.token!);
      const doctorId = decoded?.DoctorId || decoded?.doctorId;
      const patientId = decoded?.PatientId || decoded?.patientId;

      const session: UserSession = {
        token:        response.token!,
        refreshToken: response.refreshToken!,
        email:        response.username || email,
        role:         (response.role as any) || 'Patient',
        name:         response.username || 'User',
        doctorId:     doctorId || undefined,
        patientId:    patientId || undefined,
        expiresAt:    new Date(response.expiryTime!),
      };

      sessionStorage.setItem('mq_session', JSON.stringify(session));
      this._session.set(session);
      
      const tenantIdStr = (decoded as any)?.TenantId || (decoded as any)?.tenantId;
      const subdomainStr = (decoded as any)?.Subdomain || (decoded as any)?.subdomain;
      if (tenantIdStr) {
        this.tenantService.setFromJwt(tenantIdStr, subdomainStr ?? '');
      }

      console.log('User logged in successfully:', session.email);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async loginFromResponse(response: AuthResponseDto): Promise<void> {
    const decoded = decodeJwt(response.token!);
    const doctorId = decoded?.DoctorId || decoded?.doctorId;
    const patientId = decoded?.PatientId || decoded?.patientId;

    const session: UserSession = {
      token:        response.token!,
      refreshToken: response.refreshToken!,
      email:        response.username || 'patient@mediqueue.local',
      role:         (response.role as any) || 'Patient',
      name:         response.username || 'Patient',
      doctorId:     doctorId || undefined,
      patientId:    patientId || undefined,
      expiresAt:    new Date(response.expiryTime!),
    };

    sessionStorage.setItem('mq_session', JSON.stringify(session));
    this._session.set(session);

    const tenantIdStr = (decoded as any)?.TenantId || (decoded as any)?.tenantId;
    const subdomainStr = (decoded as any)?.Subdomain || (decoded as any)?.subdomain;
    if (tenantIdStr) {
      this.tenantService.setFromJwt(tenantIdStr, subdomainStr ?? '');
    }

    console.log('User logged in successfully from response:', session.email);
  }

  logout(): void {
    sessionStorage.removeItem('mq_session');
    this._session.set(null);
    this.tenantService.clear();
  }

  getToken(): string | null {
    return this._session()?.token ?? null;
  }

  /**
   * Replace the stored token, refresh token and expiry without logging the user out.
   * Called by the refresh-token interceptor after a successful silent refresh.
   */
  updateTokens(token: string, refreshToken: string, expiryTime: string): void {
    const session = this._session();
    if (!session) return;

    const updated: UserSession = {
      ...session,
      token,
      refreshToken,
      expiresAt: new Date(expiryTime),
    };

    sessionStorage.setItem('mq_session', JSON.stringify(updated));
    this._session.set(updated);
  }

  hasRole(...roles: string[]): boolean {
    const r = this.userRole();
    return r ? roles.includes(r) : false;
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
