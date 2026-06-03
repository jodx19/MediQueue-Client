import { Injectable, signal, DestroyRef, inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { UpdateSOAPNoteCommand, AddVitalSignCommand, VitalSignType } from '../../../core/api/mediqueue-api';

export interface SoapFormValue {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface SoapFormShape {
  subjective: FormControl<string>;
  objective: FormControl<string>;
  assessment: FormControl<string>;
  plan: FormControl<string>;
}

export interface VitalsFormValue {
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRate: number | null;
  temperature: number | null;
  oxygenSaturation: number | null;
  respiratoryRate: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
}

export interface VitalsFormShape {
  bloodPressureSystolic: FormControl<number | null>;
  bloodPressureDiastolic: FormControl<number | null>;
  heartRate: FormControl<number | null>;
  temperature: FormControl<number | null>;
  oxygenSaturation: FormControl<number | null>;
  respiratoryRate: FormControl<number | null>;
  weight: FormControl<number | null>;
  height: FormControl<number | null>;
  bmi: FormControl<number | null>;
}

@Injectable()
export class SoapFormService {
  private readonly destroyRef = inject(DestroyRef);
  private autoSaveTimer?: ReturnType<typeof setTimeout>;
  private readonly AUTO_SAVE_DELAY = 3000;

  lastSavedSnapshot = signal<SoapFormValue | null>(null);

  buildSoapForm(): FormGroup<SoapFormShape> {
    return new FormGroup<SoapFormShape>({
      subjective: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
      objective: new FormControl('', { nonNullable: true }),
      assessment: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] }),
      plan: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] }),
    });
  }

  buildVitalsForm(): FormGroup<VitalsFormShape> {
    const form = new FormGroup<VitalsFormShape>({
      bloodPressureSystolic: new FormControl<number | null>(null, { validators: [Validators.min(60), Validators.max(250)] }),
      bloodPressureDiastolic: new FormControl<number | null>(null, { validators: [Validators.min(40), Validators.max(150)] }),
      heartRate: new FormControl<number | null>(null, { validators: [Validators.min(30), Validators.max(250)] }),
      temperature: new FormControl<number | null>(null, { validators: [Validators.min(35), Validators.max(42)] }),
      oxygenSaturation: new FormControl<number | null>(null, { validators: [Validators.min(70), Validators.max(100)] }),
      respiratoryRate: new FormControl<number | null>(null, { validators: [Validators.min(8), Validators.max(40)] }),
      weight: new FormControl<number | null>(null, { validators: [Validators.min(1), Validators.max(500)] }),
      height: new FormControl<number | null>(null, { validators: [Validators.min(30), Validators.max(250)] }),
      bmi: new FormControl<number | null>(null),
    });

    const computeBmi = () => {
      const w = form.controls.weight.value;
      const h = form.controls.height.value;
      if (w && h) {
        const bmi = w / Math.pow(h / 100, 2);
        form.controls.bmi.setValue(parseFloat(bmi.toFixed(1)), { emitEvent: false });
      }
    };

    const sub1 = form.controls.weight.valueChanges.subscribe(() => computeBmi());
    const sub2 = form.controls.height.valueChanges.subscribe(() => computeBmi());
    this.destroyRef.onDestroy(() => { sub1.unsubscribe(); sub2.unsubscribe(); });
    return form;
  }

  scheduleAutoSave(
    visitId: string,
    form: FormGroup<SoapFormShape>,
    saveFn: (dto: UpdateSOAPNoteCommand) => Promise<void>
  ): void {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(async () => {
      if (form.invalid) return;
      const dto = this.toUpdateSoapDto(form.getRawValue());
      dto.visitId = visitId;
      await saveFn(dto);
    }, this.AUTO_SAVE_DELAY);
  }

  cancelAutoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  isDirty(form: FormGroup<SoapFormShape>): boolean {
    const snapshot = this.lastSavedSnapshot();
    if (!snapshot) return form.dirty;
    const current = form.getRawValue();
    return current.subjective !== snapshot.subjective
      || current.objective !== snapshot.objective
      || current.assessment !== snapshot.assessment
      || current.plan !== snapshot.plan;
  }

  toUpdateSoapDto(value: SoapFormValue): UpdateSOAPNoteCommand {
    return new UpdateSOAPNoteCommand({
      subjectiveNote: value.subjective,
      objectiveNote: value.objective,
      assessmentNote: value.assessment,
      planNote: value.plan,
    });
  }

  toUpdateVitalsDto(value: VitalsFormValue): AddVitalSignCommand[] {
    const commands: AddVitalSignCommand[] = [];
    if (value.bloodPressureSystolic) {
      commands.push(new AddVitalSignCommand({ vitalSignType: VitalSignType._1, value: value.bloodPressureSystolic, unit: 'mmHg' }));
    }
    if (value.bloodPressureDiastolic) {
      commands.push(new AddVitalSignCommand({ vitalSignType: VitalSignType._1, value: value.bloodPressureDiastolic, unit: 'mmHg' }));
    }
    if (value.heartRate) {
      commands.push(new AddVitalSignCommand({ vitalSignType: VitalSignType._2, value: value.heartRate, unit: 'bpm' }));
    }
    if (value.temperature) {
      commands.push(new AddVitalSignCommand({ vitalSignType: VitalSignType._3, value: value.temperature, unit: '°C' }));
    }
    if (value.oxygenSaturation) {
      commands.push(new AddVitalSignCommand({ vitalSignType: VitalSignType._4, value: value.oxygenSaturation, unit: '%' }));
    }
    if (value.respiratoryRate) {
      commands.push(new AddVitalSignCommand({ vitalSignType: VitalSignType._5, value: value.respiratoryRate, unit: 'breaths/min' }));
    }
    if (value.weight) {
      commands.push(new AddVitalSignCommand({ vitalSignType: VitalSignType._6, value: value.weight, unit: 'kg' }));
    }
    if (value.height) {
      commands.push(new AddVitalSignCommand({ vitalSignType: VitalSignType._7, value: value.height, unit: 'cm' }));
    }
    return commands;
  }
}
