import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

describe('roleGuard', () => {
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    authService = {
      isLoggedIn: jest.fn(),
      hasRole: jest.fn(),
      userRole: jest.fn(),
    } as any;
    router = {
      createUrlTree: jest.fn(),
    } as any;
    route = {} as ActivatedRouteSnapshot;
    state = { url: '/dashboard' } as RouterStateSnapshot;
  });

  it('should allow Admin to access admin-only route', () => {
    authService.isLoggedIn.mockReturnValue(true);
    authService.hasRole.mockReturnValue(true);

    const { roleGuard } = jest.requireActual('./role.guard');
    const guard = roleGuard(['Admin']);
    const result = guard(route, state);

    expect(result).toBe(true);
  });

  it('should deny Patient from accessing admin route', () => {
    authService.isLoggedIn.mockReturnValue(true);
    authService.hasRole.mockReturnValue(false);
    authService.userRole.mockReturnValue('Patient');
    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const { roleGuard } = jest.requireActual('./role.guard');
    const guard = roleGuard(['Admin']);
    const result = guard(route, state);

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/my-portal']);
  });

  it('should redirect Doctor to /my-queue on role mismatch', () => {
    authService.isLoggedIn.mockReturnValue(true);
    authService.hasRole.mockReturnValue(false);
    authService.userRole.mockReturnValue('Doctor');
    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const { roleGuard } = jest.requireActual('./role.guard');
    const guard = roleGuard(['Receptionist']);
    const result = guard(route, state);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/my-queue']);
    expect(result).toBe(urlTree);
  });

  it('should redirect to /auth/login when not authenticated', () => {
    authService.isLoggedIn.mockReturnValue(false);
    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const { roleGuard } = jest.requireActual('./role.guard');
    const guard = roleGuard(['Admin']);
    const result = guard(route, state);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toBe(urlTree);
  });

  it('should allow access when allowedRoles is empty', () => {
    const { roleGuard } = jest.requireActual('./role.guard');
    const guard = roleGuard([]);
    const result = guard(route, state);
    expect(result).toBe(true);
  });

  it('should use AuthService.hasRole for role checking', () => {
    authService.isLoggedIn.mockReturnValue(true);
    authService.hasRole.mockReturnValue(true);

    const { roleGuard } = jest.requireActual('./role.guard');
    const guard = roleGuard(['Admin', 'Doctor']);
    guard(route, state);

    expect(authService.hasRole).toHaveBeenCalledWith('Admin', 'Doctor');
  });
});
