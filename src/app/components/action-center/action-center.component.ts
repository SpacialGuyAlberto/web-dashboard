import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActionItem {
    id: string;
    title: string;
    description: string;
    impact: 'Critical' | 'High' | 'Medium';
    segmentId?: number;
}

@Component({
    selector: 'app-action-center',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow h-full">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="text-blue-500">⚡</span> Action Center
        </h3>
        <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{{ actions.length }} Pending</span>
      </div>
      
      <div class="p-2 space-y-2 overflow-y-auto max-h-[400px]">
        <div *ngFor="let action of actions" class="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-bold text-sm text-gray-900 dark:text-white">{{ action.title }}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ action.description }}</p>
              <div class="mt-2 flex items-center gap-2">
                <span class="text-xs font-bold px-2 py-0.5 rounded" 
                  [ngClass]="{
                    'bg-red-100 text-red-800': action.impact === 'Critical',
                    'bg-orange-100 text-orange-800': action.impact === 'High',
                    'bg-yellow-100 text-yellow-800': action.impact === 'Medium'
                  }">
                  {{ action.impact }} Impact
                </span>
                <span *ngIf="action.segmentId" class="text-xs text-gray-500">Seg #{{ action.segmentId }}</span>
              </div>
            </div>
            <button (click)="onApply.emit(action)" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded transition-colors">
              Apply
            </button>
          </div>
        </div>
        
        <div *ngIf="actions.length === 0" class="text-center py-8 text-gray-500">
          No pending actions. Great job!
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class ActionCenterComponent {
    @Input() actions: ActionItem[] = [];
    @Output() onApply = new EventEmitter<ActionItem>();
}
