import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Project } from '@features/projects/project.model';
import { RiskScore } from './prediction.model';


@Injectable({
    providedIn: 'root'
})
export class PlanningService {
    private apiUrl = 'http://localhost:8080/api';
    private readonly RISKS_KEY = 'planning_risks';

    constructor(private http: HttpClient) {
        this.initializeMockData();
    }

    private initializeMockData() {
        // Mock risks (read-only mostly but stored for consistency)
        if (!sessionStorage.getItem(this.RISKS_KEY)) {
            const mockRisks: RiskScore[] = [
                {
                    id: 1, segmentId: 101, projectId: 1, riskLevel: 'HIGH', confidenceScore: 0.85, riskFactors: 'Weather, Traffic',
                    predictedCompletion: '2025-07-01', bestCaseCompletion: '2025-06-15', worstCaseCompletion: '2025-08-01', delayProbability: 0.75,
                    scheduleRisk: 80, permitRisk: 20, performanceRisk: 50, safetyRisk: 30, qualityRisk: 10, environmentRisk: 60,
                    score: 80,
                    topCauses: ['Heavy Rain Forecast next week', 'Material Delivery Delayed (Steel)', 'High Traffic Congestion'],
                    recommendedActions: [
                        'Pre-order materials immediately to mitigate delay.',
                        'Schedule night shifts to avoid traffic impact.',
                        'Review weather contingency plan.'
                    ]
                },
                {
                    id: 2, segmentId: 102, projectId: 2, riskLevel: 'LOW', confidenceScore: 0.95, riskFactors: 'None',
                    predictedCompletion: '2025-03-20', bestCaseCompletion: '2025-03-18', worstCaseCompletion: '2025-03-25', delayProbability: 0.10,
                    scheduleRisk: 10, permitRisk: 5, performanceRisk: 10, safetyRisk: 5, qualityRisk: 5, environmentRisk: 5,
                    score: 10,
                    topCauses: [],
                    recommendedActions: ['Continue monitoring.', 'Maintain current pace.']
                }
            ];
            sessionStorage.setItem(this.RISKS_KEY, JSON.stringify(mockRisks));
        }
    }

    getProjects(): Observable<Project[]> {
        return this.http.get<Project[]>(`${this.apiUrl}/projects`);
    }

    getProject(id: number): Observable<Project> {
        return this.http.get<Project>(`${this.apiUrl}/projects/${id}`);
    }

    createProject(project: Project): Observable<Project> {
        return this.http.post<Project>(`${this.apiUrl}/projects`, project);
    }

    updateProject(id: number, project: Project): Observable<Project> {
        return this.http.put<Project>(`${this.apiUrl}/projects/${id}`, project);
    }

    processPlanauskunft(projectId: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/projects/${projectId}/planauskunft/process`, formData);
    }

    // Risk API (Keep as mock for now, but could be integrated with Analysis later)
    getProjectRiskDetails(projectId: number): Observable<RiskScore[]> {
        const allRisks = JSON.parse(sessionStorage.getItem(this.RISKS_KEY) || '[]');
        const relevantRisks = allRisks.filter((r: any) => r.projectId === projectId);
        return of(relevantRisks.length > 0 ? relevantRisks : allRisks);
    }

    getSegmentRisk(segmentId: number): Observable<RiskScore> {
        const allRisks = JSON.parse(sessionStorage.getItem(this.RISKS_KEY) || '[]');
        const risk = allRisks.find((r: any) => r.segmentId === segmentId);
        return of(risk ? risk : allRisks[0]);
    }
}
