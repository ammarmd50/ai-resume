import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Application } from '../models/types';
import { serverConfig } from '../config/server.config';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private http = inject(HttpClient);

  private apiUrl = `${serverConfig.url}/applications`;

  apply(jobId: string, coverLetter?: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { jobId, coverLetter });
  }

  getApplications(): Observable<{ success: boolean; count: number; applications: Application[] }> {
    return this.http.get<any>(this.apiUrl);
  }

  updateStatus(id: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { status });
  }
}
