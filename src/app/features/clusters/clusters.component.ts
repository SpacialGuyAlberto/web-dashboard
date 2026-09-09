import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Cluster } from './cluster.model';

@Component({
  selector: 'app-clusters',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clusters.component.html',
  styleUrls: ['./clusters.component.css']
})
export class ClustersComponent implements OnInit {
  @Input() projectId!: number;
  @Input() projectName: string = '';
  
  clusters: Cluster[] = [];
  showCreateModal = false;
  
  newCluster: Cluster = {
    projectId: 0,
    name: '',
    cityArea: '',
    popCount: 1,
    netzverteilerCount: 0,
    status: 'PLANNED'
  };

  ngOnInit() {
    this.newCluster.projectId = this.projectId;
    // Mock data for demo
    this.clusters = [
      {
        id: 1,
        projectId: this.projectId,
        name: 'Cluster Mitte',
        cityArea: 'Berlin Mitte',
        popCount: 2,
        netzverteilerCount: 15,
        status: 'IN_PROGRESS'
      },
      {
        id: 2,
        projectId: this.projectId,
        name: 'Cluster Kreuzberg',
        cityArea: 'Friedrichshain-Kreuzberg',
        popCount: 1,
        netzverteilerCount: 8,
        status: 'PLANNED'
      }
    ];
  }

  openCreateModal() {
    this.newCluster = {
      projectId: this.projectId,
      name: '',
      cityArea: '',
      popCount: 1,
      netzverteilerCount: 0,
      status: 'PLANNED'
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  saveCluster() {
    if (!this.newCluster.name || !this.newCluster.cityArea) return;
    
    const clusterToSave = {
      ...this.newCluster,
      id: Math.floor(Math.random() * 1000) + 100
    };
    
    this.clusters.push(clusterToSave);
    this.closeCreateModal();
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'PLANNED': return 'text-white/50 border-white/10';
      case 'IN_PROGRESS': return 'text-amber-400 border-amber-400/20';
      case 'COMPLETED': return 'text-[#2fb080] border-[#2fb080]/20';
      default: return 'text-white/50 border-white/10';
    }
  }

  getStatusText(status: string): string {
    return status.replace('_', ' ');
  }
}
