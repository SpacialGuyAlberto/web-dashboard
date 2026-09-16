import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cluster } from './cluster.model';

@Injectable({
  providedIn: 'root'
})
export class ClusterService {
  private apiUrl = 'http://localhost:8080/api/clusters';

  constructor(private http: HttpClient) {}

  getClustersByProjectId(projectId: number): Observable<Cluster[]> {
    return this.http.get<Cluster[]>(`${this.apiUrl}/project/${projectId}`);
  }

  getCluster(id: number): Observable<Cluster> {
    return this.http.get<Cluster>(`${this.apiUrl}/${id}`);
  }

  createCluster(cluster: Partial<Cluster>): Observable<Cluster> {
    return this.http.post<Cluster>(this.apiUrl, cluster);
  }

  updateCluster(id: number, cluster: Partial<Cluster>): Observable<Cluster> {
    return this.http.put<Cluster>(`${this.apiUrl}/${id}`, cluster);
  }

  deleteCluster(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
