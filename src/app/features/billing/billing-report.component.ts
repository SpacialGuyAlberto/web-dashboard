import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Subcontractor {
    id: number;
    name: string;
}

interface BillingReport {
    subcontractorId: number;
    subcontractorName: string;
    startDate: string;
    endDate: string;
    totalMeters: number;
    totalHours: number;
    totalCrossings: number;
    totalReworkMeters: number;
    pricePerMeter: number;
    pricePerManHour: number;
    pricePerCrossing: number;
    meterCost: number;
    hourCost: number;
    crossingCost: number;
    totalAmount: number;
}

@Component({
    selector: 'app-billing-report',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './billing-report.component.html',
    styleUrls: ['./billing-report.component.css']
})
export class BillingReportComponent implements OnInit {
    subcontractors: Subcontractor[] = [
        { id: 1, name: 'EcoBuild Solutions' },
        { id: 2, name: 'Terraform Infrastructure' },
        { id: 3, name: 'Urban Connectors Ltd' },
        { id: 4, name: 'Skyline Networks' }
    ];

    selectedSubcontractorId: number | null = null;
    startDate: string = '';
    endDate: string = '';
    report: BillingReport | null = null;
    loading: boolean = false;
    error: string | null = null;

    constructor() { }

    ngOnInit(): void {
        // Set default dates to current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        this.startDate = firstDay.toISOString().split('T')[0];
        this.endDate = now.toISOString().split('T')[0];
    }

    generateReport(): void {
        if (!this.selectedSubcontractorId) {
            this.error = 'Please select a subcontractor.';
            return;
        }

        this.loading = true;
        this.error = null;

        // Simulate API call
        setTimeout(() => {
            const sub = this.subcontractors.find(s => s.id === this.selectedSubcontractorId);

            this.report = {
                subcontractorId: sub?.id || 0,
                subcontractorName: sub?.name || 'Unknown',
                startDate: this.startDate,
                endDate: this.endDate,
                totalMeters: 1240.50,
                totalHours: 480.00,
                totalCrossings: 12,
                totalReworkMeters: 45.00,
                pricePerMeter: 12.50,
                pricePerManHour: 25.00,
                pricePerCrossing: 150.00,
                meterCost: 15506.25,
                hourCost: 12000.00,
                crossingCost: 1800.00,
                totalAmount: 29306.25
            };

            this.loading = false;
        }, 1500);
    }

    exportCSV(): void {
        if (!this.report) return;

        const headers = ['Category', 'Quantity', 'Unit Price', 'Total'];
        const rows = [
            ['Meters', this.report.totalMeters, this.report.pricePerMeter, this.report.meterCost],
            ['Labor Hours', this.report.totalHours, this.report.pricePerManHour, this.report.hourCost],
            ['Crossings', this.report.totalCrossings, this.report.pricePerCrossing, this.report.crossingCost],
            ['TOTAL', '', '', this.report.totalAmount]
        ];

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `billing_report_${this.report.subcontractorName.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
