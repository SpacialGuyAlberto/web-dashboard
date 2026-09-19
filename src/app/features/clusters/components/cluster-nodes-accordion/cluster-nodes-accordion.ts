import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { NetworkElement } from '../../cluster-area-dashboard/cluster-area-dashboard.component';

@Component({
  selector: 'app-cluster-nodes-accordion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cluster-nodes-accordion.html'
})
export class ClusterNodesAccordionComponent {
  @Input() groupedElements: { [key: string]: NetworkElement[] } = {};
  @Input() viewMode: 'map-focused' | 'split' | 'data-focused' = 'map-focused';
  @Input() showMap: boolean = true;
  
  @Output() createRequested = new EventEmitter<'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT'>();
  @Output() nodeClicked = new EventEmitter<NetworkElement>();
  @Output() editRequested = new EventEmitter<NetworkElement>();


  expandedGroup: string = 'POP';

  toggleGroup(groupName: string) {
    this.expandedGroup = this.expandedGroup === groupName ? '' : groupName;
  }

  openModalFor(type: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT') {
    this.createRequested.emit(type);
  }

  onNodeClick(element: NetworkElement) {
    this.nodeClicked.emit(element);
  }

  onEditClick(event: Event, element: NetworkElement) {
    event.stopPropagation();
    this.editRequested.emit(element);
  }

  getColorForType(type: string): string {
    switch (type) {
      case 'POP': return '#6938ef';
      case 'DP': return '#2fb080';
      case 'ACOMETIDA': return '#fbbf24';
      case 'HEUP': return '#ef4444';
      case 'SEGMENT': return '#ff69b4';
      default: return '#ffffff';
    }
  }
}
