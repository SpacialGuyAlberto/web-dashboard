import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 transition-all hover:shadow-lg cursor-pointer" 
         [ngClass]="getBorderClass()"
         (click)="onCardClick()">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ title }}</p>
          <div class="mt-1 flex items-baseline gap-1">
            <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ value }}</span>
            <span *ngIf="unit" class="text-sm text-gray-600 dark:text-gray-300">{{ unit }}</span>
          </div>
        </div>
        <div *ngIf="icon" class="text-gray-400 dark:text-gray-500">
          <i [class]="icon"></i>
        </div>
      </div>
      
      <div *ngIf="trend !== undefined" class="mt-3 flex items-center text-xs">
        <span [ngClass]="trend > 0 ? 'text-red-500' : 'text-green-500'" class="font-bold flex items-center">
          <span *ngIf="trend > 0">↑</span>
          <span *ngIf="trend < 0">↓</span>
          {{ Math.abs(trend) }}
        </span>
        <span class="ml-1 text-gray-500 dark:text-gray-400">{{ trendLabel }}</span>
      </div>
      
      <div *ngIf="subtext" class="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {{ subtext }}
      </div>
    </div>
  `,
  styles: []
})
export class KPICardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() unit: string = '';
  @Input() trend?: number;
  @Input() trendLabel: string = '';
  @Input() status: 'success' | 'warning' | 'danger' | 'info' = 'info';
  @Input() icon: string = '';
  @Input() subtext: string = '';

  @Output() cardClick = new EventEmitter<void>();

  Math = Math;

  getBorderClass() {
    switch (this.status) {
      case 'success': return 'border-green-500';
      case 'warning': return 'border-yellow-500';
      case 'danger': return 'border-red-500';
      default: return 'border-blue-500';
    }
  }

  onCardClick() {
    this.cardClick.emit();
  }
}
