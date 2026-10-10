import { Component, EventEmitter, Input, OnChanges, OnInit, AfterViewInit, Output, SimpleChanges, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule, GoogleMap, MapPolyline, MapMarker, MapPolygon } from '@angular/google-maps';
import { RoutingService } from '@features/gis/routing.service';
import * as turf from '@turf/turf';

export interface SegmentCoordinates {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    geometry?: { lat: number, lng: number, z?: number }[];
    length?: number;
    startAddress?: string;
    endAddress?: string;
}

export enum CADTool {
    SELECT = 'SELECT',
    PEN = 'PEN',
    ERASER = 'ERASER',
    ROTATE = 'ROTATE',
    SCALE = 'SCALE',
    STRETCH = 'STRETCH',
    FILLET = 'FILLET',
    SPLIT = 'SPLIT'
}

@Component({
    selector: 'app-segment-creation-map',
    standalone: true,
    imports: [CommonModule, GoogleMapsModule, FormsModule],
    templateUrl: './segment-creation-map.component.html',
    styleUrls: ['./segment-creation-map.component.css']
})
export class SegmentCreationMapComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
    @ViewChild(MapPolyline, { static: false }) polyline!: MapPolyline;
    @ViewChild('streetViewDiv', { static: false }) streetViewDiv!: any;

    private panorama: google.maps.StreetViewPanorama | null = null;

    @Input() startLat: number = 0;
    @Input() startLng: number = 0;
    @Input() endLat: number = 0;
    @Input() endLng: number = 0;
    @Input() isEditing: boolean = false;
    @Input() viewOnly: boolean = false;
    @Input() smartPlan: any = null;
    @Input() projectGeometry: {lat: number, lng: number}[] | null = null;
    @Input() segmentGeometry: {lat: number, lng: number, z?: number}[] | undefined;
    @Input() fencingStrategy?: string;

    @Output() coordinatesChanged = new EventEmitter<SegmentCoordinates>();
    @Output() centerChanged = new EventEmitter<google.maps.LatLngLiteral>();

    @ViewChild('searchInput', { static: false }) searchInputElement!: ElementRef;
    private autocomplete: google.maps.places.Autocomplete | null = null;

    // Multi-segment planning (Fragmented segments)
    segments: google.maps.LatLngLiteral[][] = [[]];
    renderedSegments: google.maps.LatLngLiteral[][] = [[]]; // The actual paths drawn (curved or straight)
    activeSegmentIndex: number = 0;
    private _allPoints: google.maps.LatLngLiteral[] = [];
    private updateTimer: any;

    get points(): google.maps.LatLngLiteral[] {
        return this._allPoints;
    }

    private updateCachedPoints() {
        this._allPoints = this.segments.flat();
    }

    isEraserMode = false;
    isDrawMode = true;

    activeTool: CADTool = CADTool.PEN;
    CADTool = CADTool; // Export for template
    googleMaps = google;   // Export for template
    mousePos: google.maps.LatLngLiteral | null = null;
    filletRadius: number = 5; // Meters

    // Interactive Curve Mode
    isCurvedMode: boolean = false;
    curveSharpness: number = 0.85;

    // Google Map State
    center: google.maps.LatLngLiteral = { lat: this.startLat, lng: this.startLng }; // Berlin

    zoom = 17;
    mapTypeId = google.maps.MapTypeId.ROADMAP;

    getCurrentCenter(): google.maps.LatLngLiteral {
        if (this.map && this.map.googleMap) {
            const c = this.map.googleMap.getCenter();
            if (c) return { lat: c.lat(), lng: c.lng() };
        }
        return this.center;
    }

    onCenterChanged() {
        if (this.map && this.map.googleMap) {
            const c = this.map.googleMap.getCenter();
            if (c) {
                this.center = { lat: c.lat(), lng: c.lng() };
                this.centerChanged.emit(this.center);
            }
        }
    }

    mapOptions: google.maps.MapOptions = {
        disableDefaultUI: false,
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: true,
        maxZoom: 20,
        minZoom: 8,
        gestureHandling: 'greedy',
        draggable: true
    };

    startPos: google.maps.LatLngLiteral | null = null;
    endPos: google.maps.LatLngLiteral | null = null;
    routePoints: google.maps.LatLngLiteral[] = [];

    strokeColor = '#2563EB'; // Primary Blue to match Mobile App
    trenchWidth = 1.0; // In meters (visualized as strokeWeight)

    polylineOptions: google.maps.PolylineOptions = {
        strokeColor: '#2563EB',
        strokeOpacity: 0.9,
        strokeWeight: 8,
        editable: true,
        draggable: true
    };

    private streetViewPolyline: google.maps.Polyline | null = null;
    private streetViewPolylineBorder: google.maps.Polyline | null = null;
    private streetViewMarkers: google.maps.Marker[] = [];
    private streetViewLineMarkers: google.maps.Marker[] = [];
    isSelected = false;

    polylineBackgroundOptions: google.maps.PolylineOptions = {
        strokeColor: '#ffffff',
        strokeOpacity: 0.3,
        strokeWeight: 8
    };

    startMarkerOptions: google.maps.MarkerOptions = { draggable: false };
    endMarkerOptions: google.maps.MarkerOptions = { draggable: false };

    // Multi-point planning
    showStreetView = true;
    streetViewPos: google.maps.LatLngLiteral =  { lat: 0, lng: 0 } ;

    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        if (!this.isSelected) return;

        // Don't trigger shortcuts if typing in search input
        if (document.activeElement?.tagName === 'INPUT') return;

        switch (event.key.toLowerCase()) {
            case 'v':
            case 'g': this.selectTool(CADTool.SELECT); break;
            case 'p':
            case 'a': this.selectTool(CADTool.PEN); break;
            case 'e':
            case 'x': this.selectTool(CADTool.ERASER); break;
            case 'r': this.selectTool(CADTool.ROTATE); break;
            case 's': this.selectTool(CADTool.SCALE); break;
            case 'z': if (event.ctrlKey) this.undoLastPoint(); break;
            case 'escape': this.selectTool(CADTool.SELECT); break;
        }
    }

    fencingMarkers: any[] = [];
    private startAddress?: string;
    private endAddress?: string;
    private elevationService = new google.maps.ElevationService();

    constructor(private routingService: RoutingService) { }

    ngOnInit(): void {
        this.showStreetView = true; // Always on for split view
        if (this.viewOnly) {
            this.activeTool = CADTool.SELECT;
            this.isSelected = false;
        }
        if ((this.isEditing || this.viewOnly) && this.startLat && this.endLat) {
            this.updateMapFromInputs();
        }

        // Provide a fallback center (Berlin) if startLat is not provided
        this.center = { lat: this.startLat || 52.5200, lng: this.startLng || 13.4050 };
        this.streetViewPos = { ...this.center };

        this.mapOptions = {
            ...this.mapOptions,
            center: this.center,
            zoom: this.zoom
        };
    }

    ngAfterViewInit(): void {
        this.initPanorama();
        this.initSearchAutocomplete();
        this.fitToProjectGeometry();
    }

    private fitToProjectGeometry() {
        if (this.projectGeometry && this.projectGeometry.length > 0 && this.map && this.map.googleMap) {
            const bounds = new google.maps.LatLngBounds();
            this.projectGeometry.forEach(p => bounds.extend(p));
            this.map.googleMap.fitBounds(bounds);
        }
    }

    getMaskPaths(): any {
        if (!this.projectGeometry || this.projectGeometry.length < 3) return [];
        // Create an outer ring covering the whole world
        const earthRing = [
            { lat: 85, lng: -180 },
            { lat: 85, lng: 180 },
            { lat: -85, lng: 180 },
            { lat: -85, lng: -180 }
        ];
        // The inner ring cuts a hole (the project area)
        return [earthRing, this.projectGeometry];
    }

    private initSearchAutocomplete() {
        if (!this.searchInputElement) {
            // If not available yet, try again in a bit
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
                const pos = { lat, lng };

                this.center = pos;
                this.centerChanged.emit(this.center);
                this.zoom = 18; // Zoom in for precision

                if (this.map && this.map.googleMap) {
                    this.map.googleMap.panTo(pos);
                    this.map.googleMap.setZoom(18);
                }

                this.updatePanoramaPosition(pos);
            }
        });
    }

    private initPanorama() {
        if (this.streetViewDiv && !this.panorama) {
            this.panorama = new google.maps.StreetViewPanorama(
                this.streetViewDiv.nativeElement,
                {
                    position: this.streetViewPos,
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

            // Ensure 3D overlay is created once panorama is active
            this.panorama.addListener('visible_changed', () => {
                if (this.panorama?.getVisible()) {
                    this.update3DOverlay();
                }
            });

            // Trigger discovery for the initial position
            this.updatePanoramaPosition(this.streetViewPos);

            // Trigger resize as it might be in a flex child
            setTimeout(() => {
                if (this.panorama) {
                    google.maps.event.trigger(this.panorama as any, 'resize');
                    this.update3DOverlay();
                }
                if (this.map && this.map.googleMap) {
                    google.maps.event.trigger(this.map.googleMap as any, 'resize');
                }
            }, 800); // Slightly longer timeout for modal animation
        }
    }

    public update3DOverlay() {
        if (!this.panorama) return;

        if (this.points.length < 1) return;

        // 1. Clear existing overlays
        if (this.streetViewPolyline) this.streetViewPolyline.setMap(null);
        if (this.streetViewPolylineBorder) this.streetViewPolylineBorder.setMap(null);
        this.streetViewLineMarkers.forEach(m => m.setMap(null));
        this.streetViewLineMarkers = [];
        this.streetViewMarkers.forEach(m => m.setMap(null));
        this.streetViewMarkers = [];

        // 2. Draw Simulated Line using dense markers (since Polyline is not supported in Panoramas)
        const segmentStep = 1.0; // Place a dot every 2 meters
        if (this.points.length >= 2) {
            for (let i = 0; i < this.points.length - 1; i++) {
                const p1 = new google.maps.LatLng(this.points[i].lat, this.points[i].lng);
                const p2 = new google.maps.LatLng(this.points[i + 1].lat, this.points[i + 1].lng);
                const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);

                let currentDist = 0;
                while (currentDist <= dist) {
                    const frac = currentDist / dist;
                    const pos = google.maps.geometry.spherical.interpolate(p1, p2, frac);

                    // Add a "Line Dot" marker
                    const dot = new google.maps.Marker({
                        position: { lat: pos.lat(), lng: pos.lng() },
                        map: this.panorama as any,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: this.strokeColor,
                            fillOpacity: 1.0,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: Math.max(6, this.trenchWidth * 10)
                        },
                        zIndex: 4999, // Below the numbered pins
                        clickable: false,
                        optimized: false
                    });
                    this.streetViewLineMarkers.push(dot);
                    currentDist += segmentStep;
                }
            }
        }

        // 3. Handle Main Numbered Pins in 3D
        this.points.forEach((p, i) => {
            const marker = new google.maps.Marker({
                position: { lat: p.lat, lng: p.lng },
                map: this.panorama as any,
                label: {
                    text: (i + 1).toString(),
                    color: 'white',
                    fontWeight: 'bold'
                },
                title: `Punto ${i + 1}`,
                zIndex: 5005,
                optimized: false,
                clickable: false
            });
            this.streetViewMarkers.push(marker);
        });
    }

    setTrenchWidth(width: number) {
        this.trenchWidth = width;
        this.polylineOptions = {
            ...this.polylineOptions,
            strokeWeight: width * 8 // Standardized for visibility
        };
        this.update3DOverlay();
        this.emitChanges();
    }

    // --- CAD Geometric Tools ---

    rotatePath(degrees: number) {
        const seg = this.segments[this.activeSegmentIndex];
        if (seg.length < 2) return;
        const rad = (degrees * Math.PI) / 180;
        const center = this.getCentroid();

        this.segments[this.activeSegmentIndex] = seg.map(p => {
            const dx = p.lng - center.lng;
            const dy = p.lat - center.lat;
            return {
                lat: center.lat + (dx * Math.sin(rad) + dy * Math.cos(rad)),
                lng: center.lng + (dx * Math.cos(rad) - dy * Math.sin(rad))
            };
        });
        this.syncStateAfterTransform();
    }

    scalePath(factor: number) {
        const seg = this.segments[this.activeSegmentIndex];
        if (seg.length < 1) return;
        const center = this.getCentroid();
        this.segments[this.activeSegmentIndex] = seg.map(p => ({
            lat: center.lat + (p.lat - center.lat) * factor,
            lng: center.lng + (p.lng - center.lng) * factor
        }));
        this.syncStateAfterTransform();
    }

    smoothPath() {
        const seg = this.segments[this.activeSegmentIndex];
        if (seg.length < 3) return;
        const newPoints: google.maps.LatLngLiteral[] = [];
        for (let i = 0; i < seg.length - 1; i++) {
            const p0 = seg[i];
            const p1 = seg[i + 1];

            const q = {
                lat: 0.75 * p0.lat + 0.25 * p1.lat,
                lng: 0.75 * p0.lng + 0.25 * p1.lng
            };
            const r = {
                lat: 0.25 * p0.lat + 0.75 * p1.lat,
                lng: 0.25 * p0.lng + 0.75 * p1.lng
            };
            newPoints.push(q, r);
        }
        this.segments[this.activeSegmentIndex] = newPoints;
        this.syncStateAfterTransform();
    }

    simplifyPath() {
        const seg = this.segments[this.activeSegmentIndex];
        if (seg.length > 4) {
            const newPoints: google.maps.LatLngLiteral[] = [];
            for (let i = 0; i < seg.length; i += 2) {
                newPoints.push(seg[i]);
            }
            const lastPoint = seg[seg.length - 1];
            const lastNewPoint = newPoints[newPoints.length - 1];
            if (lastPoint && lastNewPoint && (lastPoint.lat !== lastNewPoint.lat || lastPoint.lng !== lastNewPoint.lng)) {
                newPoints.push(lastPoint);
            }
            this.segments[this.activeSegmentIndex] = newPoints;
            this.syncStateAfterTransform();
        }
    }

    private getCentroid(): google.maps.LatLngLiteral {
        const latSum = this.points.reduce((sum, p) => sum + p.lat, 0);
        const lngSum = this.points.reduce((sum, p) => sum + p.lng, 0);
        return { lat: latSum / this.points.length, lng: lngSum / this.points.length };
    }

    selectTool(tool: CADTool) {
        this.isSelected = true;
        this.activeTool = tool;
        this.isDrawMode = (tool === CADTool.PEN);
        this.isEraserMode = (tool === CADTool.ERASER);
    }

    toggleDrawMode() {
        this.selectTool(this.activeTool === CADTool.PEN ? CADTool.SELECT : CADTool.PEN);
    }

    toggleEraserMode() {
        this.selectTool(this.activeTool === CADTool.ERASER ? CADTool.SELECT : CADTool.ERASER);
    }

    private syncStateAfterTransform() {
        this.updateCachedPoints();
        this.routePoints = [...this._allPoints];

        // Generate curved paths dynamically if mode is enabled
        this.renderedSegments = this.segments.map(seg => {
            if (this.isCurvedMode && seg.length >= 3) {
                try {
                    const coords = seg.map(p => [p.lng, p.lat]);
                    const line = turf.lineString(coords);
                    // Aumentar resolución a 5000 (el default es 10000). 10 era excesivamente bajo y creaba miles de vectores.
                    const curved = turf.bezierSpline(line, { resolution: 5000, sharpness: this.curveSharpness });
                    if (curved && curved.geometry && curved.geometry.coordinates) {
                        return curved.geometry.coordinates.map((coord: any) => ({
                            lat: coord[1],
                            lng: coord[0]
                        }));
                    }
                } catch (e) {
                    console.error("Bezier Spline Error:", e);
                }
            }
            return [...seg]; // Fallback to straight lines
        });

        if (this.segments.length > 0 && this.segments[0].length > 0) {
            this.startPos = this.segments[0][0];
            const lastSeg = this.segments[this.segments.length - 1];
            this.endPos = lastSeg[lastSeg.length - 1];
        } else {
            this.startPos = null;
            this.endPos = null;
        }
        this.refreshMissingElevations();
        this.renderFencingPlan();
        this.emitChanges();
        this.update3DOverlay();
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Prevent external updates from overriding the map state while the user is actively drawing
        if (this.activeTool === CADTool.PEN) return;

        if ((changes['startLat'] || changes['endLat']) && !changes['startLat']?.firstChange) {
            this.updateMapFromInputs();
        }
        if (changes['smartPlan'] || changes['fencingStrategy']) {
            this.renderFencingPlan();
        }
        if (changes['projectGeometry'] && this.projectGeometry) {
            this.fitToProjectGeometry();
        }
    }

    onMapClick(event: google.maps.MapMouseEvent) {
        if (this.viewOnly) return;
        this.isSelected = true;
        if (this.activeTool !== CADTool.PEN) return;
        const latLng = event.latLng;
        if (!latLng) return;

        const pos = { lat: latLng.lat(), lng: latLng.lng() };
        this.addPoint(pos);
    }

    onMouseMove(event: google.maps.MapMouseEvent) {
        const latLng = event.latLng;
        if (latLng) {
            this.mousePos = { lat: latLng.lat(), lng: latLng.lng() };
        }
    }

    getGhostPath(): google.maps.LatLngLiteral[] {
        if (this.activeTool !== CADTool.PEN || this.points.length === 0 || !this.mousePos) {
            return [];
        }
        return [this.points[this.points.length - 1], this.mousePos];
    }

    onMarkerClick(index: number) {
        if (this.viewOnly) return;
        if (this.activeTool === CADTool.ERASER) {
            this.deletePoint(index);
        }
    }

    onMarkerDragEnd(index: number, event: google.maps.MapMouseEvent) {
        if (this.viewOnly || !event.latLng) return;

        const newPos = { lat: event.latLng.lat(), lng: event.latLng.lng() };

        // Find which segment this point belongs to and update it
        let flatIndex = 0;
        for (let s = 0; s < this.segments.length; s++) {
            const segment = this.segments[s];
            if (index >= flatIndex && index < flatIndex + segment.length) {
                const updatedSeg = [...segment];
                updatedSeg[index - flatIndex] = { ...updatedSeg[index - flatIndex], ...newPos };
                this.segments[s] = updatedSeg;
                break;
            }
            flatIndex += segment.length;
        }

        this.syncStateAfterTransform();
        this.updatePlanningState(false);
    }

    addManualPoint() {
        if (this.viewOnly) return;

        // Add at map center or a default position
        const centerPos = this.center || { lat: 52.5200, lng: 13.4050 };
        this.addPoint(centerPos);
    }

    updateManualPoint(index: number, lat: number, lng: number) {
        if (this.viewOnly) return;

        let flatIndex = 0;
        for (let s = 0; s < this.segments.length; s++) {
            const segment = this.segments[s];
            if (index >= flatIndex && index < flatIndex + segment.length) {
                const updatedSeg = [...segment];
                updatedSeg[index - flatIndex] = { ...updatedSeg[index - flatIndex], lat, lng };
                this.segments[s] = updatedSeg;
                break;
            }
            flatIndex += segment.length;
        }

        this.syncStateAfterTransform();
        this.updatePlanningState(false);
    }

    undoLastPoint() {
        const seg = this.segments[this.activeSegmentIndex];
        if (seg.length > 0) {
            const newSeg = [...seg];
            newSeg.splice(newSeg.length - 1, 1);
            this.segments[this.activeSegmentIndex] = newSeg;
            // If segment becomes empty and not the first one, go back to previous segment
            if (this.segments[this.activeSegmentIndex].length === 0 && this.activeSegmentIndex > 0) {
                this.segments.splice(this.activeSegmentIndex, 1);
                this.activeSegmentIndex--;
            }
            this.syncStateAfterTransform();
        }
    }

    deletePoint(index: number) {
        // Find which segment this point belongs to
        let flatIndex = 0;
        for (let s = 0; s < this.segments.length; s++) {
            const segment = this.segments[s];
            if (index >= flatIndex && index < flatIndex + segment.length) {
                segment.splice(index - flatIndex, 1);
                // Clean up empty segments except the last one
                if (segment.length === 0 && this.segments.length > 1) {
                    this.segments.splice(s, 1);
                    this.activeSegmentIndex = Math.min(this.activeSegmentIndex, this.segments.length - 1);
                }
                break;
            }
            flatIndex += segment.length;
        }
        this.syncStateAfterTransform();
    }

    createNewSegment() {
        if (this.segments[this.activeSegmentIndex].length > 0) {
            this.segments.push([]);
            this.activeSegmentIndex = this.segments.length - 1;
        }
    }

    toggleCurveMode() {
        this.isCurvedMode = !this.isCurvedMode;
        this.syncStateAfterTransform();
    }

    onSharpnessChange() {
        if (this.isCurvedMode) {
            this.syncStateAfterTransform();
        }
    }

    filletActiveSegment() {
        // Obsolete one-shot fillet, redirected to interactive mode toggle for UX consistency
        this.toggleCurveMode();
    }

    stretchActiveSegment(factor: number) {
        const seg = this.segments[this.activeSegmentIndex];
        if (seg.length < 2) return;
        const start = seg[0];
        this.segments[this.activeSegmentIndex] = seg.map(p => {
            return {
                lat: start.lat + (p.lat - start.lat) * factor,
                lng: start.lng + (p.lng - start.lng) * factor
            };
        });
        this.syncStateAfterTransform();
    }

    addPointFromStreetView() {
        if (!this.panorama) return;
        const pos = this.panorama.getPosition();
        if (pos) {
            this.addPoint({ lat: pos.lat(), lng: pos.lng() }, true);
        }
    }

    onPolylinePathChange() {
        if (this.polyline && this.polyline.polyline) {
            const path = this.polyline.polyline.getPath();
            const newPoints: google.maps.LatLngLiteral[] = [];
            for (let i = 0; i < path.getLength(); i++) {
                const element = path.getAt(i);
                newPoints.push({ lat: element.lat(), lng: element.lng() });
            }

            // Update active segment
            this.segments[this.activeSegmentIndex] = newPoints;
            this.updateCachedPoints();
            this.routePoints = [...this._allPoints];

            // Re-center and update state
            if (this._allPoints.length > 0) {
                const lastIdx = this.segments[this.activeSegmentIndex].length - 1;
                this.startPos = this.segments[0][0];
                this.endPos = this.segments[this.segments.length - 1][this.segments[this.segments.length - 1].length - 1];
                this.streetViewPos = this.segments[this.activeSegmentIndex][lastIdx] || this.segments[0][0];
            }
            this.refreshMissingElevations();
            this.emitChanges();
            this.update3DOverlay();
        }
    }

    setStrokeColor(color: string) {
        this.strokeColor = color;
        this.polylineOptions = {
            ...this.polylineOptions,
            strokeColor: color
        };
        this.update3DOverlay();
        this.emitChanges();
    }

    private addPoint(pos: google.maps.LatLngLiteral, isFromStreetView: boolean = false) {
        const newPoint = { ...pos, z: 0 };
        // Create new array reference for the active segment to trigger change detection in 2D map
        this.segments[this.activeSegmentIndex] = [...this.segments[this.activeSegmentIndex], newPoint];
        this.updateCachedPoints();
        this.streetViewPos = pos;

        // Instant visual update for 2D map
        this.updatePlanningState(true); // Call with 'isFastUpdate = true'

        // Fetch elevation immediately for this point so it's not cancelled by fast clicking
        this.fetchElevationForPoints([newPoint]);

        // Debounce expensive 3D and Service updates
        if (this.updateTimer) clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => {
            this.updatePlanningState(false); // Full update with addresses

            if (this.panorama && this.showStreetView) {
                if (!isFromStreetView) {
                    this.updatePanoramaPosition(pos);
                }
                this.update3DOverlay();
            }
        }, 400); // 400ms delay to allow fluid multi-clicking
    }

    private fetchElevationForPoints(pointsToFetch: any[]) {
        if (!pointsToFetch || pointsToFetch.length === 0) return;

        const locations = pointsToFetch.map(p => ({ lat: p.lat, lng: p.lng }));

        this.elevationService.getElevationForLocations({
            locations: locations
        }, (results, status) => {
            if (status === google.maps.ElevationStatus.OK && results && results.length === pointsToFetch.length) {
                for (let i = 0; i < pointsToFetch.length; i++) {
                    pointsToFetch[i].z = Math.round(results[i].elevation * 100) / 100;
                }
                this.emitChanges();
            } else {
                console.warn('Elevation service failed due to: ', status);
                pointsToFetch.forEach(p => { if (p.z === undefined) p.z = 0; });
                this.emitChanges();
            }
        });
    }

    public refreshMissingElevations() {
        const missing = this._allPoints.filter(p => (p as any).z === undefined || (p as any).z === null);
        if (missing.length > 0) {
            this.fetchElevationForPoints(missing);
        }
    }

    private updatePanoramaPosition(pos: google.maps.LatLngLiteral) {
        if (!this.panorama) return;

        // Check current position to avoid redundant "re-jumping"
        const currentPos = this.panorama.getPosition();
        if (currentPos) {
            const dist = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(pos),
                currentPos
            );
            // If already very close (within 1m), don't trigger a service call and re-set
            if (dist < 1) return;
        }

        const service = new google.maps.StreetViewService();
        service.getPanorama({ location: pos, radius: 200, source: google.maps.StreetViewSource.OUTDOOR }, (data, status) => {
            if (status === google.maps.StreetViewStatus.OK && data && data.location && data.location.latLng) {
                // Use setPano instead of setPosition to preserve navigation context and jump points
                this.panorama!.setPano(data.location.pano!);
                this.panorama!.setPov({ heading: 34, pitch: 10 }); // Reset to standard pitch if jumping far
                this.panorama!.setVisible(true);
                // REMOVED: this.center = { lat: data.location.latLng.lat(), lng: data.location.latLng.lng() }; // Prevent map jumping

                // Multiple triggers to force redraw under different container states
                google.maps.event.trigger(this.panorama as any, 'resize');

                setTimeout(() => {
                    if (this.panorama) {
                        google.maps.event.trigger(this.panorama as any, 'resize');
                        this.update3DOverlay();
                    }
                }, 200); // Slightly more delay to allow layout to settle
            } else {
                console.warn('Street View data not found at this location. (ERR:', status, ')');
                if (this.panorama) this.panorama.setVisible(false);
            }
        });
    }

    private updatePlanningState(isFastUpdate: boolean = false) {
        if (this._allPoints.length === 0) return;

        this.startPos = this._allPoints[0];
        this.endPos = this._allPoints[this._allPoints.length - 1];
        this.routePoints = [...this._allPoints];
        this.refreshMissingElevations();

        // Skip heavy address lookups during fast updates
        if (isFastUpdate) return;

        if (this._allPoints.length === 1) {
            this.routingService.getAddress(this.startPos.lat, this.startPos.lng).subscribe(addr => this.startAddress = addr);
        }

        if (this._allPoints.length >= 2) {
            this.calculateTotalLength();
            this.routingService.getAddress(this.endPos.lat, this.endPos.lng).subscribe(addr => {
                this.endAddress = addr;
                this.emitChanges();
            });
        }
    }

    public calculateTotalLength() {
        let length = 0;
        for (let i = 0; i < this._allPoints.length - 1; i++) {
            const p1 = new google.maps.LatLng(this._allPoints[i]);
            const p2 = new google.maps.LatLng(this._allPoints[i + 1]);
            length += google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
        }
        return length;
    }

    public get vectors() {
        if (!this._allPoints || this._allPoints.length < 2) return [];
        const vecs = [];
        for (let i = 0; i < this._allPoints.length - 1; i++) {
            const p1 = this._allPoints[i] as any;
            const p2 = this._allPoints[i + 1] as any;

            const startZ = p1.z !== undefined && p1.z !== null ? p1.z : 0;
            const endZ = p2.z !== undefined && p2.z !== null ? p2.z : 0;

            const p1LatLng = new google.maps.LatLng(p1);
            const p2LatLng = new google.maps.LatLng(p2);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(p1LatLng, p2LatLng);

            let slope = 0;
            if (distance > 0) {
                slope = ((endZ - startZ) / distance) * 100;
            }

            vecs.push({
                index: i + 1,
                startZ: startZ,
                endZ: endZ,
                distance: distance,
                slope: slope
            });
        }
        return vecs;
    }

    private emitChanges() {
        this.coordinatesChanged.emit({
            startLat: this.startPos!.lat,
            startLng: this.startPos!.lng,
            endLat: this.endPos!.lat,
            endLng: this.endPos!.lng,
            geometry: this.renderedSegments.flat(),
            length: Math.round(this.calculateTotalLength()),
            startAddress: this.startAddress,
            endAddress: this.endAddress
        });
    }

    toggleStreetView() {
        // No longer toggling in split view, but kept for compatibility
        this.showStreetView = true;
        this.initPanorama();
    }

    onMapTypeChange() {
        if (this.map) {
            // mapTypeId is bound, but we can force it if needed
        }
    }

    private calculateRoute(): void {
        if (!this.points || this.points.length < 2) return;

        // Skip heavy routing/bounds fitting while in PEN mode to keep interaction fluid
        if (this.activeTool === CADTool.PEN) return;

        this.routingService.getStreetRoute(this.points)
            .subscribe(route => {
                this.routePoints = route.map(c => ({ lat: c.lat, lng: c.lng }));

                // Calculate length
                let length = 0;
                for (let i = 0; i < this.routePoints.length - 1; i++) {
                    const p1 = new google.maps.LatLng(this.routePoints[i]);
                    const p2 = new google.maps.LatLng(this.routePoints[i + 1]);
                    length += google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
                }

                // Auto-fit bounds
                this.fitBounds();

                this.refreshMissingElevations();

                // Emit
                this.coordinatesChanged.emit({
                    startLat: this.points[0].lat,
                    startLng: this.points[0].lng,
                    endLat: this.points[this.points.length - 1].lat,
                    endLng: this.points[this.points.length - 1].lng,
                    length: Math.round(length),
                    startAddress: this.startAddress,
                    endAddress: this.endAddress,
                    geometry: this.renderedSegments.flat()
                });
            });
    }

    private fitBounds() {
        if (this.routePoints.length < 2 || this.activeTool === CADTool.PEN) return;
        const bounds = new google.maps.LatLngBounds();
        this.routePoints.forEach(p => bounds.extend(p));
        if (this.map) {
            this.map.fitBounds(bounds);
        }
    }

    private renderFencingPlan(): void {
        const paths = this.renderedSegments.filter(s => s.length > 0);
        if (!paths.length) return;

        this.fencingMarkers = [];

        const strategy = this.fencingStrategy || 'none';
        if (strategy === 'none') {
            return;
        }

        const barrierSpacing = 10; // meters

        if (strategy === 'standard' || strategy === 'custom') {
            // Add Barriers
            paths.forEach(path => {
                for (let i = 0; i < path.length - 1; i++) {
                    const p1 = new google.maps.LatLng(path[i]);
                    const p2 = new google.maps.LatLng(path[i + 1]);
                    const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);

                    let currentDist = 0;
                    while (currentDist < dist) {
                        const fraction = currentDist / dist;
                        const pos = google.maps.geometry.spherical.interpolate(p1, p2, fraction);

                        this.fencingMarkers.push({
                            position: { lat: pos.lat(), lng: pos.lng() },
                            title: 'Fencing Barrier',
                            options: {
                                label: { text: '🚧', color: 'orange', fontSize: '16px' },
                                clickable: false
                            }
                        });
                        currentDist += barrierSpacing;
                    }
                }

                // Add Traffic Light at ends
                if (path.length > 0) {
                    this.fencingMarkers.push({
                        position: path[0],
                        title: 'Traffic Light Required',
                        options: {
                            label: { text: '🚦', fontSize: '24px' },
                            clickable: false
                        }
                    });
                    this.fencingMarkers.push({
                        position: path[path.length - 1],
                        title: 'Traffic Light Required',
                        options: {
                            label: { text: '🚦', fontSize: '24px' },
                            clickable: false
                        }
                    });
                }
            });
        } else if (strategy === 'sidewalk') {
            // Add Cones instead
            paths.forEach(path => {
                for (let i = 0; i < path.length - 1; i++) {
                    const p1 = new google.maps.LatLng(path[i]);
                    const p2 = new google.maps.LatLng(path[i + 1]);
                    const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);

                    let currentDist = 0;
                    while (currentDist < dist) {
                        const fraction = currentDist / dist;
                        const pos = google.maps.geometry.spherical.interpolate(p1, p2, fraction);

                        this.fencingMarkers.push({
                            position: { lat: pos.lat(), lng: pos.lng() },
                            title: 'Cone',
                            options: {
                                label: { text: '🔺', color: 'red', fontSize: '16px' },
                                clickable: false
                            }
                        });
                        currentDist += barrierSpacing;
                    }
                }
            });
        }
    }

    private updateMapFromInputs(): void {
        if (!this.startLat || !this.endLat) return;
        this.startPos = { lat: this.startLat, lng: this.startLng };
        this.endPos = { lat: this.endLat, lng: this.endLng };

        if (this.segmentGeometry && this.segmentGeometry.length > 0) {
            // Cargar los puntos guardados del backend
            this.segments = [this.segmentGeometry.map(p => ({ lat: p.lat, lng: p.lng }))];
            this._allPoints = [...this.segments[0]];
            this.routePoints = [...this._allPoints];
            this.renderedSegments = [...this.segments];
        } else if (!this.points || this.points.length < 2) {
            // Fallback a una línea recta básica
            this.segments = [[this.startPos, this.endPos]];
            this._allPoints = [this.startPos, this.endPos];
        }

        this.calculateRoute();
    }

    resetMap(): void {
        this.startPos = null;
        this.endPos = null;
        this.segments = [[]];
        this._allPoints = [];
        this.activeSegmentIndex = 0;
        this.routePoints = [];
        this.fencingMarkers = [];
        this.startAddress = undefined;
        this.endAddress = undefined;

        // Clear 3D Overlays
        if (this.streetViewPolyline) {
            this.streetViewPolyline.setMap(null);
            this.streetViewPolyline = null;
        }
        if (this.streetViewPolylineBorder) {
            this.streetViewPolylineBorder.setMap(null);
            this.streetViewPolylineBorder = null;
        }
        this.streetViewMarkers.forEach(m => m.setMap(null));
        this.streetViewMarkers = [];
        this.streetViewLineMarkers.forEach(m => m.setMap(null));
        this.streetViewLineMarkers = [];
    }

    invalidateSize(): void {
        // Handled by Angular Google Maps
    }
}
