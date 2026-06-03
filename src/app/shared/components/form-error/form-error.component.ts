import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';

const DEFAULT_MESSAGES: Record<string, string> = {
  required:      '\u0647\u0630\u0627 \u0627\u0644\u062D\u0642\u0644 \u0645\u0637\u0644\u0648\u0628',
  minlength:     '\u0627\u0644\u0646\u0635 \u0642\u0635\u064A\u0631 \u062C\u062F\u0627\u064B',
  maxlength:     '\u0627\u0644\u0646\u0635 \u0637\u0648\u064A\u0644 \u062C\u062F\u0627\u064B',
  email:         '\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D',
  egyptianPhone: '\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0628\u062F\u0623 \u0628\u0640 010 \u0623\u0648 011 \u0623\u0648 012 \u0623\u0648 015',
  nationalId:    '\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 14 \u0631\u0642\u0645',
  pastDate:      '\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0641\u064A \u0627\u0644\u0645\u0627\u0636\u064A',
  futureDate:    '\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0641\u064A \u0627\u0644\u0645\u0633\u062A\u0642\u0628\u0644',
  mrnTaken:      '\u0647\u0630\u0627 \u0627\u0644\u0631\u0642\u0645 \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644',
  min:           '\u0627\u0644\u0642\u064A\u0645\u0629 \u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D',
  max:           '\u0627\u0644\u0642\u064A\u0645\u0629 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D',
};

@Component({
  selector: 'app-form-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (control?.invalid && control?.touched) {
      <div class="form-errors">
        @for (error of activeErrors(); track error) {
          <p class="form-error">{{ error }}</p>
        }
      </div>
    }
  `,
  styles: [`
    .form-error {
      color: #ef4444;
      font-size: 12px;
      margin-top: 4px;
    }
    .form-errors {
      margin-top: 2px;
    }
  `]
})
export class FormErrorComponent {
  @Input({ required: true }) control!: AbstractControl | null;
  @Input() messages?: Record<string, string>;

  readonly activeErrors = computed(() => {
    const ctrl = this.control;
    if (!ctrl || !ctrl.errors || !ctrl.touched) return [];
    const allMessages = { ...DEFAULT_MESSAGES, ...this.messages };
    return Object.keys(ctrl.errors).map(key => allMessages[key] || key);
  });
}
