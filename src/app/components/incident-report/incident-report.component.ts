import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService, Incident } from '../../services/safety.service';

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
}
