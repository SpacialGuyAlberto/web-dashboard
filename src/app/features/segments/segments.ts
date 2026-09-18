import { Component, OnInit, ChangeDetectorRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Segment } from './segment.model';
import { Crew } from '@features/field-management/subcontractor.model';
import { SafetyProtocolsComponent } from './components/safety-protocols/safety-protocols.component';
import { IncidentReportComponent } from './components/incident-report/incident-report.component';
import { SegmentCreationMapComponent, SegmentCoordinates } from './components/segment-creation-map/segment-creation-map.component';
import { CustomFieldDefinition } from '@features/field-config/custom-field.model';
import { DynamicInputComponent } from '@shared/components/dynamic-input/dynamic-input.component';
import { InventoryService } from '@features/inventory/inventory.service';
import { Material } from '@features/inventory/inventory.model';
import { SegmentService } from './segment.service';
import { SubcontractorService } from '@features/field-management/subcontractor.service';
import { CustomFieldService } from '@features/field-config/custom-field.service';
import { SafetyService } from '@features/risk-planning/safety.service';
import { PlanningService } from '@features/risk-planning/planning.service';
import { WorkType } from '@shared/models/work-type.enum';
import { GoogleMapsModule } from '@angular/google-maps';
import { SegmentCreateModalComponent } from './components/segment-create-modal/segment-create-modal.component';

@Component({
  selector: 'app-segments',
  standalone: true,
  imports: [CommonModule, FormsModule, SafetyProtocolsComponent, IncidentReportComponent, GoogleMapsModule, SegmentCreateModalComponent],
  templateUrl: './segments.html',
  styleUrls: ['./segments.css']
})
export class SegmentsComponent implements OnInit {
  @ViewChild(SegmentCreationMapComponent) mapComponent!: SegmentCreationMapComponent;

  @Input() projectId!: number;
  @Input() projectName: string = '';

  segments: Segment[] = [];
  crews: Crew[] = [];
  loading = false;
  error: string | null = null;
  
  projectGeometry: {lat: number, lng: number}[] | null = null;

  showCreateModal = false;
  showDetailsModal = false;
  isEditing = false;
  currentSegmentId: number | null = null;
  selectedSegment: Segment | null = null;
  segmentForModal: Segment | null = null;

  constructor(
    private segmentService: SegmentService,
    private subcontractorService: SubcontractorService,
    private inventoryService: InventoryService,
    private safetyService: SafetyService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private customFieldService: CustomFieldService,
    private planningService: PlanningService
  ) { }

  ngOnInit() {
    this.loadCrews();
    if (this.projectId) {
      this.loadProjectDetails();
      this.loadSegments();
    }
  }

  loadProjectDetails() {
    this.planningService.getProjects().subscribe(projects => {
      const proj = projects.find(p => p.id === this.projectId);
      if (proj && proj.geometry && proj.geometry.length > 2) {
        this.projectGeometry = proj.geometry;
      }
    });
  }

  // customFieldService and loadCustomFieldDefinitions are no longer used here

  loadCrews() {
    this.subcontractorService.getAllCrews().subscribe(crews => {
      this.crews = crews;
    });
  }

  loadSegments() {
    this.loading = true;
    this.error = null;
    this.segmentService.getProjectSegments(this.projectId).subscribe({
      next: (data) => {
        this.segments = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load segments';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }



  openCreateModal() {
    this.isEditing = false;
    this.currentSegmentId = null;
    this.segmentForModal = null;
    this.showCreateModal = true;
  }

  openEditModal(segment: Segment) {
    this.isEditing = true;
    this.currentSegmentId = segment.id!;
    this.segmentForModal = segment;
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.isEditing = false;
    this.currentSegmentId = null;
    this.segmentForModal = null;
  }

  onSegmentSaved(segment: Segment) {
    if (this.isEditing) {
      const index = this.segments.findIndex(s => s.id === segment.id);
      if (index !== -1) {
        this.segments[index] = segment;
      }
    } else {
      this.segments.push(segment);
    }
    this.closeCreateModal();
    this.cdr.detectChanges();
  }

  openDetailsModal(segment: Segment) {
    this.selectedSegment = segment;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedSegment = null;
  }

  // Segment modal methods have been extracted to SegmentCreateModalComponent

  getStateColor(state: string): string {
    const stateColors: Record<string, string> = {
      'PLAN': 'bg-gray-200 text-gray-800',
      'EXCAVATION': 'bg-yellow-200 text-yellow-800',
      'DUCT_INSTALLATION': 'bg-blue-200 text-blue-800',
      'BACKFILL': 'bg-orange-200 text-orange-800',
      'ASPHALT': 'bg-purple-200 text-purple-800',
      'DOCUMENTATION': 'bg-indigo-200 text-indigo-800',
      'QA_APPROVAL': 'bg-green-200 text-green-800',
      'COMPLETED': 'bg-green-500 text-white'
    };
    return stateColors[state] || 'bg-gray-200 text-gray-800';
  }

  getStateText(state: string): string {
    return state.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  downloadReport(segmentId: number) {
    const url = `/api/reports/segment/${segmentId}`;
    window.open(url, '_blank');
  }

  getBimStatus(segment: Segment): string {
    // Phase 3 Logic: If volume exists, BIM data is processed
    return segment.volume ? 'CERTIFIED' : 'PENDING';
  }


}
