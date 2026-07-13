import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User } from '../models/types';
import { serverConfig } from '../config/server.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = `${serverConfig.url}/auth`;

  // Reactive Signals State
  currentUser = signal<User | null>(null);
  token = signal<string | null>(null);

  isAuthenticated = computed(() => !!this.token());
  isCandidate = computed(() => this.currentUser()?.role === 'candidate');
  isRecruiter = computed(() => this.currentUser()?.role === 'recruiter');

  constructor() {
    // Rehydrate state from localStorage on init
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      this.token.set(storedToken);
      this.currentUser.set(JSON.parse(storedUser));
      this.loadUserProfile().subscribe({
        error: () => this.logout(), // Logout if token is invalid or expired
      });
    }
  }

  register(
    name: string,
    email: string,
    password: string,
    role: 'candidate' | 'recruiter',
  ): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/register`, { name, email, password, role })
      .pipe(tap((res) => this.handleAuthentication(res.token, res.user)));
  }

  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap((res) => this.handleAuthentication(res.token, res.user)));
  }

  loadUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      tap((res) => {
        if (res.success) {
          this.currentUser.set(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      }),
    );
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  private handleAuthentication(token: string, user: User): void {
    this.token.set(token);
    this.currentUser.set(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}
