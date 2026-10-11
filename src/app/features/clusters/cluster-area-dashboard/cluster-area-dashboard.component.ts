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
import { IntelligenceService } from '../infrastructure/intelligence.service';
import { UtilityLineService } from '../../infrastructure/utility-line.service';
import { UtilityLine as UtilityLineModel } from '../../infrastructure/utility-line.model';
import { ClusterService } from '../cluster.service';
import { PlanningService } from '../../risk-planning/planning.service';

import { ClusterMapComponent } from '../components/cluster-map/cluster-map';
import { combineLatest } from 'rxjs';
import { ClusterStatsComponent } from '../components/cluster-stats/cluster-stats';
import { ClusterNodesAccordionComponent } from '../components/cluster-nodes-accordion/cluster-nodes-accordion';
import { ClusterNodeFormComponent } from '../components/cluster-node-form/cluster-node-form';
import { PlanImporterComponent } from '../../gis/components/plan-importer/plan-importer.component';

export interface NetworkElement {
  id: string;
  type: 'POP' | 'DP' | 'ACOMETIDA' | 'HEUP' | 'SEGMENT' | 'AGUA' | 'GAS' | 'ELECTRICIDAD';
  name: string;
  lat: number;
  lng: number;
  status: 'PLANNED' | 'ACTIVE' | 'ERROR';
  createdBy?: string;
  createdAt?: Date;
  forecastDate?: Date;
  company?: string;
  material?: string;
  budget?: number;
  contractor?: string;
  geometry?: any[];
  planUrl?: string;
  planBounds?: any;
}

@Component({
  selector: 'app-cluster-area-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ClusterMapComponent,
    ClusterStatsComponent,
    ClusterNodesAccordionComponent,
    ClusterNodeFormComponent,
    PlanImporterComponent
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
  groupedElements: { [key: string]: NetworkElement[] } = { 
    'POP': [], 'Netzverteiler': [], 'Acometidas': [], 'HEÜPs': [], 'Segments': [],
    'Agua': [], 'Gas': [], 'Electricidad': []
  };
  
  isSidebarOpen = true;
  viewMode: 'map-focused' | 'split' | 'data-focused' = 'map-focused';
  panelPosition: 'left' | 'right' | 'bottom' = 'left';
  showMap: boolean = true;
  isMapEditMode = false;
  is3DMode = false;
  activeDrawTool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | 'HEUP' | 'AGUA' | 'GAS' | 'ELECTRICIDAD' | null = null;
  tempMarker: { lat: number, lng: number } | null = null;
  newNodeData: any = {};
  availablePops: Pop[] = [];
  highlightedType: string | null = null;
  impactedElementIds: string[] = []; // IDs of nodes impacted by a risk scenario

  // External Plans State
  showPlanImporter = false;
  planImportType = 'WATER'; // WATER, GAS, ELECTRICITY
  isPlanAlignMode = false;
  alignPlanData: any = null;
  
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
    private intelligenceService: IntelligenceService,
    private clusterService: ClusterService,
    private planningService: PlanningService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private utilityLineService: UtilityLineService
  ) {}

  ngOnInit() {
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).subscribe(([params, queryParams]) => {
      this.clusterId = +params['clusterId'];
      this.projectId = +queryParams['projectId'];
      this.projectName = queryParams['projectName'] || 'Project';

      if (queryParams['lat'] && queryParams['lng']) {
        const qLat = +queryParams['lat'];
        const qLng = +queryParams['lng'];
        if (!isNaN(qLat) && !isNaN(qLng)) {
          this.center = { lat: qLat, lng: qLng };
          if (this.clusterMap && this.clusterMap.map && this.clusterMap.map.googleMap) {
            this.clusterMap.map.googleMap.panTo(this.center);
          }
        }
      }

      if (this.clusterId) {
        this.clusterService.getCluster(this.clusterId).subscribe({
          next: (cluster) => {
            if (cluster.latitude && cluster.longitude && !isNaN(cluster.latitude) && !isNaN(cluster.longitude)) {
              this.center = { lat: cluster.latitude, lng: cluster.longitude };
              if (this.clusterMap && this.clusterMap.map && this.clusterMap.map.googleMap) {
                this.clusterMap.map.googleMap.panTo(this.center);
              }
              this.cdr.detectChanges();
            }
          },
          error: (err) => console.warn('Could not fetch cluster coords:', err)
        });
      }

      if (this.projectId) {
        this.planningService.getProject(this.projectId).subscribe({
          next: (project) => {
            const lat = project.latitude ?? project.startLatitude ?? (project.geometry && project.geometry.length > 0 ? project.geometry[0].lat : undefined);
            const lng = project.longitude ?? project.startLongitude ?? (project.geometry && project.geometry.length > 0 ? project.geometry[0].lng : undefined);
            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
              // If center is still at Berlin fallback, update to project location
              if (Math.abs(this.center.lat - 52.5200) < 0.001 && Math.abs(this.center.lng - 13.4050) < 0.001) {
                this.center = { lat, lng };
                if (this.clusterMap && this.clusterMap.map && this.clusterMap.map.googleMap) {
                  this.clusterMap.map.googleMap.panTo(this.center);
                }
                this.cdr.detectChanges();
              }
            }
          },
          error: (err) => console.warn('Could not fetch project coords:', err)
        });
      }
      
      if (this.projectId && this.clusterId) {
        this.loadClusterData();
      }
    });
  }

  loadClusterData() {
    this.elements = [];
    
    combineLatest([
      this.popService.getAllPops(),
      this.nvtService.getAllNetzverteilers(),
      this.utilityLineService.getAll()
    ]).subscribe(([pops, nvts, utilities]) => {
      this.availablePops = pops.filter(p => p.clusterId === this.clusterId);
      const popIdsInCluster = this.availablePops.map(p => p.id);

      this.availablePops.forEach(p => {
        this.elements.push({ id: p.id ? p.id.toString() : 'POP-?', type: 'POP', name: p.name || 'Unnamed POP', lat: (p as any).latitude || this.center.lat, lng: (p as any).longitude || this.center.lng, status: 'PLANNED', createdAt: new Date() });
      });

      const clusterNvts = nvts.filter(n => popIdsInCluster.includes((n as any).popId));
      clusterNvts.forEach(n => {
        this.elements.push({ id: n.id ? n.id.toString() : 'DP-?', type: 'DP', name: (n as any).identifier || 'Unnamed DP', lat: (n as any).latitude || this.center.lat + 0.001, lng: (n as any).longitude || this.center.lng + 0.001, status: 'PLANNED', createdAt: new Date() });
      });

      utilities.forEach((u: any) => {
        let mappedType = u.utilityType;
        if (u.utilityType === 'WATER') mappedType = 'AGUA';
        if (u.utilityType === 'GAS') mappedType = 'GAS';
        if (u.utilityType === 'ELECTRICITY') mappedType = 'ELECTRICIDAD';

        this.elements.push({
          id: u.id ? u.id.toString() : 'UTIL-?',
          type: mappedType as any,
          name: u.operatorName ? u.operatorName + ' Line' : 'External Utility',
          lat: u.geometry && u.geometry.length > 0 ? u.geometry[0].lat : this.center.lat,
          lng: u.geometry && u.geometry.length > 0 ? u.geometry[0].lng : this.center.lng,
          status: 'ACTIVE',
          createdAt: new Date(),
          geometry: u.geometry,
          company: u.operatorName
        });
      });

      this.calculateStats();
      this.recenterMap();
    });

    if (this.projectId) {
      this.segmentService.getProjectSegments(this.projectId).subscribe(segments => {
        this.segments = segments;
        segments.forEach(s => {
          this.elements.push({ id: s.id ? s.id.toString() : 'AC-?', type: 'SEGMENT', name: (s.workType ? s.workType + ' ' : '') + 'Segment ' + s.length + 'm', lat: s.geometry && s.geometry.length > 0 ? s.geometry[0].lat : this.center.lat - 0.001, lng: s.geometry && s.geometry.length > 0 ? s.geometry[0].lng : this.center.lng - 0.001, status: 'PLANNED', createdAt: new Date() });
        });
        this.calculateStats();
        this.recenterMap();
      });
    }
  }

  recenterMap() {
    const validElements = this.elements.filter(e => e.lat && e.lng && (Math.abs(e.lat - 52.5200) > 0.01 || Math.abs(e.lng - 13.4050) > 0.01));
    if (validElements.length > 0) {
      const latSum = validElements.reduce((sum, e) => sum + e.lat, 0);
      const lngSum = validElements.reduce((sum, e) => sum + e.lng, 0);
      this.center = { lat: latSum / validElements.length, lng: lngSum / validElements.length };
    }
    if (this.clusterMap && this.clusterMap.map && this.clusterMap.map.googleMap) {
       this.clusterMap.map.googleMap.panTo(this.center);
    }
    this.cdr.detectChanges();
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
      'Segments': this.elements.filter(e => e.type === 'SEGMENT'),
      'Agua': this.elements.filter(e => e.type === 'AGUA'),
      'Gas': this.elements.filter(e => e.type === 'GAS'),
      'Electricidad': this.elements.filter(e => e.type === 'ELECTRICIDAD')
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

  onStatClicked(type: string) {
    this.highlightedType = type || null;
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
  onMapClicked(event: {lat: number, lng: number, address: string, elevation?: number}) {
    this.tempMarker = { lat: event.lat, lng: event.lng };
    this.newNodeData.locationAddress = event.address;
    this.newNodeData.name = event.address;
    if (event.elevation !== undefined) {
      this.newNodeData.elevation = event.elevation;
      // Puedes pasar esta elevación a tus servicios cuando se crea el nodo o segmento
    }
  }
  
  @ViewChild(ClusterNodeFormComponent) clusterNodeForm!: ClusterNodeFormComponent;

  onSegmentUpdated(event: any) {
    if (this.clusterNodeForm) {
      this.clusterNodeForm.updateSegmentCoordinates(event);
    }
  }

  onSaveSegmentPosition(updatedSegment: Segment) {
    if (updatedSegment.id) {
       this.segmentService.updateSegment(updatedSegment.id, updatedSegment).subscribe(() => {
          this.loadClusterData();
       });
    }
  }
  
  onSegmentReset() {
    if (this.clusterNodeForm) {
       this.clusterNodeForm.updateSegmentCoordinates({
          geometry: [], length: 0, startLat: 0, startLng: 0, endLat: 0, endLng: 0, startAddress: '', endAddress: ''
       });
    }
  }

  handleDrawToolChanged(tool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | 'HEUP' | 'AGUA' | 'GAS' | 'ELECTRICIDAD' | null) {
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

  openModalFor(type: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | 'HEUP' | 'AGUA' | 'GAS' | 'ELECTRICIDAD') {
    this.showMap = true;
    this.isMapEditMode = true;
    this.setViewMode('map-focused');
    this.activeDrawTool = type;
    this.tempMarker = null;
    this.newNodeData = {};
  }

  onImportPlanRequested(type: string) {
    if (type === 'AGUA') this.planImportType = 'WATER';
    else if (type === 'GAS') this.planImportType = 'GAS';
    else if (type === 'ELECTRICIDAD') this.planImportType = 'ELECTRICITY';
    this.showPlanImporter = true;
  }

  onPlanImported(event: any) {
    this.showPlanImporter = false;
    if (event) {
      this.alignPlanData = event;
      this.isPlanAlignMode = true;
      this.setViewMode('map-focused');
    }
  }

  onPlanAlignmentSaved(event: any) {
    this.isPlanAlignMode = false;
    if (event) {
      const elType = event.utilityType === 'WATER' ? 'AGUA' : (event.utilityType === 'GAS' ? 'GAS' : 'ELECTRICIDAD');
      const newElement: NetworkElement = {
         id: 'PLAN-' + Date.now(),
         type: elType as any,
         name: `Plano Importado (${elType})`,
         lat: event.center.lat,
         lng: event.center.lng,
         status: 'ACTIVE',
         createdAt: new Date(),
         planUrl: event.planUrl,
         planBounds: event.bounds
      };
      this.elements.push(newElement);
      this.calculateStats();
    }
    this.alignPlanData = null;
  }

  onNodeClicked(element: NetworkElement) {
    if (element.type === 'POP') {
      this.router.navigate(['/project-details/clusters', this.clusterId, 'pop', element.id], { queryParams: { projectId: this.projectId, projectName: this.projectName } });
    } else if (element.type === 'DP') {
      this.router.navigate(['/project-details/clusters', this.clusterId, 'dp', element.id], { queryParams: { projectId: this.projectId, projectName: this.projectName } });
    } else if (element.type === 'SEGMENT') {
      // Feature 1: Trigger risk calculation automatically when clicking a segment?
      // Or we can create a dedicated button in the modal. Let's just calculate risk here to demo.
      this.intelligenceService.calculateRiskForSegment(parseInt(element.id)).subscribe(impacted => {
        // "impacted" will be a list of maps with "affectedHeupId"
        this.impactedElementIds = impacted.map(i => i.affectedHeupId ? i.affectedHeupId.toString() : '');
        this.cdr.detectChanges();
      });
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
       const localSegment = this.segments.find(s => s.id === parseInt(element.id));
       if (localSegment) {
          console.log('Using locally loaded segment:', localSegment);
          this.newNodeData = { ...localSegment };
          this.cdr.detectChanges();
       } else {
         this.segmentService.getSegment(parseInt(element.id)).subscribe({
           next: (segment) => {
              console.log('Fetched segment from API:', segment);
              this.newNodeData = { ...segment };
              this.cdr.detectChanges();
           },
           error: (err) => {
              console.error('Error fetching segment:', err);
           }
         });
       }
    } else {
       this.newNodeData = { ...element };
    }
  }

  onEditSegmentFromMap(segment: Segment) {
    if (!segment.id) return;
    const networkElement: NetworkElement = {
      id: segment.id.toString(),
      type: 'SEGMENT',
      name: segment.streetName || 'Segment',
      lat: segment.geometry && segment.geometry.length > 0 ? segment.geometry[0].lat : this.center.lat,
      lng: segment.geometry && segment.geometry.length > 0 ? segment.geometry[0].lng : this.center.lng,
      status: 'PLANNED'
    };
    this.onEditNodeRequested(networkElement);
  }

  goBack() {
    this.router.navigate(['/project-details'], { queryParams: { projectId: this.projectId, projectName: this.projectName } });
  }

  // Data saving
  saveNode() {
    if (!this.tempMarker) return;

    if (this.activeDrawTool === 'POP') {
      const pop: any = { clusterId: this.clusterId, name: this.newNodeData.name, locationAddress: this.newNodeData.locationAddress, maxCapacityPorts: this.newNodeData.maxCapacityPorts, latitude: this.tempMarker.lat, longitude: this.tempMarker.lng, elevation: this.newNodeData.elevation };
      if (this.isEditing) {
        this.popService.updatePop(this.newNodeData.id, pop as Pop).subscribe(() => { this.loadClusterData(); this.tempMarker = null; this.isEditing = false; });
      } else {
        this.popService.createPop(pop as Pop).subscribe(() => { this.loadClusterData(); this.tempMarker = null; });
      }
    } else if (this.activeDrawTool === 'DP') {
      const dp: any = { popId: this.newNodeData.popId, identifier: this.newNodeData.identifier, locationAddress: this.newNodeData.locationAddress, latitude: this.tempMarker.lat, longitude: this.tempMarker.lng, elevation: this.newNodeData.elevation };
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

  onSavePlanLine(data: any) {
    if (!this.activeDrawTool) return;
    
    let mappedType = 'GAS';
    if (this.activeDrawTool === 'AGUA') mappedType = 'WATER';
    if (this.activeDrawTool === 'ELECTRICIDAD') mappedType = 'ELECTRICITY';

    const utilityData: UtilityLineModel = {
      utilityType: mappedType as any,
      geometry: data.geometry || [],
      operatorName: data.company || '',
      status: 'ACTIVE'
    };

    this.utilityLineService.create(utilityData).subscribe({
      next: (savedUtility) => {
        const newElement: NetworkElement = {
           id: 'PLAN-LINE-' + savedUtility.id,
           type: this.activeDrawTool as any, // AGUA, GAS, ELECTRICIDAD
           name: data.name || `Línea de ${this.activeDrawTool}`,
           lat: data.geometry && data.geometry.length > 0 ? data.geometry[0].lat : this.center.lat,
           lng: data.geometry && data.geometry.length > 0 ? data.geometry[0].lng : this.center.lng,
           status: 'ACTIVE',
           createdAt: new Date(),
           geometry: data.geometry,
           company: data.company,
           material: data.material
        };
        this.elements.push(newElement);
        this.calculateStats();
        this.activeDrawTool = null;
        this.tempMarker = null;
        this.newNodeData = {};
      },
      error: (err) => {
        console.error('Error saving utility line', err);
      }
    });
  }
}
