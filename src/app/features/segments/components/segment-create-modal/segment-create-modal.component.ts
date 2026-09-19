import { Component, OnInit, ChangeDetectorRef, ViewChild, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Segment } from '../../segment.model';
import { Crew } from '@features/field-management/subcontractor.model';
import { SegmentCreationMapComponent, SegmentCoordinates } from '../segment-creation-map/segment-creation-map.component';
import { CustomFieldDefinition } from '@features/field-config/custom-field.model';
import { DynamicInputComponent } from '@shared/components/dynamic-input/dynamic-input.component';
import { SegmentService } from '../../segment.service';
import { SubcontractorService } from '@features/field-management/subcontractor.service';
import { CustomFieldService } from '@features/field-config/custom-field.service';
import { SafetyService } from '@features/risk-planning/safety.service';
import { PlanningService } from '@features/risk-planning/planning.service';
import { WorkType } from '@shared/models/work-type.enum';
import { Netzverteiler } from '../../../infrastructure/netzverteiler.model';
import { NetzverteilerService } from '../../../infrastructure/netzverteiler.service';


@Component({
  selector: 'app-segment-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SegmentCreationMapComponent, DynamicInputComponent],
  templateUrl: './segment-create-modal.html'
})
export class SegmentCreateModalComponent implements OnInit, OnChanges {
  @ViewChild(SegmentCreationMapComponent) mapComponent!: SegmentCreationMapComponent;

  @Input() projectId!: number;
  @Input() isEditing: boolean = false;
  @Input() initialSegment: Segment | null = null;
  @Input() currentSegmentId: number | null = null;
  @Input() isEmbedded: boolean = false;
  @Input() hideMap: boolean = false;

  @Output() saved = new EventEmitter<Segment>();
  @Output() closed = new EventEmitter<void>();

  crews: Crew[] = [];
  netzverteilers: Netzverteiler[] = [];
  projectGeometry: {lat: number, lng: number}[] | null = null;

  startAddress: string = '';
  endAddress: string = '';

  customFieldDefinitions: CustomFieldDefinition[] = [];
  customFieldsData: { [key: string]: any } = {};

  availableTransitions: any[] = [];
  workType = WorkType;
  workTypeOptions = Object.values(this.workType);

  newSegment: Segment = this.getDefaultSegment();
  smartPlan: any = null;

  constructor(
    private segmentService: SegmentService,
    private subcontractorService: SubcontractorService,
    private safetyService: SafetyService,
    private customFieldService: CustomFieldService,
    private planningService: PlanningService,
    private nvtService: NetzverteilerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCrews();
    this.loadNetzverteilers();
    this.loadCustomFieldDefinitions();
    if (this.projectId) {
      this.loadProjectDetails();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialSegment']) {
      if (this.initialSegment) {
        this.newSegment = { ...this.initialSegment };
        this.startAddress = this.initialSegment.startAddress || '';
        this.endAddress = this.initialSegment.endAddress || '';
        this.customFieldsData = this.initialSegment.customFields || {};
        
        if (this.isEditing && this.currentSegmentId) {
          this.segmentService.getAvailableTransitions(this.currentSegmentId).subscribe(transitions => {
            this.availableTransitions = transitions;
          });
        }
      } else {
        this.newSegment = this.getDefaultSegment();
        this.startAddress = '';
        this.endAddress = '';
        this.customFieldsData = {};
        this.availableTransitions = [];
      }
      
      // Map requires slight delay to render fully in a modal
      setTimeout(() => {
        if (this.mapComponent) {
          this.mapComponent.invalidateSize();
        }
      }, 500);
    }
  }

  getDefaultSegment(): Segment {
    return {
      streetName: '',
      streetType: 'residential',
      workType: this.workType.EXCAVATION,
      currentState: 'PLAN',
      length: 0,
      startLatitude: 0,
      startLongitude: 0,
      endLatitude: 0,
      endLongitude: 0,
      plannedStartDate: '',
      plannedEndDate: ''
    };
  }

  loadProjectDetails() {
    this.planningService.getProjects().subscribe(projects => {
      const proj = projects.find(p => p.id === this.projectId);
      if (proj && proj.geometry && proj.geometry.length > 2) {
        this.projectGeometry = proj.geometry;
      }
    });
  }

  loadCustomFieldDefinitions() {
    this.customFieldService.getFieldsForEntity('SEGMENT').subscribe(fields => {
      this.customFieldDefinitions = fields;
    });
  }

  loadCrews() {
    this.subcontractorService.getAllCrews().subscribe(crews => {
      this.crews = crews;
    });
  }

  loadNetzverteilers() {
    this.nvtService.getAllNetzverteilers().subscribe(nvts => {
      this.netzverteilers = nvts;
    });
  }


  updateExternalCoordinates(coords: SegmentCoordinates) {
    this.onCoordinatesChanged(coords);
  }

  onCoordinatesChanged(coords: SegmentCoordinates) {
    this.newSegment.startLatitude = coords.startLat;
    this.newSegment.startLongitude = coords.startLng;
    this.newSegment.endLatitude = coords.endLat;
    this.newSegment.endLongitude = coords.endLng;
    this.newSegment.geometry = coords.geometry;
    
    if (coords.length) {
      this.newSegment.length = coords.length;
    }
    if (coords.startAddress) {
      this.startAddress = coords.startAddress;
    }
    if (coords.endAddress) {
      this.endAddress = coords.endAddress;
    }

    if (coords.startLat && coords.endLat && coords.length) {
      this.safetyService.getAutomatedPlan(coords.startLat, coords.startLng, coords.length).subscribe(plan => {
        this.smartPlan = plan;
        this.cdr.detectChanges();
      });
    }
  }

  getStateText(state: string): string {
    return state.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  closeModal() {
    this.closed.emit();
  }

  executeTransition(transition: any) {
    if (!this.currentSegmentId) return;

    this.segmentService.executeTransition(this.currentSegmentId, transition.id, this.customFieldsData).subscribe({
      next: () => {
        this.segmentService.getSegment(this.currentSegmentId!).subscribe(updated => {
          this.saved.emit(updated);
        });
      },
      error: (err) => {
        console.error('Failed to execute transition', err);
      }
    });
  }

  saveSegment() {
    if (!this.newSegment.streetName) return;

    const segmentToSave = {
      ...this.newSegment,
      customFields: this.customFieldsData
    };

    if (this.isEditing && this.currentSegmentId) {
      this.segmentService.updateSegment(this.currentSegmentId, segmentToSave).subscribe({
        next: (updated) => {
          this.saved.emit(updated);
        },
        error: (err) => {
          console.error('Failed to update segment', err);
        }
      });
    } else {
      this.segmentService.createSegment(this.projectId, segmentToSave).subscribe({
        next: (segment) => {
          this.saved.emit(segment);
        },
        error: (err) => {
          console.error('Failed to create segment', err);
        }
      });
    }
  }
}
