import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PredictionService } from '../../../services/prediction.service';
import { ProjectRisk, RiskScore } from '../../../models/prediction.model';

@Component({
    selector: 'app-risk-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './risk-dashboard.component.html',
    styleUrls: ['./risk-dashboard.component.css']
})
export class RiskDashboardComponent implements OnInit {
    projectRisk: ProjectRisk | null = null;
    riskDetails: RiskScore[] = [];
    projectId = 1; // Default
    isLoading = true;

    constructor(private predictionService: PredictionService) { }

    ngOnInit() {
        this.loadRiskData();
    }

    loadRiskData() {
        this.isLoading = true;
        this.predictionService.getProjectRisk(this.projectId).subscribe(data => {
            this.projectRisk = data;
            this.isLoading = false;
        });

        this.predictionService.getProjectRiskDetails(this.projectId).subscribe(data => {
            this.riskDetails = data;
        });
    }

    getScoreColor(score: number): string {
        if (score < 40) return 'text-green-600';
        if (score < 70) return 'text-yellow-600';
        return 'text-red-600';
    }

    getRiskBadgeClass(level: string): string {
        switch (level) {
            case 'LOW': return 'bg-green-100 text-green-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            case 'HIGH': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
}
