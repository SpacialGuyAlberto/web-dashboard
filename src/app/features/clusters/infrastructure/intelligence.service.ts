import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IntelligenceService {
  private apiUrl = 'http://localhost:8080/api/v1/intelligence';

  constructor(private http: HttpClient) {}

  calculateRiskForSegment(segmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/risk/segment/${segmentId}`);
  }

  calculateOptimalRoute(heupId: number, popId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/route/optimal?heupId=${heupId}&popId=${popId}`);
  }

  getHighCapacityAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/capacity/alerts`);
  }
}
