import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
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
  @ViewChild(SegmentCreationMapComponent) referenceMap!: SegmentCreationMapComponent;
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
  isFullscreen = false;
  mapCenter: google.maps.LatLngLiteral = { lat: 52.4746, lng: 13.4475 };

  onMapCenterChanged(center: google.maps.LatLngLiteral) {
    this.mapCenter = center;
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

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
    this.resetOverlay();
    this.currentStep = 1;
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newProject = { name: '', description: '', startDate: '', endDate: '', lifecycle_todo: [], lifecycle_done: [], geometry: [] };
    this.isEditing = false;
    this.currentProjectId = null;
    this.selectedFile = null;
    this.resetOverlay();
    this.currentStep = 1;
  }

  // Overlay state
  planOverlayUrl: string | null = null;
  planOpacity = 0.7;
  planScale = 1.0;
  planRotation = 0;
  planX = 0;
  planY = 0;
  
  isDraggingOverlay = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialPlanX = 0;
  private initialPlanY = 0;

  getTransform(): string {
      return `translate(${this.planX}px, ${this.planY}px) scale(${this.planScale}) rotate(${this.planRotation}deg)`;
  }

  // Simulated AI Vector Comparison Score
  get matchScore(): number {
      // Deterministic function based on transforms to simulate real-time alignment analysis
      const normalizedX = Math.abs(this.planX % 200) / 200;
      const normalizedY = Math.abs(this.planY % 200) / 200;
      
      // Let's create a sweet spot for rotation around 0, 90, 180...
      const rotMod = Math.abs(this.planRotation % 90);
      const normalizedRot = rotMod > 45 ? (90 - rotMod) / 45 : rotMod / 45; 
      
      // Base score 50. Closer to 0 mod 200 on X/Y gives higher score. Closer to orthogonal rotation gives higher score.
      let score = 50 + ((1 - normalizedX) * 20) + ((1 - normalizedY) * 20) + ((1 - normalizedRot) * 9.9);
      
      // Penalize absurd scales
      if (this.planScale > 2.0) {
          score -= (this.planScale - 2.0) * 30;
      }
      
      return Math.max(0, Math.min(99.9, score));
  }

  get matchColor(): string {
      const score = this.matchScore;
      if (score < 75) return '#ef4444'; // Red (Poor match)
      if (score < 88) return '#eab308'; // Yellow (Partial match)
      return '#2fb080'; // Green (Good match)
  }

  resetOverlay() {
      this.planOverlayUrl = null;
      this.planOpacity = 0.7;
      this.planScale = 1.0;
      this.planRotation = 0;
      this.planX = 0;
      this.planY = 0;
  }

  onDragOver(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
      // Optionally add a class for drag over styling
  }

  onDrop(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
          this.handleFile(event.dataTransfer.files[0]);
      }
  }

  onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
          this.handleFile(file);
      }
  }

  private handleFile(file: File) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
          this.planOverlayUrl = e.target.result;
          this.autoAlignPlan();
      };
      reader.readAsDataURL(file);
  }

  autoAlignPlan() {
      // Simulate automatic geometric compatibility adjustment
      this.planScale = 1.15;
      this.planRotation = 0; // Keeping it straight, or maybe adjust if needed
      this.planX = 0;
      this.planY = 0;
      
      // Let's add a slight rotation or scale to make it feel "calculated"
      // In a real scenario, this would compare image edges with map streets
      setTimeout(() => {
          this.planScale = 1.25;
          this.planRotation = -2;
          this.planX = 15;
          this.planY = -10;
      }, 500); // Small delay for visual effect
  }

  onOverlayDragStart(event: MouseEvent) {
      event.preventDefault(); // Prevent default image dragging
      this.isDraggingOverlay = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      this.initialPlanX = this.planX;
      this.initialPlanY = this.planY;
  }

  onOverlayDrag(event: MouseEvent) {
      if (!this.isDraggingOverlay) return;
      const dx = event.clientX - this.dragStartX;
      const dy = event.clientY - this.dragStartY;
      this.planX = this.initialPlanX + dx;
      this.planY = this.initialPlanY + dy;
  }

  onOverlayDragEnd() {
      this.isDraggingOverlay = false;
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
        let currentLat = this.mapCenter.lat;
        let currentLng = this.mapCenter.lng;
        
        if (this.referenceMap) {
            const center = this.referenceMap.getCurrentCenter();
            currentLat = center.lat;
            currentLng = center.lng;
        }

        this.planningService.processPlanauskunft(
            projectId, 
            this.selectedFile,
            this.planScale,
            this.planRotation,
            this.planX,
            this.planY,
            currentLat, 
            currentLng  
        ).subscribe({
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

    if (start && now < start) return 'text-[#6938ef] border-[#6938ef]/20';
    if (end && now > end) return 'text-[#2fb080] border-[#2fb080]/20';
    return 'text-orange-400 border-orange-400/20';
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
