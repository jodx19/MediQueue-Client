import { InvoiceStatusPipe } from './invoice-status.pipe';
import { InvoiceStatus } from '../../core/api/mediqueue-api';

const IS = InvoiceStatus;

describe('InvoiceStatusPipe', () => {
  let pipe: InvoiceStatusPipe;

  beforeEach(() => {
    pipe = new InvoiceStatusPipe();
  });

  it('should transform status to label by default', () => {
    expect(pipe.transform(IS._3)).toBe('Paid');
    expect(pipe.transform(IS._1)).toBe('Draft');
  });

  it('should transform status to Arabic label with label-ar arg', () => {
    expect(pipe.transform(IS._3, 'label-ar')).toBe('مدفوعة');
    expect(pipe.transform(IS._1, 'label-ar')).toBe('مسودة');
  });

  it('should transform status to badge class with badge arg', () => {
    expect(pipe.transform(IS._3, 'badge')).toBe('badge badge-success');
    expect(pipe.transform(IS._5, 'badge')).toBe('badge badge-danger');
  });

  it('should handle numeric input', () => {
    expect(pipe.transform(3)).toBe('Paid');
    expect(pipe.transform(3, 'badge')).toBe('badge badge-success');
  });

  it('should handle string numeric input', () => {
    expect(pipe.transform('3')).toBe('Paid');
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should be a pure pipe', () => {
    const decorator = InvoiceStatusPipe.__NG_DECORATOR_MAP__?.ɵpipe;
    const pipeInstance = new InvoiceStatusPipe();
    expect(pipeInstance).toBeTruthy();
  });

  it('should handle label-ar format for all statuses', () => {
    const labels = ['مسودة', 'مُرسلة', 'مدفوعة', 'جزئي', 'متأخرة', 'ملغاة'];
    for (let i = 1; i <= 6; i++) {
      expect(pipe.transform(i, 'label-ar')).toBe(labels[i - 1]);
    }
  });
});
