import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface UtilityProvider {
    id: number;
    name: string;
    type: string;
    serviceRegion: string;
    contactEmail: string;
}

export interface Inquiry {
    id: number;
    projectId: number;
    utilityProvider: UtilityProvider;
    status: 'PENDING' | 'SENT' | 'RECEIVED_CLEAR' | 'RECEIVED_CONFLICT';
    requestDate?: string;
    responseFileUrl?: string;
    analysisResult?: string;
    analysisStatus?: 'NONE' | 'PENDING' | 'COMPLETED' | 'FAILED';
}

@Injectable({
    providedIn: 'root'
})
export class InfrastructureService {
    // Session Key
    private readonly INQUIRIES_KEY = 'mock_infrastructure_inquiries';

    constructor(private http: HttpClient) {
        this.initializeMockData();
    }

    private initializeMockData() {
        if (!sessionStorage.getItem(this.INQUIRIES_KEY)) {
            const mockInquiries: Inquiry[] = [
                {
                    id: 1,
                    projectId: 1,
                    utilityProvider: { id: 101, name: 'Stadtwerke Water', type: 'WATER', serviceRegion: 'Berlin', contactEmail: 'info@water.de' },
                    status: 'PENDING',
                    requestDate: '2025-01-02'
                },
                {
                    id: 2,
                    projectId: 1,
                    utilityProvider: { id: 102, name: 'Berlin Gas Grid', type: 'GAS', serviceRegion: 'Berlin', contactEmail: 'ops@gas.de' },
                    status: 'RECEIVED_CONFLICT',
                    requestDate: '2024-12-28',
                    responseFileUrl: 'mock-plan.pdf',
                    analysisStatus: 'NONE'
                },
                {
                    id: 3,
                    projectId: 1,
                    utilityProvider: { id: 103, name: 'ElectroNet', type: 'ELECTRICITY', serviceRegion: 'Berlin', contactEmail: 'contact@electronet.de' },
                    status: 'RECEIVED_CLEAR',
                    requestDate: '2024-12-29'
                }
            ];
            sessionStorage.setItem(this.INQUIRIES_KEY, JSON.stringify(mockInquiries));
        }
    }

    private get<T>(key: string): T[] {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    private save<T>(key: string, data: T[]): void {
        sessionStorage.setItem(key, JSON.stringify(data));
    }

    getInquiries(projectId: number): Observable<Inquiry[]> {
        const all = this.get<Inquiry>(this.INQUIRIES_KEY);
        // In full mock, valid projectId might differ, so return all or filter if ID matches mock
        // For demo, just returning all is safer to ensure data visibility
        return of(all);
        // return of(all.filter(i => i.projectId === projectId));
    }

    generateInquiries(projectId: number, region: string = 'Berlin'): Observable<Inquiry[]> {
        const current = this.get<Inquiry>(this.INQUIRIES_KEY);
        const newInquiries: Inquiry[] = [
            {
                id: Math.floor(Math.random() * 10000),
                projectId: projectId,
                utilityProvider: { id: 201, name: 'Telekom Fiber', type: 'TELECOM', serviceRegion: region, contactEmail: 'bau@telekom.de' },
                status: 'PENDING',
                requestDate: new Date().toISOString().split('T')[0]
            },
            {
                id: Math.floor(Math.random() * 10000),
                projectId: projectId,
                utilityProvider: { id: 202, name: 'District Heating Co.', type: 'HEATING', serviceRegion: region, contactEmail: 'heat@berlin.de' },
                status: 'PENDING',
                requestDate: new Date().toISOString().split('T')[0]
            }
        ];

        const updated = [...current, ...newInquiries];
        this.save(this.INQUIRIES_KEY, updated);

        return new Observable(observer => {
            setTimeout(() => {
                observer.next(newInquiries); // Return just the new ones as per likely API contract, or re-fetch all
                observer.complete();
            }, 800);
        });
    }

    updateStatus(inquiryId: number, status: string): Observable<Inquiry> {
        return new Observable(observer => {
            const all = this.get<Inquiry>(this.INQUIRIES_KEY);
            const index = all.findIndex(i => i.id === inquiryId);
            if (index !== -1) {
                all[index].status = status as any;
                this.save(this.INQUIRIES_KEY, all);
                setTimeout(() => {
                    observer.next(all[index]);
                    observer.complete();
                }, 300);
            } else {
                observer.error('Inquiry not found');
            }
        });
    }

    analyzeInquiry(inquiryId: number): Observable<Inquiry> {
        return new Observable(observer => {
            const all = this.get<Inquiry>(this.INQUIRIES_KEY);
            const index = all.findIndex(i => i.id === inquiryId);
            if (index !== -1) {
                // Mock analysis delay
                all[index].analysisStatus = 'PENDING';
                this.save(this.INQUIRIES_KEY, all);

                setTimeout(() => {
                    // Refresh from storage in case of race conditions (unlikely in single thread JS but good practice)
                    const currentAll = this.get<Inquiry>(this.INQUIRIES_KEY);
                    const currentIndex = currentAll.findIndex(i => i.id === inquiryId);
                    if (currentIndex !== -1) {
                        currentAll[currentIndex].analysisStatus = 'COMPLETED';
                        currentAll[currentIndex].analysisResult = 'AI Analysis detected 2 potential conflicts with gas pipes at depth 1.5m. Recommended action: Manual test pit verification required.';
                        this.save(this.INQUIRIES_KEY, currentAll);
                        observer.next(currentAll[currentIndex]);
                        observer.complete();
                    }
                }, 2000); // 2 second delay for "AI" effect
            } else {
                observer.error('Inquiry not found');
            }
        });
    }
}
