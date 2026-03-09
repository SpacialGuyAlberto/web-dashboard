import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlanningService, Project } from '../../services/planning.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
    endDate: ''
  };

  openCreateModal() {
    this.isEditing = false;
    this.currentProjectId = null;
    this.newProject = { name: '', description: '', startDate: '', endDate: '' };
    this.showCreateModal = true;
  }

  openEditModal(project: Project) {
    this.isEditing = true;
    this.currentProjectId = project.id!;
    this.newProject = { ...project }; // Copy data
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newProject = { name: '', description: '', startDate: '', endDate: '' };
    this.isEditing = false;
    this.currentProjectId = null;
  }

  saveProject() {
    if (!this.newProject.name) return;

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
          this.closeCreateModal();
          this.loading = false;
          this.cdr.detectChanges();
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
          this.closeCreateModal();
          this.loading = false;
          this.cdr.detectChanges();
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
