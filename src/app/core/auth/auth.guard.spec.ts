import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    authService = {
      isLoggedIn: jest.fn(),
    } as any;
    router = {
      createUrlTree: jest.fn(),
    } as any;
    route = {} as ActivatedRouteSnapshot;
    state = { url: '/dashboard' } as RouterStateSnapshot;
  });

  it('should allow activation when user is authenticated', () => {
    authService.isLoggedIn.mockReturnValue(true);
    const { authGuard } = jest.requireActual('./auth.guard');
    const result = authGuard(route, state);
    expect(result).toBe(true);
  });

  it('should redirect to /auth/login when not authenticated for non-patient route', () => {
    authService.isLoggedIn.mockReturnValue(false);
    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);
    const { authGuard } = jest.requireActual('./auth.guard');
    const result = authGuard(route, state);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/dashboard' },
    });
    expect(result).toBe(urlTree);
  });

  it('should redirect to /patient-login for patient portal URLs', () => {
    authService.isLoggedIn.mockReturnValue(false);
    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);
    const patientState = { url: '/my-portal' } as RouterStateSnapshot;
    const { authGuard } = jest.requireActual('./auth.guard');
    const result = authGuard(route, patientState);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/patient-login'], {
      queryParams: { returnUrl: '/my-portal' },
    });
    expect(result).toBe(urlTree);
  });

  it('should include returnUrl in redirect query params', () => {
    authService.isLoggedIn.mockReturnValue(false);
    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);
    const targetState = { url: '/appointments/create' } as RouterStateSnapshot;
    const { authGuard } = jest.requireActual('./auth.guard');
    authGuard(route, targetState);
    expect(router.createUrlTree).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        queryParams: { returnUrl: '/appointments/create' },
      }),
    );
  });
});
