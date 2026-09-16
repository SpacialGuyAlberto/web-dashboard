import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Netzverteiler } from './netzverteiler.model';

@Injectable({
  providedIn: 'root'
})
export class NetzverteilerService {
  private apiUrl = 'http://localhost:8080/api/netzverteilers';

  constructor(private http: HttpClient) {}

  getAllNetzverteilers(): Observable<Netzverteiler[]> {
    return this.http.get<Netzverteiler[]>(this.apiUrl);
  }

  getNetzverteiler(id: number): Observable<Netzverteiler> {
    return this.http.get<Netzverteiler>(`${this.apiUrl}/${id}`);
  }

  createNetzverteiler(nvt: Partial<Netzverteiler>): Observable<Netzverteiler> {
    return this.http.post<Netzverteiler>(this.apiUrl, nvt);
  }

  updateNetzverteiler(id: number, nvt: Partial<Netzverteiler>): Observable<Netzverteiler> {
    return this.http.put<Netzverteiler>(`${this.apiUrl}/${id}`, nvt);
  }

  deleteNetzverteiler(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
