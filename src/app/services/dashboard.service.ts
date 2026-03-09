import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
    overallProgress: number;
    highRiskSegments: number;
    highRiskTrend: number;
    predictedDelayDays: number;
    dailyProduction: number;
    dailyProductionTarget: number;
    openIncidents: number;
    criticalIncidents: number;
    pendingPermits: number;
    avgPermitWaitDays: number;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = 'http://localhost:8080/api/dashboard';

    constructor(private http: HttpClient) { }

    getStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
    }
}
