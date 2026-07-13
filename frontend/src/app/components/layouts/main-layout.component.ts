import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent implements OnInit {
  protected authService = inject(AuthService);
  protected notificationService = inject(NotificationService);
  private router = inject(Router);

  isSidebarExpanded = signal(true);
  isNotificationDropdownOpen = signal(false);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.notificationService.fetch().subscribe();
    }
  }

  toggleSidebar(): void {
    this.isSidebarExpanded.update(val => !val);
  }

  toggleNotificationDropdown(event: Event): void {
    event.stopPropagation();
    this.isNotificationDropdownOpen.update(val => !val);
  }

  closeNotificationDropdown(): void {
    this.isNotificationDropdownOpen.set(false);
  }

  markAsRead(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
