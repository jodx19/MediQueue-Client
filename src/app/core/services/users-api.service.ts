import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserListItemDto, UserRole } from '../models/user.models';

/**
 * Typed service for the /api/users endpoints.
 *
 * Uses raw HttpClient so it works independently of the NSwag-generated
 * client (which may exclude UsersController on regeneration).
 * The api-response interceptor automatically unwraps the ApiResponse
 * envelope, so callers receive the typed array directly.
 *
 * @remarks Future methods stubbed below:
 *   getById(id: string): Observable<UserListItemDto>
 *   updateRole(id: string, role: UserRole): Observable<void>
 *   deactivate(id: string): Observable<void>
 */
@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  getAll(): Observable<UserListItemDto[]> {
    return this.http.get<UserListItemDto[]>(this.baseUrl);
  }

  deactivate(email: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${email}/deactivate`, {});
  }
}
