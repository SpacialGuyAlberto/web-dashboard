import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlanningService } from '@features/risk-planning/planning.service';
import { Project, WorkType } from './project.model';
import { SegmentCreationMapComponent } from '@features/segments/components/segment-creation-map/segment-creation-map.component';
import { GeometryPoint } from '@features/segments/segment.model';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SegmentCreationMapComponent],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
// Updated component with API integration
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  loading = true;
  error: string | null = null;

  constructor(private planningService: PlanningService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    console.log('ProjectsComponent initialized');
    this.loadProjects();
  }

  loadProjects(): void {
    console.log('Starting loadProjects');
    this.loading = true;
    this.planningService.getProjects().subscribe({
      next: (projects) => {
        console.log('Projects loaded successfully:', projects);
        this.projects = projects;
        this.loading = false;
        this.cdr.detectChanges(); // Force update
      },
      error: (err) => {
        console.error('Error loading projects in component:', err);
        this.error = 'Failed to load projects. Make sure the backend services are running.';
        this.loading = false;
        // Mock data for demo
        this.projects = [
          { id: 1, name: 'Berlin Fiber Deployment', description: 'City-wide fiber installation', startDate: '2024-01-15', endDate: '2024-12-31' },
          { id: 2, name: 'Munich Network Expansion', description: 'Expand existing network', startDate: '2024-03-01', endDate: '2024-11-30' }
        ];
        this.cdr.detectChanges(); // Force update
      }
    });
  }

  showCreateModal = false;
  isEditing = false;
  currentProjectId: number | null = null;

  newProject: Project = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    organizationId: 1,
    lifecycle_todo: [],
    lifecycle_done: [],
    geometry: []
  };

  selectedFile: File | null = null;

  currentStep: number = 1;
  workTypes = Object.values(WorkType);

  toggleLifecycle(workType: WorkType, type: 'todo' | 'done') {
    const list = type === 'todo' ? this.newProject.lifecycle_todo! : this.newProject.lifecycle_done!;
    const otherList = type === 'todo' ? this.newProject.lifecycle_done! : this.newProject.lifecycle_todo!;

    // Remove from the other list if present
    const otherIdx = otherList.indexOf(workType);
    if (otherIdx > -1) {
      otherList.splice(otherIdx, 1);
    }

    const idx = list.indexOf(workType);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(workType);
    }
  }

  isWorkTypeSelected(workType: WorkType, type: 'todo' | 'done'): boolean {
    const list = type === 'todo' ? this.newProject.lifecycle_todo! : this.newProject.lifecycle_done!;
    return list.includes(workType);
  }

  nextStep() {
    if (this.currentStep < 4) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  onCoordinatesChanged(event: any) {
    if (event && event.geometry) {
      this.newProject.geometry = event.geometry;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentProjectId = null;
    this.newProject = { name: '', description: '', startDate: '', endDate: '', lifecycle_todo: [], lifecycle_done: [], geometry: [] };
    this.selectedFile = null;
    this.currentStep = 1;
    this.showCreateModal = true;
  }

  openEditModal(project: Project) {
    this.isEditing = true;
    this.currentProjectId = project.id!;
    this.newProject = {
        ...project,
        lifecycle_todo: project.lifecycle_todo || [],
        lifecycle_done: project.lifecycle_done || [],
        geometry: project.geometry || []
    }; // Copy data
    this.selectedFile = null;
    this.currentStep = 1;
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newProject = { name: '', description: '', startDate: '', endDate: '', lifecycle_todo: [], lifecycle_done: [], geometry: [] };
    this.isEditing = false;
    this.currentProjectId = null;
    this.selectedFile = null;
    this.currentStep = 1;
  }

  saveProject() {
    if (!this.newProject.name) return;

    // Ensure geometry is a closed polygon
    if (this.newProject.geometry && this.newProject.geometry.length > 2) {
      const first = this.newProject.geometry[0];
      const last = this.newProject.geometry[this.newProject.geometry.length - 1];
      if (first.lat !== last.lat || first.lng !== last.lng) {
        // Append first point to the end to close the circle (A->B->C->D->A)
        this.newProject.geometry.push({ ...first });
      }
    }

    this.loading = true;

    if (this.isEditing && this.currentProjectId) {
      // Update existing project
      // Note: PlanningService needs an updateProject method. For now we might need to add it or mock it.
      // Assuming createProject can handle updates or we add a new method.
      // Let's add updateProject to service first? Or just use create for now if backend supports it (unlikely).
      // I will add updateProject to the service in the next step.
      this.planningService.updateProject(this.currentProjectId, this.newProject).subscribe({
        next: (updatedProject) => {
          console.log('Project updated:', updatedProject);
          const index = this.projects.findIndex(p => p.id === updatedProject.id);
          if (index !== -1) {
            this.projects[index] = updatedProject;
          }
          this.handleFileUploadAndClose(updatedProject.id!);
        },
        error: (err) => {
          console.error('Error updating project:', err);
          this.error = 'Failed to update project.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new project
      this.planningService.createProject(this.newProject).subscribe({
        next: (project) => {
          console.log('Project created:', project);
          this.projects.push(project);
          this.handleFileUploadAndClose(project.id!);
        },
        error: (err) => {
          console.error('Error creating project:', err);
          this.error = 'Failed to create project.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private handleFileUploadAndClose(projectId: number) {
    if (this.selectedFile) {
        this.planningService.processPlanauskunft(projectId, this.selectedFile).subscribe({
            next: (segments) => {
                console.log('Planauskunft processed, segments generated:', segments);
                this.closeCreateModal();
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error processing planauskunft:', err);
                this.error = 'Project saved, but failed to process Planauskunft.';
                this.closeCreateModal();
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    } else {
        this.closeCreateModal();
        this.loading = false;
        this.cdr.detectChanges();
    }
  }

  getStatusColor(project: Project): string {
    const now = new Date();
    const start = project.startDate ? new Date(project.startDate) : null;
    const end = project.endDate ? new Date(project.endDate) : null;

    if (start && now < start) return 'bg-blue-100 text-blue-800';
    if (end && now > end) return 'bg-green-100 text-green-800';
    return 'bg-orange-100 text-orange-800';
  }

  getStatus(project: Project): string {
    const now = new Date();
    const start = project.startDate ? new Date(project.startDate) : null;
    const end = project.endDate ? new Date(project.endDate) : null;

    if (start && now < start) return 'Planned';
    if (end && now > end) return 'Completed';
    return 'In Progress';
  }
}
