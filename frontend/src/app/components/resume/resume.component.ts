import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResumeService } from '../../services/resume.service';
import { NotificationService } from '../../services/notification.service';
import { Resume } from '../../models/types';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './resume.html',
  styleUrl: './resume.scss'
})
export class ResumeComponent implements OnInit {
  private resumeService = inject(ResumeService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  resume = signal<Resume | null>(null);
  isLoading = signal(true);
  isUploading = signal(false);
  
  // Tabs active panel
  activeTab = signal<'ats' | 'suggestions' | 'cv_enhancer' | 'interview' | 'profile'>('ats');

  // Form for manual edits
  profileForm!: FormGroup;
  isEditing = signal(false);

  // AI Summary Improver
  summaryDraft = signal('');
  isImprovingSummary = signal(false);

  ngOnInit(): void {
    this.loadResume();
  }

  loadResume(): void {
    this.isLoading.set(true);
    this.resumeService.get().subscribe({
      next: (res) => {
        if (res.success && res.resume) {
          this.resume.set(res.resume);
          this.initForm(res.resume);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private initForm(resume: Resume): void {
    this.profileForm = this.fb.group({
      skills: [resume.skills ? resume.skills.join(', ') : ''],
      languages: [resume.languages ? resume.languages.join(', ') : ''],
      aiSummary: [resume.aiSummary || '', [Validators.required]]
    });
    this.summaryDraft.set(resume.aiSummary || '');
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadResume(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadResume(event.dataTransfer.files[0]);
    }
  }

  private uploadResume(file: File): void {
    // Validate type
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      this.snackBar.open('Please upload PDF or DOCX files only', 'Close', { duration: 4000 });
      return;
    }

    this.isUploading.set(true);
    this.resumeService.upload(file).subscribe({
      next: (res) => {
        if (res.success) {
          this.resume.set(res.resume);
          this.initForm(res.resume);
          this.snackBar.open('Resume analyzed successfully!', 'Close', { duration: 3000 });
          // Fetch notifications to load "Resume parsed" notification
          this.notificationService.fetch().subscribe();
        }
        this.isUploading.set(false);
      },
      error: (err) => {
        this.isUploading.set(false);
        this.snackBar.open(err.error?.message || 'Failed to analyze resume', 'Close', { duration: 5000 });
      }
    });
  }

  toggleEditMode(): void {
    this.isEditing.update(val => !val);
  }

  saveProfileChanges(): void {
    if (this.profileForm.invalid) return;

    this.isLoading.set(true);
    const formVals = this.profileForm.value;
    
    // Split skills & languages
    const skills = formVals.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    const languages = formVals.languages.split(',').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    
    const updateData: Partial<Resume> = {
      skills,
      languages,
      aiSummary: formVals.aiSummary
    };

    this.resumeService.update(updateData).subscribe({
      next: (res) => {
        if (res.success) {
          this.resume.set(res.resume);
          this.isEditing.set(false);
          this.snackBar.open('Resume profile updated', 'Close', { duration: 3000 });
          this.notificationService.fetch().subscribe();
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to save manual modifications', 'Close', { duration: 4000 });
      }
    });
  }

  improveSummaryAI(): void {
    const draft = this.profileForm.get('aiSummary')?.value || this.summaryDraft();
    if (!draft.trim()) return;

    this.isImprovingSummary.set(true);
    this.resumeService.improveSummary(draft).subscribe({
      next: (res) => {
        if (res.success) {
          this.profileForm.patchValue({ aiSummary: res.improved });
          this.summaryDraft.set(res.improved);
          this.snackBar.open('Summary optimized by AI!', 'Close', { duration: 3000 });
        }
        this.isImprovingSummary.set(false);
      },
      error: () => {
        this.isImprovingSummary.set(false);
        this.snackBar.open('AI enhancement failed', 'Close', { duration: 4000 });
      }
    });
  }

  deleteResume(): void {
    if (confirm('Are you sure you want to delete your active resume? This will wipe your parsed profile.')) {
      this.isLoading.set(true);
      this.resumeService.delete().subscribe({
        next: () => {
          this.resume.set(null);
          this.isLoading.set(false);
          this.snackBar.open('Resume deleted successfully', 'Close', { duration: 3000 });
        },
        error: () => {
          this.isLoading.set(false);
          this.snackBar.open('Delete failed', 'Close', { duration: 4000 });
        }
      });
    }
  }

  setTab(tab: 'ats' | 'suggestions' | 'cv_enhancer' | 'interview' | 'profile'): void {
    this.activeTab.set(tab);
  }
}
