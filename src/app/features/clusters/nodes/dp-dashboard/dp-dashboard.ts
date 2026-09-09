import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-dp-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dp-dashboard.html',
  styleUrls: ['./dp-dashboard.css']
})
export class DpDashboard implements OnInit {
  projectId: number = 0;
  projectName: string = '';
  clusterId: number = 0;
  dpId: string = '';

  dpData = {
    id: '',
    name: 'Netzverteiler A',
    status: 'ACTIVE',
    location: 'Friedrichstraße 140',
    contractor: 'Alpha Networks',
    budget: { total: 12000, spent: 4500 },
    capacity: { totalPorts: 288, usedPorts: 142, reservedPorts: 20 },
    hardware: { splitters: 4, type: 'Street Cabinet 2.0', batteryStatus: 'Good' },
    connectedAcometidas: [
      { id: 'AC-01', name: 'Route 1', status: 'ACTIVE', length: '120m', endpoints: 4 },
      { id: 'AC-02', name: 'Route 2', status: 'ACTIVE', length: '85m', endpoints: 3 },
      { id: 'AC-05', name: 'Route 5', status: 'PLANNED', length: '210m', endpoints: 8 }
    ],
    lastInspection: new Date(2025, 3, 5)
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['projectId']) this.projectId = +params['projectId'];
      if (params['projectName']) this.projectName = params['projectName'];
    });
    
    this.route.params.subscribe(params => {
      this.clusterId = +params['clusterId'];
      this.dpId = params['dpId'];
      this.dpData.id = this.dpId;
    });
  }

  getCapacityPercentage() {
    return (this.dpData.capacity.usedPorts / this.dpData.capacity.totalPorts) * 100;
  }

  goBack() {
    this.router.navigate(['/project-details/clusters', this.clusterId, 'areas'], { 
      queryParams: { projectId: this.projectId, projectName: this.projectName } 
    });
  }
}
