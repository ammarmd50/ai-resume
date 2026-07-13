import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Resume } from '../models/types';
import { serverConfig } from '../config/server.config';

@Injectable({
  providedIn: 'root',
})
export class ResumeService {
  private http = inject(HttpClient);

  private resumeUrl = `${serverConfig.url}/resume`;
  private aiUrl = `${serverConfig.url}/ai`;

  upload(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('resume', file);
    return this.http.post<any>(`${this.resumeUrl}/upload`, formData);
  }

  get(): Observable<{ success: boolean; resume: Resume | null }> {
    return this.http.get<any>(this.resumeUrl);
  }

  update(resumeFields: Partial<Resume>): Observable<any> {
    return this.http.put<any>(this.resumeUrl, resumeFields);
  }

  delete(): Observable<any> {
    return this.http.delete<any>(this.resumeUrl);
  }

  improveSummary(
    summary: string,
  ): Observable<{ success: boolean; original: string; improved: string }> {
    return this.http.post<any>(`${this.aiUrl}/improve-summary`, { summary });
  }

  analyzeText(text: string): Observable<{ success: boolean; resume: Resume }> {
    return this.http.post<any>(`${this.aiUrl}/analyze-resume`, { text });
  }
}
