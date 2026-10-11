import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { Cluster } from './cluster.model';
import { ClusterService } from './cluster.service';
import { PlanningService } from '../risk-planning/planning.service';
import { PlanImporterComponent } from '../gis/components/plan-importer/plan-importer.component';

@Component({
  selector: 'app-clusters',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, GoogleMapsModule, PlanImporterComponent],
  templateUrl: './clusters.component.html',
  styleUrls: ['./clusters.component.css']
})
export class ClustersComponent implements OnInit, OnChanges {
  @Input() projectId!: number;
  @Input() projectName: string = '';
  @Input() projectCenter?: google.maps.LatLngLiteral;
  
  clusters: Cluster[] = [];
  showCreateModal = false;
  showImportModal = false;
  selectedClusterIdForImport: number | null = null;
  
  mapCenter: google.maps.LatLngLiteral = { lat: 52.4746, lng: 13.4475 };
  mapZoom = 16;
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

  markerOptions: google.maps.MarkerOptions = {
    draggable: true,
    title: 'Cluster Center'
  };

  newCluster: Cluster = {
    name: '',
    description: '',
    projectId: 0,
    latitude: 52.4746,
    longitude: 13.4475
  };

  constructor(
    private clusterService: ClusterService,
    private planningService: PlanningService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.newCluster.projectId = this.projectId;
    if (this.projectCenter) {
      this.mapCenter = { ...this.projectCenter };
    }
    this.loadProjectCoordinates();
    this.loadClusters();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['projectCenter'] && this.projectCenter) {
      this.mapCenter = { ...this.projectCenter };
      if (!this.newCluster.latitude || !this.newCluster.longitude) {
        this.newCluster.latitude = this.projectCenter.lat;
        this.newCluster.longitude = this.projectCenter.lng;
      }
      this.cdr.detectChanges();
    }
    if (changes['projectId'] && this.projectId) {
      this.newCluster.projectId = this.projectId;
      this.loadProjectCoordinates();
      this.loadClusters();
    }
  }

  loadProjectCoordinates() {
    if (!this.projectId) return;
    this.planningService.getProject(this.projectId).subscribe({
      next: (project) => {
        const lat = project.latitude ?? project.startLatitude ?? (project.geometry && project.geometry.length > 0 ? project.geometry[0].lat : undefined);
        const lng = project.longitude ?? project.startLongitude ?? (project.geometry && project.geometry.length > 0 ? project.geometry[0].lng : undefined);
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          this.mapCenter = { lat, lng };
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.warn('Could not load project coordinates for cluster creation:', err)
    });
  }

  loadClusters() {
    this.clusterService.getClustersByProjectId(this.projectId).subscribe({
      next: (data) => {
        this.clusters = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading clusters', err)
    });
  }

  openCreateModal() {
    const lat = this.projectCenter?.lat ?? this.mapCenter.lat;
    const lng = this.projectCenter?.lng ?? this.mapCenter.lng;
    this.mapCenter = { lat, lng };
    this.newCluster = {
      name: '',
      description: '',
      projectId: this.projectId,
      latitude: lat,
      longitude: lng
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      this.newCluster.latitude = lat;
      this.newCluster.longitude = lng;
      this.mapCenter = { lat, lng };
      this.cdr.detectChanges();
    }
  }

  onMarkerDrag(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      this.newCluster.latitude = lat;
      this.newCluster.longitude = lng;
      this.mapCenter = { lat, lng };
      this.cdr.detectChanges();
    }
  }

  openImportModal(clusterId: number) {
    this.selectedClusterIdForImport = clusterId;
    this.showImportModal = true;
  }

  closeImportModal() {
    this.showImportModal = false;
    this.selectedClusterIdForImport = null;
  }

  onPlanImported(event: any) {
    console.log('Líneas extraídas para el cluster', this.selectedClusterIdForImport, event);
    this.closeImportModal();
  }

  saveCluster() {
    if (!this.newCluster.name) return;
    
    // Ensure latitude and longitude are assigned from parent project / current map center
    if (this.newCluster.latitude == null || this.newCluster.longitude == null) {
      this.newCluster.latitude = this.mapCenter.lat;
      this.newCluster.longitude = this.mapCenter.lng;
    }

    this.clusterService.createCluster(this.newCluster).subscribe({
      next: (created) => {
        this.clusters.push(created);
        this.closeCreateModal();
        this.cdr.detectChanges();
        // Abrir inmediatamente el mapa del cluster en esa posición
        const targetLat = created.latitude || this.newCluster.latitude || this.mapCenter.lat;
        const targetLng = created.longitude || this.newCluster.longitude || this.mapCenter.lng;
        this.router.navigate(['/project-details/clusters', created.id, 'areas'], {
          queryParams: {
            projectId: this.projectId,
            projectName: this.projectName,
            lat: targetLat,
            lng: targetLng
          }
        });
      },
      error: (err) => console.error('Error creating cluster', err)
    });
  }
  
  getPopCount(cluster: Cluster): number {
    return cluster.pops?.length || 0;
  }
  
  getNetzverteilerCount(cluster: Cluster): number {
    if (!cluster.pops) return 0;
    return cluster.pops.reduce((total, pop) => total + (pop.nvts?.length || 0), 0);
  }
}
