import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { NetworkElement } from '../../cluster-area-dashboard/cluster-area-dashboard.component';
import { RoutingService } from '../../../gis/routing.service';
import { Segment } from '../../../segments/segment.model';

@Component({
  selector: 'app-cluster-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './cluster-map.html'
})
export class ClusterMapComponent implements AfterViewInit, OnChanges {
  @Input() elements: NetworkElement[] = [];
  @Input() center: google.maps.LatLngLiteral = { lat: 52.5200, lng: 13.4050 };
  @Input() zoom: number = 16;
  @Input() mapOptions!: google.maps.MapOptions;
  @Input() map3DOptions!: google.maps.MapOptions;
  @Input() isMapEditMode: boolean = false;
  @Input() is3DMode: boolean = false;
  @Input() activeDrawTool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | null = null;
  @Input() showMap: boolean = true;
  @Input() viewMode: 'map-focused' | 'split' | 'data-focused' = 'map-focused';

  @Output() mapClicked = new EventEmitter<{lat: number, lng: number, address: string}>();
  @Output() segmentUpdated = new EventEmitter<{geometry: any[], length: number, startLat: number, startLng: number, endLat: number, endLng: number, startAddress: string, endAddress: string}>();
  @Output() segmentReset = new EventEmitter<void>();
  
  @Output() drawToolChanged = new EventEmitter<'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | null>();
  @Output() toggle3DModeEvent = new EventEmitter<void>();
  @Output() exitEditModeEvent = new EventEmitter<void>();

  setDrawTool(tool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | null) {
    this.drawToolChanged.emit(tool);
  }

  toggle3DMode() {
    this.toggle3DModeEvent.emit();
  }

  exitEditMode() {
    this.exitEditModeEvent.emit();
  }

  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
  @ViewChild('streetViewDiv', { static: false }) streetViewDiv!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputElement!: ElementRef;

  private panorama: google.maps.StreetViewPanorama | null = null;
  private autocomplete: google.maps.places.Autocomplete | null = null;
  private geocoder: google.maps.Geocoder = new google.maps.Geocoder();
  private streetViewMarkers: google.maps.Marker[] = [];
  private streetViewLineMarkers: google.maps.Marker[] = [];

  tempMarker: { lat: number, lng: number } | null = null;
  segmentWaypoints: {lat: number, lng: number}[] = [];
  segmentRoute: { lat: number, lng: number }[] = [];
  newSegment: Partial<Segment> = {};

  constructor(private routingService: RoutingService, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.initSearchAutocomplete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['is3DMode']) {
      if (this.is3DMode) {
        setTimeout(() => this.initPanorama(), 100);
      } else {
        this.panorama = null;
      }
    }
    
    if (changes['activeDrawTool'] && !this.activeDrawTool) {
       this.tempMarker = null;
       this.segmentWaypoints = [];
       this.segmentRoute = [];
       this.update3DOverlay();
    }
    
    if (changes['elements'] && this.is3DMode) {
        this.update3DOverlay();
    }
  }

  triggerMapResize() {
    setTimeout(() => {
      if (this.map && this.map.googleMap) {
        google.maps.event.trigger(this.map.googleMap as any, 'resize');
      }
    }, 300);
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

  onMapClick(event: google.maps.MapMouseEvent) {
    if (!this.isMapEditMode || !this.activeDrawTool || !event.latLng) return;
    
    const clickedLat = event.latLng.lat();
    const clickedLng = event.latLng.lng();

    this.reverseGeocode(event.latLng, (address) => {
      this.mapClicked.emit({lat: clickedLat, lng: clickedLng, address: address});
      
      if (this.activeDrawTool === 'SEGMENT') {
        this.handleSegmentClick(clickedLat, clickedLng, address);
      } else {
        this.tempMarker = { lat: clickedLat, lng: clickedLng };
        this.update3DOverlay();
      }
    });
  }

  // Allow double-click to finish drawing? Or just accumulate? 
  // Let's just accumulate. A separate action (like selecting another tool or pressing Escape) stops it.
  private handleSegmentClick(lat: number, lng: number, address: string) {
      this.segmentWaypoints.push({ lat, lng });

      if (this.segmentWaypoints.length === 1) {
        this.segmentRoute = [...this.segmentWaypoints];
        this.newSegment.startAddress = address;
        this.update3DOverlay();
      } else {
        this.newSegment.endAddress = address;
        
        // Calculate Route through all waypoints
        this.routingService.getStreetRoute(this.segmentWaypoints).subscribe(route => {
          this.segmentRoute = route;
          
          let length = 0;
          for (let i = 0; i < this.segmentRoute.length - 1; i++) {
              const p1 = new google.maps.LatLng(this.segmentRoute[i]);
              const p2 = new google.maps.LatLng(this.segmentRoute[i + 1]);
              length += google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
          }
          length = Math.round(length);

          const startPin = this.segmentWaypoints[0];
          const endPin = this.segmentWaypoints[this.segmentWaypoints.length - 1];

          this.segmentUpdated.emit({
              geometry: this.segmentRoute,
              length: length,
              startLat: startPin.lat,
              startLng: startPin.lng,
              endLat: endPin.lat,
              endLng: endPin.lng,
              startAddress: this.newSegment.startAddress!,
              endAddress: this.newSegment.endAddress!
          });
          
          this.update3DOverlay();
          this.cdr.detectChanges();
        });
      }
  }

  resetSegmentDrawing() {
      this.segmentWaypoints = [];
      this.segmentRoute = [];
      this.segmentReset.emit();
      this.update3DOverlay();
  }

  private reverseGeocode(latLng: google.maps.LatLng, callback: (address: string) => void) {
    this.geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        callback(results[0].formatted_address);
      } else {
        callback('Unknown Address');
      }
    });
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
    if (this.tempMarker && this.activeDrawTool !== 'SEGMENT') {
        const marker = new google.maps.Marker({
            position: this.tempMarker,
            map: this.panorama as any,
            label: { text: 'NEW', color: 'yellow', fontWeight: 'bold' },
            optimized: false,
            clickable: false
        });
        this.streetViewMarkers.push(marker);
    }
    
    if (this.segmentWaypoints.length > 0) {
        this.segmentWaypoints.forEach((wp, index) => {
            const isStart = index === 0;
            const marker = new google.maps.Marker({
                position: wp,
                map: this.panorama as any,
                label: { text: isStart ? 'S' : (index === this.segmentWaypoints.length - 1 ? 'E' : (index+1).toString()), color: 'white', fontWeight: 'bold' },
                optimized: false,
                clickable: false
            });
            this.streetViewMarkers.push(marker);
        });
    }

    // Segment Line interpolation
    if (this.segmentRoute && this.segmentRoute.length > 1 && google.maps.geometry) {
        for (let i = 0; i < this.segmentRoute.length - 1; i++) {
            const p1 = new google.maps.LatLng(this.segmentRoute[i].lat, this.segmentRoute[i].lng);
            const p2 = new google.maps.LatLng(this.segmentRoute[i+1].lat, this.segmentRoute[i+1].lng);
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
  }

  getIconForType(type: string): string {
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
      case 'POP': return '#6938ef'; 
      case 'DP': return '#2fb080'; 
      case 'ACOMETIDA': return '#fbbf24'; 
      case 'HEUP': return '#ef4444'; 
      default: return '#ffffff';
    }
  }
}
