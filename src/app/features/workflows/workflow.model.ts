export interface WorkflowTask {
    id: number;
    projectName: string;
    currentStep: string;
    assignedTo: string;
    status: string;
    dueDate: string;
}
