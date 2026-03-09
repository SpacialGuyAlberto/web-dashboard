import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Subcontractor {
    id?: number;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    rating?: number;
    status: 'PREFERRED' | 'ACTIVE' | 'BLOCKED';
    skills: string[];
    certifications?: string[];
    averageTimePerMeter?: number;
    defectRate?: number;
    reworkFrequency?: number;
}

export interface Crew {
    id?: number;
    name: string;
    subcontractor?: Subcontractor;
    foremanName: string;
    size: number;
    vehiclePlate: string;
}

@Injectable({
    providedIn: 'root'
})
export class SubcontractorService {
    // Session Keys
    private readonly SUBCONTRACTORS_KEY = 'subcontractor_list';
    private readonly CREWS_KEY = 'subcontractor_crews';

    constructor(private http: HttpClient) {
        this.initializeMockData();
    }

    private initializeMockData() {
        if (!sessionStorage.getItem(this.SUBCONTRACTORS_KEY)) {
            const mockSubcontractors: Subcontractor[] = [
                {
                    id: 1, name: 'Berlin Tiefbau GmbH', contactPerson: 'Hans Mueller', email: 'hans@tiefbau.de',
                    phone: '030-123456', rating: 4.8, status: 'PREFERRED',
                    skills: ['Excavation', 'Fiber Blowing'], certifications: ['ISO 9001']
                },
                {
                    id: 2, name: 'Schmidt Bau', contactPerson: 'Fritz Schmidt', email: 'fritz@schmidt-bau.de',
                    phone: '089-987654', rating: 4.2, status: 'ACTIVE',
                    skills: ['Paving', 'Restoration']
                }
            ];
            sessionStorage.setItem(this.SUBCONTRACTORS_KEY, JSON.stringify(mockSubcontractors));
        }

        if (!sessionStorage.getItem(this.CREWS_KEY)) {
            // Mock crews must align with IDs used in ScheduleService (101, 102)
            const mockCrews: Crew[] = [
                {
                    id: 101, name: 'Alpha Crew', foremanName: 'Mike Ross', size: 4, vehiclePlate: 'B-XY 123',
                    subcontractor: { id: 1, name: 'Berlin Tiefbau GmbH' } as Subcontractor
                },
                {
                    id: 102, name: 'Beta Crew', foremanName: 'Harvey Specter', size: 5, vehiclePlate: 'M-ZW 987',
                    subcontractor: { id: 2, name: 'Schmidt Bau' } as Subcontractor
                },
                {
                    id: 103, name: 'Gamma Crew', foremanName: 'Louis Litt', size: 3, vehiclePlate: 'HH-AA 111',
                    subcontractor: { id: 1, name: 'Berlin Tiefbau GmbH' } as Subcontractor
                }
            ];
            sessionStorage.setItem(this.CREWS_KEY, JSON.stringify(mockCrews));
        }
    }

    private get<T>(key: string): T[] {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    private save<T>(key: string, data: T[]): void {
        sessionStorage.setItem(key, JSON.stringify(data));
    }

    getSubcontractors(): Observable<Subcontractor[]> {
        return of(this.get<Subcontractor>(this.SUBCONTRACTORS_KEY));
    }

    createSubcontractor(subcontractor: Subcontractor): Observable<Subcontractor> {
        const list = this.get<Subcontractor>(this.SUBCONTRACTORS_KEY);
        subcontractor.id = Math.floor(Math.random() * 10000);
        list.push(subcontractor);
        this.save(this.SUBCONTRACTORS_KEY, list);
        return of(subcontractor);
    }

    getSubcontractorCrews(subcontractorId: number): Observable<Crew[]> {
        const allCrews = this.get<Crew>(this.CREWS_KEY);
        // Safely access subcontractor.id with optional chaining or type check mock data structure
        const filtered = allCrews.filter(c => c.subcontractor && c.subcontractor.id == subcontractorId);
        return of(filtered);
    }

    createCrew(subcontractorId: number, crew: Crew): Observable<Crew> {
        const crews = this.get<Crew>(this.CREWS_KEY);
        crew.id = Math.floor(Math.random() * 10000);
        // Find sub to link name
        const subs = this.get<Subcontractor>(this.SUBCONTRACTORS_KEY);
        crew.subcontractor = subs.find(s => s.id == subcontractorId);

        crews.push(crew);
        this.save(this.CREWS_KEY, crews);
        return of(crew);
    }

    getAllCrews(): Observable<Crew[]> {
        return of(this.get<Crew>(this.CREWS_KEY));
    }
}
