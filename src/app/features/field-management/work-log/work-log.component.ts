import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '@features/billing/billing.service';
import { WorkLog, WorkLogDTO } from '@features/billing/billing.model';
import { FieldService } from '../field.service';
import { FieldCrew } from '../models/field-crew.model';
import { SegmentService } from '@features/segments/segment.service';
import { Segment } from '@features/segments/segment.model';

@Component({
    selector: 'app-work-log',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './work-log.component.html',
    styleUrls: ['./work-log.component.css']
})
// Work Log Component - Updated
export class WorkLogComponent implements OnInit {
    workLogs: WorkLogDTO[] = [];
    crews: FieldCrew[] = [];
    segments: Segment[] = [];

    newWorkLog: WorkLog = {
        segmentId: 0,
        crewId: 0,
        date: new Date().toISOString().split('T')[0],
        metersCompleted: 0,
        hoursWorked: 0,
        crossingsCompleted: 0,
        reworkMeters: 0,
        notes: ''
    };

    showModal = false;
    loading = false;
    error = '';

    // Filters
    filterSegmentId: number | null = null;
    filterCrewId: number | null = null;

    constructor(
        private billingService: BillingService,
        private fieldService: FieldService,
        private segmentService: SegmentService
    ) { }

    ngOnInit() {
        this.loadCrews();
        this.loadSegments();
        this.loadWorkLogs();
    }

    loadCrews() {
        // Mock crews
        this.crews = [
            { id: 1, name: 'Alpha Crew', members: 4, currentProject: 'Berlin', location: 'Berlin', status: 'Active' },
            { id: 2, name: 'Beta Crew', members: 3, currentProject: 'Munich', location: 'Munich', status: 'Active' },
            { id: 3, name: 'Gamma Crew', members: 5, currentProject: 'Hamburg', location: 'Hamburg', status: 'Active' }
        ] as any[];
    }

    loadSegments() {
        // Mock segments
        this.segments = [
            { id: 1, streetName: 'Berlin Sector 4', status: 'IN_PROGRESS' },
            { id: 2, streetName: 'Munich Central', status: 'PLANNED' }
        ] as any[];
    }

    loadWorkLogs() {
        this.loading = true;
        this.error = '';

        // Mock work logs
        setTimeout(() => {
            const allLogs: WorkLogDTO[] = [
                { id: 1, segmentId: 1, segmentName: 'Berlin Sector 4', crewId: 1, crewName: 'Alpha Crew', date: '2026-09-07', metersCompleted: 120, hoursWorked: 8, notes: 'Normal soil conditions', crossingsCompleted: 1, reworkMeters: 0, subcontractorId: 1, subcontractorName: 'FiberTech' },
                { id: 2, segmentId: 1, segmentName: 'Berlin Sector 4', crewId: 2, crewName: 'Beta Crew', date: '2026-09-06', metersCompleted: 85, hoursWorked: 6, notes: 'Heavy rain in the afternoon', crossingsCompleted: 0, reworkMeters: 5, subcontractorId: 1, subcontractorName: 'FiberTech' },
                { id: 3, segmentId: 2, segmentName: 'Munich Central', crewId: 3, crewName: 'Gamma Crew', date: '2026-09-05', metersCompleted: 210, hoursWorked: 10, notes: 'Fast progress on asphalt', crossingsCompleted: 2, reworkMeters: 0, subcontractorId: 2, subcontractorName: 'AlphaBuild' },
                { id: 4, segmentId: 1, segmentName: 'Berlin Sector 4', crewId: 1, crewName: 'Alpha Crew', date: '2026-09-04', metersCompleted: 95, hoursWorked: 8, notes: 'Found underground cables, delayed', crossingsCompleted: 0, reworkMeters: 0, subcontractorId: 1, subcontractorName: 'FiberTech' },
                { id: 5, segmentId: 2, segmentName: 'Munich Central', crewId: 2, crewName: 'Beta Crew', date: '2026-09-03', metersCompleted: 150, hoursWorked: 8, notes: 'Completed crossing #2', crossingsCompleted: 1, reworkMeters: 0, subcontractorId: 1, subcontractorName: 'FiberTech' }
            ];

            if (this.filterSegmentId) {
                this.workLogs = allLogs.filter(log => log.segmentId === this.filterSegmentId);
            } else if (this.filterCrewId) {
                this.workLogs = allLogs.filter(log => log.crewId === this.filterCrewId);
            } else {
                this.workLogs = allLogs;
            }
            
            this.loading = false;
        }, 300);
    }

    openCreateModal() {
        this.newWorkLog = {
            segmentId: 0,
            crewId: 0,
            date: new Date().toISOString().split('T')[0],
            metersCompleted: 0,
            hoursWorked: 0,
            crossingsCompleted: 0,
            reworkMeters: 0,
            notes: ''
        };
        this.showModal = true;
    }

    // --- Smart Foreman Features ---

    startVoiceLog() {
        // Mocking Voice Recognition interaction
        // In real PWA: navigator.mediaDevices.getUserMedia(...)
        const mockSpeech = "Hicimos 120 metros de zanja en el tramo 5";
        if (confirm(`🎙️ Escuchando... \n\n(Simulado) Dijiste: "${mockSpeech}"\n\n¿Procesar?`)) {
            // Call Smart Log Backend
            // this.http.post('/api/work-logs/smart', { text: mockSpeech })...
            // For MVP Demo: Auto-fill form
            this.newWorkLog.notes = mockSpeech;
            this.newWorkLog.metersCompleted = 120;
            this.newWorkLog.crewId = 1; // Assuming Crew 1
            this.newWorkLog.hoursWorked = 8;
            alert("✅ Inteligencia Artificial: Datos extraídos del audio.");
        }
    }

    triggerCamera() {
        // Mocking Camera interaction
        // In real PWA: <input type="file" capture="environment">
        if (confirm("📸 Cámara activada. \n\n(Simulado) Foto tomada: 'zanja_profunda.jpg'\n\n¿Analizar?")) {
            // Call Vision Backend
            // this.visionService.analyze(file)...
            alert("✅ Vision AI: Profundidad detectada: 60cm. Distancia cables: 15cm (OK).");
        }
    }

    closeModal() {
        this.showModal = false;
    }

    saveWorkLog() {
        this.billingService.createWorkLog(this.newWorkLog).subscribe({
            next: () => {
                this.closeModal();
                this.loadWorkLogs();
            },
            error: (err) => {
                this.error = 'Failed to save work log';
                console.error(err);
            }
        });
    }

    applyFilters() {
        this.loadWorkLogs();
    }

    clearFilters() {
        this.filterSegmentId = null;
        this.filterCrewId = null;
        this.workLogs = [];
    }
}
