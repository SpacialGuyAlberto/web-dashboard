import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';

import { RouteCoordinate, OSRMResponse } from './routing.model';

@Injectable({
    providedIn: 'root'
})
export class RoutingService {
    // OSRM public API - uses 'driving' profile for road routing
    private osrmUrl = 'https://router.project-osrm.org/route/v1/driving';

    // Cache to avoid redundant API calls
    private routeCache = new Map<string, RouteCoordinate[]>();

    constructor(private http: HttpClient) { }

    /**
     * Get a route between multiple points that follows actual streets.
     */
    getStreetRoute(
        waypoints: RouteCoordinate[]
    ): Observable<RouteCoordinate[]> {
        if (!waypoints || waypoints.length < 2) return of([]);

        // Create cache key
        const cacheKey = waypoints.map(w => `${w.lat},${w.lng}`).join(';');

        // Check cache first
        if (this.routeCache.has(cacheKey)) {
            console.log('🗺️ Route from cache:', cacheKey);
            return of(this.routeCache.get(cacheKey)!);
        }

        // OSRM expects coordinates in format: lng1,lat1;lng2,lat2;...;lngn,latn
        const coordString = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
        const url = `${this.osrmUrl}/${coordString}?geometries=geojson&overview=full`;

        console.log('🛣️ Fetching multi-point route from OSRM:', url);

        return this.http.get<OSRMResponse>(url).pipe(
            map(response => {
                if (response.code === 'Ok' && response.routes && response.routes.length > 0) {
                    const coordinates = response.routes[0].geometry.coordinates.map(coord => ({
                        lat: coord[1],
                        lng: coord[0]
                    }));

                    console.log(`✅ Multi-point route found with ${coordinates.length} waypoints`);
                    this.routeCache.set(cacheKey, coordinates);
                    return coordinates;
                }

                console.warn('⚠️ No routes in OSRM response, using fallback');
                return this.getStraightLineThroughWaypoints(waypoints);
            }),
            catchError(error => {
                console.error('❌ OSRM routing failed:', error);
                return of(this.getStraightLineThroughWaypoints(waypoints));
            })
        );
    }

    /**
     * Fallback: returns the waypoints as a straight line path
     */
    private getStraightLineThroughWaypoints(
        waypoints: RouteCoordinate[]
    ): RouteCoordinate[] {
        console.log('📏 Using straight line fallback for waypoints');
        return waypoints;
    }

    /**
     * Get address from coordinates using Nominatim (OpenStreetMap)
     */
    getAddress(lat: number, lng: number): Observable<string> {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        return this.http.get<any>(url).pipe(
            map(response => {
                if (response && response.display_name) {
                    return response.display_name;
                }
                return 'Address not found';
            }),
            catchError(error => {
                console.error('❌ Geocoding failed:', error);
                return of('Address lookup failed');
            })
        );
    }

    /**
     * Clear the route cache (useful for testing or memory management)
     */
    clearCache(): void {
        this.routeCache.clear();
    }
}
