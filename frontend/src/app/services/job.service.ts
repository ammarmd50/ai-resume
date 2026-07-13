import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Job } from '../models/types';
import { serverConfig } from '../config/server.config';

@Injectable({
  providedIn: 'root',
})
export class JobService {
  private http = inject(HttpClient);

  private jobsUrl = `${serverConfig.url}/jobs`;
  private aiUrl = `${serverConfig.url}/ai`;

  getJobs(
    filters: {
      search?: string;
      location?: string;
      skills?: string;
      experience?: string;
      employmentType?: string;
      workMode?: string;
      sortBy?: string;
    } = {},
  ): Observable<{ success: boolean; count: number; jobs: Job[] }> {
    let params = new HttpParams();

    // Map filters to query parameters
    Object.keys(filters).forEach((key) => {
      const val = filters[key as keyof typeof filters];
      if (val) {
        params = params.set(key, val);
      }
    });

    return this.http.get<any>(this.jobsUrl, { params });
  }

  create(jobData: Partial<Job>): Observable<{ success: boolean; job: Job }> {
    return this.http.post<any>(this.jobsUrl, jobData);
  }

  update(id: string, jobData: Partial<Job>): Observable<{ success: boolean; job: Job }> {
    return this.http.put<any>(`${this.jobsUrl}/${id}`, jobData);
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<any>(`${this.jobsUrl}/${id}`);
  }

  matchJobsExplicit(): Observable<{ success: boolean; matches: any[] }> {
    return this.http.post<any>(`${this.aiUrl}/match-jobs`, {});
  }
}
