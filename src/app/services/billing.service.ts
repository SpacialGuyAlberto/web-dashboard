import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface WorkLog {
    id?: number;
    segmentId: number;
    crewId: number;
    date: string;
    metersCompleted: number;
    hoursWorked: number;
    crossingsCompleted: number;
    reworkMeters: number;
    notes?: string;
}

export interface WorkLogDTO {
    id: number;
    segmentId: number;
    segmentName: string;
    crewId: number;
    crewName: string;
    subcontractorId: number;
    subcontractorName: string;
    date: string;
    metersCompleted: number;
    hoursWorked: number;
    crossingsCompleted: number;
    reworkMeters: number;
    notes?: string;
}

export interface BillingUnit {
    id?: number;
    subcontractorId: number;
    pricePerMeter: number;
    pricePerCrossing: number;
    pricePerManHour: number;
    effectiveFrom: string;
    effectiveTo?: string;
}

export interface BillingReport {
    subcontractorId: number;
    subcontractorName: string;
    totalMeters: number;
    totalHours: number;
    totalCrossings: number;
    totalReworkMeters: number;
    pricePerMeter: number;
    pricePerCrossing: number;
    pricePerManHour: number;
    meterCost: number;
    hourCost: number;
    crossingCost: number;
    totalAmount: number;
}

@Injectable({
    providedIn: 'root'
})
export class BillingService {
    private apiUrl = 'http://localhost:8080/api/billing';

    constructor(private http: HttpClient) { }

    createWorkLog(workLog: WorkLog): Observable<WorkLog> {
        return this.http.post<WorkLog>(`${this.apiUrl}/worklogs`, workLog);
    }

    getWorkLogsBySegment(segmentId: number): Observable<WorkLogDTO[]> {
        return this.http.get<WorkLogDTO[]>(`${this.apiUrl}/worklogs/segment/${segmentId}`);
    }

    getWorkLogsByCrew(crewId: number): Observable<WorkLogDTO[]> {
        return this.http.get<WorkLogDTO[]>(`${this.apiUrl}/worklogs/crew/${crewId}`);
    }

    getAllWorkLogs(): Observable<WorkLogDTO[]> {
        return this.http.get<WorkLogDTO[]>(`${this.apiUrl}/worklogs`);
    }

    getSubcontractorReport(subcontractorId: number, startDate: string, endDate: string): Observable<BillingReport> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<BillingReport>(`${this.apiUrl}/reports/subcontractor/${subcontractorId}`, { params });
    }

    exportWorkLogs(format: string, subcontractorId: number | null, startDate: string, endDate: string): Observable<Blob> {
        let params = new HttpParams()
            .set('format', format)
            .set('startDate', startDate)
            .set('endDate', endDate);
        if (subcontractorId) params = params.set('subcontractorId', subcontractorId.toString());

        return this.http.get(`${this.apiUrl}/export`, {
            params,
            responseType: 'blob'
        });
    }
}
