import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldService } from '../field.service';
import { FieldCrew } from '../models/field-crew.model';
import { InventoryService } from '../../inventory/inventory.service';

@Component({
  selector: 'app-crew-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="crew-detail-container">
      <div class="crew-detail-wrapper">
        <!-- Header -->
        <div class="flex items-center gap-4 mb-8">
          <button (click)="goBack()" class="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 transition-colors border-none cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 class="font-display text-4xl text-white m-0 tracking-wide">{{ crew?.name || 'Loading...' }}</h1>
            <p class="font-mono text-sm text-[#ff69b4] uppercase tracking-widest mt-1">Crew ID: {{ crew?.id }} • {{ crew?.company || 'FiberTech Build GmbH' }}</p>
          </div>
        </div>

        @if (crew) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column: Key Stats -->
            <div class="lg:col-span-2 space-y-6">
              <!-- KPI Cards -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div class="kpi-card group border-[#2fb080]/30 hover:border-[#2fb080]">
                  <div class="kpi-icon text-[#2fb080] bg-[#2fb080]/10 group-hover:bg-[#2fb080]/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <p class="kpi-label">Members</p>
                  <p class="kpi-value text-[#2fb080]">{{ crew.members }}</p>
                </div>

                <div class="kpi-card group border-[#3b82f6]/30 hover:border-[#3b82f6]">
                  <div class="kpi-icon text-[#3b82f6] bg-[#3b82f6]/10 group-hover:bg-[#3b82f6]/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </div>
                  <p class="kpi-label">Finished Jobs</p>
                  <p class="kpi-value text-[#3b82f6]">{{ crew.finishedSegments || 12 }}</p>
                </div>

                <div class="kpi-card group border-[#eab308]/30 hover:border-[#eab308]">
                  <div class="kpi-icon text-[#eab308] bg-[#eab308]/10 group-hover:bg-[#eab308]/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <p class="kpi-label">Hours Worked</p>
                  <p class="kpi-value text-[#eab308]">{{ crew.hoursWorked || 340 }}<span class="text-lg">h</span></p>
                </div>

                <div class="kpi-card group border-[#ff69b4]/30 hover:border-[#ff69b4]">
                  <div class="kpi-icon text-[#ff69b4] bg-[#ff69b4]/10 group-hover:bg-[#ff69b4]/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <p class="kpi-label">Correction Avg</p>
                  <p class="kpi-value text-[#ff69b4]">{{ crew.correctionAvg || 2.1 }}<span class="text-lg">%</span></p>
                </div>
              </div>

              <!-- Metrics -->
              <div class="bg-[#161719]/80 backdrop-blur-md rounded-2xl border border-white/5 p-6">
                <h3 class="font-display text-xl text-white mb-6 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6938ef" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                  Performance Analytics
                </h3>
                
                <div class="space-y-6">
                  <div>
                    <div class="flex justify-between mb-2">
                       <span class="text-sm font-mono text-white/60 tracking-widest">Avg Material Used (Ducts)</span>
                       <span class="text-sm font-mono text-white">{{ crew.materialAvg || 85 }}%</span>
                    </div>
                    <div class="w-full bg-[#0a0a0f] rounded-full h-3 overflow-hidden border border-white/5 shadow-inner">
                       <div class="bg-gradient-to-r from-[#6938ef] to-[#ff69b4] h-full rounded-full relative" [style.width.%]="crew.materialAvg || 85">
                         <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                       </div>
                    </div>
                  </div>

                  <div>
                    <div class="flex justify-between mb-2">
                       <span class="text-sm font-mono text-white/60 tracking-widest">Safety Score</span>
                       <span class="text-sm font-mono text-[#2fb080] font-bold">{{ crew.safetyScore || 98 }}/100</span>
                    </div>
                    <div class="w-full bg-[#0a0a0f] rounded-full h-3 overflow-hidden border border-white/5 shadow-inner">
                       <div class="bg-gradient-to-r from-[#2fb080] to-[#3b82f6] h-full rounded-full" [style.width.%]="crew.safetyScore || 98"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Machinery List -->
              <div class="bg-[#161719]/80 backdrop-blur-md rounded-2xl border border-white/5 p-6">
                <h3 class="font-display text-xl text-white mb-6 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                  Assigned Machinery
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (machine of assignedMachinery; track machine.serialNumber) {
                    <div class="flex items-center gap-4 bg-[#0a0a0f] p-4 rounded-xl border border-white/5 hover:border-[#eab308]/30 transition-colors">
                      <div class="w-12 h-12 rounded-lg bg-[#eab308]/10 text-[#eab308] flex items-center justify-center border border-[#eab308]/20">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                      </div>
                      <div>
                        <h4 class="text-white font-medium m-0">{{ machine.name }}</h4>
                        <p class="text-xs text-white/50 font-mono mt-1">{{ machine.serialNumber }} • {{ machine.status }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>

            </div>

            <!-- Right Column: Sidebar -->
            <div class="space-y-6">
              
              <!-- Current Assignment -->
              <div class="bg-[#161719]/80 backdrop-blur-md rounded-2xl border border-[#6938ef]/30 p-6">
                <div class="flex justify-between items-start mb-4">
                  <h3 class="font-display text-lg text-white m-0">Current Assignment</h3>
                  <span class="px-2 py-1 bg-[#6938ef]/20 text-[#6938ef] text-[10px] font-mono uppercase tracking-widest rounded border border-[#6938ef]/50">
                    {{ crew.status }}
                  </span>
                </div>
                
                <div class="space-y-4">
                  <div>
                    <span class="block text-xs font-mono text-white/40 uppercase tracking-widest mb-1">Project</span>
                    <span class="text-white font-medium">{{ crew.currentProject }}</span>
                  </div>
                  <div>
                    <span class="block text-xs font-mono text-white/40 uppercase tracking-widest mb-1">Location</span>
                    <span class="text-white font-medium">{{ crew.location }}</span>
                  </div>
                  <div>
                    <span class="block text-xs font-mono text-white/40 uppercase tracking-widest mb-1">Foreman</span>
                    <span class="text-white font-medium">{{ crew.leader }}</span>
                  </div>
                </div>
                
                <button (click)="locateOnMap()" class="w-full mt-6 bg-[#6938ef] hover:bg-[#4e22cc] text-white py-3 rounded-lg text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer border-none">
                  Locate on Map
                </button>
              </div>
              
              <!-- Team Members -->
              <div class="bg-[#161719]/80 backdrop-blur-md rounded-2xl border border-white/5 p-6">
                <h3 class="font-display text-lg text-white mb-4">Team Members</h3>
                <div class="space-y-3">
                  @for (worker of mockWorkers; track worker.name) {
                    <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <img [src]="worker.photoUrl" class="w-10 h-10 rounded-full border border-white/10" alt="worker">
                      <div class="flex-1">
                        <p class="text-white text-sm m-0">{{ worker.name }}</p>
                        <p class="text-[10px] font-mono text-[#2fb080] uppercase tracking-widest m-0">{{ worker.role }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>

            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #060609;
    }
    .crew-detail-container {
      padding: 2rem;
      height: 100%;
      overflow-y: auto;
    }
    .crew-detail-wrapper {
      max-width: 1200px;
      margin: 0 auto;
    }
    .kpi-card {
      background: rgba(22, 23, 25, 0.8);
      backdrop-filter: blur(12px);
      border-width: 1px;
      border-style: solid;
      border-radius: 1rem;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      transition: all 0.3s ease;
    }
    .kpi-card:hover {
      transform: translateY(-5px);
    }
    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      transition: all 0.3s ease;
    }
    .kpi-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.5);
      margin: 0 0 0.5rem 0;
    }
    .kpi-value {
      font-family: 'Clash Display', sans-serif;
      font-size: 2.5rem;
      font-weight: 600;
      line-height: 1;
      margin: 0;
    }
  `]
})
export class CrewDetailComponent implements OnInit {
  crew: FieldCrew | null = null;
  assignedMachinery: any[] = [];
  mockWorkers: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private fieldService: FieldService,
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCrew(parseInt(id, 10));
      }
    });
  }

  loadCrew(id: number) {
    const qParams = this.route.snapshot.queryParams;
    this.fieldService.getCrewById(id).subscribe({
      next: (freshCrew) => {
        const fullCrew: any = {
          ...freshCrew,
          id: id,
          name: freshCrew.name || `Crew ${id}`,
          leader: freshCrew.leader || 'Michael Bauer',
          members: freshCrew.members || 4,
          currentProject: freshCrew.currentProject || qParams['project'] || 'Glasfaser Ausbau',
          status: freshCrew.status || qParams['status'] || 'ACTIVE',
          location: freshCrew.location || qParams['location'] || 'Sector Alpha',
          company: 'FiberTech Build GmbH',
          correctionAvg: 2.1,
          finishedSegments: 12,
          materialAvg: 85,
          hoursWorked: 340,
          safetyScore: 98,
          clusterId: 1,
          projectId: 1
        };
        this.crew = fullCrew;
        
        // If freshCrew was empty, ensure our default id/name remain
        if (!this.crew?.name) this.crew!.name = `Crew ${id}`;
        if (!this.crew?.id) this.crew!.id = id;

        this.generateMockWorkers(this.crew?.members || 4);
        
        // Fetch assigned machinery
        this.inventoryService.getAllMachines().subscribe({
          next: (machines) => {
            this.assignedMachinery = machines.filter(m => m.assignedCrewId === id);
            this.cdr.detectChanges();
          }
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        // Fallback or handle error
        console.error(err);
      }
    });
  }

  generateMockWorkers(count: number) {
    this.mockWorkers = Array.from({ length: count || 4 }).map((_, i) => ({
      name: `Worker ${i + 1}`,
      role: i === 0 ? 'Foreman' : 'Technician',
      photoUrl: `https://i.pravatar.cc/150?u=crew_worker_${i}`
    }));
  }

  goBack() {
    this.location.back();
  }

  locateOnMap() {
    if (this.crew) {
      const clusterId = (this.crew as any).clusterId || 1;
      const projectId = (this.crew as any).projectId || 1;
      this.router.navigate(['/project-details/clusters', clusterId, 'areas'], {
        queryParams: { projectId: projectId, projectName: this.crew.currentProject }
      });
    }
  }
}
