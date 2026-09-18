import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cluster-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cluster-stats.html'
})
export class ClusterStatsComponent {
  @Input() stats: { pop: number, dp: number, acometida: number, heup: number } = { pop: 0, dp: 0, acometida: 0, heup: 0 };
  @Input() viewMode: 'map-focused' | 'split' | 'data-focused' = 'map-focused';
  @Input() panelPosition: 'left' | 'right' | 'bottom' = 'left';
}
