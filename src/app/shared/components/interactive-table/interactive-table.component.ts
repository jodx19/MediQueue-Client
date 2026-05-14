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
    <div class="overflow-x-auto rounded-xl shadow-sm border border-gray-100 bg-white">
      <table class="mq-table w-full">
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th [ngClass]="{'text-right': col.type === 'currency' || col.type === 'number'}">
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
                  <td><div class="h-4 w-24 animate-skeleton"></div></td>
                }
              </tr>
            }
          } @else if (data().length === 0) {
            <tr>
              <td [attr.colspan]="columns().length" class="text-center py-8 text-gray-400 font-medium">
                No data available.
              </td>
            </tr>
          } @else {
            @for (row of data(); track $index) {
              <tr class="mq-tr" (click)="rowClick.emit(row)">
                @for (col of columns(); track col.key) {
                  <td [ngClass]="{'text-right': col.type === 'currency' || col.type === 'number'}">
                    @if (col.type === 'currency') {
                      <span class="font-medium text-gray-900">{{ getValue(row, col.key) | currency }}</span>
                    } @else if (col.type === 'badge') {
                      <span class="px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide"
                            [ngClass]="getBadgeClass(getValue(row, col.key))">
                        {{ getValue(row, col.key) }}
                      </span>
                    } @else if (col.type === 'date') {
                      <span class="text-gray-600">{{ getValue(row, col.key) | date:'mediumDate' }}</span>
                    } @else if (col.key === 'actions') {
                      <div class="flex items-center justify-end gap-2" (click)="$event.stopPropagation()">
                        <button class="btn-ghost text-mq-teal" (click)="actionClick.emit({action: 'view', row})">View</button>
                        <button class="btn-ghost" (click)="actionClick.emit({action: 'edit', row})">Edit</button>
                      </div>
                    } @else {
                      <span class="text-gray-800">{{ getValue(row, col.key) }}</span>
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
    if (val.includes('active') || val.includes('completed')) return 'bg-green-100 text-green-700';
    if (val.includes('pending') || val.includes('waiting')) return 'bg-yellow-100 text-yellow-700';
    if (val.includes('in session')) return 'bg-blue-100 text-blue-700';
    if (val.includes('cancel') || val.includes('failed')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  }
}
