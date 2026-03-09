import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService, SafetyProtocol, TrafficPermit } from '../../services/safety.service';

@Component({
    selector: 'app-safety-protocols',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './safety-protocols.component.html',
    styles: [`
    .tab-active { border-bottom: 2px solid #2563eb; color: #2563eb; }
    .tab-inactive { color: #6b7280; }
  `]
})
export class SafetyProtocolsComponent implements OnInit, OnChanges {
    @Input() segmentId!: number;

    activeTab: 'protocols' | 'permits' = 'protocols';

    protocol: SafetyProtocol = {
        segmentId: 0,
        regelplanType: '',
        streetCategory: '',
        workType: '',
        requiredSigns: '[]',
        requiredBarriers: '[]',
        validated: false
    };

    permits: TrafficPermit[] = [];
    newPermit: TrafficPermit = {
        segmentId: 0,
        permitNumber: '',
        status: 'PENDING'
    };

    showPermitModal = false;

    constructor(private safetyService: SafetyService) { }

    ngOnInit() {
        if (this.segmentId) {
            this.loadData();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['segmentId'] && changes['segmentId'].currentValue) {
            this.loadData();
        }
    }

    loadData() {
        this.loadProtocol();
        this.loadPermits();
    }

    loadProtocol() {
        this.safetyService.getProtocol(this.segmentId).subscribe({
            next: (data) => this.protocol = data,
            error: () => {
                // Initialize default if not found
                this.protocol = {
                    segmentId: this.segmentId,
                    regelplanType: 'B I/2 innerorts',
                    streetCategory: 'innerorts',
                    workType: 'excavation',
                    requiredSigns: '[]',
                    requiredBarriers: '[]',
                    validated: false
                };
            }
        });
    }

    loadPermits() {
        this.safetyService.getPermits(this.segmentId).subscribe(data => {
            this.permits = data;
        });
    }

    saveProtocol() {
        this.protocol.segmentId = this.segmentId;
        this.safetyService.createOrUpdateProtocol(this.protocol).subscribe(saved => {
            this.protocol = saved;
            alert('Protocol saved successfully');
        });
    }

    openPermitModal() {
        this.newPermit = {
            segmentId: this.segmentId,
            permitNumber: '',
            status: 'PENDING'
        };
        this.showPermitModal = true;
    }

    savePermit() {
        this.safetyService.createPermit(this.newPermit).subscribe(saved => {
            this.permits.push(saved);
            this.showPermitModal = false;
        });
    }

    updatePermitStatus(permit: TrafficPermit, status: string) {
        if (!permit.id) return;
        this.safetyService.updatePermitStatus(permit.id, status).subscribe(updated => {
            permit.status = updated.status as any;
        });
    }
}
