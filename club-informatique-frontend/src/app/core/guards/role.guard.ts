import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const tokenService = inject(TokenService);
    const router = inject(Router);

    if (!tokenService.isAuthenticated()) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (tokenService.hasAnyRole(allowedRoles)) {
      return true;
    }

    router.navigate(['/acces-refuse']);
    return false;
  };
};
