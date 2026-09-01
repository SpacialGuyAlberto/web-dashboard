import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-[#131415] rounded-xl p-8 border border-white/5 hover:border-white/10 transition-all cursor-pointer flex flex-col justify-between" 
         (click)="onCardClick()">
      <div class="flex justify-between items-start mb-6">
        <div>
          <p class="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em]">{{ title }}</p>
        </div>
        <div *ngIf="icon" class="text-white/20">
          <i [class]="icon"></i>
        </div>
      </div>
      
      <div>
        <div class="flex items-baseline gap-1">
          <span class="font-mono text-4xl font-normal text-white/90">{{ value }}</span>
          <span *ngIf="unit" class="text-xs text-white/30 ml-2 font-mono">{{ unit }}</span>
        </div>
        
        <div *ngIf="trend !== undefined" class="mt-4 flex items-center text-[9px] font-mono uppercase tracking-[0.2em]">
          <span [ngClass]="trend > 0 ? 'text-red-400' : 'text-[#2fb080]'" class="flex items-center">
            <span *ngIf="trend > 0" class="mr-1">&uarr;</span>
            <span *ngIf="trend < 0" class="mr-1">&darr;</span>
            {{ Math.abs(trend) }}
          </span>
          <span class="ml-2 text-white/30">{{ trendLabel }}</span>
        </div>
        
        <div *ngIf="subtext" class="mt-3 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
          {{ subtext }}
        </div>
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


  onCardClick() {
    this.cardClick.emit();
  }
}
