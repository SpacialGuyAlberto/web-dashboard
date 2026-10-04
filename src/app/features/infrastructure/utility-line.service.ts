import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UtilityLine } from './utility-line.model';

@Injectable({
  providedIn: 'root'
})
export class UtilityLineService {
  private apiUrl = 'http://localhost:8080/api/v1/utilities';

  constructor(private http: HttpClient) {}

  getAll(type?: string): Observable<UtilityLine[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<UtilityLine[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<UtilityLine> {
    return this.http.get<UtilityLine>(`${this.apiUrl}/${id}`);
  }

  create(utility: UtilityLine): Observable<UtilityLine> {
    return this.http.post<UtilityLine>(this.apiUrl, utility);
  }

  update(id: number, utility: UtilityLine): Observable<UtilityLine> {
    return this.http.put<UtilityLine>(`${this.apiUrl}/${id}`, utility);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
