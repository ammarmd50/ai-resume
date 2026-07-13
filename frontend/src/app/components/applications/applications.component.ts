import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../services/auth.service';
import { Application } from '../../models/types';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './applications.html',
  styleUrl: './applications.scss'
})
export class ApplicationsComponent implements OnInit {
  private applicationService = inject(ApplicationService);
  protected authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  applications = signal<Application[]>([]);
  isLoading = signal(true);

  // Side-drawer detail panel controller
  selectedApp = signal<Application | null>(null);
  isDrawerOpen = signal(false);

  // Lanes divisions based on status
  appliedLanes = computed(() => {
    const list = this.applications();
    return {
      applied: list.filter(a => a.status === 'Applied'),
      reviewing: list.filter(a => a.status === 'Reviewing'),
      interview: list.filter(a => a.status === 'Interview'),
      rejected: list.filter(a => a.status === 'Rejected'),
      selected: list.filter(a => a.status === 'Selected')
    };
  });

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading.set(true);
    this.applicationService.getApplications().subscribe({
      next: (res) => {
        if (res.success) {
          this.applications.set(res.applications);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // RECRUITER ACTION: Drag/Click change stage status
  moveStage(appId: string, status: 'Applied' | 'Reviewing' | 'Interview' | 'Rejected' | 'Selected'): void {
    this.applicationService.updateStatus(appId, status).subscribe({
      next: () => {
        // Update local state signal
        this.applications.update(list => 
          list.map(app => app._id === appId ? { ...app, status } : app)
        );
        
        // Update drawer profile active data if selected
        const currentSelected = this.selectedApp();
        if (currentSelected && currentSelected._id === appId) {
          this.selectedApp.set({ ...currentSelected, status });
        }
        
        this.snackBar.open(`Applicant progressed to ${status}`, 'Close', { duration: 3000 });
      }
    });
  }

  openDrawer(app: Application): void {
    this.selectedApp.set(app);
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.selectedApp.set(null);
  }

  // Model objects helpers
  getUserObject(user: any): { name: string; email: string; phone?: string; location?: string } {
    if (typeof user === 'object') {
      return { 
        name: user.name, 
        email: user.email,
        phone: user.profile?.phone || '',
        location: user.profile?.location || ''
      };
    }
    return { name: 'Unknown Candidate', email: '' };
  }

  getJobObject(job: any): { title: string; company: string; location: string } {
    if (typeof job === 'object') {
      return { title: job.title, company: job.company, location: job.location };
    }
    return { title: 'Unknown Job', company: '', location: '' };
  }
}
