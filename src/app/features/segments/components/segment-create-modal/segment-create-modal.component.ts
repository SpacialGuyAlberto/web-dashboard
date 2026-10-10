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
import { ToastService } from '@core/notifications/toast.service';
import { ScheduleComponent } from '@features/schedule/schedule.component';

@Component({
  selector: 'app-segment-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SegmentCreationMapComponent, DynamicInputComponent, ScheduleComponent],
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
  crewSchedule: Segment[] = [];

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
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
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
      const seg = changes['initialSegment'].currentValue;
      console.log('SegmentCreateModalComponent ngOnChanges initialSegment:', seg);
      if (seg && Object.keys(seg).length > 0) {
        this.newSegment = { ...this.getDefaultSegment(), ...seg };
        this.startAddress = seg.startAddress || '';
        this.endAddress = seg.endAddress || '';
        this.customFieldsData = seg.customFields || {};
        
        if (this.isEditing && this.currentSegmentId) {
          this.segmentService.getAvailableTransitions(this.currentSegmentId).subscribe(transitions => {
            this.availableTransitions = transitions;
            this.cdr.detectChanges();
          });
        }
      } else {
        this.newSegment = this.getDefaultSegment();
        this.startAddress = '';
        this.endAddress = '';
        this.customFieldsData = {};
        this.availableTransitions = [];
      }
      
      if (this.newSegment.assignedCrewId) {
         this.onCrewChanged();
      }
      
      this.cdr.detectChanges();
      
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
      if (this.newSegment.assignedCrewId) {
         this.onCrewChanged();
      }
    });
  }

  onCrewChanged() {
    if (!this.newSegment.assignedCrewId) {
       this.crewSchedule = [];
       return;
    }
    this.segmentService.getCrewSchedule(this.newSegment.assignedCrewId).subscribe({
       next: (schedule) => {
         // Filter out the current segment being edited
         this.crewSchedule = schedule.filter(s => s.id !== this.currentSegmentId);
         this.cdr.detectChanges();
       },
       error: (err) => {
         console.error('Failed to load crew schedule', err);
         this.crewSchedule = [];
       }
    });
  }

  get conflictingSegments(): Segment[] {
    if (!this.newSegment.plannedStartDate || !this.newSegment.plannedEndDate) {
       return [];
    }
    const start = new Date(this.newSegment.plannedStartDate).getTime();
    const end = new Date(this.newSegment.plannedEndDate).getTime();
    
    return this.crewSchedule.filter(seg => {
       if (!seg.plannedStartDate || !seg.plannedEndDate) return true; // Segments without dates are technically blocking
       const segStart = new Date(seg.plannedStartDate).getTime();
       const segEnd = new Date(seg.plannedEndDate).getTime();
       return (segStart <= end && segEnd >= start);
    });
  }

  get hasConflict(): boolean {
     return this.conflictingSegments.length > 0;
  }

  get isDateInvalid(): boolean {
     if (!this.newSegment.plannedStartDate || !this.newSegment.plannedEndDate) return false;
     const start = new Date(this.newSegment.plannedStartDate).getTime();
     const end = new Date(this.newSegment.plannedEndDate).getTime();
     return start > end;
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

    if (coords.geometry && coords.geometry.length > 0) {
      this.newSegment.startElevation = coords.geometry[0].z || 0;
      this.newSegment.endElevation = coords.geometry[coords.geometry.length - 1].z || 0;
      this.fetchMissingElevations(coords.geometry);
    }
    
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
      });
    }
  }

  private fetchMissingElevations(geometry: {lat: number, lng: number, z?: number}[]) {
    const missing = geometry.filter(p => p.z === undefined || p.z === null);
    if (missing.length === 0) return;

    const elevationService = new google.maps.ElevationService();
    // Chunk requests if needed (max 512 locations per request)
    const chunkSize = 500;
    for (let i = 0; i < missing.length; i += chunkSize) {
      const chunk = missing.slice(i, i + chunkSize);
      const locations = chunk.map(p => ({ lat: p.lat, lng: p.lng }));
      
      elevationService.getElevationForLocations({ locations }, (results, status) => {
        if (status === google.maps.ElevationStatus.OK && results) {
          for (let j = 0; j < chunk.length; j++) {
            chunk[j].z = Math.round(results[j].elevation * 100) / 100;
          }
        }
      });
    }
  }

  public get vectors() {
    const geom = this.newSegment?.geometry;
    if (!geom || geom.length < 2) return [];
    
    const vecs = [];
    for (let i = 0; i < geom.length - 1; i++) {
        const p1 = geom[i];
        const p2 = geom[i + 1];
        
        const startZ = p1.z || 0;
        const endZ = p2.z || 0;
        
        const p1LatLng = new google.maps.LatLng(p1.lat, p1.lng);
        const p2LatLng = new google.maps.LatLng(p2.lat, p2.lng);
        const distance = google.maps.geometry.spherical.computeDistanceBetween(p1LatLng, p2LatLng);
        
        let slope = 0;
        if (distance > 0) {
            slope = ((endZ - startZ) / distance) * 100;
        }
        
        vecs.push({
            index: i + 1,
            startZ: startZ,
            endZ: endZ,
            distance: distance,
            slope: slope
        });
    }
    return vecs;
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
          this.handleFencingAndEmit(updated);
        },
        error: (err) => {
          console.error('Failed to update segment', err);
          const errorMsg = err.error?.message || err.error?.error || err.message || 'Failed to update segment';
          this.toastService.error(errorMsg);
        }
      });
    } else {
      this.segmentService.createSegment(this.projectId, segmentToSave).subscribe({
        next: (segment) => {
          this.handleFencingAndEmit(segment);
        },
        error: (err) => {
          console.error('Failed to create segment', err);
          const errorMsg = err.error?.message || err.error?.error || err.message || 'Failed to create segment';
          this.toastService.error(errorMsg);
        }
      });
    }
  }

  private handleFencingAndEmit(segment: Segment) {
    if (this.newSegment.fencingStrategy && this.newSegment.fencingStrategy !== 'none' && segment.id) {
      this.segmentService.generateFencingPlan(segment.id, this.newSegment.fencingStrategy).subscribe({
        next: (plan) => {
          console.log('Fencing Plan generated:', plan);
          this.saved.emit(segment);
        },
        error: (err) => {
          console.error('Failed to generate fencing plan', err);
          this.saved.emit(segment); // Emit anyway to close modal
        }
      });
    } else {
      this.saved.emit(segment);
    }
  }
}
