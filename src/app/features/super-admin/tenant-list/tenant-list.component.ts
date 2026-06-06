import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiErrorHandlerService } from '../../../core/services/api-error-handler.service';

interface TenantDto {
  id: string;
  name: string;
  subdomain: string;
  adminEmail: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  trialEndsAt: string;
  subscriptionEndsAt: string | null;
}

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">إدارة العيادات (Tenants)</h1>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        @if (isLoading()) {
          <div class="p-8 text-center text-gray-500">جاري تحميل البيانات...</div>
        } @else if (tenants().length === 0) {
          <div class="p-8 text-center text-gray-500">لا توجد عيادات مسجلة حالياً</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العيادة</th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرابط</th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدير</th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الباقة</th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الانتهاء</th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (tenant of tenants(); track tenant.id) {
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ tenant.name }}</div>
                      <div class="text-xs text-gray-500">{{ tenant.createdAt | date:'shortDate' }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <a [href]="'https://' + tenant.subdomain + '.mediqueue.com'" target="_blank" class="text-sm text-blue-600 hover:underline" dir="ltr">
                        {{ tenant.subdomain }}.mediqueue.com
                      </a>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{{ tenant.adminEmail }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {{ tenant.plan }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      @if (tenant.isActive) {
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">نشط</span>
                      } @else {
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">موقوف</span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      @if (tenant.subscriptionEndsAt) {
                        <div class="text-green-600">اشتراك: {{ tenant.subscriptionEndsAt | date:'shortDate' }}</div>
                      } @else {
                        <div class="text-orange-600">تجريبي: {{ tenant.trialEndsAt | date:'shortDate' }}</div>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      @if (tenant.isActive) {
                        <button (click)="suspendTenant(tenant.id)" class="text-red-600 hover:text-red-900">إيقاف</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class TenantListComponent implements OnInit {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private apiErrorHandler = inject(ApiErrorHandlerService);

  tenants = signal<TenantDto[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadTenants();
  }

  async loadTenants() {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.http.get<TenantDto[]>('/api/tenants'));
      this.tenants.set(response || []);
    } catch (err) {
      this.apiErrorHandler.handle(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async suspendTenant(id: string) {
    if (!confirm('هل أنت متأكد من إيقاف هذه العيادة؟')) return;

    try {
      await firstValueFrom(this.http.put(`/api/tenants/${id}/suspend`, {}));
      this.notificationService.success('تم إيقاف العيادة بنجاح');
      this.loadTenants(); // Reload list
    } catch (err) {
      this.apiErrorHandler.handle(err);
    }
  }
}
