export interface CrewAssignment {
    id?: number;
    crewId: number;
    segmentId: number;
    assignedDate: string;
    startTime?: string;    // HH:mm format
    endTime?: string;      // HH:mm format
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    // Display fields
    crewName?: string;
    segmentName?: string;
    projectId?: number;
}

export interface ValidationResponse {
    valid: boolean;
    errors: string[];
}
