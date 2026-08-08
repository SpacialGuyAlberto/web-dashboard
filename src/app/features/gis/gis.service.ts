import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { GISFeature, TopologyValidation, GISStats } from './gis.model';

@Injectable({
    providedIn: 'root'
})
export class GISService {
    private apiUrl = 'http://localhost:8080/api/gis';

    constructor(private http: HttpClient) { }

    importGeoJSON(file: File, version: string = 'PLAN'): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('version', version);
        return this.http.post(`${this.apiUrl}/import`, formData);
    }

    exportGeoJSON(version: string = 'PLAN', featureType?: string): Observable<Blob> {
        let params = new HttpParams().set('version', version);
        if (featureType) {
            params = params.set('featureType', featureType);
        }

        return this.http.get(`${this.apiUrl}/export`, {
            params,
            responseType: 'blob'
        });
    }

    getFeatures(version: string = 'PLAN', featureType?: string): Observable<GISFeature[]> {
        let params = new HttpParams().set('version', version);
        if (featureType) {
            params = params.set('featureType', featureType);
        }

        return this.http.get<GISFeature[]>(`${this.apiUrl}/features`, { params });
    }

    validateTopology(version: string = 'PLAN'): Observable<TopologyValidation> {
        const params = new HttpParams().set('version', version);
        return this.http.get<TopologyValidation>(`${this.apiUrl}/topology/validate`, { params });
    }

    promoteVersion(featureId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/versions/promote/${featureId}`, {});
    }

    getStats(): Observable<GISStats> {
        return this.http.get<GISStats>(`${this.apiUrl}/stats`);
    }
}
