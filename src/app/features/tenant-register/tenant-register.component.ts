import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TenantsClient, CheckSubdomainResponse, TenantPlan, ProvisionTenantCommand } from '../../core/api/mediqueue-api';
import { NotificationService } from '../../core/services/notification.service';
import { ApiErrorHandlerService } from '../../core/services/api-error-handler.service';
import { FormErrorComponent } from '../../shared/components/form-error/form-error.component';

@Component({
  selector: 'app-tenant-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormErrorComponent],
  template: `
    <div class="container mx-auto p-8 max-w-2xl">
      @if (registrationDone()) {
        <div class="bg-white p-8 rounded-lg shadow text-center">
          <h2 class="text-3xl font-bold text-green-600 mb-4">🎉 تم إنشاء عيادتك بنجاح!</h2>
          <p class="text-gray-600 mb-6">يمكنك الآن تسجيل الدخول إلى لوحة التحكم الخاصة بك من الرابط التالي:</p>
          <a [href]="portalUrl()" class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors">
            الذهاب إلى {{ portalUrl() }}
          </a>
        </div>
      } @else {
        <div class="bg-white p-8 rounded-lg shadow">
          <h1 class="text-2xl font-bold mb-6">تسجيل عيادة جديدة</h1>
          
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <!-- Clinic Info -->
            <div class="space-y-4">
              <h2 class="text-xl font-semibold border-b pb-2">معلومات العيادة</h2>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">اسم العيادة</label>
                <input type="text" formControlName="clinicName" class="w-full px-3 py-2 border rounded-md" placeholder="مثال: عيادة الأمل">
                <app-form-error [control]="form.controls.clinicName"></app-form-error>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">الرابط المخصص (Subdomain)</label>
                <div class="flex items-center">
                  <input type="text" formControlName="subdomain" class="flex-1 px-3 py-2 border rounded-r-md text-left" dir="ltr" placeholder="my-clinic">
                  <span class="px-3 py-2 bg-gray-100 border border-l-0 rounded-l-md text-gray-600 dir-ltr">.mediqueue.com</span>
                </div>
                
                <div class="mt-1 text-sm">
                  @switch (subdomainStatus()) {
                    @case ('checking') { <span class="text-blue-500">جاري التحقق...</span> }
                    @case ('available') { <span class="text-green-500">الرابط متاح!</span> }
                    @case ('taken') { <span class="text-red-500">الرابط مستخدم، يرجى اختيار رابط آخر.</span> }
                  }
                </div>
                <app-form-error [control]="form.controls.subdomain"></app-form-error>
              </div>
            </div>

            <!-- Admin Info -->
            <div class="space-y-4">
              <h2 class="text-xl font-semibold border-b pb-2">معلومات المدير</h2>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">الاسم الأول</label>
                  <input type="text" formControlName="adminFirstName" class="w-full px-3 py-2 border rounded-md">
                  <app-form-error [control]="form.controls.adminFirstName"></app-form-error>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">الاسم الأخير</label>
                  <input type="text" formControlName="adminLastName" class="w-full px-3 py-2 border rounded-md">
                  <app-form-error [control]="form.controls.adminLastName"></app-form-error>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input type="email" formControlName="adminEmail" class="w-full px-3 py-2 border rounded-md text-left" dir="ltr">
                <app-form-error [control]="form.controls.adminEmail"></app-form-error>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                <input type="password" formControlName="adminPassword" class="w-full px-3 py-2 border rounded-md text-left" dir="ltr">
                <app-form-error [control]="form.controls.adminPassword"></app-form-error>
                <p class="text-xs text-gray-500 mt-1">يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، ورقم.</p>
              </div>
            </div>

            <!-- Plan -->
            <div class="space-y-4">
              <h2 class="text-xl font-semibold border-b pb-2">الباقة</h2>
              <div>
                <select formControlName="plan" class="w-full px-3 py-2 border rounded-md">
                  <option value="Basic">الأساسية (Basic)</option>
                  <option value="Pro">الاحترافية (Pro)</option>
                  <option value="Enterprise">المؤسسات (Enterprise)</option>
                </select>
              </div>
            </div>

            <div class="flex items-center">
              <input type="checkbox" formControlName="agreeToTerms" id="terms" class="h-4 w-4 text-blue-600 rounded border-gray-300">
              <label for="terms" class="ml-2 mr-2 block text-sm text-gray-900">
                أوافق على الشروط والأحكام
              </label>
            </div>

            <div class="pt-4">
              <button type="submit" 
                      [disabled]="form.invalid || subdomainStatus() === 'taken' || isSaving()"
                      class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                @if (isSaving()) {
                  <span>جاري الإنشاء...</span>
                } @else {
                  <span>إنشاء العيادة</span>
                }
              </button>
            </div>

          </form>
        </div>
      }
    </div>
  `
})
export class TenantRegisterComponent implements OnInit {
  private fb = inject(FormBuilder)
  private tenantsClient = inject(TenantsClient)
  private router = inject(Router)
  private notificationService = inject(NotificationService)
  private apiErrorHandler = inject(ApiErrorHandlerService)

  // State
  isSaving = signal(false)
  subdomainStatus = signal<'idle' | 'checking' | 'available' | 'taken'>('idle')
  registrationDone = signal(false)
  portalUrl = signal('')

  form = this.fb.nonNullable.group({
    clinicName: ['', [Validators.required, Validators.maxLength(200)]],
    subdomain: ['', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(50),
      Validators.pattern(/^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/)
    ]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPassword: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/[A-Z]/),
      Validators.pattern(/[0-9]/)
    ]],
    adminFirstName: ['', Validators.required],
    adminLastName: ['', Validators.required],
    plan: ['Basic'],
    agreeToTerms: [false, Validators.requiredTrue]
  })

  ngOnInit() {
    this.form.controls.subdomain.valueChanges
      .subscribe(async (v: string | null) => {
        if (!v || v.length < 4) {
          this.subdomainStatus.set('idle')
          return
        }
        this.subdomainStatus.set('checking')
        try {
          const result = await firstValueFrom(this.tenantsClient.available(v))
          this.subdomainStatus.set(
            result.available ? 'available' : 'taken'
          )
        } catch {
          this.subdomainStatus.set('idle')
        }
      })

    // Auto-suggest subdomain from clinic name
    this.form.controls.clinicName.valueChanges
      .subscribe((name: string | null) => {
        if (name && !this.form.controls.subdomain.dirty) {
          const suggested = name
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
            .replace(/[\u0600-\u06FF]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50)

          if (suggested) {
            this.form.controls.subdomain.setValue(suggested, { emitEvent: true })
          }
        }
      })
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid ||
      this.subdomainStatus() === 'taken') {
      this.form.markAllAsTouched()
      return
    }

    this.isSaving.set(true)
    try {
      const v = this.form.getRawValue()
      const planMap: Record<string, TenantPlan> = {
        Basic: TenantPlan._1,
        Pro: TenantPlan._2,
        Enterprise: TenantPlan._3
      }
      const result = await firstValueFrom(
        this.tenantsClient.provision({
          clinicName: v.clinicName!,
          subdomain: v.subdomain!,
          adminEmail: v.adminEmail!,
          adminPassword: v.adminPassword!,
          adminFirstName: v.adminFirstName!,
          adminLastName: v.adminLastName!,
          plan: planMap[v.plan!] ?? TenantPlan._1
        } as ProvisionTenantCommand)
      )

      this.portalUrl.set(result.portalUrl!)
      this.registrationDone.set(true)
      this.notificationService.success('تم تسجيل العيادة بنجاح!');

    } catch (err) {
      this.apiErrorHandler.handle(err)
    } finally {
      this.isSaving.set(false)
    }
  }
}
