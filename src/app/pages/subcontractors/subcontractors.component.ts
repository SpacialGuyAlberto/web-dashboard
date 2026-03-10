import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubcontractorService } from '../../services/subcontractor.service';
import { Subcontractor, Crew } from '../../models/subcontractor.model';

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
        this.subcontractorService.getSubcontractors().subscribe(subs => {
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
        this.subcontractorService.createSubcontractor(this.newSubcontractor).subscribe(() => {
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
}
