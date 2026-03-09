import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FieldService, FieldCrew } from '../../services/field.service';



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
      case 'active': return 'bg-green-100 text-green-800';
      case 'idle': return 'bg-yellow-100 text-yellow-800';
      case 'off-duty': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  openDetailsModal(crew: FieldCrew) {
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
  }
}
