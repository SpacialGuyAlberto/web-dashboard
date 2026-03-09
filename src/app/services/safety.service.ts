import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SafetyProtocol {
    id?: number;
    segmentId: number;
    regelplanType: string;
    streetCategory: string;
    workType: string;
    requiredSigns: string; // JSON string
    requiredBarriers: string; // JSON string
    notes?: string;
    validated: boolean;
}

export interface TrafficPermit {
    id?: number;
    segmentId: number;
    permitNumber: string;
    issuingAuthority?: string;
    validFrom?: string;
    validTo?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    conditions?: string;
}

export interface Incident {
    id?: number;
    segmentId: number;
    type: 'BLOCKED' | 'WEATHER' | 'COMPLAINT' | 'SAFETY' | 'ACCIDENT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    reportedBy?: string;
    reportedAt?: string;
    photos?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class SafetyService {
    private apiUrl = 'http://localhost:8080/api/safety';

    constructor(private http: HttpClient) { }

    // Protocols
    getProtocol(segmentId: number): Observable<SafetyProtocol> {
        return this.http.get<SafetyProtocol>(`${this.apiUrl}/protocols/segment/${segmentId}`);
    }

    createOrUpdateProtocol(protocol: SafetyProtocol): Observable<SafetyProtocol> {
        return this.http.post<SafetyProtocol>(`${this.apiUrl}/protocols`, protocol);
    }

    // Permits
    getPermits(segmentId: number): Observable<TrafficPermit[]> {
        return this.http.get<TrafficPermit[]>(`${this.apiUrl}/permits/segment/${segmentId}`);
    }

    createPermit(permit: TrafficPermit): Observable<TrafficPermit> {
        return this.http.post<TrafficPermit>(`${this.apiUrl}/permits`, permit);
    }

    updatePermitStatus(id: number, status: string): Observable<TrafficPermit> {
        return this.http.put<TrafficPermit>(`${this.apiUrl}/permits/${id}/status`, {}, { params: { status } });
    }

    // Incidents
    getIncidents(segmentId: number): Observable<Incident[]> {
        return this.http.get<Incident[]>(`${this.apiUrl}/incidents/segment/${segmentId}`);
    }

    reportIncident(incident: Incident): Observable<Incident> {
        return this.http.post<Incident>(`${this.apiUrl}/incidents`, incident);
    }

    updateIncidentStatus(id: number, status: string): Observable<Incident> {
        return this.http.put<Incident>(`${this.apiUrl}/incidents/${id}/status`, {}, { params: { status } });
    }

    getAutomatedPlan(lat: number, lng: number, length: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/plan`, {
            params: { lat, lng, length }
        });
    }
}
