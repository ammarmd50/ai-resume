import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth.component';
import { MainLayoutComponent } from './components/layouts/main-layout.component';
import { CandidateDashboardComponent } from './components/dashboard/candidate-dashboard.component';
import { RecruiterDashboardComponent } from './components/dashboard/recruiter-dashboard.component';
import { ResumeComponent } from './components/resume/resume.component';
import { JobsComponent } from './components/jobs/jobs.component';
import { ApplicationsComponent } from './components/applications/applications.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: AuthComponent },
  { path: 'register', component: AuthComponent },
  {
    path: 'candidate',
    component: MainLayoutComponent,
    canActivate: [authGuard, roleGuard('candidate')],
    children: [
      { path: 'dashboard', component: CandidateDashboardComponent },
      { path: 'resume', component: ResumeComponent },
      { path: 'jobs', component: JobsComponent },
      { path: 'applications', component: ApplicationsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'recruiter',
    component: MainLayoutComponent,
    canActivate: [authGuard, roleGuard('recruiter')],
    children: [
      { path: 'dashboard', component: RecruiterDashboardComponent },
      { path: 'jobs', component: JobsComponent },
      { path: 'applications', component: ApplicationsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
