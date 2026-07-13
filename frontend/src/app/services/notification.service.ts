import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Notification } from '../models/types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = 'http://localhost:5000/api/notifications';

  // Signals State
  notifications = signal<Notification[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  constructor() {
    // Automatically poll notifications every 30 seconds if authenticated
    setInterval(() => {
      if (this.authService.isAuthenticated()) {
        this.fetch().subscribe();
      }
    }, 30000);
  }

  fetch(): Observable<{ success: boolean; count: number; notifications: Notification[] }> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap(res => {
        if (res.success) {
          this.notifications.set(res.notifications);
        }
      })
    );
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, {}).pipe(
      tap(() => {
        // Optimistic state update
        this.notifications.update(list => 
          list.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put<any>(this.apiUrl, {}).pipe(
      tap(() => {
        // Optimistic state update
        this.notifications.update(list => 
          list.map(n => ({ ...n, isRead: true }))
        );
      })
    );
  }
}
