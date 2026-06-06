/**
 * @temporary Manual typed service — will be replaced by
 * NSwag-generated SettingsClient after next nswag run.
 * DO NOT add business logic here.
 */
import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'

export interface ClinicSettingsDto {
  id: string
  clinicName: string
  clinicPhone: string
  clinicEmail: string
  clinicAddress: string
  logoUrl: string
  workStartTime: string      // "HH:mm"
  workEndTime: string        // "HH:mm"
  appointmentDurationMinutes: number
  currency: string
  timeZone: string
  allowOnlineBooking: boolean
  requireDepositForBooking: boolean
  depositAmount: number
}

export interface UpdateSettingsRequest {
  clinicName: string
  clinicPhone: string
  clinicEmail: string
  clinicAddress: string
  workStartTime: string
  workEndTime: string
  appointmentDurationMinutes: number
  currency: string
  timeZone: string
  allowOnlineBooking: boolean
  requireDepositForBooking: boolean
  depositAmount: number
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient)
  private baseUrl = `${environment.apiBaseUrl}/api/settings`

  // TODO Step 10: inject TenantId from TenantService
  // Settings will be scoped per tenant
  // getSettings() will send X-Tenant-Id header automatically
  // via the tenant interceptor (to be added in Step 10)

  getSettings(): Observable<ClinicSettingsDto> {
    return this.http.get<ClinicSettingsDto>(this.baseUrl)
  }

  updateSettings(
    request: UpdateSettingsRequest
  ): Observable<ClinicSettingsDto> {
    return this.http.put<ClinicSettingsDto>(this.baseUrl, request)
  }
}
