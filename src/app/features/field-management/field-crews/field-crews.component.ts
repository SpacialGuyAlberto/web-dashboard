import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    private ngZone: NgZone
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
    // Generate mock workers based on number of members
    this.mockWorkers = Array.from({ length: crew.members || 4 }).map((_, i) => ({
      name: `Worker ${i + 1}`,
      role: i === 0 ? 'Foreman' : 'Technician',
      photoUrl: `https://i.pravatar.cc/150?u=crew_${crew.id}_worker_${i}`,
      currentProject: crew.currentProject,
      location: crew.location,
      status: i % 3 === 0 ? 'On Break' : 'Working',
      pastProjects: [
        'Berlin Sector 4 Expansion',
        'Munich Central Fiber Drop',
        'Hamburg Node Maintenance'
      ],
      hoursLogged: Math.floor(Math.random() * 20) + 30
    }));

    // Fetch fresh crew details from backend
    this.fieldService.getCrewById(crew.id).subscribe({
      next: (freshCrew) => {
        this.ngZone.run(() => {
          this.selectedCrew = freshCrew;
          this.showDetailsModal = true;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error fetching crew details:', error);
        // Fallback to the crew data we already have
        this.ngZone.run(() => {
          this.selectedCrew = crew;
          this.showDetailsModal = true;
          this.cdr.detectChanges();
        });
      }
    });
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
