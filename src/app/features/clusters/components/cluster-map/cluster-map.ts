import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GoogleMapsModule, GoogleMap, MapInfoWindow, MapPolyline, MapGroundOverlay, MapMarker } from '@angular/google-maps';
import { NetworkElement } from '../../cluster-area-dashboard/cluster-area-dashboard.component';
import { RoutingService } from '../../../gis/routing.service';
import { Segment } from '../../../segments/segment.model';
import * as turf from '@turf/turf';

@Component({
  selector: 'app-cluster-map',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule, MapGroundOverlay, MapMarker],
  templateUrl: './cluster-map.html'
})
export class ClusterMapComponent implements AfterViewInit, OnChanges {
  @Input() elements: NetworkElement[] = [];
  @Input() segments: Segment[] = [];
  @Input() center: google.maps.LatLngLiteral = { lat: 52.5200, lng: 13.4050 };
  @Input() zoom: number = 16;
  @Input() mapOptions!: google.maps.MapOptions;
  @Input() map3DOptions!: google.maps.MapOptions;
  @Input() isMapEditMode: boolean = false;
  @Input() is3DMode: boolean = false;
  @Input() activeDrawTool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | 'HEUP' | 'AGUA' | 'GAS' | 'ELECTRICIDAD' | null = null;
  @Input() showMap: boolean = true;
  @Input() viewMode: 'map-focused' | 'split' | 'data-focused' = 'map-focused';
  @Input() highlightedType: string | null = null;
  @Input() impactedElementIds: string[] = []; // Used for intelligence highlighting
  @Input() isPlanAlignMode: boolean = false;
  @Input() alignPlanData: any = null;

  @Output() mapClicked = new EventEmitter<{lat: number, lng: number, address: string, elevation?: number}>();
  @Output() segmentUpdated = new EventEmitter<{geometry: any[], length: number, startLat: number, startLng: number, endLat: number, endLng: number, startAddress: string, endAddress: string}>();
  @Output() segmentReset = new EventEmitter<void>();
  
  @Output() drawToolChanged = new EventEmitter<'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | 'HEUP' | null>();
  @Output() toggle3DModeEvent = new EventEmitter<void>();
  @Output() exitEditModeEvent = new EventEmitter<void>();
  @Output() saveSegmentPosition = new EventEmitter<Segment>();
  @Output() editSegmentRequested = new EventEmitter<Segment>();
  @Output() planAlignmentSaved = new EventEmitter<any>();

  setDrawTool(tool: 'POP' | 'DP' | 'ACOMETIDA' | 'SEGMENT' | 'HEUP' | 'AGUA' | 'GAS' | 'ELECTRICIDAD' | null) {
    this.drawToolChanged.emit(tool as any);
  }

  toggle3DMode() {
    this.toggle3DModeEvent.emit();
  }

  exitEditMode() {
    this.exitEditModeEvent.emit();
  }

  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
  @ViewChild(MapInfoWindow, { static: false }) infoWindow!: MapInfoWindow;
  @ViewChild('streetViewDiv', { static: false }) streetViewDiv!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputElement!: ElementRef;
  @ViewChild('editPolyline') editPolyline!: MapPolyline;

  private panorama: google.maps.StreetViewPanorama | null = null;
  private autocomplete: google.maps.places.Autocomplete | null = null;
  private geocoder: google.maps.Geocoder = new google.maps.Geocoder();
  private elevationService: google.maps.ElevationService = new google.maps.ElevationService();
  private streetViewMarkers: google.maps.Marker[] = [];
  private streetViewLineMarkers: google.maps.Marker[] = [];

  tempMarker: { lat: number, lng: number } | null = null;
  segmentWaypoints: {lat: number, lng: number}[] = [];
  segmentRoute: { lat: number, lng: number }[] = [];
  newSegment: Partial<Segment> = {};
  
  selectedSegment: Segment | null = null;
  selectedNode: NetworkElement | null = null;
  infoWindowPosition: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  editingSegment: Segment | null = null;

  // Plan Alignment State
  planBounds = { north: 0, south: 0, east: 0, west: 0 };
  planMarkerPos = { lat: 0, lng: 0 };

  // Draggable Modals State
  draggingModal: 'analytics' | 'prompt' | null = null;
  dragOffset = { x: 0, y: 0 };
  modalPositions = {
    analytics: { x: window.innerWidth / 2 - 192, y: window.innerHeight * 0.6 },
    prompt: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 }
  };

  // Curve Mode
  curveSharpness: number = 0.85;

  @HostListener('document:mousemove', ['$event'])
  onModalMouseMove(event: MouseEvent) {
    if (this.draggingModal) {
      this.modalPositions[this.draggingModal] = {
        x: event.clientX - this.dragOffset.x,
        y: event.clientY - this.dragOffset.y
      };
    }
  }

  @HostListener('document:mouseup')
  onModalMouseUp() {
    this.draggingModal = null;
  }

  onModalMouseDown(event: MouseEvent, modal: 'analytics' | 'prompt') {
    this.draggingModal = modal;
    this.dragOffset = {
      x: event.clientX - this.modalPositions[modal].x,
      y: event.clientY - this.modalPositions[modal].y
    };
    event.preventDefault();
  }

  constructor(private routingService: RoutingService, private cdr: ChangeDetectorRef, private router: Router) {}

  getSegmentMidpoint(seg: Segment): google.maps.LatLngLiteral | null {
    if (!seg.geometry || seg.geometry.length === 0) return null;
    const midIndex = Math.floor(seg.geometry.length / 2);
    return { lat: seg.geometry[midIndex].lat, lng: seg.geometry[midIndex].lng };
  }

  getCrewMarkerOptions(): google.maps.MarkerOptions {
    return {
      label: { text: '👷', fontSize: '24px' },
      icon: {
        path: 'M -12,0 A 12,12 0 1,0 12,0 A 12,12 0 1,0 -12,0', // 24px invisible circle for click area
        fillOpacity: 0,
        strokeOpacity: 0,
        scale: 1
      },
      zIndex: 1001,
      title: 'Crew Trabajando - Click para Detalles'
    };
  }

  getMachineryMarkerOptions(): google.maps.marker.AdvancedMarkerElementOptions {
    const iconElement = document.createElement('div');
    iconElement.innerHTML = `<div style="font-size: 20px; text-shadow: 0 0 10px #eab308; cursor: pointer;">🚜</div>`;
    return {
      content: iconElement,
      gmpClickable: true,
      zIndex: 9999
    };
  }

  getOffsetPosition(pos: google.maps.LatLngLiteral): google.maps.LatLngLiteral {
    // Add a small offset to the east
    return { lat: pos.lat, lng: pos.lng + 0.00015 };
  }

  goToMachinery() {
    this.router.navigate(['/inventory/machines']);
  }

  onCrewMarkerClick(seg: Segment, event?: google.maps.MapMouseEvent) {
    if (event && event.domEvent) {
      event.domEvent.preventDefault();
      event.domEvent.stopPropagation();
    }
    if (seg.assignedCrewId) {
      this.router.navigate(['/field-crews', seg.assignedCrewId], {
        queryParams: {
          location: seg.streetName || 'Sector Alpha',
          project: 'Glasfaser Ausbau',
          status: seg.currentState || 'ACTIVE'
        }
      });
    } else {
      this.router.navigate(['/field-crews']);
    }
  }

  ngAfterViewInit() {
    this.initSearchAutocomplete();
    this.panToCurrentCenter();
  }

  panToCurrentCenter() {
    if (!this.center) return;
    const apply = () => {
      if (this.map && this.map.googleMap) {
        this.map.googleMap.setCenter(this.center);
        this.map.googleMap.panTo(this.center);
      }
    };
    apply();
    setTimeout(apply, 100);
    setTimeout(apply, 300);
    setTimeout(apply, 600);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['center'] && this.center) {
      this.panToCurrentCenter();
    }

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

    if (changes['elements'] && this.elements) {
        this.elements.forEach(element => {
            if ((element.type === 'AGUA' || element.type === 'GAS' || element.type === 'ELECTRICIDAD') && element.geometry && element.geometry.length > 2) {
                try {
                    const line = turf.lineString(element.geometry.map((c: any) => [c.lng, c.lat]));
                    const curvedLine = turf.bezierSpline(line, { resolution: 10000, sharpness: 0.85 });
                    element.geometry = curvedLine.geometry.coordinates.map(coord => ({
                        lat: coord[1],
                        lng: coord[0]
                    }));
                } catch(e) {
                    console.error("Error smoothing curve", e);
                }
            }
        });
    }

    if (changes['isPlanAlignMode'] && this.isPlanAlignMode && this.alignPlanData) {
       this.initPlanAlignment();
    }
  }

  initPlanAlignment() {
     const lat = this.center.lat;
     const lng = this.center.lng;
     const spanLat = 0.0005;
     const spanLng = 0.0008;
     this.planBounds = { north: lat + spanLat, south: lat - spanLat, east: lng + spanLng, west: lng - spanLng };
     this.planMarkerPos = { lat, lng };
  }

  onPlanMarkerDrag(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.updatePlanBounds(event.latLng.lat(), event.latLng.lng());
    }
  }

  private updatePlanBounds(newLat: number, newLng: number) {
      const latDiff = newLat - this.planMarkerPos.lat;
      const lngDiff = newLng - this.planMarkerPos.lng;
      this.planBounds = {
        north: this.planBounds.north + latDiff,
        south: this.planBounds.south + latDiff,
        east: this.planBounds.east + lngDiff,
        west: this.planBounds.west + lngDiff
      };
      this.planMarkerPos = { lat: newLat, lng: newLng };
  }

  scalePlan(factor: number) {
    const latSpan = (this.planBounds.north - this.planBounds.south) * factor;
    const lngSpan = (this.planBounds.east - this.planBounds.west) * factor;
    this.planBounds = {
        north: this.planMarkerPos.lat + latSpan / 2,
        south: this.planMarkerPos.lat - latSpan / 2,
        east: this.planMarkerPos.lng + lngSpan / 2,
        west: this.planMarkerPos.lng - lngSpan / 2
    };
  }

  nudgePlan(direction: 'N'|'S'|'E'|'W', amount: number = 0.0001) {
    let newLat = this.planMarkerPos.lat;
    let newLng = this.planMarkerPos.lng;
    if (direction === 'N') newLat += amount;
    if (direction === 'S') newLat -= amount;
    if (direction === 'E') newLng += amount;
    if (direction === 'W') newLng -= amount;
    this.updatePlanBounds(newLat, newLng);
  }

  savePlanAlignment() {
    this.planAlignmentSaved.emit({
       ...this.alignPlanData,
       center: this.planMarkerPos,
       bounds: this.planBounds
    });
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
    const loc = event.latLng;

    this.reverseGeocode(loc, (address) => {
      this.elevationService.getElevationForLocations({ locations: [loc] })
        .then((response) => {
          let elevation = 0;
          if (response.results && response.results.length > 0) {
            elevation = response.results[0].elevation;
          }
          
          this.mapClicked.emit({lat: clickedLat, lng: clickedLng, address: address, elevation: elevation});
          
          const isPolylineTool = this.activeDrawTool === 'SEGMENT' || this.activeDrawTool === 'AGUA' || this.activeDrawTool === 'GAS' || this.activeDrawTool === 'ELECTRICIDAD';
          if (isPolylineTool) {
            this.handleSegmentClick(clickedLat, clickedLng, address, elevation);
          } else {
            this.tempMarker = { lat: clickedLat, lng: clickedLng };
            this.update3DOverlay();
          }
        })
        .catch((e) => {
          console.error("Elevation service failed due to: " + e);
          this.mapClicked.emit({lat: clickedLat, lng: clickedLng, address: address});
          const isPolylineTool = this.activeDrawTool === 'SEGMENT' || this.activeDrawTool === 'AGUA' || this.activeDrawTool === 'GAS' || this.activeDrawTool === 'ELECTRICIDAD';
          if (isPolylineTool) {
            this.handleSegmentClick(clickedLat, clickedLng, address);
          } else {
            this.tempMarker = { lat: clickedLat, lng: clickedLng };
            this.update3DOverlay();
          }
        });
    });
  }

  private handleSegmentClick(lat: number, lng: number, address: string, elevation?: number) {
      this.segmentWaypoints.push({ lat, lng });

      if (this.segmentWaypoints.length === 1) {
        this.segmentRoute = [...this.segmentWaypoints];
        this.newSegment.startAddress = address;
        if (elevation !== undefined) this.newSegment.startElevation = elevation;
        this.update3DOverlay();
      } else {
        this.newSegment.endAddress = address;
        if (elevation !== undefined) this.newSegment.endElevation = elevation;
        
        this.recalculateSegmentRoute();
      }
  }

  public segmentVectors: any[] = [];
  
  onSharpnessChange() {
      if (this.segmentWaypoints.length > 1) {
          this.recalculateSegmentRoute();
      }
  }

  onWaypointDragEnd(index: number, event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.segmentWaypoints[index] = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      this.recalculateSegmentRoute();
    }
  }

  private recalculateSegmentRoute() {
      if (this.segmentWaypoints.length < 2) return;
      
      this.routingService.getStreetRoute(this.segmentWaypoints).subscribe(route => {
        this.segmentRoute = route;
        
        // Apply Curve if multiple waypoints
        if (this.segmentRoute.length > 2) {
            try {
                const line = turf.lineString(this.segmentRoute.map(p => [p.lng, p.lat]));
                const curved = turf.bezierSpline(line, { resolution: 10000, sharpness: this.curveSharpness });
                if (curved && curved.geometry && curved.geometry.coordinates) {
                    this.segmentRoute = curved.geometry.coordinates.map((coord: any) => ({
                        lat: coord[1],
                        lng: coord[0]
                    }));
                }
            } catch(e) {
                console.error("Spline error in Segment", e);
            }
        }

        let length = 0;
        for (let i = 0; i < this.segmentRoute.length - 1; i++) {
            const p1 = new google.maps.LatLng(this.segmentRoute[i].lat, this.segmentRoute[i].lng);
            const p2 = new google.maps.LatLng(this.segmentRoute[i + 1].lat, this.segmentRoute[i + 1].lng);
            length += google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
        }
        length = Math.round(length);

        const emitSegmentUpdate = () => {
            const startPin = this.segmentWaypoints[0];
            const endPin = this.segmentWaypoints[this.segmentWaypoints.length - 1];
            this.segmentUpdated.emit({
                // DO NOT send this.segmentRoute (which contains thousands of curved spline points) to the backend.
                // We send only the raw waypoints to avoid memory overflows in Unity AR.
                geometry: this.segmentWaypoints,
                length: length,
                startLat: startPin.lat,
                startLng: startPin.lng,
                endLat: endPin.lat,
                endLng: endPin.lng,
                startAddress: this.newSegment.startAddress || 'Unknown',
                endAddress: this.newSegment.endAddress || 'Unknown'
            });
            this.update3DOverlay();
            this.cdr.detectChanges();
        };

        // Fetch elevations for the route
        const locations = this.segmentRoute.map((p: any) => ({ lat: p.lat, lng: p.lng }));
        if (locations.length > 0) {
            const chunkSize = 500;
            let fetched = 0;
            for (let c = 0; c < locations.length; c += chunkSize) {
                const chunk = locations.slice(c, c + chunkSize);
                this.elevationService.getElevationForLocations({ locations: chunk }, (results, status) => {
                    fetched += chunk.length;
                    if (status === google.maps.ElevationStatus.OK && results) {
                        for (let j = 0; j < results.length; j++) {
                            (this.segmentRoute[c + j] as any).z = Math.round(results[j].elevation * 100) / 100;
                        }
                    }
                    if (fetched >= locations.length) {
                        this.calculateVectors();
                        emitSegmentUpdate();
                    }
                });
            }
        } else {
            this.calculateVectors();
            emitSegmentUpdate();
        }
      });
  }
  
  private calculateVectors() {
      this.segmentVectors = [];
      if (!this.segmentRoute || this.segmentRoute.length < 2) return;
      
      for (let i = 0; i < this.segmentRoute.length - 1; i++) {
          const p1 = this.segmentRoute[i] as any;
          const p2 = this.segmentRoute[i + 1] as any;
          
          const startZ = p1.z || 0;
          const endZ = p2.z || 0;
          
          const p1LatLng = new google.maps.LatLng(p1.lat, p1.lng);
          const p2LatLng = new google.maps.LatLng(p2.lat, p2.lng);
          const distance = google.maps.geometry.spherical.computeDistanceBetween(p1LatLng, p2LatLng);
          
          let slope = 0;
          if (distance > 0) {
              slope = ((endZ - startZ) / distance) * 100;
          }
          
          this.segmentVectors.push({
              index: i + 1,
              startZ: startZ,
              endZ: endZ,
              distance: distance,
              slope: slope
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
        
        setTimeout(() => {
            if (this.panorama) {
                google.maps.event.trigger(this.panorama, 'resize');
                this.update3DOverlay();
            }
        }, 300);
    }
  }

  public update3DOverlay() {
    if (!this.panorama) return;

    this.streetViewMarkers.forEach(m => m.setMap(null));
    this.streetViewMarkers = [];
    this.streetViewLineMarkers.forEach(m => m.setMap(null));
    this.streetViewLineMarkers = [];

    this.elements.forEach(element => {
        const marker = new google.maps.Marker({
            position: { lat: element.lat, lng: element.lng },
            map: this.panorama as any,
            icon: this.get3DIconForType(element.type),
            title: element.name,
            optimized: false,
            clickable: true
        });
        this.streetViewMarkers.push(marker);
    });

    const isPolylineTool = this.activeDrawTool === 'SEGMENT' || this.activeDrawTool === 'AGUA' || this.activeDrawTool === 'GAS' || this.activeDrawTool === 'ELECTRICIDAD';
    if (this.tempMarker && !isPolylineTool) {
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
                        fillColor: '#ffffff',
                        fillOpacity: 1.0,
                        strokeColor: '#ff69b4',
                        strokeWeight: 2,
                        scale: 6
                    },
                    clickable: false,
                    optimized: false
                });
                this.streetViewLineMarkers.push(dot);
                currentDist += 0.5;
            }
        }
    }

    if (this.segments && this.segments.length > 0 && google.maps.geometry) {
        this.renderSegmentsAsync();
    }
  }

  private renderTaskVersion = 0;

  private renderSegmentsAsync() {
    this.renderTaskVersion++;
    const currentVersion = this.renderTaskVersion;
    
    const segmentsToRender = [...this.segments];
    let currentIndex = 0;
    
    const chunkSize = 5;

    const renderChunk = () => {
      if (this.renderTaskVersion !== currentVersion || !this.panorama) return;

      const end = Math.min(currentIndex + chunkSize, segmentsToRender.length);
      
      for (let i = currentIndex; i < end; i++) {
        const seg = segmentsToRender[i];
        if (seg.geometry && seg.geometry.length > 1) {
            const options = this.getSegmentOptions(seg);
            const color = options.strokeColor as string;
            
            for (let j = 0; j < seg.geometry.length - 1; j++) {
                const p1 = new google.maps.LatLng(seg.geometry[j].lat, seg.geometry[j].lng);
                const p2 = new google.maps.LatLng(seg.geometry[j+1].lat, seg.geometry[j+1].lng);
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
                            fillColor: color,
                            fillOpacity: 0.9,
                            strokeColor: '#000000',
                            strokeWeight: 1,
                            scale: 8
                        },
                        title: seg.streetName || 'Segment',
                        clickable: true,
                        optimized: false
                    });
                    
                    dot.addListener('click', (e: any) => this.onSegmentClick(seg, e));
                    this.streetViewLineMarkers.push(dot);
                    
                    currentDist += 0.5; 
                }
            }
        }
      }
      
      currentIndex = end;
      
      if (currentIndex < segmentsToRender.length) {
        requestAnimationFrame(renderChunk);
      }
    };
    
    requestAnimationFrame(renderChunk);
  }

  getIconForType(type: string): string {
    const color = this.getColorForType(type);
    let path = '';
    let scale = 1;
    
    switch(type) {
      case 'POP': 
        path = 'M12 2L22 7l-10 5L2 7l10-5zm0 15l-10-5v5l10 5 10-5v-5l-10 5zm0-5l-10-5v5l10 5 10-5v-5l-10 5z';
        scale = 1.2;
        break;
      case 'DP': 
        path = 'M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z';
        scale = 1.1;
        break;
      case 'ACOMETIDA': 
        path = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z';
        scale = 0.9;
        break;
      case 'HEUP': 
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

  get3DIconForType(type: string): string {
    let svg = '';

    if (type === 'POP') {
      const scale = 140; 
      const topColor = '#8e66f2';
      const leftColor = '#5327c9';
      const rightColor = '#6938ef';
      const detailColor = '#2d156b';
      
      svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="${scale}" height="${scale}">
          <polygon points="60,20 100,40 60,60 20,40" fill="${topColor}" stroke="#111" stroke-width="2"/>
          <polygon points="20,40 60,60 60,140 20,120" fill="${leftColor}" stroke="#111" stroke-width="2"/>
          <polygon points="60,60 100,40 100,120 60,140" fill="${rightColor}" stroke="#111" stroke-width="2"/>
          
          <polygon points="30,70 50,80 50,135 30,125" fill="${detailColor}" stroke="#111" stroke-width="1.5"/>
          <circle cx="45" cy="107" r="1.5" fill="#fff" />
          
          <polygon points="70,70 90,60 90,63 70,73" fill="${detailColor}"/>
          <polygon points="70,78 90,68 90,71 70,81" fill="${detailColor}"/>
          <polygon points="70,86 90,76 90,79 70,89" fill="${detailColor}"/>
          <polygon points="70,94 90,84 90,87 70,97" fill="${detailColor}"/>
          <polygon points="70,102 90,92 90,95 70,105" fill="${detailColor}"/>
          
          <text x="60" y="47" font-family="sans-serif" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle" transform="skewY(26)">POP</text>
        </svg>
      `;
    } else if (type === 'DP') {
      const scale = 80;
      const topColor = '#59c79f';
      const leftColor = '#218f65';
      const rightColor = '#2fb080';
      const detailColor = '#135c40';

      svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="${scale}" height="${scale}">
          <polygon points="50,20 90,40 50,60 10,40" fill="${topColor}" stroke="#111" stroke-width="2"/>
          <polygon points="10,40 50,60 50,110 10,90" fill="${leftColor}" stroke="#111" stroke-width="2"/>
          <polygon points="50,60 90,40 90,90 50,110" fill="${rightColor}" stroke="#111" stroke-width="2"/>
          
          <line x1="30" y1="50" x2="30" y2="100" stroke="${detailColor}" stroke-width="1.5"/>
          <rect x="28" y="70" width="4" height="6" fill="#111" transform="skewY(26)"/>
          
          <text x="70" y="40" font-family="sans-serif" font-size="14" font-weight="bold" fill="#fff" text-anchor="middle" transform="skewY(-26)">DP</text>
        </svg>
      `;
    } else {
      const scale = 40;
      let topColor = '#ffffff';
      let leftColor = '#cccccc';
      let rightColor = '#aaaaaa';

      if (type === 'HEUP') {
        topColor = '#f26868';
        leftColor = '#cc2a2a';
        rightColor = '#ef4444';
      }

      svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${scale}" height="${scale}">
          <polygon points="50,15 90,35 50,55 10,35" fill="${topColor}" stroke="#111" stroke-width="2"/>
          <polygon points="10,35 50,55 50,85 10,65" fill="${leftColor}" stroke="#111" stroke-width="2"/>
          <polygon points="50,55 90,35 90,65 50,85" fill="${rightColor}" stroke="#111" stroke-width="2"/>
          <text x="50" y="40" font-family="sans-serif" font-size="14" font-weight="bold" fill="#fff" text-anchor="middle" transform="skewY(26)">${type.substring(0, 3)}</text>
        </svg>
      `;
    }
    
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

  getMarkerOpacity(type: string): number {
    if (!this.highlightedType) return 1.0;
    return this.highlightedType === type ? 1.0 : 0.2;
  }

  getSegmentOptions(segment: Segment): google.maps.PolylineOptions {
    let color = '#ff69b4';
    let weight = 4;
    
    const workType = (segment.workType || '').toLowerCase();
    if (workType.includes('excavaci') || workType.includes('excavation') || workType.includes('trench')) {
      color = '#eab308'; 
      weight = 5;
    } else if (workType.includes('aerial')) {
      color = '#3b82f6'; 
      weight = 3;
    } else if (workType.includes('micro')) {
      color = '#10b981'; 
      weight = 3;
    }

    let opacity = 0.8;
    if (this.highlightedType) {
      opacity = this.highlightedType === 'SEGMENT' ? 1.0 : 0.2;
    }

    return {
      strokeColor: color,
      strokeWeight: weight,
      strokeOpacity: opacity,
      zIndex: this.highlightedType === 'SEGMENT' ? 10 : 1
    };
  }

  getEditableSegmentOptions(segment: Segment): google.maps.PolylineOptions {
    return {
      strokeColor: '#ff69b4',
      strokeWeight: 8,
      strokeOpacity: 0.8,
      zIndex: 100,
      editable: true,
      draggable: true
    };
  }

  onSegmentClick(segment: Segment, event: google.maps.MapMouseEvent) {
    if (this.isMapEditMode || this.activeDrawTool) return;
    
    this.selectedSegment = segment;
    this.selectedNode = null;
    if (event.latLng) {
      this.infoWindowPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      this.cdr.detectChanges();
      if (this.infoWindow) {
        this.infoWindow.open();
      }
    }
  }

  requestSegmentEdit() {
    if (this.selectedSegment) {
      this.editSegmentRequested.emit(this.selectedSegment);
      if (this.infoWindow) {
        this.infoWindow.close();
      }
    }
  }

  cancelSegmentEdit() {
    this.editingSegment = null;
    this.cdr.detectChanges();
  }

  saveSegmentEdit() {
    if (this.editingSegment && this.editPolyline && this.editPolyline.polyline) {
      const path = this.editPolyline.polyline.getPath();
      const newGeometry = path.getArray().map(latLng => ({ lat: latLng.lat(), lng: latLng.lng() }));
      
      const updatedSegment = { ...this.editingSegment, geometry: newGeometry };
      this.saveSegmentPosition.emit(updatedSegment);
      this.editingSegment = null;
      this.cdr.detectChanges();
    }
  }

  onNodeClick(element: NetworkElement, event: google.maps.MapMouseEvent) {
    this.selectedNode = element;
    this.selectedSegment = null;
    if (event.latLng) {
      this.infoWindowPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      this.cdr.detectChanges();
      if (this.infoWindow) {
        this.infoWindow.open();
      }
    }
  }

  viewNodeIn3D(element: NetworkElement) {
    this.center = { lat: element.lat, lng: element.lng };
    if (this.map && this.map.googleMap) {
      this.map.googleMap.panTo(this.center);
    }
    if (this.panorama) {
      this.panorama.setPosition(this.center);
    }
    
    if (this.infoWindow) {
      this.infoWindow.close();
    }
    
    if (!this.is3DMode) {
      this.toggle3DMode();
    }
  }
}
