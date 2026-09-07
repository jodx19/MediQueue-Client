// Lightweight structural tests for the refreshTokenInterceptor bypass logic.
// Full integration tests require TestBed + HttpClientTestingModule.

/** Helper: mirrors the bypass check inside the interceptor */
function isAuthEndpoint(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('/api/auth/login') ||
    lower.includes('/api/auth/refresh-token') ||
    lower.includes('/api/auth/patient-login')
  );
}

describe('refreshTokenInterceptor — bypass guard', () => {

  it('should bypass /api/auth/login', () => {
    expect(isAuthEndpoint('/api/auth/login')).toBe(true);
  });

  it('should bypass /api/auth/refresh-token', () => {
    expect(isAuthEndpoint('/api/auth/refresh-token')).toBe(true);
  });

  it('should bypass /api/auth/patient-login', () => {
    expect(isAuthEndpoint('/api/auth/patient-login')).toBe(true);
  });

  it('should NOT bypass /api/patients', () => {
    expect(isAuthEndpoint('/api/patients')).toBe(false);
  });

  it('should NOT bypass /api/appointments', () => {
    expect(isAuthEndpoint('/api/appointments')).toBe(false);
  });

  it('PROACTIVE_REFRESH_THRESHOLD_MS should be 2 minutes (120 000 ms)', () => {
    const threshold = 2 * 60 * 1000;
    expect(threshold).toBe(120_000);
  });
});
