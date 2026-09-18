import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SegmentCreateModalComponent } from '../../../segments/components/segment-create-modal/segment-create-modal.component';

@Component({
  selector: 'app-cluster-node-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SegmentCreateModalComponent],
  templateUrl: './cluster-node-form.html'
})
export class ClusterNodeFormComponent {
  @Input() activeDrawTool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | null = null;
  @Input() isEditing: boolean = false;
  @Input() tempMarker: { lat: number, lng: number } | null = null;
  @Input() newNodeData: any = {};
  
  @Output() saveRequested = new EventEmitter<void>();
  @Output() segmentSaved = new EventEmitter<any>();
  
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
}
