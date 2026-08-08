import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { RiskScore, ProjectRisk } from './prediction.model';

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
