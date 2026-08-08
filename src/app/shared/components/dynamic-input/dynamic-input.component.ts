import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomFieldDefinition } from '@features/field-config/custom-field.model';

@Component({
  selector: 'app-dynamic-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mb-4">
      <label [for]="field.fieldKey" class="block text-sm font-medium text-gray-700 mb-1">
        {{ field.label }}
        <span *ngIf="field.isRequired" class="text-red-500">*</span>
      </label>

      <!-- TEXT Input -->
      <input *ngIf="field.fieldType === 'TEXT'"
             type="text"
             [id]="field.fieldKey"
             [(ngModel)]="value"
             (ngModelChange)="onValueChange($event)"
             [required]="field.isRequired"
             class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">

      <!-- NUMBER Input -->
      <input *ngIf="field.fieldType === 'NUMBER'"
             type="number"
             [id]="field.fieldKey"
             [(ngModel)]="value"
             (ngModelChange)="onValueChange($event)"
             [required]="field.isRequired"
             class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">

      <!-- DATE Input -->
      <input *ngIf="field.fieldType === 'DATE'"
             type="date"
             [id]="field.fieldKey"
             [(ngModel)]="value"
             (ngModelChange)="onValueChange($event)"
             [required]="field.isRequired"
             class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">

      <!-- SELECT Input -->
      <select *ngIf="field.fieldType === 'SELECT'"
              [id]="field.fieldKey"
              [(ngModel)]="value"
              (ngModelChange)="onValueChange($event)"
              [required]="field.isRequired"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        <option value="" disabled selected>Select an option</option>
        <option *ngFor="let opt of field.options" [value]="opt">{{ opt }}</option>
      </select>

      <!-- BOOLEAN Input -->
      <div *ngIf="field.fieldType === 'BOOLEAN'" class="flex items-center">
        <input type="checkbox"
               [id]="field.fieldKey"
               [(ngModel)]="value"
               (ngModelChange)="onValueChange($event)"
               class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
        <label [for]="field.fieldKey" class="ml-2 block text-sm text-gray-900">
          {{ field.label }}
        </label>
      </div>
    </div>
  `
})
export class DynamicInputComponent {
  @Input() field!: CustomFieldDefinition;
  @Input() value: any;
  @Output() valueChange = new EventEmitter<any>();

  onValueChange(newValue: any) {
    this.valueChange.emit(newValue);
  }
}
