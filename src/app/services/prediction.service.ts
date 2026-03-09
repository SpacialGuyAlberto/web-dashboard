import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface RiskScore {
    segmentId: number;
    segmentName?: string; // Added for UI
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    score: number;
    // New fields for detailed dashboard
    delayProbability: number;
    scheduleRisk: number;
    permitRisk: number;
    performanceRisk: number;
    safetyRisk: number;
    qualityRisk: number;
    environmentRisk: number;
    topCauses: string[];

    factors: any;
    recommendedActions: string[];
}

export interface ProjectRisk {
    projectId: number;
    overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    averageRiskScore: number;
    segmentsAtRisk: number;
    totalSegments: number;
    predictedDelayDays: number;
    // New summary field
    segmentSummary: {
        highRisk: number;
        mediumRisk: number;
        lowRisk: number;
        totalSegments: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class PredictionService {
    private apiUrl = 'http://localhost:8080/api/analysis';

    constructor(private http: HttpClient) { }

    getProjectRisk(projectId: number): Observable<ProjectRisk> {
        return this.http.get<ProjectRisk>(`${this.apiUrl}/projects/${projectId}/risk`);
    }

    getProjectRiskDetails(projectId: number): Observable<RiskScore[]> {
        return this.http.get<RiskScore[]>(`${this.apiUrl}/projects/${projectId}/risk/details`);
    }

    recalculatePredictions(): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/recalculate`, {});
    }
}
