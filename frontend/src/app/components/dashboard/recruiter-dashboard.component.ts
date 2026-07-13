import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobService } from '../../services/job.service';
import { ApplicationService } from '../../services/application.service';
import { Job, Application } from '../../models/types';

@Component({
  selector: 'app-recruiter-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recruiter-dashboard.html',
  styleUrl: './recruiter-dashboard.scss'
})
export class RecruiterDashboardComponent implements OnInit {
  private jobService = inject(JobService);
  private applicationService = inject(ApplicationService);

  jobs = signal<Job[]>([]);
  applications = signal<Application[]>([]);
  isLoading = signal(true);

  // Derived stats
  totalJobs = computed(() => this.jobs().length);
  totalApplications = computed(() => this.applications().length);
  
  interviewCount = computed(() => 
    this.applications().filter(app => app.status === 'Interview').length
  );
  
  selectionCount = computed(() => 
    this.applications().filter(app => app.status === 'Selected').length
  );

  // Aggregated candidates count (unique users who applied)
  totalCandidates = computed(() => {
    const list = this.applications();
    const userIds = new Set(list.map(app => {
      const u = app.userId;
      return typeof u === 'object' ? u._id || u.id : u;
    }));
    return userIds.size;
  });

  // Hiring Funnel percentages
  funnelSteps = computed(() => {
    const list = this.applications();
    const total = list.length || 1;

    const reviewing = list.filter(a => ['Reviewing', 'Interview', 'Selected'].includes(a.status)).length;
    const interviewing = list.filter(a => ['Interview', 'Selected'].includes(a.status)).length;
    const selected = list.filter(a => a.status === 'Selected').length;

    return [
      { name: 'Applied', count: list.length, percent: 100, color: 'var(--primary)' },
      { name: 'Reviewing', count: reviewing, percent: Math.round((reviewing / total) * 100), color: 'var(--accent)' },
      { name: 'Interviewing', count: interviewing, percent: Math.round((interviewing / total) * 100), color: 'var(--warning)' },
      { name: 'Hired', count: selected, percent: Math.round((selected / total) * 100), color: 'var(--success)' }
    ];
  });

  // Chart: Applications per Job (top 3)
  jobChartData = computed(() => {
    const jobsList = this.jobs();
    const appsList = this.applications();

    return jobsList.slice(0, 3).map(job => {
      const count = appsList.filter(app => {
        const jId = typeof app.jobId === 'object' ? app.jobId._id || app.jobId.id : app.jobId;
        return jId === job._id;
      }).length;

      return {
        title: job.title,
        count
      };
    });
  });

  // Recent applications (limit to 5)
  recentApplications = computed(() => {
    return this.applications().slice(0, 5);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Load recruiter jobs (we'll fetch with default search to return recruiter's matches on backend)
    this.jobService.getJobs().subscribe({
      next: (res) => {
        if (res.success) {
          // Filter jobs specifically posted by current recruiter (backend handles it, but let's double check)
          this.jobs.set(res.jobs);
        }
      }
    });

    // Load recruiter applications (handled automatically by backend based on role)
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

  updateStatus(appId: string, status: 'Applied' | 'Reviewing' | 'Interview' | 'Rejected' | 'Selected'): void {
    this.applicationService.updateStatus(appId, status).subscribe({
      next: () => {
        // Update local status optimistically
        this.applications.update(list => 
          list.map(app => app._id === appId ? { ...app, status } : app)
        );
      }
    });
  }

  getUserObject(user: any): { name: string; email: string } {
    if (typeof user === 'object') {
      return { name: user.name, email: user.email };
    }
    return { name: 'Unknown Candidate', email: '' };
  }

  getJobObject(job: any): { title: string; company: string } {
    if (typeof job === 'object') {
      return { title: job.title, company: job.company };
    }
    return { title: 'Unknown Job', company: '' };
  }
}
