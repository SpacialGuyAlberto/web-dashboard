import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Huep } from './huep.model';

@Injectable({
  providedIn: 'root'
})
export class HuepService {
  private apiUrl = 'http://localhost:8080/api/hueps';

  constructor(private http: HttpClient) {}

  getAllHueps(): Observable<Huep[]> {
    return this.http.get<Huep[]>(this.apiUrl);
  }

  getHuep(id: number): Observable<Huep> {
    return this.http.get<Huep>(`${this.apiUrl}/${id}`);
  }

  createHuep(huep: Partial<Huep>): Observable<Huep> {
    return this.http.post<Huep>(this.apiUrl, huep);
  }

  updateHuep(id: number, huep: Partial<Huep>): Observable<Huep> {
    return this.http.put<Huep>(`${this.apiUrl}/${id}`, huep);
  }

  deleteHuep(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
