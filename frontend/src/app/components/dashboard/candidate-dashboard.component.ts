import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResumeService } from '../../services/resume.service';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../services/auth.service';
import { Resume, Application } from '../../models/types';

@Component({
  selector: 'app-candidate-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './candidate-dashboard.html',
  styleUrl: './candidate-dashboard.scss'
})
export class CandidateDashboardComponent implements OnInit {
  private resumeService = inject(ResumeService);
  private applicationService = inject(ApplicationService);
  protected authService = inject(AuthService);

  resume = signal<Resume | null>(null);
  applications = signal<Application[]>([]);
  isLoading = signal(true);

  // Derived stats
  atsScore = computed(() => this.resume()?.atsScore || 0);
  skillsCount = computed(() => this.resume()?.skills?.length || 0);
  totalApps = computed(() => this.applications().length);
  savedJobsCount = computed(() => 2); // Hardcoded mock helper
  
  interviewCalls = computed(() => 
    this.applications().filter(app => app.status === 'Interview').length
  );

  // Status distribution for SVG donut chart calculations
  statusStats = computed(() => {
    const list = this.applications();
    const stats = { applied: 0, reviewing: 0, interview: 0, rejected: 0, selected: 0 };
    list.forEach(app => {
      const status = app.status.toLowerCase();
      if (status in stats) {
        stats[status as keyof typeof stats]++;
      }
    });
    return stats;
  });

  // Pure SVG Donut Chart slices calculation
  donutSlices = computed(() => {
    const stats = this.statusStats();
    const total = this.totalApps() || 1; // Prevent division by zero
    
    let accumulatedPercent = 0;
    const slices = [];
    const colors = {
      applied: '#6366f1',  // Indigo
      reviewing: '#06b6d4', // Cyan
      interview: '#f59e0b', // Amber
      selected: '#10b981',  // Emerald
      rejected: '#ef4444'   // Red
    };

    for (const [key, val] of Object.entries(stats)) {
      const percentage = (val / total) * 100;
      if (percentage > 0) {
        const strokeDashArray = `${percentage} ${100 - percentage}`;
        const strokeDashOffset = -accumulatedPercent;
        
        slices.push({
          label: key.toUpperCase(),
          value: val,
          color: colors[key as keyof typeof colors],
          dashArray: strokeDashArray,
          dashOffset: strokeDashOffset
        });
        
        accumulatedPercent += percentage;
      }
    }
    
    // Provide default slice if no applications
    if (slices.length === 0) {
      slices.push({
        label: 'NO APPLICATIONS',
        value: 0,
        color: '#334155', // Grey placeholder
        dashArray: '100 0',
        dashOffset: 0
      });
    }

    return slices;
  });

  // Top 5 Skills with rating scores based on presence
  skillsChartData = computed(() => {
    const resume = this.resume();
    if (!resume) return [];
    
    const detected = resume.analysis?.detectedSkills || resume.skills || [];
    const strong = resume.analysis?.strongSkills || [];
    
    return detected.slice(0, 5).map((skill, index) => {
      // Logic: Strong skills get 90-95%, others get 70-80%
      const isStrong = strong.some(s => s.toLowerCase().includes(skill.toLowerCase()));
      const percentage = isStrong ? 92 - index * 2 : 75 - index * 4;
      return {
        name: skill,
        value: percentage
      };
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    // Fetch resume
    this.resumeService.get().subscribe({
      next: (res) => {
        if (res.success && res.resume) {
          this.resume.set(res.resume);
        }
      },
      error: () => this.isLoading.set(false)
    });

    // Fetch applications
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
}
