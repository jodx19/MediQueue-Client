import { InvoiceStatus } from '../api/mediqueue-api';
import {
  getInvoiceStatusLabel,
  getInvoiceStatusBadgeClass,
  invoiceStatusFromNumber,
  isInvoiceStatus,
} from './invoice-status.utils';

const IS = InvoiceStatus;

describe('InvoiceStatusUtils', () => {
  describe('getInvoiceStatusLabel', () => {
    it.each([
      [IS._1, 'en', 'Draft'],
      [IS._2, 'en', 'Sent'],
      [IS._3, 'en', 'Paid'],
      [IS._4, 'en', 'Partial'],
      [IS._5, 'en', 'Overdue'],
      [IS._6, 'en', 'Cancelled'],
    ])('status %s in en should return %s', (status, lang, expected) => {
      expect(getInvoiceStatusLabel(status, lang as 'en')).toBe(expected);
    });

    it.each([
      [IS._1, 'ar', 'مسودة'],
      [IS._3, 'ar', 'مدفوعة'],
      [IS._5, 'ar', 'متأخرة'],
      [IS._6, 'ar', 'ملغاة'],
    ])('status %s in ar should return %s', (status, lang, expected) => {
      expect(getInvoiceStatusLabel(status, lang as 'ar')).toBe(expected);
    });

    it('should default to English when lang is not specified', () => {
      expect(getInvoiceStatusLabel(IS._3)).toBe('Paid');
    });
  });

  describe('getInvoiceStatusBadgeClass', () => {
    it('should return badge-success for Paid', () => {
      expect(getInvoiceStatusBadgeClass(IS._3)).toBe('badge badge-success');
    });

    it('should return badge-danger for Overdue', () => {
      expect(getInvoiceStatusBadgeClass(IS._5)).toBe('badge badge-danger');
    });

    it('should return badge-warning for Partial', () => {
      expect(getInvoiceStatusBadgeClass(IS._4)).toBe('badge badge-warning');
    });

    it('should return badge-gray for Draft', () => {
      expect(getInvoiceStatusBadgeClass(IS._1)).toBe('badge badge-gray');
    });

    it('should return badge-gray for Cancelled', () => {
      expect(getInvoiceStatusBadgeClass(IS._6)).toBe('badge badge-gray');
    });

    it('should return badge-primary for Sent', () => {
      expect(getInvoiceStatusBadgeClass(IS._2)).toBe('badge badge-primary');
    });
  });

  describe('invoiceStatusFromNumber', () => {
    it('should map 1 to Draft', () => {
      expect(invoiceStatusFromNumber(1)).toBe(IS._1);
    });

    it('should map 3 to Paid', () => {
      expect(invoiceStatusFromNumber(3)).toBe(IS._3);
    });

    it('should map 6 to Cancelled', () => {
      expect(invoiceStatusFromNumber(6)).toBe(IS._6);
    });

    it('should default to Draft for invalid number 0', () => {
      expect(invoiceStatusFromNumber(0)).toBe(IS._1);
    });

    it('should default to Draft for invalid number 999', () => {
      expect(invoiceStatusFromNumber(999)).toBe(IS._1);
    });
  });

  describe('isInvoiceStatus', () => {
    it('should return true for valid InvoiceStatus values', () => {
      expect(isInvoiceStatus(1)).toBe(true);
      expect(isInvoiceStatus(3)).toBe(true);
      expect(isInvoiceStatus(6)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isInvoiceStatus(0)).toBe(false);
      expect(isInvoiceStatus(7)).toBe(false);
      expect(isInvoiceStatus('Draft')).toBe(false);
      expect(isInvoiceStatus(null)).toBe(false);
    });
  });
});
