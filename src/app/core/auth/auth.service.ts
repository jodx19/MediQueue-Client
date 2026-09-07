import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthClient, LoginCommand as LoginRequest, AuthResponseDto } from '../api/mediqueue-api';
import { TenantService } from '../services/tenant.service';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

export interface UserSession {
  token: string;
  refreshToken: string;
  email: string;
  role: 'Admin' | 'Doctor' | 'Receptionist' | 'Patient' | 'SuperAdmin';
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

// F-1: Use localStorage so the session persists across browser restarts / tab
// closes while the refresh token is still valid. The refresh-token interceptor
// will silently renew the access token on the next request, so the user never
// needs to re-login until the refresh token itself expires (7 days by default).
const SESSION_KEY = 'mq_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authClient = inject(AuthClient);
  private readonly tenantService = inject(TenantService);
  private readonly router = inject(Router);

  private _session = signal<UserSession | null>(this.loadSession());

  readonly currentUser  = this._session.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._session());
  readonly userRole     = computed(() => this._session()?.role ?? null);
  readonly isSuperAdmin = computed(() => {
    const s = this._session();
    return s?.role === 'SuperAdmin' || s?.email === environment.superAdminEmail;
  });
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

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      this._session.set(session);

      const tenantIdStr = (decoded as any)?.TenantId || (decoded as any)?.tenantId;
      const subdomainStr = (decoded as any)?.Subdomain || (decoded as any)?.subdomain;
      if (tenantIdStr) {
        this.tenantService.setFromJwt(tenantIdStr, subdomainStr ?? '');
      }
    } catch (error) {
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

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this._session.set(session);

    const tenantIdStr = (decoded as any)?.TenantId || (decoded as any)?.tenantId;
    const subdomainStr = (decoded as any)?.Subdomain || (decoded as any)?.subdomain;
    if (tenantIdStr) {
      this.tenantService.setFromJwt(tenantIdStr, subdomainStr ?? '');
    }
  }

  async logout(): Promise<void> {
    try {
      // F-3: The backend's /logout endpoint is [Authorize] — it reads the userId
      // directly from the Bearer token's NameIdentifier claim. No body needed;
      // the previous `this.authClient.logout({ userId } as any)` was incorrect.
      await firstValueFrom(this.authClient.logout());
    } catch (error) {
      console.warn('Logout API call failed, proceeding with local cleanup:', error);
    } finally {
      localStorage.removeItem(SESSION_KEY);
      this._session.set(null);
      this.tenantService.clear();
      this.router.navigate(['/']);
    }
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

    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    this._session.set(updated);
  }

  hasRole(...roles: string[]): boolean {
    const r = this.userRole();
    return r ? roles.includes(r) : false;
  }

  private loadSession(): UserSession | null {
    try {
      // Migrate any legacy sessionStorage data to localStorage on first load
      const legacy = sessionStorage.getItem(SESSION_KEY);
      if (legacy) {
        localStorage.setItem(SESSION_KEY, legacy);
        sessionStorage.removeItem(SESSION_KEY);
      }

      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;

      const s = JSON.parse(raw) as UserSession;

      // F-2: Do NOT discard the session when the access token has expired.
      // The refresh-token interceptor handles silent renewal on the next API call.
      // Only discard when the refresh token itself is missing (fully logged out).
      if (!s.refreshToken) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return s;
    } catch {
      return null;
    }
  }
}
