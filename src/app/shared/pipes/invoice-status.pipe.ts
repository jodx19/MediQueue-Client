import { Pipe, PipeTransform } from '@angular/core';
import { InvoiceStatus } from '../../core/api/mediqueue-api';
import {
  getInvoiceStatusLabel,
  getInvoiceStatusBadgeClass,
  invoiceStatusFromNumber,
} from '../../core/utils/invoice-status.utils';

@Pipe({
  name: 'invoiceStatus',
  standalone: true,
  pure: true,
})
export class InvoiceStatusPipe implements PipeTransform {
  transform(
    value: InvoiceStatus | number | string | undefined | null,
    format: 'label' | 'badge' | 'label-ar' = 'label',
  ): string {
    if (value == null) return '';

    const n = typeof value === 'string' ? parseInt(value, 10) : (value as number);
    const status = invoiceStatusFromNumber(n);

    switch (format) {
      case 'badge':
        return getInvoiceStatusBadgeClass(status);
      case 'label-ar':
        return getInvoiceStatusLabel(status, 'ar');
      default:
        return getInvoiceStatusLabel(status, 'en');
    }
  }
}
