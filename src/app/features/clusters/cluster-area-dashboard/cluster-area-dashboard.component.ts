import { Component, OnInit, ViewChild, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule, KeyValuePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';

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
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './cluster-area-dashboard.html',
  styleUrls: ['./cluster-area-dashboard.css']
})
export class ClusterAreaDashboardComponent implements OnInit {
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;

  projectId!: number;
  projectName!: string;
  clusterId!: number;
  
  center: google.maps.LatLngLiteral = { lat: 52.5200, lng: 13.4050 };
  zoom = 16;
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeId: 'roadmap',
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
  
  stats = {
    pop: 0,
    dp: 0,
    acometida: 0,
    heup: 0
  };

  isSidebarOpen = true; // Used for mobile/collapsing
  viewMode: 'map-focused' | 'split' | 'data-focused' = 'map-focused';
  panelPosition: 'left' | 'right' | 'bottom' = 'left';

  // Resizing state
  isResizing = false;
  panelWidth = 450;
  panelHeight = 350;
  minPanelWidth = 300;
  minPanelHeight = 200;

  // Accordion state
  expandedGroup: string = 'POP';

  get groupedElements() {
    return {
      'POP': this.elements.filter(e => e.type === 'POP'),
      'Netzverteiler': this.elements.filter(e => e.type === 'DP'),
      'Acometidas': this.elements.filter(e => e.type === 'ACOMETIDA'),
      'HEÜPs': this.elements.filter(e => e.type === 'HEUP')
    };
  }

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
    const today = new Date();
    // Generate mock data for visualization around Berlin
    this.elements = [
      { id: 'POP-01', type: 'POP', name: 'Main POP Mitte', lat: 52.5200, lng: 13.4050, status: 'ACTIVE', createdBy: 'Luis', createdAt: new Date(2025, 1, 10), forecastDate: new Date(2025, 2, 1), budget: 50000, contractor: 'QuarkBau Internal' },
      
      { id: 'DP-01', type: 'DP', name: 'Netzverteiler A', lat: 52.5210, lng: 13.4030, status: 'ACTIVE', createdBy: 'Anna M.', createdAt: new Date(2025, 3, 5), forecastDate: new Date(2025, 4, 10), budget: 12000, contractor: 'Alpha Networks' },
      { id: 'DP-02', type: 'DP', name: 'Netzverteiler B', lat: 52.5190, lng: 13.4070, status: 'PLANNED', createdBy: 'Luis', createdAt: new Date(), forecastDate: new Date(2026, 1, 15), budget: 15000, contractor: 'Pending' },
      { id: 'DP-03', type: 'DP', name: 'Netzverteiler C', lat: 52.5180, lng: 13.4020, status: 'ACTIVE', createdBy: 'Max W.', createdAt: new Date(2025, 5, 20), forecastDate: new Date(2025, 8, 1), budget: 11000, contractor: 'Alpha Networks' },
      
      { id: 'AC-01', type: 'ACOMETIDA', name: 'Route 1', lat: 52.5215, lng: 13.4025, status: 'ACTIVE', createdBy: 'SysAuto', createdAt: new Date(2025, 4, 1), forecastDate: new Date(2025, 4, 15), budget: 5000, contractor: 'Trenching GMBH' },
      { id: 'AC-02', type: 'ACOMETIDA', name: 'Route 2', lat: 52.5208, lng: 13.4035, status: 'ACTIVE', createdBy: 'SysAuto', createdAt: new Date(2025, 4, 2), forecastDate: new Date(2025, 4, 18), budget: 4500, contractor: 'Trenching GMBH' },
      { id: 'AC-03', type: 'ACOMETIDA', name: 'Route 3', lat: 52.5195, lng: 13.4065, status: 'PLANNED', createdBy: 'Luis', createdAt: new Date(), forecastDate: new Date(2026, 2, 1), budget: 6000, contractor: 'Pending' },
      { id: 'AC-04', type: 'ACOMETIDA', name: 'Route 4', lat: 52.5185, lng: 13.4015, status: 'ERROR', createdBy: 'Max W.', createdAt: new Date(2025, 6, 10), forecastDate: new Date(2025, 7, 20), budget: 5500, contractor: 'Trenching GMBH' },
      
      { id: 'HE-01', type: 'HEUP', name: 'House 12', lat: 52.5218, lng: 13.4022, status: 'ACTIVE', createdBy: 'Install Team 1', createdAt: new Date(2025, 4, 20), forecastDate: new Date(2025, 4, 21), budget: 800, contractor: 'InstallPro' },
      { id: 'HE-02', type: 'HEUP', name: 'House 14', lat: 52.5205, lng: 13.4038, status: 'ACTIVE', createdBy: 'Install Team 1', createdAt: new Date(2025, 4, 22), forecastDate: new Date(2025, 4, 23), budget: 800, contractor: 'InstallPro' },
      { id: 'HE-03', type: 'HEUP', name: 'House 16', lat: 52.5198, lng: 13.4060, status: 'PLANNED', createdBy: 'Luis', createdAt: new Date(), forecastDate: new Date(2026, 3, 5), budget: 900, contractor: 'Pending' },
      { id: 'HE-04', type: 'HEUP', name: 'House 18', lat: 52.5188, lng: 13.4012, status: 'ERROR', createdBy: 'Install Team 2', createdAt: new Date(2025, 7, 21), forecastDate: new Date(2025, 7, 21), budget: 850, contractor: 'InstallPro' }
    ];
    
    this.calculateStats();
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
