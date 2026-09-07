import { Component, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule, GoogleMap, MapGroundOverlay } from '@angular/google-maps';
import { InfrastructureService } from '@features/infrastructure/infrastructure.service';

@Component({
    selector: 'app-gis-viewer',
    standalone: true,
    imports: [CommonModule, FormsModule, GoogleMapsModule, MapGroundOverlay],
    templateUrl: './gis-viewer.component.html',
    styles: [`
        .map-container { position: relative; width: 100%; height: 100%; }
    `]
})
export class GisViewerComponent implements AfterViewInit {
    @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;

    isLoading = true;

    projects = [
        { id: 1, name: 'Proyecto Berlín Centro (Fibra A-1)', lat: 52.5200, lng: 13.4050, zoom: 14 },
        { id: 2, name: 'München Expansión (Obra Civil)', lat: 48.1351, lng: 11.5820, zoom: 14 },
        { id: 3, name: 'Hamburg Puerto (Arquetas)', lat: 53.5488, lng: 9.9872, zoom: 15 }
    ];

    center: google.maps.LatLngLiteral = { lat: 52.5200, lng: 13.4050 };
    zoom = 14;
    mapOptions: google.maps.MapOptions = {
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#263c3f" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6b9a76" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b3" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#746855" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#f3d19c" }],
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [{ color: "#2f3948" }],
            },
            {
              featureType: "transit.station",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#17263c" }],
            },
          ]
    };

    // Digital Plan Room State
    showPlanOverlay = false;
    planUrl = 'assets/mock-plan.svg';
    planBounds = {
        north: 52.5250,
        south: 52.5190,
        east: 13.4120,
        west: 13.4040
    };

    overlayOptions: google.maps.GroundOverlayOptions = {
        clickable: false
    };

    constructor(private infrastructureService: InfrastructureService, private cdr: ChangeDetectorRef) { }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
        }, 500);
    }

    togglePlanOverlay(show: boolean) {
        this.showPlanOverlay = show;
        if (show && this.map) {
            this.map.panTo({ lat: (this.planBounds.north + this.planBounds.south) / 2, lng: (this.planBounds.east + this.planBounds.west) / 2 });
            this.map.zoom = 16;
        }
    }

    onProjectSelect(event: any): void {
        const projectId = event.target.value;
        const project = this.projects.find(p => p.id == projectId);
        if (project && this.map) {
            this.map.panTo({ lat: project.lat, lng: project.lng });
            this.map.zoom = project.zoom;
        }
    }
}
