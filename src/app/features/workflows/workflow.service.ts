import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { WorkflowTask } from './workflow.model';

@Injectable({
    providedIn: 'root'
})
export class WorkflowService {
    // Session Keys
    private readonly WORKFLOWS_KEY = 'workflow_tasks';

    constructor(private http: HttpClient) {
        this.initializeMockData();
    }

    private initializeMockData() {
        if (!sessionStorage.getItem(this.WORKFLOWS_KEY)) {
            const mockTasks: WorkflowTask[] = [
                { id: 1, projectName: 'City Bridge Repair', currentStep: 'Review Blueprints', assignedTo: 'John Architect', status: 'IN_PROGRESS', dueDate: '2025-01-20' },
                { id: 2, projectName: 'Main St. Overlay', currentStep: 'Approve Budget', assignedTo: 'Jane Finance', status: 'PENDING', dueDate: '2025-01-15' },
                { id: 3, projectName: 'Sewer Line Expansion', currentStep: 'Permit Application', assignedTo: 'Mike Compliance', status: 'COMPLETED', dueDate: '2024-12-20' }
            ];
            sessionStorage.setItem(this.WORKFLOWS_KEY, JSON.stringify(mockTasks));
        }
    }

    private get<T>(key: string): T[] {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    private save<T>(key: string, data: T[]): void {
        sessionStorage.setItem(key, JSON.stringify(data));
    }

    getWorkflows(): Observable<WorkflowTask[]> {
        return of(this.get<WorkflowTask>(this.WORKFLOWS_KEY));
    }

    createWorkflow(task: WorkflowTask): Observable<WorkflowTask> {
        const tasks = this.get<WorkflowTask>(this.WORKFLOWS_KEY);
        task.id = Math.floor(Math.random() * 10000);
        tasks.push(task);
        this.save(this.WORKFLOWS_KEY, tasks);
        return of(task);
    }

    updateWorkflow(id: number, task: WorkflowTask): Observable<WorkflowTask> {
        const tasks = this.get<WorkflowTask>(this.WORKFLOWS_KEY);
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...task };
            this.save(this.WORKFLOWS_KEY, tasks);
            return of(tasks[index]);
        }
        throw new Error('Workflow not found');
    }
}
