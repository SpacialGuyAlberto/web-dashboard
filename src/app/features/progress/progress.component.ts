import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgressService } from './progress.service';
import { AdvancedProgressData } from './progress.model';

@Component({
    selector: 'app-progress',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './progress.component.html',
    styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit {
    advancedData: AdvancedProgressData | null = null;
    loading = false;
    error: string | null = null;

    // Date Filters
    startDate: string = '';
    endDate: string = '';

    constructor(
        private progressService: ProgressService,
        private cdr: ChangeDetectorRef
    ) {
        // Default to last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        this.endDate = end.toISOString().split('T')[0];
        this.startDate = start.toISOString().split('T')[0];
    }

    Math = Math;

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading = true;
        this.error = null;

        this.progressService.getAdvancedProgress(this.startDate, this.endDate).subscribe({
            next: (data) => {
                this.advancedData = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading progress data:', err);
                this.error = 'Failed to load progress data. Please try again later.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onDateChange() {
        this.loadData();
    }

    // Helper to get color for soil type
    getSoilColor(type: string): string {
        switch (type) {
            case 'ROCKY': return 'bg-red-100 text-red-800';
            case 'SANDY': return 'bg-yellow-100 text-yellow-800';
            case 'CLAY': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
}
