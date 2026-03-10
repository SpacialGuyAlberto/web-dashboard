import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowTask } from '../../models/workflow.model';



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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
