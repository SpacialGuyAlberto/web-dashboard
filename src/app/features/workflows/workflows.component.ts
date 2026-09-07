import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowService } from './workflow.service';
import { WorkflowTask } from './workflow.model';



@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workflows.component.html',
  styleUrls: ['./workflows.component.css']
})
// Updated component with workflow table
export class WorkflowsComponent {
  workflows: WorkflowTask[] = [];

  constructor(private workflowService: WorkflowService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.workflowService.getWorkflows().subscribe(data => {
      this.workflows = data;
      this.cdr.detectChanges();
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'bg-transparent text-white/60 border-white/20';
      case 'in-progress': return 'bg-transparent text-[#6938ef] border-[#6938ef]/30';
      case 'completed': return 'bg-transparent text-[#2fb080] border-[#2fb080]/20';
      case 'blocked': return 'bg-transparent text-amber-400 border-amber-400/20';
      default: return 'bg-transparent text-white/40 border-white/10';
    }
  }

  getStatusText(status: string): string {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  showCreateModal = false;
  isEditing = false;
  currentTaskId: number | null = null;

  newTask: WorkflowTask = {
    id: 0,
    projectName: '',
    currentStep: 'Plan',
    assignedTo: '',
    status: 'pending',
    dueDate: ''
  };

  openCreateModal() {
    this.isEditing = false;
    this.currentTaskId = null;
    this.newTask = {
      id: 0,
      projectName: '',
      currentStep: 'Plan',
      assignedTo: '',
      status: 'pending',
      dueDate: ''
    };
    this.showCreateModal = true;
  }

  openEditModal(task: WorkflowTask) {
    this.isEditing = true;
    this.currentTaskId = task.id;
    this.newTask = { ...task };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newTask = {
      id: 0,
      projectName: '',
      currentStep: 'Plan',
      assignedTo: '',
      status: 'pending',
      dueDate: ''
    };
    this.isEditing = false;
    this.currentTaskId = null;
  }

  saveTask() {
    if (!this.newTask.projectName) return;

    if (this.isEditing && this.currentTaskId) {
      this.workflowService.updateWorkflow(this.currentTaskId, this.newTask).subscribe(updatedTask => {
        const index = this.workflows.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          this.workflows[index] = updatedTask;
        }
        this.closeCreateModal();
        this.cdr.detectChanges();
      });
    } else {
      this.workflowService.createWorkflow(this.newTask).subscribe(task => {
        this.workflows.push(task);
        this.closeCreateModal();
        this.cdr.detectChanges();
      });
    }
  }
}
