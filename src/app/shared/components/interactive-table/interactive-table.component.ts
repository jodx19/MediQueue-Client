import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn<T> {
  key: keyof T | 'actions';
  header: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'custom';
}

@Component({
  selector: 'app-interactive-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mq-table-wrapper">
      <table class="mq-table w-full">
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th class="mq-th" [ngClass]="{'text-right': col.type === 'currency' || col.type === 'number'}">
                {{ col.header }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @if (loading()) {
            @for (i of [1,2,3,4,5]; track i) {
              <tr>
                @for (col of columns(); track col.key) {
                  <td><div class="skeleton h-4 w-24 rounded"></div></td>
                }
              </tr>
            }
          } @else if (data().length === 0) {
            <tr>
              <td [attr.colspan]="columns().length" class="mq-td text-center py-12 text-mq-s400 font-medium">
                No data available.
              </td>
            </tr>
          } @else {
            @for (row of data(); track $index) {
              <tr class="mq-tr" (click)="rowClick.emit(row)">
                @for (col of columns(); track col.key) {
                  <td class="mq-td" [ngClass]="{'text-right': col.type === 'currency' || col.type === 'number'}">
                    @if (col.type === 'currency') {
                      <span class="font-medium text-mq-text">{{ getValue(row, col.key) | currency }}</span>
                    } @else if (col.type === 'badge') {
                      <span [ngClass]="getBadgeClass(getValue(row, col.key))">
                        {{ getValue(row, col.key) }}
                      </span>
                    } @else if (col.type === 'date') {
                      <span class="text-mq-s400">{{ getValue(row, col.key) | date:'mediumDate' }}</span>
                    } @else if (col.key === 'actions') {
                      <div class="flex items-center justify-end gap-2" (click)="$event.stopPropagation()">
                        <button class="btn-ghost text-mq-teal" (click)="actionClick.emit({action: 'view', row})">View</button>
                        <button class="btn-ghost" (click)="actionClick.emit({action: 'edit', row})">Edit</button>
                      </div>
                    } @else {
                      <span class="text-mq-s300">{{ getValue(row, col.key) }}</span>
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `
})
export class InteractiveTableComponent<T> {
  data = input<T[]>([]);
  columns = input<TableColumn<T>[]>([]);
  loading = input<boolean>(false);

  rowClick = output<T>();
  actionClick = output<{action: string, row: T}>();

  getValue(row: T, key: keyof T | 'actions'): any {
    if (key === 'actions') return null;
    return (row as any)[key];
  }

  getBadgeClass(value: any): string {
    const val = String(value).toLowerCase();
    if (val.includes('active') || val.includes('completed') || val.includes('paid'))
      return 'badge badge-success';
    if (val.includes('pending') || val.includes('waiting') || val.includes('scheduled'))
      return 'badge badge-warning';
    if (val.includes('in session') || val.includes('in progress'))
      return 'badge badge-teal';
    if (val.includes('cancel') || val.includes('failed') || val.includes('overdue'))
      return 'badge badge-danger';
    return 'badge badge-neutral';
  }
}
