import { Component, OnInit, ChangeDetectorRef, HostListener, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PopService } from '../../infrastructure/pop.service';
import { NetzverteilerService } from '../../infrastructure/netzverteiler.service';
import { SegmentService } from '../../segments/segment.service';
import { Pop } from '../../infrastructure/pop.model';
import { Netzverteiler } from '../../infrastructure/netzverteiler.model';
import { Segment } from '../../segments/segment.model';
import { HuepService } from '../../infrastructure/huep.service';
import { Huep } from '../../infrastructure/huep.model';

import { ClusterMapComponent } from '../components/cluster-map/cluster-map';
import { combineLatest } from 'rxjs';
import { ClusterStatsComponent } from '../components/cluster-stats/cluster-stats';
import { ClusterNodesAccordionComponent } from '../components/cluster-nodes-accordion/cluster-nodes-accordion';
import { ClusterNodeFormComponent } from '../components/cluster-node-form/cluster-node-form';

export interface NetworkElement {
  id: string;
  type: 'POP' | 'DP' | 'ACOMETIDA' | 'HEUP' | 'SEGMENT';
  name: string;
  lat: number;
  lng: number;
  status: 'PLANNED' | 'ACTIVE' | 'ERROR';
  createdBy?: string;
  createdAt?: Date;
  forecastDate?: Date;
  budget?: number;
  contractor?: string;
}

@Component({
  selector: 'app-cluster-area-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ClusterMapComponent,
    ClusterStatsComponent,
    ClusterNodesAccordionComponent,
    ClusterNodeFormComponent
  ],
  templateUrl: './cluster-area-dashboard.html',
  styleUrls: ['./cluster-area-dashboard.css']
})
export class ClusterAreaDashboardComponent implements OnInit {
  projectId!: number;
  projectName!: string;
  clusterId!: number;
  
  isEditing: boolean = false;

  center: google.maps.LatLngLiteral = { lat: 52.5200, lng: 13.4050 };
  zoom = 16;
  
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true, zoomControl: true, mapTypeId: 'roadmap', tilt: 0,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
      { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
      { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
      { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
      { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
      { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
      { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
    ]
  };

  map3DOptions: google.maps.MapOptions = {
    disableDefaultUI: true, zoomControl: true, mapTypeId: 'roadmap', tilt: 45, heading: 0, mapId: '8f000b200b3e6c38',
    styles: this.mapOptions.styles
  };

  elements: NetworkElement[] = [];
  segments: Segment[] = [];
  stats = { pop: 0, dp: 0, acometida: 0, heup: 0, segment: 0 };
  groupedElements: { [key: string]: NetworkElement[] } = { 'POP': [], 'Netzverteiler': [], 'Acometidas': [], 'HEÜPs': [], 'Segments': [] };
  
  isSidebarOpen = true;
  viewMode: 'map-focused' | 'split' | 'data-focused' = 'map-focused';
  panelPosition: 'left' | 'right' | 'bottom' = 'left';
  showMap: boolean = true;
  isMapEditMode = false;
  is3DMode = false;
  activeDrawTool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | null = null;
  tempMarker: { lat: number, lng: number } | null = null;
  newNodeData: any = {};
  availablePops: Pop[] = [];
  
  @ViewChild(ClusterMapComponent) clusterMap!: ClusterMapComponent;

  // Resizing state
  isResizing = false;
  panelWidth = 450;
  panelHeight = 350;
  minPanelWidth = 300;
  minPanelHeight = 200;

  projections = {
    totalBudget: 450000,
    spent: 125000,
    completionDate: new Date(2027, 5, 15),
    completionPercentage: 28,
    upcomingMilestone: 'Deploy Backbone Fiber to DP-02'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private popService: PopService,
    private nvtService: NetzverteilerService,
    private segmentService: SegmentService,
    private huepService: HuepService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).subscribe(([params, queryParams]) => {
      this.clusterId = +params['clusterId'];
      this.projectId = +queryParams['projectId'];
      this.projectName = queryParams['projectName'] || 'Project';
      
      if (this.projectId && this.clusterId) {
        this.loadClusterData();
      }
    });
  }

  loadClusterData() {
    this.elements = [];
    
    this.popService.getAllPops().subscribe(pops => {
      this.availablePops = pops.filter(p => p.clusterId === this.clusterId);
      this.availablePops.forEach(p => {
        this.elements.push({ id: p.id ? p.id.toString() : 'POP-?', type: 'POP', name: p.name || 'Unnamed POP', lat: (p as any).latitude || this.center.lat, lng: (p as any).longitude || this.center.lng, status: 'PLANNED', createdAt: new Date() });
      });
      this.calculateStats();
    });

    this.nvtService.getAllNetzverteilers().subscribe(nvts => {
      nvts.forEach(n => {
        this.elements.push({ id: n.id ? n.id.toString() : 'DP-?', type: 'DP', name: (n as any).identifier || 'Unnamed DP', lat: (n as any).latitude || this.center.lat + 0.001, lng: (n as any).longitude || this.center.lng + 0.001, status: 'PLANNED', createdAt: new Date() });
      });
      this.calculateStats();
    });

    if (this.projectId) {
      this.segmentService.getProjectSegments(this.projectId).subscribe(segments => {
        this.segments = segments;
        segments.forEach(s => {
          this.elements.push({ id: s.id ? s.id.toString() : 'AC-?', type: 'SEGMENT', name: (s.workType ? s.workType + ' ' : '') + 'Segment ' + s.length + 'm', lat: s.geometry && s.geometry.length > 0 ? s.geometry[0].lat : this.center.lat - 0.001, lng: s.geometry && s.geometry.length > 0 ? s.geometry[0].lng : this.center.lng - 0.001, status: 'PLANNED', createdAt: new Date() });
        });
        this.calculateStats();
      });
    }
  }

  calculateStats() {
    this.stats = {
      pop: this.elements.filter(e => e.type === 'POP').length,
      dp: this.elements.filter(e => e.type === 'DP').length,
      acometida: this.elements.filter(e => e.type === 'ACOMETIDA').length,
      heup: this.elements.filter(e => e.type === 'HEUP').length,
      segment: this.elements.filter(e => e.type === 'SEGMENT').length
    };
    
    this.groupedElements = {
      'POP': this.elements.filter(e => e.type === 'POP'),
      'Netzverteiler': this.elements.filter(e => e.type === 'DP'),
      'Acometidas': this.elements.filter(e => e.type === 'ACOMETIDA'),
      'HEÜPs': this.elements.filter(e => e.type === 'HEUP'),
      'Segments': this.elements.filter(e => e.type === 'SEGMENT')
    };
    this.cdr.detectChanges();
  }

  // Layout Handlers
  toggleMap() {
    this.showMap = !this.showMap;
    if (this.showMap && this.clusterMap) {
      this.clusterMap.triggerMapResize();
    }
  }

  setViewMode(mode: 'map-focused' | 'split' | 'data-focused') {
    this.viewMode = mode;
    if (isPlatformBrowser(this.platformId)) {
      if (mode === 'map-focused') { this.panelWidth = 450; this.panelHeight = 350; } 
      else if (mode === 'split') { this.panelWidth = window.innerWidth * 0.45; this.panelHeight = window.innerHeight * 0.5; }
    }
    if (this.clusterMap) this.clusterMap.triggerMapResize();
  }

  setPanelPosition(pos: 'left' | 'right' | 'bottom') {
    this.panelPosition = pos;
    if (this.clusterMap) this.clusterMap.triggerMapResize();
  }

  // Resizer Events
  onResizeStart(event: MouseEvent) {
    if (this.viewMode === 'data-focused') return;
    this.isResizing = true;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing || !isPlatformBrowser(this.platformId)) return;
    if (this.panelPosition === 'left') { this.panelWidth = Math.max(this.minPanelWidth, event.clientX); } 
    else if (this.panelPosition === 'right') { this.panelWidth = Math.max(this.minPanelWidth, window.innerWidth - event.clientX); } 
    else if (this.panelPosition === 'bottom') { this.panelHeight = Math.max(this.minPanelHeight, window.innerHeight - event.clientY); }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isResizing) {
      this.isResizing = false;
      if (this.clusterMap) this.clusterMap.triggerMapResize();
    }
  }

  // Map Interaction Handlers
  onMapClicked(event: {lat: number, lng: number, address: string}) {
    this.tempMarker = { lat: event.lat, lng: event.lng };
    this.newNodeData.locationAddress = event.address;
    this.newNodeData.name = event.address;
  }
  
  @ViewChild(ClusterNodeFormComponent) clusterNodeForm!: ClusterNodeFormComponent;

  onSegmentUpdated(event: any) {
    if (this.clusterNodeForm) {
      this.clusterNodeForm.updateSegmentCoordinates(event);
    }
  }
  
  onSegmentReset() {
    if (this.clusterNodeForm) {
       this.clusterNodeForm.updateSegmentCoordinates({
          geometry: [], length: 0, startLat: 0, startLng: 0, endLat: 0, endLng: 0, startAddress: '', endAddress: ''
       });
    }
  }

  handleDrawToolChanged(tool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | null) {
    this.activeDrawTool = tool;
    this.tempMarker = null;
    this.newNodeData = {};
  }

  handleToggle3DMode() {
    this.is3DMode = !this.is3DMode;
  }

  handleExitEditMode() {
    this.isMapEditMode = false;
    this.activeDrawTool = null;
    this.tempMarker = null;
  }

  openModalFor(type: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT') {
    this.showMap = true;
    this.isMapEditMode = true;
    this.setViewMode('map-focused');
    this.activeDrawTool = type;
    this.tempMarker = null;
    this.newNodeData = {};
  }

  onNodeClicked(element: NetworkElement) {
    if (element.type === 'POP') {
      this.router.navigate(['/project-details/clusters', this.clusterId, 'pop', element.id], { queryParams: { projectId: this.projectId, projectName: this.projectName } });
    } else if (element.type === 'DP') {
      this.router.navigate(['/project-details/clusters', this.clusterId, 'dp', element.id], { queryParams: { projectId: this.projectId, projectName: this.projectName } });
    }
  }

  onEditNodeRequested(element: NetworkElement) {
    this.showMap = true;
    this.isMapEditMode = true;
    this.setViewMode('map-focused');
    this.activeDrawTool = element.type as any;
    this.tempMarker = { lat: element.lat, lng: element.lng };
    this.isEditing = true;

    // Fetch or construct full node data based on type
    if (element.type === 'POP') {
       this.popService.getPop(parseInt(element.id)).subscribe(pop => {
          this.newNodeData = { ...pop };
       });
    } else if (element.type === 'DP') {
       this.nvtService.getNetzverteiler(parseInt(element.id)).subscribe(dp => {
          this.newNodeData = { ...dp };
       });
    } else if (element.type === 'SEGMENT' || element.type === 'ACOMETIDA') {
       this.segmentService.getSegment(parseInt(element.id)).subscribe(segment => {
          this.newNodeData = { ...segment };
       });
    } else {
       this.newNodeData = { ...element };
    }
  }

  goBack() {
    this.router.navigate(['/project-details'], { queryParams: { projectId: this.projectId, projectName: this.projectName } });
  }

  // Data saving
  saveNode() {
    if (!this.tempMarker) return;

    if (this.activeDrawTool === 'POP') {
      const pop: any = { clusterId: this.clusterId, name: this.newNodeData.name, locationAddress: this.newNodeData.locationAddress, maxCapacityPorts: this.newNodeData.maxCapacityPorts, latitude: this.tempMarker.lat, longitude: this.tempMarker.lng };
      if (this.isEditing) {
        this.popService.updatePop(this.newNodeData.id, pop as Pop).subscribe(() => { this.loadClusterData(); this.tempMarker = null; this.isEditing = false; });
      } else {
        this.popService.createPop(pop as Pop).subscribe(() => { this.loadClusterData(); this.tempMarker = null; });
      }
    } else if (this.activeDrawTool === 'DP') {
      const dp: any = { popId: this.newNodeData.popId, identifier: this.newNodeData.identifier, locationAddress: this.newNodeData.locationAddress, latitude: this.tempMarker.lat, longitude: this.tempMarker.lng };
      if (this.isEditing) {
        this.nvtService.updateNetzverteiler(this.newNodeData.id, dp as Netzverteiler).subscribe(() => { this.loadClusterData(); this.tempMarker = null; this.isEditing = false; });
      } else {
        this.nvtService.createNetzverteiler(dp as Netzverteiler).subscribe(() => { this.loadClusterData(); this.tempMarker = null; });
      }
    } else if (this.activeDrawTool === 'ACOMETIDA') {
      const seg: Segment = { streetName: this.newNodeData.name || 'Custom Segment', streetType: 'UNKNOWN', workType: 'UNKNOWN', currentState: 'PLANNED', length: 50, geometry: [ { lat: this.tempMarker.lat, lng: this.tempMarker.lng }, { lat: this.tempMarker.lat + 0.0005, lng: this.tempMarker.lng + 0.0005 } ] };
      this.segmentService.createSegment(this.projectId, seg).subscribe(() => { this.loadClusterData(); this.tempMarker = null; });
    }
  }

  onSegmentSaved(segment: any) {
    this.activeDrawTool = null;
    this.tempMarker = null;
    this.isEditing = false;
    this.loadClusterData();
  }
}
