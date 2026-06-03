import { TestBed } from '@angular/core/testing';
import { SoapFormService, SoapFormShape } from './soap-form.service';
import { FormGroup, Validators } from '@angular/forms';
import { jest } from '@jest/globals';

describe('SoapFormService', () => {
  let service: SoapFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SoapFormService],
    });
    service = TestBed.inject(SoapFormService);
  });

  describe('buildSoapForm', () => {
    it('should create form with 4 controls', () => {
      const form = service.buildSoapForm();
      expect(form.contains('subjective')).toBe(true);
      expect(form.contains('objective')).toBe(true);
      expect(form.contains('assessment')).toBe(true);
      expect(form.contains('plan')).toBe(true);
    });

    it('subjective should be required with minLength 10', () => {
      const form = service.buildSoapForm();
      const control = form.get('subjective')!;
      control.setValue('');
      expect(control.valid).toBe(false);
      expect(control.errors?.['required']).toBe(true);

      control.setValue('Short');
      expect(control.valid).toBe(false);
      expect(control.errors?.['minlength']).toBeTruthy();

      control.setValue('Long enough text here');
      expect(control.valid).toBe(true);
    });

    it('assessment should be required with minLength 5', () => {
      const form = service.buildSoapForm();
      const control = form.get('assessment')!;
      control.setValue('');
      expect(control.valid).toBe(false);

      control.setValue('Hi');
      expect(control.valid).toBe(false);

      control.setValue('Diagnosis here');
      expect(control.valid).toBe(true);
    });

    it('plan should be required with minLength 5', () => {
      const form = service.buildSoapForm();
      const control = form.get('plan')!;
      control.setValue('');
      expect(control.valid).toBe(false);

      control.setValue('Plan');
      expect(control.valid).toBe(false);

      control.setValue('Full treatment plan details');
      expect(control.valid).toBe(true);
    });

    it('objective should be optional', () => {
      const form = service.buildSoapForm();
      const control = form.get('objective')!;
      control.setValue('');
      expect(control.valid).toBe(true);

      control.setValue('Any value is fine');
      expect(control.valid).toBe(true);
    });
  });

  describe('buildVitalsForm', () => {
    it('should create form with 9 controls', () => {
      const form = service.buildVitalsForm();
      expect(Object.keys(form.controls).length).toBe(9);
      expect(form.contains('bmi')).toBe(true);
    });

    it('heartRate should have min 30 max 250 validators', () => {
      const form = service.buildVitalsForm();
      const control = form.get('heartRate')!;
      control.setValue(20);
      expect(control.valid).toBe(false);
      control.setValue(75);
      expect(control.valid).toBe(true);
      control.setValue(300);
      expect(control.valid).toBe(false);
    });

    it('oxygenSaturation should have min 70 max 100 validators', () => {
      const form = service.buildVitalsForm();
      const control = form.get('oxygenSaturation')!;
      control.setValue(50);
      expect(control.valid).toBe(false);
      control.setValue(98);
      expect(control.valid).toBe(true);
      control.setValue(101);
      expect(control.valid).toBe(false);
    });

    it('temperature should have min 35 max 42 validators', () => {
      const form = service.buildVitalsForm();
      const control = form.get('temperature')!;
      control.setValue(34);
      expect(control.valid).toBe(false);
      control.setValue(37);
      expect(control.valid).toBe(true);
      control.setValue(43);
      expect(control.valid).toBe(false);
    });
  });

  describe('BMI auto-computation', () => {
    it('should compute BMI when weight and height are set', () => {
      const form = service.buildVitalsForm();
      form.get('weight')!.setValue(70);
      form.get('height')!.setValue(175);
      const bmi = form.get('bmi')!.value;
      expect(bmi).toBeCloseTo(22.9, 1);
    });

    it('should not compute BMI when either value is null', () => {
      const form = service.buildVitalsForm();
      form.get('weight')!.setValue(70);
      form.get('height')!.setValue(null);
      expect(form.get('bmi')!.value).toBeNull();

      form.get('weight')!.setValue(null);
      form.get('height')!.setValue(175);
      expect(form.get('bmi')!.value).toBeNull();
    });

    it.each([
      [70, 175, 22.9],
      [90, 170, 31.1],
      [50, 160, 19.5],
    ])('weight %skg height %scm should give BMI %s', (weight, height, expected) => {
      const form = service.buildVitalsForm();
      form.get('weight')!.setValue(weight);
      form.get('height')!.setValue(height);
      const bmi = form.get('bmi')!.value;
      expect(bmi).toBeCloseTo(expected, 1);
    });
  });

  describe('isDirty', () => {
    it('should return false when form matches snapshot', () => {
      const form = service.buildSoapForm();
      form.patchValue({ subjective: 'A', objective: 'B', assessment: 'C', plan: 'D' });
      service.lastSavedSnapshot.set(form.getRawValue());
      expect(service.isDirty(form)).toBe(false);
    });

    it('should return true when form differs from snapshot', () => {
      const form = service.buildSoapForm();
      form.patchValue({ subjective: 'A', objective: 'B', assessment: 'C', plan: 'D' });
      service.lastSavedSnapshot.set({ subjective: 'X', objective: 'B', assessment: 'C', plan: 'D' });
      expect(service.isDirty(form)).toBe(true);
    });

    it('should return true when snapshot is null', () => {
      const form = service.buildSoapForm();
      service.lastSavedSnapshot.set(null);
      form.markAsDirty();
      expect(service.isDirty(form)).toBe(true);
    });
  });

  describe('scheduleAutoSave', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call saveFn after 3s delay', () => {
      const form = service.buildSoapForm();
      form.setValue({ subjective: 'Subjective notes here', objective: '', assessment: 'Assessment dx', plan: 'Plan details' });
      const saveFn = jest.fn().mockResolvedValue(undefined);

      service.scheduleAutoSave('visit-1', form, saveFn);
      expect(saveFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(3000);
      expect(saveFn).toHaveBeenCalledTimes(1);
    });

    it('should not save if form is invalid', () => {
      const form = service.buildSoapForm();
      form.setValue({ subjective: '', objective: '', assessment: '', plan: '' });
      const saveFn = jest.fn().mockResolvedValue(undefined);

      service.scheduleAutoSave('visit-1', form, saveFn);
      jest.advanceTimersByTime(3000);
      expect(saveFn).not.toHaveBeenCalled();
    });

    it('should cancel previous timer on new change', () => {
      const form = service.buildSoapForm();
      form.setValue({ subjective: 'Notes', objective: '', assessment: 'Dx', plan: 'Plan' });
      const saveFn = jest.fn().mockResolvedValue(undefined);

      service.scheduleAutoSave('visit-1', form, saveFn);

      form.setValue({ subjective: 'Updated notes', objective: '', assessment: 'Dx', plan: 'Plan' });
      service.scheduleAutoSave('visit-1', form, saveFn);

      jest.advanceTimersByTime(3000);
      expect(saveFn).toHaveBeenCalledTimes(1);
    });

    it('should include visitId in DTO', () => {
      const form = service.buildSoapForm();
      form.setValue({ subjective: 'Subj note', objective: '', assessment: 'Assess', plan: 'Planned treatment' });
      const saveFn = jest.fn().mockResolvedValue(undefined);

      service.scheduleAutoSave('visit-123', form, saveFn);
      jest.advanceTimersByTime(3000);

      const dtoArg = saveFn.mock.calls[0][0];
      expect(dtoArg.visitId).toBe('visit-123');
    });
  });

  describe('toUpdateSoapDto', () => {
    it('should map form value to UpdateSOAPNoteCommand', () => {
      const value = { subjective: 'S', objective: 'O', assessment: 'A', plan: 'P' };
      const dto = service.toUpdateSoapDto(value);
      expect(dto.subjectiveNote).toBe('S');
      expect(dto.objectiveNote).toBe('O');
      expect(dto.assessmentNote).toBe('A');
      expect(dto.planNote).toBe('P');
    });
  });

  describe('toUpdateVitalsDto', () => {
    it('should map vitals to array of AddVitalSignCommand', () => {
      const value = {
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: null,
        heartRate: 80,
        temperature: null,
        oxygenSaturation: 98,
        respiratoryRate: null,
        weight: 70,
        height: null,
        bmi: null,
      };
      const commands = service.toUpdateVitalsDto(value);
      expect(commands.length).toBe(3);
      expect(commands[0].value).toBe(120);
      expect(commands[1].value).toBe(80);
      expect(commands[2].value).toBe(98);
    });
  });
});
