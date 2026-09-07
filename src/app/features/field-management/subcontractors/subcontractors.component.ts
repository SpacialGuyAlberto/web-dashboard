import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubcontractorService } from '../subcontractor.service';
import { Subcontractor, Crew } from '../subcontractor.model';

@Component({
    selector: 'app-subcontractors',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './subcontractors.component.html',
    styleUrls: ['./subcontractors.component.css']
})
export class SubcontractorsComponent implements OnInit {
    subcontractors: Subcontractor[] = [];
    crews: { [key: number]: Crew[] } = {};
    organizationId = 1;

    showAddSubModal = false;
    showAddCrewModal = false;
    selectedSubcontractorId: number | null = null;

    newSubcontractor: Subcontractor = {
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        status: 'ACTIVE',
        skills: [],
        certifications: [],
        averageTimePerMeter: 0,
        defectRate: 0,
        reworkFrequency: 0
    };

    newCrew: Crew = {
        name: '',
        foremanName: '',
        size: 2,
        vehiclePlate: ''
    };

    constructor(
        private subcontractorService: SubcontractorService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadSubcontractors();
    }

    loadSubcontractors() {
        this.subcontractorService.getSubcontractors(this.organizationId).subscribe(subs => {
            this.subcontractors = subs;
            subs.forEach(sub => {
                if (sub.id) {
                    this.loadCrews(sub.id);
                }
            });
            this.cdr.detectChanges();
        });
    }

    loadCrews(subId: number) {
        this.subcontractorService.getSubcontractorCrews(subId).subscribe(crews => {
            this.crews[subId] = crews;
            this.cdr.detectChanges();
        });
    }

    openAddSubModal() {
        this.showAddSubModal = true;
    }

    closeAddSubModal() {
        this.showAddSubModal = false;
    }

    saveSubcontractor() {
        this.subcontractorService.createSubcontractor(this.organizationId, this.newSubcontractor).subscribe(() => {
            this.loadSubcontractors();
            this.closeAddSubModal();
            this.newSubcontractor = {
                name: '',
                contactPerson: '',
                email: '',
                phone: '',
                status: 'ACTIVE',
                skills: [],
                certifications: [],
                averageTimePerMeter: 0,
                defectRate: 0,
                reworkFrequency: 0
            };
        });
    }

    openAddCrewModal(subId: number) {
        this.selectedSubcontractorId = subId;
        this.showAddCrewModal = true;
    }

    closeAddCrewModal() {
        this.showAddCrewModal = false;
        this.selectedSubcontractorId = null;
    }

    saveCrew() {
        if (this.selectedSubcontractorId) {
            this.subcontractorService.createCrew(this.selectedSubcontractorId, this.newCrew).subscribe(() => {
                if (this.selectedSubcontractorId) this.loadCrews(this.selectedSubcontractorId);
                this.closeAddCrewModal();
                this.newCrew = {
                    name: '',
                    foremanName: '',
                    size: 2,
                    vehiclePlate: ''
                };
            });
        }
    }

    // --- Details Modal ---
    showDetailsModal = false;
    selectedSubcontractor: any = null;
    mockContracts: any[] = [];
    mockProjects: any[] = [];
    totalHours: number = 0;

    openSubcontractorDetails(sub: Subcontractor) {
        this.selectedSubcontractor = sub;
        
        // Generate mock data for the detailed view
        this.totalHours = Math.floor(Math.random() * 5000) + 1200; // Mock total hours
        
        this.mockContracts = [
            { id: 'CTR-2026-001', name: 'Master Services Agreement 2026', value: '€250,000', status: 'Active', expiryDate: '2026-12-31' },
            { id: 'CTR-2025-089', name: 'Berlin Fiber Drop Q4', value: '€75,000', status: 'Completed', expiryDate: '2025-12-01' }
        ];

        this.mockProjects = [
            { name: 'Berlin Sector 4 Expansion', role: 'Main Fiber Installer', progress: 65 },
            { name: 'Munich Central Upgrade', role: 'Trenching Support', progress: 30 }
        ];

        this.showDetailsModal = true;
    }

    closeSubcontractorDetails() {
        this.showDetailsModal = false;
        this.selectedSubcontractor = null;
        this.mockContracts = [];
        this.mockProjects = [];
    }
}
