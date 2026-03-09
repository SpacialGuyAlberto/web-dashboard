import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SegmentService, Segment } from '../../services/segment.service';
import { SubcontractorService, Crew } from '../../services/subcontractor.service';
import { SafetyProtocolsComponent } from '../../components/safety-protocols/safety-protocols.component';
import { IncidentReportComponent } from '../../components/incident-report/incident-report.component';
import { SegmentCreationMapComponent, SegmentCoordinates } from '../../components/segment-creation-map/segment-creation-map.component';
import { CustomFieldService, CustomFieldDefinition } from '../../services/custom-field.service';
import { DynamicInputComponent } from '../../components/dynamic-input/dynamic-input.component';
import { InventoryService, Material } from '../../services/inventory.service';
import { SafetyService } from '../../services/safety.service';

import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-segments',
  standalone: true,
  imports: [CommonModule, FormsModule, SafetyProtocolsComponent, IncidentReportComponent, SegmentCreationMapComponent, DynamicInputComponent, GoogleMapsModule],
  templateUrl: './segments.html',
  styleUrls: ['./segments.css']
})
export class SegmentsComponent implements OnInit {
  @ViewChild(SegmentCreationMapComponent) mapComponent!: SegmentCreationMapComponent;

  projectId!: number;
  projectName: string = '';
  segments: Segment[] = [];
  crews: Crew[] = [];
  loading = false;
  error: string | null = null;

  // Tabs
  activeTab: 'segments' | 'materials' = 'segments';
  projectMaterials: Material[] = [];

  showCreateModal = false;
  showDetailsModal = false;
  isEditing = false;
  currentSegmentId: number | null = null;
  selectedSegment: Segment | null = null;

  // Transient address fields for UI
  startAddress: string = '';
  endAddress: string = '';

  // Custom Fields
  customFieldDefinitions: CustomFieldDefinition[] = [];
  customFieldsData: { [key: string]: any } = {};

  // Workflow
  availableTransitions: any[] = [];

  newSegment: Segment = {
    streetName: '',
    streetType: 'residential',
    workType: 'EXCAVATION',
    currentState: 'PLAN',
    length: 0,
    startLatitude: 0,
    startLongitude: 0,
    endLatitude: 0,
    endLongitude: 0,
    plannedStartDate: '',
    plannedEndDate: ''
  };

  constructor(
    private segmentService: SegmentService,
    private subcontractorService: SubcontractorService,
    private inventoryService: InventoryService,
    private safetyService: SafetyService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private customFieldService: CustomFieldService
  ) { }

  smartPlan: any = null;

  ngOnInit() {
    this.loadCrews();
    this.loadCustomFieldDefinitions();
    this.route.queryParams.subscribe(params => {
      this.projectId = +params['projectId'];
      this.projectName = params['projectName'] || 'Project';
      if (this.projectId) {
        this.loadSegments();
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

  loadProjectMaterials() {
    this.inventoryService.getAllMaterials().subscribe({
      next: (materials) => {
        // Filter materials that have allocation for this project
        // Note: In a real backend, we'd have a specific endpoint like /api/projects/{id}/materials
        this.projectMaterials = materials.filter(m =>
          m.projectAllocations && m.projectAllocations.some(a => a.projectId == this.projectId.toString())
        );

        // Mocking some data if empty for demo purposes (since we just added the feature)
        if (this.projectMaterials.length === 0) {
          this.projectMaterials = materials.slice(0, 3).map(m => ({
            ...m,
            projectAllocations: [{ projectId: this.projectId.toString(), projectName: this.projectName, quantityAllocated: Math.floor(Math.random() * 500) + 50 }]
          }));
        }
      }
    });
  }

  switchTab(tab: 'segments' | 'materials') {
    this.activeTab = tab;
    if (tab === 'materials') {
      this.loadProjectMaterials();
    }
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentSegmentId = null;
    this.newSegment = {
      streetName: '',
      streetType: 'residential',
      workType: 'EXCAVATION',
      currentState: 'PLAN',
      length: 0,
      startLatitude: 0,
      startLongitude: 0,
      endLatitude: 0,
      endLongitude: 0,
      plannedStartDate: '',
      plannedEndDate: ''
    };
    this.startAddress = '';
    this.endAddress = '';
    this.customFieldsData = {}; // Reset custom fields
    this.availableTransitions = []; // No transitions for new segment (starts at initial state)
    this.showCreateModal = true;

    // Invalidate map size after modal opens - increased timeout
    setTimeout(() => {
      if (this.mapComponent) {
        this.mapComponent.invalidateSize();
      }
    }, 500);
  }

  openEditModal(segment: Segment) {
    this.isEditing = true;
    this.currentSegmentId = segment.id!;
    this.newSegment = { ...segment };
    this.startAddress = ''; // TODO: If we saved address, load it here
    this.endAddress = '';
    this.customFieldsData = segment.customFields || {}; // Load existing custom fields
    this.showCreateModal = true;

    // Load available transitions
    this.segmentService.getAvailableTransitions(segment.id!).subscribe(transitions => {
      this.availableTransitions = transitions;
    });

    // Invalidate map size after modal opens - increased timeout
    setTimeout(() => {
      if (this.mapComponent) {
        this.mapComponent.invalidateSize();
      }
    }, 500);
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.isEditing = false;
    this.currentSegmentId = null;
    this.startAddress = '';
    this.endAddress = '';
  }

  openDetailsModal(segment: Segment) {
    this.selectedSegment = segment;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedSegment = null;
  }

  onCoordinatesChanged(coords: SegmentCoordinates) {
    this.newSegment.startLatitude = coords.startLat;
    this.newSegment.startLongitude = coords.startLng;
    this.newSegment.endLatitude = coords.endLat;
    this.newSegment.endLongitude = coords.endLng;
    this.newSegment.geometry = coords.geometry; // Save 3D geometry
    if (coords.length) {
      this.newSegment.length = coords.length;
    }
    if (coords.startAddress) {
      this.startAddress = coords.startAddress;
    }
    if (coords.endAddress) {
      this.endAddress = coords.endAddress;
    }

    // Fetch Smart Plan Suggestion if we have coordinates and length
    if (coords.startLat && coords.endLat && coords.length) {
      this.safetyService.getAutomatedPlan(coords.startLat, coords.startLng, coords.length).subscribe(plan => {
        this.smartPlan = plan;
        this.cdr.detectChanges();
      });
    }
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
          const index = this.segments.findIndex(s => s.id === updated.id);
          if (index !== -1) {
            this.segments[index] = updated;
          }
          this.closeCreateModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to update segment';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.segmentService.createSegment(this.projectId, segmentToSave).subscribe({
        next: (segment) => {
          this.segments.push(segment);
          this.closeCreateModal();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to create segment';
          this.cdr.detectChanges();
        }
      });
    }
  }

  executeTransition(transition: any) {
    if (!this.currentSegmentId) return;

    this.segmentService.executeTransition(this.currentSegmentId, transition.id, this.customFieldsData).subscribe({
      next: () => {
        // Refresh segment to get new state
        this.segmentService.getSegment(this.currentSegmentId!).subscribe(updated => {
          const index = this.segments.findIndex(s => s.id === updated.id);
          if (index !== -1) {
            this.segments[index] = updated;
          }
          this.closeCreateModal();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.error = 'Failed to execute transition';
        this.cdr.detectChanges();
      }
    });
  }

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

  goBack() {
    this.router.navigate(['/projects']);
  }
}
