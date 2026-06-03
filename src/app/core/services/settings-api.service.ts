import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Typed service for the /api/settings endpoints.
 *
 * Uses raw HttpClient independently of the NSwag-generated client
 * (settings endpoints may not be covered by the swagger spec).
 * The api-response interceptor automatically unwraps the ApiResponse envelope.
 *
 * @remarks This is a stub — the backend /api/settings endpoints have not
 * yet been implemented. All methods currently fall back to localStorage
 * in the SettingsComponent.
 */
@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/settings';

  /** Fetch all clinic settings */
  getAll(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  /** Update clinic settings */
  update(settings: any): Observable<void> {
    return this.http.put<void>(this.baseUrl, settings);
  }

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