import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-pop-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pop-dashboard.html',
  styleUrls: ['./pop-dashboard.css']
})
export class PopDashboard implements OnInit {
  projectId: number = 0;
  projectName: string = '';
  clusterId: number = 0;
  popId: string = '';

  popData = {
    id: '',
    name: 'Main POP Mitte',
    status: 'ACTIVE',
    capacity: { total: 10000, used: 4500, unit: 'Connections' },
    hardware: { racks: 4, activeSwitches: 12, temp: '22°C' },
    bandwidth: { up: '10 Gbps', down: '40 Gbps', usage: '42%' },
    connectedDPs: [
      { id: 'DP-01', name: 'Netzverteiler A', status: 'ACTIVE', connections: 240 },
      { id: 'DP-02', name: 'Netzverteiler B', status: 'PLANNED', connections: 0 },
      { id: 'DP-03', name: 'Netzverteiler C', status: 'ACTIVE', connections: 180 }
    ],
    lastMaintenance: new Date(2025, 1, 15)
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
      this.popId = params['popId'];
      this.popData.id = this.popId;
    });
  }

  goBack() {
    this.router.navigate(['/project-details/clusters', this.clusterId, 'areas'], { 
      queryParams: { projectId: this.projectId, projectName: this.projectName } 
    });
  }
}
