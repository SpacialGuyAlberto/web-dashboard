import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PredictionService } from '../../services/prediction.service';
import { ProjectRisk, RiskScore } from '../../models/prediction.model';
import { PlanningService } from '../../services/planning.service';

@Component({
    selector: 'app-risk-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './risk-dashboard.component.html',
    styleUrls: ['./risk-dashboard.component.css']
})
export class RiskDashboardComponent implements OnInit {
    projects: any[] = [];
    selectedProjectId: number | null = null;
    projectRisk: ProjectRisk | null = null;
    riskDetails: RiskScore[] = [];
    loading = false;
    error = '';

    constructor(
        private predictionService: PredictionService,
        private planningService: PlanningService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadProjects();
    }

    loadProjects() {
        console.log('RiskDashboard: Loading projects...');
        this.planningService.getProjects().subscribe({
            next: (data) => {
                console.log('RiskDashboard: Projects loaded:', data);
                this.projects = data;
                if (this.projects.length > 0) {
                    this.selectedProjectId = this.projects[0].id!;
                    this.loadProjectRisk();
                }
            },
            error: (err) => {
                console.error('RiskDashboard: Error loading projects:', err);
                this.error = 'Failed to load projects';
            }
        });
    }

    loadProjectRisk() {
        if (!this.selectedProjectId) return;

        this.loading = true;
        this.error = '';

        this.predictionService.getProjectRisk(this.selectedProjectId).subscribe({
            next: (data) => {
                this.projectRisk = data;
                this.loadRiskDetails(); // Load details after summary
            },
            error: (err) => {
                this.error = 'Failed to load project risk analysis';
                this.loading = false;
            }
        });
    }

    loadRiskDetails() {
        if (!this.selectedProjectId) return;

        this.predictionService.getProjectRiskDetails(this.selectedProjectId).subscribe({
            next: (data) => {
                this.riskDetails = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load risk details', err);
                this.loading = false;
            }
        });
    }

    assignCrew(segmentId: number) {
        // Navigate to segments page where crew can be assigned
        this.router.navigate(['/segments'], {
            queryParams: { highlightSegment: segmentId }
        });
    }

    onProjectChange() {
        this.loadProjectRisk();
    }

    recalculate() {
        this.predictionService.recalculatePredictions().subscribe({
            next: () => {
                this.loadProjectRisk();
            },
            error: (err) => {
                this.error = 'Failed to recalculate predictions';
            }
        });
    }

    getRiskPercentage(count: number): string {
        if (!this.projectRisk || !this.projectRisk.segmentSummary || this.projectRisk.segmentSummary.totalSegments === 0) return '0';
        return ((count / this.projectRisk.segmentSummary.totalSegments) * 100).toFixed(0);
    }

    getRiskLevelColor(riskLevel: string): string {
        switch (riskLevel) {
            case 'HIGH':
                return 'bg-red-100 text-red-800';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-800';
            case 'LOW':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    parseAction(actionJson: string): { id: string, label: string, impact: string } {
        try {
            return JSON.parse(actionJson);
        } catch (e) {
            return { id: 'UNKNOWN', label: actionJson, impact: 'Unknown' };
        }
    }
}
