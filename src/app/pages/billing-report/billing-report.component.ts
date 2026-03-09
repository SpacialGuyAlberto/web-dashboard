import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService, BillingReport } from '../../services/billing.service';
import { SubcontractorService, Subcontractor } from '../../services/subcontractor.service';

@Component({
    selector: 'app-billing-report',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './billing-report.component.html'
})
export class BillingReportComponent implements OnInit {
    subcontractors: Subcontractor[] = [];
    report: BillingReport | null = null;
    loading = false;
    error = '';

    selectedSubcontractorId: number | null = null;
    startDate = '';
    endDate = '';

    constructor(
        private billingService: BillingService,
        private subcontractorService: SubcontractorService
    ) { }

    ngOnInit() {
        this.loadSubcontractors();
        // Set default dates (last 30 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        this.endDate = end.toISOString().split('T')[0];
        this.startDate = start.toISOString().split('T')[0];
    }

    loadSubcontractors() {
        this.subcontractorService.getSubcontractors().subscribe({
            next: (data) => this.subcontractors = data,
            error: (err) => console.error('Error loading subcontractors:', err)
        });
    }

    generateReport() {
        if (!this.selectedSubcontractorId || !this.startDate || !this.endDate) {
            this.error = 'Please select a subcontractor and date range';
            return;
        }

        this.loading = true;
        this.error = '';

        this.billingService.getSubcontractorReport(
            this.selectedSubcontractorId,
            this.startDate,
            this.endDate
        ).subscribe({
            next: (data) => {
                this.report = data;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to generate report';
                this.loading = false;
                console.error(err);
            }
        });
    }

    exportCSV() {
        if (!this.selectedSubcontractorId || !this.startDate || !this.endDate) {
            this.error = 'Please select a subcontractor and date range';
            return;
        }

        this.billingService.exportWorkLogs(
            'csv',
            this.selectedSubcontractorId,
            this.startDate,
            this.endDate
        ).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `worklogs_${this.startDate}_${this.endDate}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                this.error = 'Failed to export CSV';
                console.error(err);
            }
        });
    }
}
