import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { FieldCrew } from './models/field-crew.model';
import { Evidence } from './models/evidence.model';

@Injectable({
    providedIn: 'root'
})
export class FieldService {
    // Session Keys
    private readonly EVIDENCE_KEY = 'field_evidence';
    private readonly CREWS_KEY = 'field_crews';

    constructor(private http: HttpClient) {
        this.initializeMockData();
    }

    private initializeMockData() {
        if (!sessionStorage.getItem(this.CREWS_KEY)) {
            const mockCrews: FieldCrew[] = [
                { id: 101, name: 'Alpha Crew', leader: 'Mike Ross', members: 4, currentProject: 'Bridge Repair', status: 'ACTIVE', location: 'Sector 7' },
                { id: 102, name: 'Beta Crew', leader: 'Harvey Specter', members: 5, currentProject: 'Road Laying', status: 'IDLE', location: 'HQ' },
                { id: 103, name: 'Gamma Crew', leader: 'Louis Litt', members: 3, currentProject: 'Surveying', status: 'ACTIVE', location: 'Sector 2' }
            ];
            sessionStorage.setItem(this.CREWS_KEY, JSON.stringify(mockCrews));
        }

        if (!sessionStorage.getItem(this.EVIDENCE_KEY)) {
            // Mock some initial evidence if needed, or leave empty
            sessionStorage.setItem(this.EVIDENCE_KEY, JSON.stringify([]));
        }
    }

    // Helper to get from session
    private get<T>(key: string): T[] {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    // Helper to save to session
    private save<T>(key: string, data: T[]): void {
        sessionStorage.setItem(key, JSON.stringify(data));
    }

    submitEvidence(evidence: Evidence): Observable<Evidence> {
        const allEvidence = this.get<Evidence>(this.EVIDENCE_KEY);
        evidence.id = Math.floor(Math.random() * 10000);
        evidence.createdAt = new Date().toISOString();
        allEvidence.push(evidence);
        this.save(this.EVIDENCE_KEY, allEvidence);
        return of(evidence);
    }

    getEvidenceForSegment(segmentId: number): Observable<Evidence[]> {
        const allEvidence = this.get<Evidence>(this.EVIDENCE_KEY);
        const filtered = allEvidence.filter(e => e.segmentId === segmentId);
        return of(filtered);
    }

    getCrews(): Observable<FieldCrew[]> {
        return of(this.get<FieldCrew>(this.CREWS_KEY));
    }

    createCrew(crew: FieldCrew): Observable<FieldCrew> {
        const crews = this.get<FieldCrew>(this.CREWS_KEY);
        crew.id = Math.floor(Math.random() * 10000);
        crews.push(crew);
        this.save(this.CREWS_KEY, crews);
        return of(crew);
    }

    updateCrew(id: number, crew: FieldCrew): Observable<FieldCrew> {
        const crews = this.get<FieldCrew>(this.CREWS_KEY);
        const index = crews.findIndex(c => c.id === id);
        if (index !== -1) {
            crews[index] = { ...crews[index], ...crew };
            this.save(this.CREWS_KEY, crews);
            return of(crews[index]);
        }
        throw new Error('Crew not found');
    }

    getCrewById(id: number): Observable<FieldCrew> {
        const crews = this.get<FieldCrew>(this.CREWS_KEY);
        const crew = crews.find(c => c.id === id);
        return crew ? of(crew) : of({} as FieldCrew);
    }
}
