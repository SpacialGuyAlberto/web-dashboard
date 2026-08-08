import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfrastructureService } from '../infrastructure.service';
import { Inquiry } from '../infrastructure.model';
import { PlanningService } from '@features/risk-planning/planning.service';
import { Project } from '@features/projects/project.model';

@Component({
    selector: 'app-inquiry-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './inquiry-dashboard.component.html'
})
export class InquiryDashboardComponent implements OnInit {
    inquiries: Inquiry[] = [];
    projects: Project[] = [];
    selectedProjectId: number | null = null;
    loading = false;

    constructor(
        private infrastructureService: InfrastructureService,
        private planningService: PlanningService
    ) { }

    ngOnInit() {
        this.loadProjects();
    }

    loadProjects() {
        this.planningService.getProjects().subscribe(projects => {
            this.projects = projects;
            if (this.projects.length > 0) {
                // Default to first project
                this.selectedProjectId = this.projects[0].id || null;
                this.loadInquiries();
            }
        });
    }

    onProjectChange() {
        if (this.selectedProjectId) {
            this.loadInquiries();
        }
    }

    loadInquiries() {
        if (!this.selectedProjectId) return;
        this.loading = true;
        this.infrastructureService.getInquiries(this.selectedProjectId).subscribe({
            next: (data) => {
                this.inquiries = data;
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    generateInquiries() {
        if (!this.selectedProjectId) return;
        this.loading = true;
        this.infrastructureService.generateInquiries(this.selectedProjectId).subscribe({
            next: (data) => {
                this.inquiries = data;
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    sendStatus(inquiry: Inquiry) {
        this.infrastructureService.updateStatus(inquiry.id, 'SENT').subscribe(updated => {
            inquiry.status = updated.status;
            inquiry.requestDate = updated.requestDate;
        });
    }

    analyze(inquiry: Inquiry) {
        inquiry.analysisStatus = 'PENDING';
        this.infrastructureService.analyzeInquiry(inquiry.id).subscribe(updated => {
            inquiry.analysisResult = updated.analysisResult;
            inquiry.analysisStatus = updated.analysisStatus;
        });
    }

    markReceived(inquiry: Inquiry, hasConflict: boolean) {
        const status = hasConflict ? 'RECEIVED_CONFLICT' : 'RECEIVED_CLEAR';
        this.infrastructureService.updateStatus(inquiry.id, status).subscribe(updated => {
            inquiry.status = updated.status;
            // Mock file url if conflict
            if (hasConflict) {
                inquiry.responseFileUrl = 'assets/mock-plans/gas-plan.jpg';
            }
        });
    }
}
