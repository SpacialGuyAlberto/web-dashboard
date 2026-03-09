import { Component, OnInit, AfterViewInit, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, GoogleMap, MapPolyline, MapMarker } from '@angular/google-maps';
import { RiskScore } from '../../services/planning.service';
import { RoutingService } from '../../services/routing.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-map-view',
    standalone: true,
    imports: [CommonModule, GoogleMapsModule, MapPolyline, MapMarker],
    templateUrl: './map-view.component.html',
    styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements OnChanges {
    @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;

    @Input() segments: any[] = [];
    @Input() riskData: RiskScore[] = [];

    center: google.maps.LatLngLiteral = { lat: 52.5200, lng: 13.4050 };
    zoom = 12;
    mapOptions: google.maps.MapOptions = {
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        styles: [
            {
                featureType: 'all',
                elementType: 'all',
                stylers: [{ saturation: -100 }, { lightness: -20 }]
            }
        ]
    };

    polylines: any[] = [];
    markers: any[] = [];

    constructor(private routingService: RoutingService) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['segments'] || changes['riskData']) {
            this.renderSegments();
        }
    }

    public flyToSegment(segmentId: number): void {
        const segment = this.segments.find(s => s.id == segmentId);
        if (segment && segment.startLatitude && this.map) {
            this.map.panTo({ lat: segment.startLatitude, lng: segment.startLongitude });
            this.map.zoom = 15;
        }
    }

    private renderSegments(): void {
        if (!this.segments || this.segments.length === 0) return;

        const validSegments = this.segments.filter(
            s => s.startLatitude && s.startLongitude && s.endLatitude && s.endLongitude
        );

        const routeRequests = validSegments.map(segment =>
            this.routingService.getStreetRoute(
                segment.startLatitude,
                segment.startLongitude,
                segment.endLatitude,
                segment.endLongitude
            ).pipe(
                catchError(() => of([
                    { lat: segment.startLatitude, lng: segment.startLongitude },
                    { lat: segment.endLatitude, lng: segment.endLongitude }
                ]))
            )
        );

        forkJoin(routeRequests).subscribe(routes => {
            this.polylines = [];
            this.markers = [];

            const bounds = new google.maps.LatLngBounds();

            validSegments.forEach((segment, index) => {
                const routeCoords = routes[index];
                const risk = this.riskData.find(r => r.segmentId == segment.id);
                const color = this.getRiskColor(risk?.riskLevel);

                const path = routeCoords.map(c => ({ lat: c.lat, lng: c.lng }));

                this.polylines.push({
                    path: path,
                    options: {
                        strokeColor: color,
                        strokeOpacity: 0.8,
                        strokeWeight: 8,
                        lineCap: 'round'
                    },
                    title: segment.streetName || 'Segment ' + segment.id,
                    info: `Status: ${segment.currentState}, Risk: ${risk?.riskLevel || 'LOW'}`
                });

                // Add Hammer Icon at center or start
                if (path.length > 0) {
                    this.markers.push({
                        position: path[Math.floor(path.length / 2)],
                        label: { text: '🔨', fontSize: '20px' },
                        title: segment.streetName
                    });
                    path.forEach(p => bounds.extend(p));
                }
            });

            if (this.map && !bounds.isEmpty()) {
                this.map.fitBounds(bounds);
            }
        });
    }

    private getRiskColor(level?: string): string {
        switch (level) {
            case 'HIGH': return '#ff0040';
            case 'MEDIUM': return '#ffcc00';
            case 'LOW': return '#00ff88';
            default: return '#00ccff';
        }
    }
}
