import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobService } from '../../services/job.service';
import { AuthService } from '../../services/auth.service';
import { ApplicationService } from '../../services/application.service';
import { Job } from '../../models/types';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './jobs.html',
  styleUrl: './jobs.scss'
})
export class JobsComponent implements OnInit {
  protected jobService = inject(JobService);
  protected authService = inject(AuthService);
  private applicationService = inject(ApplicationService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  jobs = signal<Job[]>([]);
  isLoading = signal(true);

  // Search & Filter controls
  searchQuery = signal('');
  locationFilter = signal('');
  modeFilter = signal('');
  typeFilter = signal('');
  sortBy = signal('newest');

  // Form & modal controllers for Recruiters to create/edit jobs
  jobForm!: FormGroup;
  isFormOpen = signal(false);
  isEditing = signal(false);
  selectedJobId = signal<string | null>(null);

  // Form & modal controllers for Candidates to apply
  isApplyOpen = signal(false);
  applyJobId = signal<string | null>(null);
  applyJobTitle = signal('');
  coverLetterInput = signal('');

  ngOnInit(): void {
    this.initJobForm();
    this.loadJobs();
  }

  private initJobForm(): void {
    this.jobForm = this.fb.group({
      title: ['', [Validators.required]],
      company: ['', [Validators.required]],
      location: ['', [Validators.required]],
      skills: ['', [Validators.required]],
      salary: [''],
      experience: [''],
      employmentType: ['Full-time', [Validators.required]],
      workMode: ['Onsite', [Validators.required]],
      description: ['', [Validators.required]]
    });
  }

  loadJobs(): void {
    this.isLoading.set(true);
    const filters = {
      search: this.searchQuery(),
      location: this.locationFilter(),
      employmentType: this.typeFilter(),
      workMode: this.modeFilter(),
      sortBy: this.sortBy()
    };

    this.jobService.getJobs(filters).subscribe({
      next: (res) => {
        if (res.success) {
          // If recruiter, only show jobs created by them
          if (this.authService.isRecruiter()) {
            const recruiterId = this.authService.currentUser()?._id || this.authService.currentUser()?.id;
            this.jobs.set(res.jobs.filter(j => j.recruiterId === recruiterId));
          } else {
            this.jobs.set(res.jobs);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.loadJobs();
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.locationFilter.set('');
    this.modeFilter.set('');
    this.typeFilter.set('');
    this.sortBy.set('newest');
    this.loadJobs();
  }

  // RECRUITER CRUD ACTIONS
  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedJobId.set(null);
    this.jobForm.reset({
      employmentType: 'Full-time',
      workMode: 'Onsite'
    });
    this.isFormOpen.set(true);
  }

  openEditModal(job: Job): void {
    this.isEditing.set(true);
    this.selectedJobId.set(job._id || job.id || null);
    this.jobForm.patchValue({
      title: job.title,
      company: job.company,
      location: job.location,
      skills: job.skills ? job.skills.join(', ') : '',
      salary: job.salary,
      experience: job.experience,
      employmentType: job.employmentType,
      workMode: job.workMode,
      description: job.description
    });
    this.isFormOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormOpen.set(false);
  }

  onSubmitJob(): void {
    if (this.jobForm.invalid) return;

    this.isLoading.set(true);
    const formVals = this.jobForm.value;

    const jobData: Partial<Job> = {
      title: formVals.title,
      company: formVals.company,
      location: formVals.location,
      skills: formVals.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0),
      salary: formVals.salary,
      experience: formVals.experience,
      employmentType: formVals.employmentType,
      workMode: formVals.workMode,
      description: formVals.description
    };

    if (this.isEditing() && this.selectedJobId()) {
      this.jobService.update(this.selectedJobId()!, jobData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isFormOpen.set(false);
          this.snackBar.open('Job listing updated successfully', 'Close', { duration: 3000 });
          this.loadJobs();
        },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.jobService.create(jobData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isFormOpen.set(false);
          this.snackBar.open('New Job posted successfully', 'Close', { duration: 3000 });
          this.loadJobs();
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  onDeleteJob(id: string): void {
    if (confirm('Are you sure you want to delete this job posting? This cannot be undone.')) {
      this.jobService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Job listing deleted', 'Close', { duration: 3000 });
          this.loadJobs();
        }
      });
    }
  }

  // CANDIDATE APPLY ACTIONS
  openApplyModal(job: Job): void {
    this.applyJobId.set(job._id || job.id || null);
    this.applyJobTitle.set(job.title);
    this.coverLetterInput.set('');
    this.isApplyOpen.set(true);
  }

  closeApplyModal(): void {
    this.isApplyOpen.set(false);
  }

  onSubmitApplication(): void {
    if (!this.applyJobId()) return;

    this.isLoading.set(true);
    this.applicationService.apply(this.applyJobId()!, this.coverLetterInput()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isApplyOpen.set(false);
        this.snackBar.open('Application submitted successfully!', 'Close', { duration: 3000 });
        this.loadJobs();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open(err.error?.message || 'Failed to submit application', 'Close', { duration: 4000 });
      }
    });
  }
}
