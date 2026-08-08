import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { GeometryPoint, Segment } from './segment.model';

@Injectable({
    providedIn: 'root'
})
export class SegmentService {
    private apiUrl = 'http://localhost:8080/api';

    constructor(private http: HttpClient) { }

  createSegment(projectId: number, segment: Segment): Observable<Segment> {
    if (!projectId || !segment) {
      return throwError(() => new Error('Datos de segmento o ID de proyecto inválidos.'));
    }
    return this.http.post<Segment>(`${this.apiUrl}/projects/${projectId}/segments`, segment);
  }

    getProjectSegments(projectId: number): Observable<Segment[]> {
        return this.http.get<Segment[]>(`${this.apiUrl}/projects/${projectId}/segments`);
    }

    getSegment(id: number): Observable<Segment> {
        return this.http.get<Segment>(`${this.apiUrl}/segments/${id}`);
    }

    updateSegment(id: number, segment: Segment): Observable<Segment> {
        return this.http.put<Segment>(`${this.apiUrl}/segments/${id}`, segment);
    }

    getAvailableTransitions(segmentId: number): Observable<any[]> {
        // Workflow module is still simplified, but we can point to it if needed
        return of([
            { id: 1, name: 'Start Construction', targetState: 'IN_PROGRESS' },
            { id: 2, name: 'Hold (Weather)', targetState: 'ON_HOLD' },
            { id: 3, name: 'Complete', targetState: 'COMPLETED' }
        ]);
    }

    executeTransition(segmentId: number, transitionId: number, data: any): Observable<void> {
        // Placeholder for real workflow execution
        return of(void 0);
    }

    // New: Impact Analysis
    getImpactedSegments(segmentId: number): Observable<Segment[]> {
        return this.http.get<Segment[]>(`${this.apiUrl}/analysis/segments/${segmentId}/impact`);
    }

    linkSegments(sourceId: number, targetId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/analysis/segments/${sourceId}/link/${targetId}`, {});
    }
}
