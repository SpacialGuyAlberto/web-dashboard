import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SegmentCreateModalComponent } from '../../../segments/components/segment-create-modal/segment-create-modal.component';
import { Pop } from '../../../infrastructure/pop.model';

@Component({
  selector: 'app-cluster-node-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SegmentCreateModalComponent],
  templateUrl: './cluster-node-form.html'
})
export class ClusterNodeFormComponent {
  @Input() activeDrawTool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | 'HEUP' | null = null;
  @Input() isEditing: boolean = false;
  @Input() tempMarker: { lat: number, lng: number } | null = null;
  @Input() newNodeData: any = {};
  @Input() projectId!: number;
  @Input() availablePops: Pop[] = [];
  
  @Output() saveRequested = new EventEmitter<void>();
  @Output() segmentSaved = new EventEmitter<any>();
  @Output() locateRequested = new EventEmitter<{lat: number, lng: number}>();
  
  @ViewChild(SegmentCreateModalComponent) segmentModal!: SegmentCreateModalComponent;

  onSave() {
    this.saveRequested.emit();
  }

  onSegmentSaved(segment: any) {
    this.segmentSaved.emit(segment);
  }
  
  updateSegmentCoordinates(event: any) {
    if (this.segmentModal) {
      this.segmentModal.updateExternalCoordinates(event);
    }
  }

  selectPop(pop: Pop) {
    this.newNodeData.popId = pop.id;
  }

  locatePop(event: Event, pop: Pop) {
    event.stopPropagation();
    if (pop.latitude && pop.longitude) {
      this.locateRequested.emit({ lat: pop.latitude, lng: pop.longitude });
    }
  }
}
