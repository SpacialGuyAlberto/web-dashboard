import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService } from '../../services/safety.service';
import { Incident } from '../../models/safety.model';

@Component({
    selector: 'app-incident-report',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './incident-report.component.html'
})
export class IncidentReportComponent implements OnInit, OnChanges {
    @Input() segmentId!: number;

    incidents: Incident[] = [];
    showModal = false;

    newIncident: Incident = {
        segmentId: 0,
        type: 'SAFETY',
        severity: 'LOW',
        description: '',
        status: 'OPEN',
        reportedBy: 'Foreman' // Mock user
    };

    constructor(private safetyService: SafetyService) { }

    ngOnInit() {
        if (this.segmentId) {
            this.loadIncidents();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['segmentId'] && changes['segmentId'].currentValue) {
            this.loadIncidents();
        }
    }

    loadIncidents() {
        this.safetyService.getIncidents(this.segmentId).subscribe(data => {
            this.incidents = data;
        });
    }

    openModal() {
        this.newIncident = {
            segmentId: this.segmentId,
            type: 'SAFETY',
            severity: 'LOW',
            description: '',
            status: 'OPEN',
            reportedBy: 'Foreman'
        };
        this.showModal = true;
    }

    submitIncident() {
        this.safetyService.reportIncident(this.newIncident).subscribe(saved => {
            this.incidents.unshift(saved);
            this.showModal = false;
            alert('Incident reported successfully. Notifications sent.');
        });
    }

    resolveIncident(incident: Incident) {
        if (!incident.id) return;
        this.safetyService.updateIncidentStatus(incident.id, 'RESOLVED').subscribe(updated => {
            incident.status = 'RESOLVED';
        });
    }

    getSeverityClass(severity: string): string {
        switch (severity) {
            case 'CRITICAL': return 'bg-rose-100 text-rose-700';
            case 'HIGH': return 'bg-orange-100 text-orange-700';
            case 'MEDIUM': return 'bg-amber-100 text-amber-700';
            case 'LOW': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'OPEN': return 'text-rose-500 border-rose-500';
            case 'RESOLVED': return 'text-emerald-500 border-emerald-500';
            case 'IN_PROGRESS': return 'text-amber-500 border-amber-500';
            default: return 'text-slate-500 border-slate-500';
        }
    }
}
