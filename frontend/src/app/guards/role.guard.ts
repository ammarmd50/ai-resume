import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (expectedRole: 'candidate' | 'recruiter'): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser();

    if (user && user.role === expectedRole) {
      return true;
    }

    // Redirect to default dashboard based on their actual role, or to login
    if (user) {
      router.navigate([user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard']);
    } else {
      router.navigate(['/login']);
    }
    return false;
  };
};
