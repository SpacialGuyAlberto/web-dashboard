import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MapViewComponent } from '@features/gis/components/map-view/map-view.component';
import { KPICardComponent } from '@shared/components/kpi-card/kpi-card.component';
import { ActionCenterComponent, ActionItem } from './components/action-center/action-center.component';
import { PlanningService } from '@features/risk-planning/planning.service';
import { DashboardService } from './dashboard.service';
import { DashboardStats } from './dashboard.model';
import { RiskScore } from '@features/risk-planning/prediction.model';
import { Project } from '@features/projects/project.model';


@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, MapViewComponent, KPICardComponent, ActionCenterComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    stats: DashboardStats | null = null;
    projects: Project[] = [];
    segments: any[] = [];
    riskData: RiskScore[] = [];
    highRiskSegments: RiskScore[] = [];
    actions: ActionItem[] = [];
    selectedProjectId: number | null = null;
    selectedProject: Project | null = null;
    kpiData = {
        activeProjects: 0,
        totalSegments: 0,
        activeCrews: 0,
        highRiskSegments: 0
    };

    constructor(
        private planningService: PlanningService,
        private dashboardService: DashboardService,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadDashboardData();
    }

    loadDashboardData(): void {
        console.log('📊 Loading dashboard data...');

        this.dashboardService.getStats().subscribe({
            next: (stats) => {
                console.log('✅ Stats loaded:', stats);
                this.stats = stats;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('❌ Error loading stats:', error);
                this.stats = {
                    overallProgress: 0,
                    highRiskSegments: 0,
                    highRiskTrend: 0,
                    predictedDelayDays: 0,
                    dailyProduction: 0,
                    dailyProductionTarget: 0,
                    openIncidents: 0,
                    criticalIncidents: 0,
                    pendingPermits: 0,
                    avgPermitWaitDays: 0
                };
                this.cdr.detectChanges();
            }
        });

        this.planningService.getProjects().subscribe({
            next: (projects) => {
                console.log('✅ Projects loaded:', projects);
                this.projects = projects;
                this.kpiData.activeProjects = projects.length;
                if (projects.length > 0 && !this.selectedProjectId) {
                    this.selectedProjectId = projects[0].id!;
                    this.loadProjectData(this.selectedProjectId);
                }
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('❌ Error loading projects:', error);
                this.projects = [];
                this.cdr.detectChanges();
            }
        });
    }

    loadProjectData(projectId: number): void {
        this.planningService.getProjectRiskDetails(projectId).subscribe({
            next: (risks) => {
                this.riskData = risks;
                this.highRiskSegments = risks.filter(r => r.riskLevel === 'HIGH');
                this.kpiData.highRiskSegments = this.highRiskSegments.length;
                this.generateActions(this.highRiskSegments);
                this.cdr.detectChanges();
            },
            error: () => {
                this.riskData = [];
                this.highRiskSegments = [];
                this.actions = [];
            }
        });

        this.planningService.getProject(projectId).subscribe({
            next: (project: any) => {
                this.selectedProject = project;
                if (project.segments && Array.isArray(project.segments)) {
                    this.segments = project.segments;
                    this.kpiData.totalSegments = this.segments.length;
                    // Count crews (assuming each segment can have a crew assigned)
                    this.kpiData.activeCrews = this.segments.filter(s => s.assignedCrew).length;
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.segments = [];
                this.selectedProject = null;
            }
        });
    }

    onProjectChange(event: any): void {
        const id = Number(event.target.value);
        this.selectedProjectId = id;
        this.loadProjectData(id);
    }

    generateActions(highRiskSegments: RiskScore[]): void {
        this.actions = [];
        highRiskSegments.forEach(risk => {
            if (risk.recommendedActions) {
                risk.recommendedActions.forEach(actionJson => {
                    try {
                        const actionObj = JSON.parse(actionJson);
                        this.actions.push({
                            id: actionObj.id,
                            title: actionObj.label,
                            description: `Segment #${risk.segmentId} - ${risk.topCauses?.[0] || 'High Risk'}`,
                            impact: actionObj.impact as any,
                            segmentId: risk.segmentId
                        });
                    } catch (e) {
                        this.actions.push({
                            id: 'UNKNOWN',
                            title: actionJson,
                            description: `Segment #${risk.segmentId}`,
                            impact: 'Medium',
                            segmentId: risk.segmentId
                        });
                    }
                });
            }
        });
    }

    handleApplyAction(action: ActionItem): void {
        console.log('Action applied:', action);
        this.actions = this.actions.filter(a => a !== action);
        alert(`Action "${action.title}" applied for Segment #${action.segmentId}`);
    }

    // Map Interaction
    @ViewChild(MapViewComponent) mapView!: MapViewComponent;

    focusOnSegment(segmentId: number): void {
        if (this.mapView) {
            this.mapView.flyToSegment(segmentId);
        }
    }

    // KPI Navigation Methods
    navigateToProjects() {
        this.router.navigate(['/projects']);
    }

    navigateToRiskDashboard() {
        this.router.navigate(['/risk-dashboard']);
    }

    navigateToSchedule() {
        this.router.navigate(['/schedule']);
    }

    navigateToWorkLogs() {
        this.router.navigate(['/work-logs']);
    }

    navigateToSegments() {
        this.router.navigate(['/segments']);
    }

    navigateToSubcontractors() {
        this.router.navigate(['/subcontractors']);
    }

    navigateToRisks() {
        this.navigateToRiskDashboard();
    }
}
