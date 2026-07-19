import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserListItemDto } from '../models/user.models';
import { UsersClient } from '../api/mediqueue-api';

/**
 * Typed service for the /api/users endpoints.
 *
 * Now relies entirely on the NSwag generated UsersClient for Type-Safety.
 */
@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly usersClient = inject(UsersClient);

  getAll(): Observable<UserListItemDto[]> {
    // The NSwag client returns an Observable<UserListItemDto[]> directly
    // since the api-response interceptor unwraps the ApiResponse envelope.
    return this.usersClient.users() as unknown as Observable<UserListItemDto[]>;
  }

  deactivate(email: string): Observable<void> {
    return this.usersClient.deactivate(email);
  }
}
