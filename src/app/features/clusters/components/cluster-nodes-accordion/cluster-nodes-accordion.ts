import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkElement } from '../../cluster-area-dashboard/cluster-area-dashboard.component';

@Component({
  selector: 'app-cluster-nodes-accordion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cluster-nodes-accordion.html'
})
export class ClusterNodesAccordionComponent implements OnChanges {
  @Input() groupedElements: { [key: string]: NetworkElement[] } = {};
  @Input() viewMode: 'map-focused' | 'split' | 'data-focused' = 'map-focused';
  @Input() showMap: boolean = true;
  @Input() highlightedType: string | null = null;
  
  @Output() createRequested = new EventEmitter<'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | 'HEUP'>();
  @Output() nodeClicked = new EventEmitter<NetworkElement>();
  @Output() editRequested = new EventEmitter<NetworkElement>();

  expandedGroup: string = 'POP';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['highlightedType'] && this.highlightedType) {
      const mapping: { [key: string]: string } = {
        'POP': 'POP',
        'DP': 'Netzverteiler',
        'ACOMETIDA': 'Acometidas',
        'HEUP': 'HEÜPs',
        'SEGMENT': 'Segments'
      };
      if (mapping[this.highlightedType]) {
        this.expandedGroup = mapping[this.highlightedType];
      }
    }
  }

  toggleGroup(group: string) {
    this.expandedGroup = this.expandedGroup === group ? '' : group;
  }

  openModalFor(type: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | 'HEUP') {
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
