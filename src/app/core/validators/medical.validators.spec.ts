import { FormControl } from '@angular/forms';
import { MedicalValidators } from './medical.validators';
import { of, throwError } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

describe('MedicalValidators', () => {
  describe('egyptianPhone', () => {
    it.each([
      '01012345678',
      '01112345678',
      '01212345678',
      '01512345678',
    ])('should accept valid Egyptian phone %s', (phone) => {
      const control = new FormControl(phone);
      const result = MedicalValidators.egyptianPhone()(control);
      expect(result).toBeNull();
    });

    it.each([
      ['0901234567', 'wrong prefix'],
      ['1234567890', 'no leading 0'],
      ['010123456', 'too short'],
      ['010123456789', 'too long'],
      ['abcdefghijk', 'not digits'],
    ])('should reject invalid phone %s (%s)', (phone) => {
      const control = new FormControl(phone);
      const result = MedicalValidators.egyptianPhone()(control);
      expect(result).toEqual({ egyptianPhone: true });
    });

    it('should accept null value (optional field)', () => {
      const control = new FormControl(null);
      const result = MedicalValidators.egyptianPhone()(control);
      expect(result).toBeNull();
    });

    it('should accept empty string (optional field)', () => {
      const control = new FormControl('');
      const result = MedicalValidators.egyptianPhone()(control);
      expect(result).toBeNull();
    });
  });

  describe('nationalId', () => {
    it('should accept exactly 14 digits', () => {
      const control = new FormControl('12345678901234');
      const result = MedicalValidators.nationalId()(control);
      expect(result).toBeNull();
    });

    it('should reject 13 digits', () => {
      const control = new FormControl('1234567890123');
      const result = MedicalValidators.nationalId()(control);
      expect(result).toEqual({ nationalId: true });
    });

    it('should reject 15 digits', () => {
      const control = new FormControl('123456789012345');
      const result = MedicalValidators.nationalId()(control);
      expect(result).toEqual({ nationalId: true });
    });

    it('should reject non-numeric characters', () => {
      const control = new FormControl('1234567890abcd');
      const result = MedicalValidators.nationalId()(control);
      expect(result).toEqual({ nationalId: true });
    });

    it('should accept null (optional field)', () => {
      const control = new FormControl(null);
      const result = MedicalValidators.nationalId()(control);
      expect(result).toBeNull();
    });
  });

  describe('pastDate', () => {
    it('should accept yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const control = new FormControl(yesterday.toISOString());
      const result = MedicalValidators.pastDate()(control);
      expect(result).toBeNull();
    });

    it('should accept 20 years ago', () => {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 20);
      const control = new FormControl(past.toISOString());
      const result = MedicalValidators.pastDate()(control);
      expect(result).toBeNull();
    });

    it('should reject tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const control = new FormControl(tomorrow.toISOString());
      const result = MedicalValidators.pastDate()(control);
      expect(result).toEqual({ pastDate: true });
    });
  });

  describe('futureDate', () => {
    it('should accept tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const control = new FormControl(tomorrow.toISOString());
      const result = MedicalValidators.futureDate()(control);
      expect(result).toBeNull();
    });

    it('should accept next year', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const control = new FormControl(future.toISOString());
      const result = MedicalValidators.futureDate()(control);
      expect(result).toBeNull();
    });

    it('should reject yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const control = new FormControl(yesterday.toISOString());
      const result = MedicalValidators.futureDate()(control);
      expect(result).toEqual({ futureDate: true });
    });
  });

  describe('minAge', () => {
    it('should accept age above minimum', () => {
      const oldEnough = new Date();
      oldEnough.setFullYear(oldEnough.getFullYear() - 25);
      const control = new FormControl(oldEnough.toISOString());
      const result = MedicalValidators.minAge(18)(control);
      expect(result).toBeNull();
    });

    it('should reject age below minimum', () => {
      const tooYoung = new Date();
      tooYoung.setFullYear(tooYoung.getFullYear() - 5);
      const control = new FormControl(tooYoung.toISOString());
      const result = MedicalValidators.minAge(18)(control);
      expect(result).not.toBeNull();
    });
  });

  describe('mrnUnique (async)', () => {
    it('should return null when MRN is available', (done) => {
      const patientsClient = { mrn: jest.fn().mockReturnValue(of(null)) };
      const control = new FormControl('MRN-001');
      const validator = MedicalValidators.mrnUnique(patientsClient as any);
      validator(control).subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return { mrnTaken: true } when MRN exists', (done) => {
      const patientsClient = { mrn: jest.fn().mockReturnValue(of({} as any)) };
      const control = new FormControl('MRN-001');
      const validator = MedicalValidators.mrnUnique(patientsClient as any);
      validator(control).subscribe((result) => {
        expect(result).toEqual({ mrnTaken: true });
        done();
      });
    });

    it('should return null when API call fails', (done) => {
      const patientsClient = { mrn: jest.fn().mockReturnValue(throwError(() => new Error('Network error'))) };
      const control = new FormControl('MRN-001');
      const validator = MedicalValidators.mrnUnique(patientsClient as any);
      validator(control).subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when value is empty', (done) => {
      const patientsClient = { mrn: jest.fn() };
      const control = new FormControl('');
      const validator = MedicalValidators.mrnUnique(patientsClient as any);
      validator(control).subscribe((result) => {
        expect(result).toBeNull();
        expect(patientsClient.mrn).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
