import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Cluster } from './cluster.model';
import { ClusterService } from './cluster.service';
import { PlanImporterComponent } from '../gis/components/plan-importer/plan-importer.component';

@Component({
  selector: 'app-clusters',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PlanImporterComponent],
  templateUrl: './clusters.component.html',
  styleUrls: ['./clusters.component.css']
})
export class ClustersComponent implements OnInit {
  @Input() projectId!: number;
  @Input() projectName: string = '';
  
  clusters: Cluster[] = [];
  showCreateModal = false;
  showImportModal = false;
  selectedClusterIdForImport: number | null = null;
  
  newCluster: Cluster = {
    name: '',
    description: '',
    projectId: 0
  };

  constructor(
    private clusterService: ClusterService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.newCluster.projectId = this.projectId;
    this.loadClusters();
  }

  loadClusters() {
    this.clusterService.getClustersByProjectId(this.projectId).subscribe({
      next: (data) => {
        this.clusters = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading clusters', err)
    });
  }

  openCreateModal() {
    this.newCluster = {
      name: '',
      description: '',
      projectId: this.projectId
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  openImportModal(clusterId: number) {
    this.selectedClusterIdForImport = clusterId;
    this.showImportModal = true;
  }

  closeImportModal() {
    this.showImportModal = false;
    this.selectedClusterIdForImport = null;
  }

  onPlanImported(event: any) {
    console.log('Líneas extraídas para el cluster', this.selectedClusterIdForImport, event);
    // Aquí enviaríamos las event.lines y event.utilityType al backend de Quarkbau
    this.closeImportModal();
  }

  saveCluster() {
    if (!this.newCluster.name) return;
    
    this.clusterService.createCluster(this.newCluster).subscribe({
      next: (created) => {
        this.clusters.push(created);
        this.closeCreateModal();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error creating cluster', err)
    });
  }
  
  getPopCount(cluster: Cluster): number {
    return cluster.pops?.length || 0;
  }
  
  getNetzverteilerCount(cluster: Cluster): number {
    if (!cluster.pops) return 0;
    return cluster.pops.reduce((total, pop) => total + (pop.nvts?.length || 0), 0);
  }
}
