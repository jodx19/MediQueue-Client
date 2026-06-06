import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SettingsService } from './settings.service';

/**
 * @deprecated For core clinic settings, use SettingsService instead.
 * 
 * TODO Step 10: The endpoints for hours and specialties need to be implemented 
 * as separate controllers or grouped under the new Settings architecture, properly
 * tenant-scoped with X-Tenant-Id headers.
 */
@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/settings';
  private readonly settingsService = inject(SettingsService);

  /** 
   * @deprecated Delegate to typed SettingsService 
   */
  getAll(): Observable<any> {
    return this.settingsService.getSettings();
  }

  /** 
   * @deprecated Delegate to typed SettingsService 
   */
  update(settings: any): Observable<any> {
    return this.settingsService.updateSettings(settings);
  }

  // --- THESE NEED SEPARATE API ENDPOINTS IN STEP 10 ---
  // TODO Step 10: inject TenantId from TenantService when these endpoints are built

  /** Fetch working hours */
  getWorkingHours(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/hours`);
  }

  /** Update working hours */
  updateWorkingHours(hours: any[]): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/hours`, hours);
  }

  /** Fetch specialties */
  getSpecialties(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/specialties`);
  }

  /** Add a specialty */
  addSpecialty(name: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/specialties`, { name });
  }

  /** Remove a specialty */
  removeSpecialty(name: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/specialties/${encodeURIComponent(name)}`);
  }
}
