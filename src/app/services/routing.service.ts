import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';

import { RouteCoordinate, OSRMResponse } from '../models/routing.model';

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
     * Get a route between two points that follows actual streets.
     * Uses OSRM (Open Source Routing Machine) public API.
     */
    getStreetRoute(
        startLat: number,
        startLng: number,
        endLat: number,
        endLng: number
    ): Observable<RouteCoordinate[]> {
        // Create cache key
        const cacheKey = `${startLat},${startLng};${endLat},${endLng}`;

        // Check cache first
        if (this.routeCache.has(cacheKey)) {
            console.log('🗺️ Route from cache:', cacheKey);
            return of(this.routeCache.get(cacheKey)!);
        }

        // OSRM expects coordinates in format: lng,lat;lng,lat
        const url = `${this.osrmUrl}/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full`;
        console.log('🛣️ Fetching route from OSRM:', url);

        return this.http.get<OSRMResponse>(url).pipe(
            map(response => {
                console.log('📍 OSRM response code:', response.code, 'routes:', response.routes?.length);
                if (response.code === 'Ok' && response.routes && response.routes.length > 0) {
                    // OSRM returns coordinates as [lng, lat], convert to {lat, lng}
                    const coordinates = response.routes[0].geometry.coordinates.map(coord => ({
                        lat: coord[1],
                        lng: coord[0]
                    }));

                    console.log(`✅ Route found with ${coordinates.length} waypoints`);
                    // Cache the result
                    this.routeCache.set(cacheKey, coordinates);

                    return coordinates;
                }

                console.warn('⚠️ No routes in OSRM response, using fallback');
                return this.getStraightLine(startLat, startLng, endLat, endLng);
            }),
            catchError(error => {
                console.error('❌ OSRM routing failed:', error);
                return of(this.getStraightLine(startLat, startLng, endLat, endLng));
            })
        );
    }

    /**
     * Fallback: returns just start and end points (straight line)
     */
    private getStraightLine(
        startLat: number,
        startLng: number,
        endLat: number,
        endLng: number
    ): RouteCoordinate[] {
        console.log('📏 Using straight line fallback');
        return [
            { lat: startLat, lng: startLng },
            { lat: endLat, lng: endLng }
        ];
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
