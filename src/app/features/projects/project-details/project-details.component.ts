import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '@features/inventory/inventory.service';
import { PlanningService } from '@features/risk-planning/planning.service';
import { Material } from '@features/inventory/inventory.model';
import { SegmentsComponent } from '@features/segments/segments';
import { ClustersComponent } from '@features/clusters/clusters.component';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, SegmentsComponent, ClustersComponent],
  templateUrl: './project-details.html',
  styleUrls: ['./project-details.component.css']
})
export class ProjectDetailsComponent implements OnInit {
  projectId!: number;
  projectName: string = '';
  projectCenter?: google.maps.LatLngLiteral;
  activeTab: 'clusters' | 'segments' | 'materials' = 'clusters';
  
  projectMaterials: Material[] = [];
  loadingMaterials = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private planningService: PlanningService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.projectId = +params['projectId'];
      this.projectName = params['projectName'] || 'Project';
      if (params['lat'] && params['lng'] && !isNaN(+params['lat']) && !isNaN(+params['lng'])) {
        this.projectCenter = { lat: +params['lat'], lng: +params['lng'] };
      }
      if (this.projectId) {
        this.planningService.getProject(this.projectId).subscribe({
          next: (project) => {
            const lat = project.latitude ?? project.startLatitude ?? (project.geometry && project.geometry[0] ? project.geometry[0].lat : undefined);
            const lng = project.longitude ?? project.startLongitude ?? (project.geometry && project.geometry[0] ? project.geometry[0].lng : undefined);
            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
              this.projectCenter = { lat, lng };
            }
          },
          error: (err) => console.warn('Could not fetch project center:', err)
        });
      }
    });
  }

  switchTab(tab: 'clusters' | 'segments' | 'materials') {
    this.activeTab = tab;
    if (tab === 'materials' && this.projectMaterials.length === 0) {
      this.loadProjectMaterials();
    }
  }

  loadProjectMaterials() {
    this.loadingMaterials = true;
    this.inventoryService.getAllMaterials().subscribe({
      next: (materials) => {
        // Filter materials that have allocation for this project
        this.projectMaterials = materials.filter(m =>
          m.projectAllocations && m.projectAllocations.some(a => a.projectId == this.projectId.toString())
        );

        // Mocking some data if empty for demo purposes
        if (this.projectMaterials.length === 0) {
          this.projectMaterials = materials.slice(0, 3).map(m => ({
            ...m,
            projectAllocations: [{ projectId: this.projectId.toString(), projectName: this.projectName, quantityAllocated: Math.floor(Math.random() * 500) + 50 }]
          }));
        }
        this.loadingMaterials = false;
      },
      error: () => {
        this.loadingMaterials = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/projects']);
  }
}
