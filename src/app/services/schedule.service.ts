import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface CrewAssignment {
    id?: number;
    crewId: number;
    segmentId: number;
    assignedDate: string;  // ISO date format (YYYY-MM-DD)
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

@Injectable({
    providedIn: 'root'
})
export class ScheduleService {
    private apiUrl = 'http://localhost:8080/api/schedule';

    constructor(private http: HttpClient) { }

    // Create a crew assignment
    createAssignment(assignment: CrewAssignment): Observable<CrewAssignment> {
        return this.http.post<CrewAssignment>(`${this.apiUrl}/assignments`, assignment);
    }

    // Get crew schedule for a date range
    getCrewSchedule(crewId: number, start: string, end: string): Observable<CrewAssignment[]> {
        const params = new HttpParams().set('start', start).set('end', end);
        return this.http.get<CrewAssignment[]>(`${this.apiUrl}/assignments/crew/${crewId}`, { params });
    }

    // Get project schedule for a date range
    getProjectSchedule(projectId: number, start: string, end: string): Observable<CrewAssignment[]> {
        const params = new HttpParams().set('start', start).set('end', end);
        return this.http.get<CrewAssignment[]>(`${this.apiUrl}/assignments/project/${projectId}`, { params });
    }

    // Get all assignments for a week (or generic range)
    getWeekSchedule(start: string, end: string): Observable<CrewAssignment[]> {
        const params = new HttpParams().set('start', start).set('end', end);
        return this.http.get<CrewAssignment[]>(`${this.apiUrl}/assignments`, { params });
    }

    // Update an assignment
    updateAssignment(assignmentId: number, assignment: CrewAssignment): Observable<CrewAssignment> {
        return this.http.put<CrewAssignment>(`${this.apiUrl}/assignments/${assignmentId}`, assignment);
    }

    // Delete an assignment
    deleteAssignment(assignmentId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/assignments/${assignmentId}`);
    }

    // Validate an assignment without saving
    validateAssignment(assignment: CrewAssignment): Observable<ValidationResponse> {
        return this.http.post<ValidationResponse>(`${this.apiUrl}/assignments/validate`, assignment);
    }
}
