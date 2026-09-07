import { Injectable, inject } from '@angular/core'
import { Observable } from 'rxjs'
import { SettingsClient, ClinicSettingsDto, UpdateSettingsCommand } from '../api/mediqueue-api'

/**
 * Settings service — wraps the generated SettingsClient.
 *
 * NOTE (TODO Step 10 — RESOLVED):
 * TenantId is NOT injected manually here. It is automatically added to every
 * outgoing /api/ request by the `tenantInterceptor` (see tenant.interceptor.ts)
 * as the `X-Tenant-Id` header. No service-level injection is needed.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settingsClient = inject(SettingsClient)

  getSettings(): Observable<ClinicSettingsDto> {
    return this.settingsClient.settingsGET()
  }

  updateSettings(request: UpdateSettingsCommand): Observable<ClinicSettingsDto> {
    return this.settingsClient.settingsPUT(request)
  }
}
