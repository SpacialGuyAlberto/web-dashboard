import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pop } from './pop.model';

@Injectable({
  providedIn: 'root'
})
export class PopService {
  private apiUrl = 'http://localhost:8080/api/pops';

  constructor(private http: HttpClient) {}

  getAllPops(): Observable<Pop[]> {
    return this.http.get<Pop[]>(this.apiUrl);
  }

  getPop(id: number): Observable<Pop> {
    return this.http.get<Pop>(`${this.apiUrl}/${id}`);
  }

  createPop(pop: Partial<Pop>): Observable<Pop> {
    return this.http.post<Pop>(this.apiUrl, pop);
  }

  updatePop(id: number, pop: Partial<Pop>): Observable<Pop> {
    return this.http.put<Pop>(`${this.apiUrl}/${id}`, pop);
  }

  deletePop(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
