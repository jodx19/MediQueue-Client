import { InvoiceStatus } from '../api/mediqueue-api';

const IS = InvoiceStatus;

const LABEL_MAP: Record<InvoiceStatus, { en: string; ar: string }> = {
  [IS._1]: { en: 'Draft',     ar: 'مسودة' },
  [IS._2]: { en: 'Sent',      ar: 'مُرسلة' },
  [IS._3]: { en: 'Paid',      ar: 'مدفوعة' },
  [IS._4]: { en: 'Partial',   ar: 'جزئي'   },
  [IS._5]: { en: 'Overdue',   ar: 'متأخرة' },
  [IS._6]: { en: 'Cancelled', ar: 'ملغاة'  },
};

const BADGE_MAP: Record<InvoiceStatus, string> = {
  [IS._1]: 'badge badge-gray',
  [IS._2]: 'badge badge-primary',
  [IS._3]: 'badge badge-success',
  [IS._4]: 'badge badge-warning',
  [IS._5]: 'badge badge-danger',
  [IS._6]: 'badge badge-gray',
};

export function getInvoiceStatusLabel(status: InvoiceStatus, lang: 'en' | 'ar' = 'en'): string {
  return LABEL_MAP[status]?.[lang] ?? 'Unknown';
}

export function getInvoiceStatusBadgeClass(status: InvoiceStatus): string {
  return BADGE_MAP[status] ?? 'badge badge-gray';
}

export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return Object.values(InvoiceStatus).includes(value as InvoiceStatus);
}

export function invoiceStatusFromNumber(n: number): InvoiceStatus {
  if (isInvoiceStatus(n)) return n;
  return IS._1;
}
