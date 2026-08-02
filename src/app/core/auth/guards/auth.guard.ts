import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isAuthenticated$() && !session.isTokenExpired()) {
    return true;
  }

  session.clearSession();
  return router.createUrlTree(['/auth/login']);
};
