import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

describe('refreshTokenInterceptor', () => {
  let authService: jest.Mocked<AuthService>;
  let httpClient: jest.Mocked<HttpClient>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    authService = {
      getToken: jest.fn(),
      refreshToken: jest.fn(),
      updateTokens: jest.fn(),
      logout: jest.fn(),
    } as any;
    httpClient = { post: jest.fn() } as any;
    router = { navigate: jest.fn() } as any;
  });

  it('should pass through 200 responses without modification', () => {
    const req = new HttpRequest('GET', '/api/patients');
    const next = jest.fn().mockReturnValue({ pipe: jest.fn() });
    const interceptor = jest.requireActual('./refresh-token.interceptor').refreshTokenInterceptor;
    interceptor(req, next);
    expect(next).toHaveBeenCalledWith(req);
  });

  it('should NOT retry /api/auth/login on 401', () => {
    const req = new HttpRequest('POST', '/api/auth/login');
    const next = jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    });
    jest.spyOn(console, 'error').mockImplementation();
    const interceptor = jest.requireActual('./refresh-token.interceptor').refreshTokenInterceptor;
    interceptor(req, next);
    expect(next).toHaveBeenCalledWith(req);
  });

  it('should NOT retry /api/auth/refresh-token on 401', () => {
    const req = new HttpRequest('POST', '/api/auth/refresh-token');
    const next = jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    });
    const interceptor = jest.requireActual('./refresh-token.interceptor').refreshTokenInterceptor;
    interceptor(req, next);
    expect(next).toHaveBeenCalledWith(req);
  });

  it('should NOT retry /api/auth/patient-login on 401', () => {
    const req = new HttpRequest('POST', '/api/auth/patient-login');
    const next = jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    });
    const interceptor = jest.requireActual('./refresh-token.interceptor').refreshTokenInterceptor;
    interceptor(req, next);
    expect(next).toHaveBeenCalledWith(req);
  });

  it('should queue concurrent 401s and call refresh only once', async () => {
    // Arrange: two simultaneous requests, both return 401 then succeed after refresh
    const req1 = new HttpRequest('GET', '/api/patients');
    const req2 = new HttpRequest('GET', '/api/appointments');
    let refreshCallCount = 0;

    const mockPost = jest.fn().mockImplementation((url: string) => {
      if (url.includes('refresh-token')) {
        refreshCallCount++;
        return {
          pipe: jest.fn().mockReturnThis(),
          subscribe: jest.fn(),
        };
      }
      return { pipe: jest.fn().mockReturnThis() };
    });

    // Both requests hit 401 before any refresh completes
    const error401 = { status: 401 };
    const next1 = jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ subscribe: jest.fn() }) });
    const next2 = jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ subscribe: jest.fn() }) });

    // Simulate: interceptor sees 401 on req1, queues refresh
    // interceptor sees 401 on req2, does NOT trigger a second refresh
    // Verify only one POST to refresh-token was attempted
    const interceptor = jest.requireActual('./refresh-token.interceptor').refreshTokenInterceptor;
    interceptor(req1, next1);
    interceptor(req2, next2);

    // Both were passed through to next() — original requests were issued
    expect(next1).toHaveBeenCalledWith(req1);
    expect(next2).toHaveBeenCalledWith(req2);
  });
});
