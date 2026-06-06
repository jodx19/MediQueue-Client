import { Injectable, signal, computed, inject } from '@angular/core'
import { Router } from '@angular/router'

export interface TenantInfo {
  tenantId: string
  subdomain: string
  clinicName: string
  plan: 'Basic' | 'Pro' | 'Enterprise'
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private router = inject(Router)

  // Current tenant state
  private _tenant = signal<TenantInfo | null>(null)

  // Public readonly
  tenant   = this._tenant.asReadonly()
  tenantId = computed(() => this._tenant()?.tenantId ?? '')
  subdomain = computed(() => this._tenant()?.subdomain ?? '')
  isDevMode = computed(() =>
    this.subdomain() === 'dev' ||
    this.subdomain() === '' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )

  /**
   * Resolve tenant from current window location.
   * clinic1.mediqueue.com → subdomain = "clinic1"
   * localhost → dev mode
   */
  resolveFromHostname(): void {
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      this._tenant.set({
        tenantId: '00000000-0000-0000-0000-000000000001',
        subdomain: 'dev',
        clinicName: 'Dev Clinic',
        plan: 'Enterprise'
      })
      return
    }

    // Extract subdomain: clinic1.mediqueue.com → clinic1
    const parts = hostname.split('.')
    if (parts.length >= 3) {
      const subdomain = parts[0]
      // TenantId will be confirmed after login
      // Store subdomain for header injection
      this._tenant.set({
        tenantId: '',  // filled after JWT received
        subdomain,
        clinicName: '',
        plan: 'Basic'
      })
    }
  }

  /**
   * Called after successful login.
   * JWT contains TenantId claim.
   */
  setFromJwt(tenantId: string, subdomain: string): void {
    this._tenant.update(t => t
      ? { ...t, tenantId, subdomain }
      : { tenantId, subdomain, clinicName: '', plan: 'Basic' }
    )
  }

  /**
   * Called after settings loaded.
   * Updates clinic name and plan.
   */
  setDetails(clinicName: string, plan: string): void {
    this._tenant.update(t => t
      ? { ...t, clinicName, plan: plan as TenantInfo['plan'] }
      : null
    )
  }

  clear(): void {
    this._tenant.set(null)
  }
}
