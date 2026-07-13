import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatSnackBarModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class AuthComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  authForm!: FormGroup;
  isLoginMode = signal(true);
  isLoading = signal(false);

  ngOnInit(): void {
    // Check path to set mode (login or register)
    this.route.url.subscribe(url => {
      const path = url[0]?.path;
      this.isLoginMode.set(path === 'login');
      this.initForm();
    });
  }

  private initForm(): void {
    if (this.isLoginMode()) {
      this.authForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    } else {
      this.authForm = this.fb.group({
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        role: ['candidate', [Validators.required]]
      });
    }
  }

  onSubmit(): void {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { name, email, password, role } = this.authForm.value;

    if (this.isLoginMode()) {
      this.authService.login(email, password).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.snackBar.open('Welcome back!', 'Close', { duration: 3000 });
          this.redirectUser(res.user.role);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackBar.open(err.error?.message || 'Login failed', 'Close', { duration: 4000 });
        }
      });
    } else {
      this.authService.register(name, email, password, role).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.snackBar.open('Registration successful!', 'Close', { duration: 3000 });
          this.redirectUser(res.user.role);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackBar.open(err.error?.message || 'Registration failed', 'Close', { duration: 4000 });
        }
      });
    }
  }

  private redirectUser(role: 'candidate' | 'recruiter'): void {
    if (role === 'recruiter') {
      this.router.navigate(['/recruiter/dashboard']);
    } else {
      this.router.navigate(['/candidate/dashboard']);
    }
  }
}
