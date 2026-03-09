import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService, WorkLog, WorkLogDTO } from '../../services/billing.service';
import { FieldService, FieldCrew } from '../../services/field.service';
import { SegmentService, Segment } from '../../services/segment.service';

@Component({
    selector: 'app-work-log',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './work-log.component.html'
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
        this.fieldService.getCrews().subscribe({
            next: (data) => this.crews = data,
            error: (err) => console.error('Error loading crews:', err)
        });
    }

    loadSegments() {
        // Load segments for dropdown
        this.segmentService.getProjectSegments(1).subscribe(data => {
            this.segments = data;
        }); // Mocking project ID 1 for now or fetch all
    }

    loadWorkLogs() {
        this.loading = true;
        this.error = '';

        if (this.filterSegmentId) {
            this.billingService.getWorkLogsBySegment(this.filterSegmentId).subscribe({
                next: (data) => {
                    this.workLogs = data;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = 'Failed to load work logs';
                    this.loading = false;
                }
            });
        } else if (this.filterCrewId) {
            this.billingService.getWorkLogsByCrew(this.filterCrewId).subscribe({
                next: (data) => {
                    this.workLogs = data;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = 'Failed to load work logs';
                    this.loading = false;
                }
            });
        } else {
            // Load all if no filter
            this.billingService.getAllWorkLogs().subscribe({
                next: (data) => {
                    this.workLogs = data;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = 'Failed to load work logs';
                    this.loading = false;
                }
            });
        }
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
