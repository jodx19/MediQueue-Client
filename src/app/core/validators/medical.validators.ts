import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, take, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { PatientsClient } from '../api/mediqueue-api';
import { inject } from '@angular/core';

export class MedicalValidators {

  static egyptianPhone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const valid = /^01[0125][0-9]{8}$/.test(value);
      return valid ? null : { egyptianPhone: true };
    };
  }

  static nationalId(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const valid = /^[0-9]{14}$/.test(value);
      return valid ? null : { nationalId: true };
    };
  }

  static pastDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) return { pastDate: true };
      return date < new Date() ? null : { pastDate: true };
    };
  }

  static futureDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) return { futureDate: true };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today ? null : { futureDate: true };
    };
  }

  static minAge(years: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) return { minAge: { requiredYears: years } };
      const ageMs = Date.now() - date.getTime();
      const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
      return ageYears >= years ? null : { minAge: { requiredYears: years } };
    };
  }

  static mrnUnique(patientsClient: PatientsClient): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = control.value;
      if (!value) return of(null);
      return of(value).pipe(
        debounceTime(500),
        take(1),
        switchMap((mrn: string) => {
          return patientsClient.mrn(mrn).pipe(
            map(() => ({ mrnTaken: true })),
            catchError(() => of(null)),
          );
        }),
      );
    };
  }
}
