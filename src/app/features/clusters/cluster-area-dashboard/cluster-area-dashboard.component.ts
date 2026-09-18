import { Component, OnInit, ViewChild, HostListener, Inject, PLATFORM_ID, ChangeDetectorRef, ElementRef, AfterViewInit } from '@angular/core';
import { isPlatformBrowser, CommonModule, KeyValuePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { FormsModule } from '@angular/forms';
import { PopService } from '../../infrastructure/pop.service';
import { NetzverteilerService } from '../../infrastructure/netzverteiler.service';
import { SegmentService } from '../../segments/segment.service';
import { Pop } from '../../infrastructure/pop.model';
import { Netzverteiler } from '../../infrastructure/netzverteiler.model';
import { Segment } from '../../segments/segment.model';
import { WorkType } from '@shared/models/work-type.enum';
import { CustomFieldDefinition } from '@features/field-config/custom-field.model';

export interface NetworkElement {
  id: string;
  type: 'POP' | 'DP' | 'ACOMETIDA' | 'HEUP';
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
  imports: [CommonModule, GoogleMapsModule, FormsModule],
  templateUrl: './cluster-area-dashboard.html',
  styleUrls: ['./cluster-area-dashboard.css']
})
export class ClusterAreaDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;

  ngAfterViewInit() {
    this.initSearchAutocomplete();
  }

  projectId!: number;
  projectName!: string;
  clusterId!: number;
  
  isEditing: boolean = false;

  center: google.maps.LatLngLiteral = { lat: 52.5200, lng: 13.4050 };
  zoom = 16;
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeId: 'roadmap',
    tilt: 0,
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
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeId: 'roadmap',
    tilt: 45,
    heading: 0,
    mapId: '8f000b200b3e6c38',
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

  elements: NetworkElement[] = [];
  
  stats = { pop: 0, dp: 0, acometida: 0, heup: 0 };

  isSidebarOpen = true; // Used for mobile/collapsing
  viewMode: 'map-focused' | 'split' | 'data-focused' = 'map-focused';
  panelPosition: 'left' | 'right' | 'bottom' = 'left';
  showMap: boolean = true;

  toggleMap() {
    this.showMap = !this.showMap;
    if (this.showMap) {
      this.triggerMapResize();
    }
  }

  // Resizing state
  isResizing = false;
  panelWidth = 450;
  panelHeight = 350;
  minPanelWidth = 300;
  minPanelHeight = 200;

  // Accordion state
  expandedGroup: string = 'POP';

  // Map Editor States
  isMapEditMode = false;
  is3DMode = false;
  @ViewChild('streetViewDiv', { static: false }) streetViewDiv!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputElement!: ElementRef;
  private panorama: google.maps.StreetViewPanorama | null = null;
  private autocomplete: google.maps.places.Autocomplete | null = null;
  private streetViewMarkers: google.maps.Marker[] = [];
  private streetViewLineMarkers: google.maps.Marker[] = [];

  activeDrawTool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | null = null;
  tempMarker: { lat: number, lng: number } | null = null;
  
  // Segment Specific States
  segmentStartPin: { lat: number, lng: number } | null = null;
  segmentEndPin: { lat: number, lng: number } | null = null;
  newSegment: Partial<Segment> = {};
  smartPlan: any = null;
  workTypeOptions = Object.values(WorkType);
  customFieldDefinitions: CustomFieldDefinition[] = [];
  customFieldsData: { [key: string]: any } = {};

  newNodeData: any = {};
  showSegmentModal = false;

  toggleEditMode() {
    this.isMapEditMode = !this.isMapEditMode;
    if (this.isMapEditMode) {
      this.showMap = true;
      this.setViewMode('map-focused');
      this.activeDrawTool = null;
      this.tempMarker = null;
      this.is3DMode = false;
    } else {
      this.activeDrawTool = null;
      this.tempMarker = null;
    }
  }

  toggle3DMode() {
    this.is3DMode = !this.is3DMode;
    this.triggerMapResize();
    if (this.is3DMode) {
      setTimeout(() => this.initPanorama(), 100);
    } else {
      this.panorama = null;
    }
  }

  private initPanorama() {
    if (this.streetViewDiv && !this.panorama) {
        this.panorama = new google.maps.StreetViewPanorama(
            this.streetViewDiv.nativeElement,
            {
                position: this.center,
                pov: { heading: 34, pitch: 10 },
                disableDefaultUI: false,
                clickToGo: true,
                linksControl: true,
                addressControl: true,
                imageDateControl: true,
                enableCloseButton: false,
                visible: true
            }
        );
        this.panorama.addListener('visible_changed', () => {
            if (this.panorama?.getVisible()) {
                this.update3DOverlay();
            }
        });
        setTimeout(() => this.update3DOverlay(), 500);
    }
  }

  public update3DOverlay() {
    if (!this.panorama) return;

    this.streetViewMarkers.forEach(m => m.setMap(null));
    this.streetViewMarkers = [];
    this.streetViewLineMarkers.forEach(m => m.setMap(null));
    this.streetViewLineMarkers = [];

    // Nodes
    this.elements.forEach(element => {
        const marker = new google.maps.Marker({
            position: { lat: element.lat, lng: element.lng },
            map: this.panorama as any,
            label: { text: element.type.substring(0, 3), color: 'white', fontWeight: 'bold' },
            title: element.name,
            optimized: false,
            clickable: false
        });
        this.streetViewMarkers.push(marker);
    });

    // Active Tool markers
    if (this.tempMarker) {
        const marker = new google.maps.Marker({
            position: this.tempMarker,
            map: this.panorama as any,
            label: { text: 'NEW', color: 'yellow', fontWeight: 'bold' },
            optimized: false,
            clickable: false
        });
        this.streetViewMarkers.push(marker);
    }
    if (this.segmentStartPin) {
        const marker = new google.maps.Marker({
            position: this.segmentStartPin,
            map: this.panorama as any,
            label: { text: 'S', color: 'white', fontWeight: 'bold' },
            optimized: false,
            clickable: false
        });
        this.streetViewMarkers.push(marker);
    }
    if (this.segmentEndPin) {
        const marker = new google.maps.Marker({
            position: this.segmentEndPin,
            map: this.panorama as any,
            label: { text: 'E', color: 'white', fontWeight: 'bold' },
            optimized: false,
            clickable: false
        });
        this.streetViewMarkers.push(marker);
    }

    // Segment Line interpolation
    if (this.segmentStartPin && this.segmentEndPin && google.maps.geometry) {
        const p1 = new google.maps.LatLng(this.segmentStartPin.lat, this.segmentStartPin.lng);
        const p2 = new google.maps.LatLng(this.segmentEndPin.lat, this.segmentEndPin.lng);
        const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);

        let currentDist = 0;
        while (currentDist <= dist) {
            const frac = currentDist / dist;
            const pos = google.maps.geometry.spherical.interpolate(p1, p2, frac);

            const dot = new google.maps.Marker({
                position: { lat: pos.lat(), lng: pos.lng() },
                map: this.panorama as any,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#ff69b4',
                    fillOpacity: 1.0,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: 6
                },
                clickable: false,
                optimized: false
            });
            this.streetViewLineMarkers.push(dot);
            currentDist += 1.5;
        }
    }
  }

  private initSearchAutocomplete() {
    if (!this.searchInputElement) {
        setTimeout(() => this.initSearchAutocomplete(), 500);
        return;
    }
    this.autocomplete = new google.maps.places.Autocomplete(this.searchInputElement.nativeElement, {
        componentRestrictions: { country: 'DE' },
        fields: ['geometry', 'name', 'formatted_address']
    });
    this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete?.getPlace();
        if (place && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            this.center = { lat, lng };
            this.zoom = 18;
            
            if (this.map && this.map.googleMap) {
                this.map.googleMap.panTo(this.center);
                this.map.googleMap.setZoom(18);
            }

            if (this.panorama) {
                this.panorama.setPosition(this.center);
            }
        }
    });
  }

  openModalFor(type: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT') {
    this.showMap = true;
    this.isMapEditMode = true;
    this.setViewMode('map-focused');
    this.setDrawTool(type);
  }

  setDrawTool(tool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | null) {
    this.activeDrawTool = tool;
    this.tempMarker = null;
    this.segmentStartPin = null;
    this.segmentEndPin = null;
    this.smartPlan = null;
    this.newSegment = {};
    this.newNodeData = {};
    this.update3DOverlay();
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (!this.isMapEditMode || !this.activeDrawTool || !event.latLng) return;
    
    if (this.activeDrawTool === 'SEGMENT') {
      if (!this.segmentStartPin) {
        this.segmentStartPin = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        this.newSegment.startLatitude = this.segmentStartPin.lat;
        this.newSegment.startLongitude = this.segmentStartPin.lng;
      } else if (!this.segmentEndPin) {
        this.segmentEndPin = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        this.newSegment.endLatitude = this.segmentEndPin.lat;
        this.newSegment.endLongitude = this.segmentEndPin.lng;
        // Mock Smart Planning generation
        this.generateSmartPlan();
      } else {
        // Reset and start over
        this.segmentStartPin = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        this.newSegment.startLatitude = this.segmentStartPin.lat;
        this.newSegment.startLongitude = this.segmentStartPin.lng;
        this.segmentEndPin = null;
        this.smartPlan = null;
      }
    } else {
      this.tempMarker = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      this.newNodeData = {};
    }
    this.update3DOverlay();
  }

  generateSmartPlan() {
    this.smartPlan = {
      suggestedRegelplan: 'RSA-95 Type B',
      safetyScore: 85,
      requiresPermit: true,
      requiredMaterials: ['Absperrgitter x4', 'Leitkegel x10', 'LSA Ampelanlage'],
      environmentalContext: {
        weather: { temperature: 15, condition: 'Clear' },
        traffic: { congestionLevel: 'Moderate' }
      }
    };
  }

  closeQuickForm() {
    this.tempMarker = null;
    this.newNodeData = {};
  }

  closeAllModals() {
    this.showSegmentModal = false;
  }

  saveUnifiedElement() {
    if (this.activeDrawTool === 'SEGMENT') {
      if (!this.segmentStartPin || !this.segmentEndPin) return;
      
      const segmentData = {
        ...this.newSegment,
        startLatitude: this.segmentStartPin.lat,
        startLongitude: this.segmentStartPin.lng,
        endLatitude: this.segmentEndPin.lat,
        endLongitude: this.segmentEndPin.lng,
        smartPlan: this.smartPlan
      };
      console.log('Saving segment:', segmentData);
      // Here you would call segmentService.createSegment(segmentData)
    } else {
      if (!this.tempMarker) return;
      console.log(`Saving node (${this.activeDrawTool}):`, this.newNodeData, 'at', this.tempMarker);
      // Here you would call the respective node service
    }

    this.toggleEditMode(); // Exit edit mode on save
  }

  onSegmentSaved(segment: any) {
    this.closeAllModals();
    this.loadClusterData();
  }

  groupedElements: { [key: string]: NetworkElement[] } = {
    'POP': [],
    'Netzverteiler': [],
    'Acometidas': [],
    'HEÜPs': []
  };

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
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.projectId = +params['projectId'];
      this.projectName = params['projectName'] || 'Project';
    });
    
    this.route.params.subscribe(params => {
      this.clusterId = +params['clusterId'];
      this.loadClusterData();
    });
  }

  loadClusterData() {
    this.elements = [];
    
    // Load POPs
    this.popService.getAllPops().subscribe(pops => {
      pops.filter(p => p.clusterId === this.clusterId).forEach(p => {
        this.elements.push({
          id: p.id ? p.id.toString() : 'POP-?',
          type: 'POP',
          name: p.name || 'Unnamed POP',
          lat: (p as any).latitude || this.center.lat,
          lng: (p as any).longitude || this.center.lng,
          status: 'PLANNED',
          createdAt: new Date()
        });
      });
      this.calculateStats();
      this.cdr.detectChanges();
    });

    // Load Netzverteilers
    this.nvtService.getAllNetzverteilers().subscribe(nvts => {
      nvts.forEach(n => {
        this.elements.push({
          id: n.id ? n.id.toString() : 'DP-?',
          type: 'DP',
          name: (n as any).identifier || 'Unnamed DP',
          lat: (n as any).latitude || this.center.lat + 0.001,
          lng: (n as any).longitude || this.center.lng + 0.001,
          status: 'PLANNED',
          createdAt: new Date()
        });
      });
      this.calculateStats();
      this.cdr.detectChanges();
    });

    // Load Segments
    if (this.projectId) {
      this.segmentService.getProjectSegments(this.projectId).subscribe(segments => {
        segments.forEach(s => {
          this.elements.push({
            id: s.id ? s.id.toString() : 'AC-?',
            type: 'ACOMETIDA',
            name: 'Segment ' + s.length + 'm',
            lat: s.geometry && s.geometry.length > 0 ? s.geometry[0].lat : this.center.lat - 0.001,
            lng: s.geometry && s.geometry.length > 0 ? s.geometry[0].lng : this.center.lng - 0.001,
            status: 'PLANNED',
            createdAt: new Date()
          });
        });
        this.calculateStats();
        this.cdr.detectChanges();
      });
    }
  }

  saveNode() {
    if (!this.tempMarker) return;

    if (this.activeDrawTool === 'POP') {
      const pop: any = {
        clusterId: this.clusterId,
        name: this.newNodeData.name,
        locationAddress: this.newNodeData.locationAddress,
        maxCapacityPorts: this.newNodeData.maxCapacityPorts,
        latitude: this.tempMarker.lat,
        longitude: this.tempMarker.lng
      };

      this.popService.createPop(pop as Pop).subscribe(() => {
        this.loadClusterData();
        this.closeQuickForm();
      });
    } else if (this.activeDrawTool === 'DP') {
      const dp: any = {
        popId: this.newNodeData.popId,
        identifier: this.newNodeData.identifier,
        latitude: this.tempMarker.lat,
        longitude: this.tempMarker.lng
      };

      this.nvtService.createNetzverteiler(dp as Netzverteiler).subscribe(() => {
        this.loadClusterData();
        this.closeQuickForm();
      });
    } else if (this.activeDrawTool === 'ACOMETIDA') {
      const seg: Segment = {
        streetName: this.newNodeData.name || 'Custom Segment',
        streetType: 'UNKNOWN',
        workType: 'UNKNOWN',
        currentState: 'PLANNED',
        length: 50, // default dummy
        geometry: [
          { lat: this.tempMarker.lat, lng: this.tempMarker.lng },
          { lat: this.tempMarker.lat + 0.0005, lng: this.tempMarker.lng + 0.0005 }
        ]
      };
      this.segmentService.createSegment(this.projectId, seg).subscribe(() => {
        this.loadClusterData();
        this.closeQuickForm();
      });
    }
  }

  setViewMode(mode: 'map-focused' | 'split' | 'data-focused') {
    this.viewMode = mode;
    
    if (isPlatformBrowser(this.platformId)) {
      if (mode === 'map-focused') {
        this.panelWidth = 450;
        this.panelHeight = 350;
      } else if (mode === 'split') {
        this.panelWidth = window.innerWidth * 0.45;
        this.panelHeight = window.innerHeight * 0.5;
      }
    }
    
    this.triggerMapResize();
  }

  setPanelPosition(pos: 'left' | 'right' | 'bottom') {
    this.panelPosition = pos;
    this.triggerMapResize();
  }

  onResizeStart(event: MouseEvent) {
    if (this.viewMode === 'data-focused') return;
    this.isResizing = true;
    event.preventDefault(); // Prevent text selection
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing || !isPlatformBrowser(this.platformId)) return;

    if (this.panelPosition === 'left') {
      this.panelWidth = Math.max(this.minPanelWidth, event.clientX);
    } else if (this.panelPosition === 'right') {
      this.panelWidth = Math.max(this.minPanelWidth, window.innerWidth - event.clientX);
    } else if (this.panelPosition === 'bottom') {
      this.panelHeight = Math.max(this.minPanelHeight, window.innerHeight - event.clientY);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isResizing) {
      this.isResizing = false;
      this.triggerMapResize();
    }
  }

  toggleGroup(groupName: string) {
    if (this.expandedGroup === groupName) {
      this.expandedGroup = '';
    } else {
      this.expandedGroup = groupName;
    }
  }

  private triggerMapResize() {
    // Trigger map resize event so Google Maps canvas adjusts
    setTimeout(() => {
      if (this.map && this.map.googleMap) {
        google.maps.event.trigger(this.map.googleMap as any, 'resize');
      }
    }, 300);
  }

  calculateStats() {
    this.stats = {
      pop: this.elements.filter(e => e.type === 'POP').length,
      dp: this.elements.filter(e => e.type === 'DP').length,
      acometida: this.elements.filter(e => e.type === 'ACOMETIDA').length,
      heup: this.elements.filter(e => e.type === 'HEUP').length
    };
    
    this.groupedElements = {
      'POP': this.elements.filter(e => e.type === 'POP'),
      'Netzverteiler': this.elements.filter(e => e.type === 'DP'),
      'Acometidas': this.elements.filter(e => e.type === 'ACOMETIDA'),
      'HEÜPs': this.elements.filter(e => e.type === 'HEUP')
    };
  }

  getIconForType(type: string): string {
    // Return SVG data URIs for different types
    const color = this.getColorForType(type);
    
    let path = '';
    let scale = 1;
    
    switch(type) {
      case 'POP': // Hexagon or Server rack
        path = 'M12 2L22 7l-10 5L2 7l10-5zm0 15l-10-5v5l10 5 10-5v-5l-10 5zm0-5l-10-5v5l10 5 10-5v-5l-10 5z';
        scale = 1.2;
        break;
      case 'DP': // Square/Cabinet
        path = 'M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z';
        scale = 1.1;
        break;
      case 'ACOMETIDA': // Arrow/Line
        path = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z';
        scale = 0.9;
        break;
      case 'HEUP': // Home
        path = 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z';
        scale = 1.0;
        break;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <path d="${path}" fill="${color}" stroke="#131415" stroke-width="1.5" />
      </svg>
    `;
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  getColorForType(type: string): string {
    switch(type) {
      case 'POP': return '#6938ef'; // Purple
      case 'DP': return '#2fb080'; // Green
      case 'ACOMETIDA': return '#fbbf24'; // Yellow
      case 'HEUP': return '#ef4444'; // Red
      default: return '#ffffff';
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onNodeClick(element: any) {
    if (element.type === 'POP') {
      this.router.navigate(['/project-details/clusters', this.clusterId, 'pop', element.id], {
        queryParams: { projectId: this.projectId, projectName: this.projectName }
      });
    } else if (element.type === 'DP') {
      this.router.navigate(['/project-details/clusters', this.clusterId, 'dp', element.id], {
        queryParams: { projectId: this.projectId, projectName: this.projectName }
      });
    }
    // You could add logic here for ACOMETIDA and HEUP later
  }

  goBack() {
    this.router.navigate(['/project-details'], { queryParams: { projectId: this.projectId, projectName: this.projectName } });
  }
}
