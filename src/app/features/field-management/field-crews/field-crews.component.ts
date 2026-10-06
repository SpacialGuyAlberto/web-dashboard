import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldService } from '../field.service';
import { FieldCrew } from '../models/field-crew.model';



@Component({
  selector: 'app-field-crews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './field-crews.component.html',
  styleUrls: ['./field-crews.component.css']
})
// Updated component with full template
export class FieldCrewsComponent {
  crews: FieldCrew[] = [];

  constructor(
    private fieldService: FieldService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.fieldService.getCrews().subscribe(data => {
      this.crews = data;
      this.cdr.detectChanges();
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-[#2fb080] border-[#2fb080]/30';
      case 'idle': return 'text-amber-400 border-amber-400/30';
      case 'off-duty': return 'text-white/40 border-white/10';
      default: return 'text-white/40 border-white/10';
    }
  }

  getStatusText(status: string): string {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  showCreateModal = false;
  isEditing = false;
  currentCrewId: number | null = null;

  newCrew: FieldCrew = {
    id: 0,
    name: '',
    leader: '',
    members: 0,
    currentProject: '',
    status: 'idle',
    location: ''
  };

  openCreateModal() {
    this.isEditing = false;
    this.currentCrewId = null;
    this.newCrew = {
      id: 0,
      name: '',
      leader: '',
      members: 0,
      currentProject: '',
      status: 'idle',
      location: ''
    };
    this.showCreateModal = true;
  }

  openEditModal(crew: FieldCrew) {
    this.isEditing = true;
    this.currentCrewId = crew.id;
    this.newCrew = { ...crew };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newCrew = {
      id: 0,
      name: '',
      leader: '',
      members: 0,
      currentProject: '',
      status: 'idle',
      location: ''
    };
    this.isEditing = false;
    this.currentCrewId = null;
  }

  saveCrew() {
    if (!this.newCrew.name) return;

    if (this.isEditing && this.currentCrewId) {
      this.fieldService.updateCrew(this.currentCrewId, this.newCrew).subscribe(updatedCrew => {
        const index = this.crews.findIndex(c => c.id === updatedCrew.id);
        if (index !== -1) {
          this.crews[index] = updatedCrew;
        }
        this.closeCreateModal();
        this.cdr.detectChanges();
      });
    } else {
      this.fieldService.createCrew(this.newCrew).subscribe(crew => {
        this.crews.push(crew);
        this.closeCreateModal();
        this.cdr.detectChanges();
      });
    }
  }

  // Details modal
  showDetailsModal = false;
  selectedCrew: FieldCrew | null = null;
  mockWorkers: any[] = [];
  
  // Worker modal
  showWorkerModal = false;
  selectedWorker: any = null;

  openDetailsModal(crew: FieldCrew) {
    this.router.navigate(['/field-crews', crew.id]);
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedCrew = null;
    this.mockWorkers = [];
  }

  openWorkerDetails(worker: any) {
    this.selectedWorker = worker;
    this.showWorkerModal = true;
  }

  closeWorkerDetails() {
    this.showWorkerModal = false;
    this.selectedWorker = null;
  }
}
