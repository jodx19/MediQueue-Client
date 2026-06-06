import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { TenantService } from '../services/tenant.service'

/**
 * Injects X-Tenant-Id and X-Subdomain headers
 * into every outgoing API request.
 *
 * Skips non-API requests (assets, etc.)
 *
 * Interceptor order in app.config.ts:
 * auth -> tenant -> refresh -> apiResponse -> error
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // Only inject for API calls
  if (!req.url.includes('/api/')) {
    return next(req)
  }

  const tenantService = inject(TenantService)
  const tenantId  = tenantService.tenantId()
  const subdomain = tenantService.subdomain()

  // Skip if no tenant resolved yet (e.g. during login)
  if (!tenantId && !subdomain) {
    return next(req)
  }

  const modified = req.clone({
    setHeaders: {
      ...(tenantId  ? { 'X-Tenant-Id':  tenantId  } : {}),
      ...(subdomain ? { 'X-Subdomain': subdomain } : {}),
    }
  })

  return next(modified)
}
