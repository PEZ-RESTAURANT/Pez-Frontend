import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { NotificationService } from '../../services/notification.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export const permissionGuard: CanActivateFn = (route) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const notifier = inject(NotificationService);

  const requiredPermission = route.data?.['permission'] as string | undefined;

  if (!requiredPermission) {
    return of(true);
  }

  return permissionService.checkPermission(requiredPermission).pipe(
    map((hasPerm) => {
      if (hasPerm) {
        return true;
      }
      notifier.error('No tienes permiso para acceder a esta sección.');
      return router.createUrlTree(['/app/dashboard']);
    })
  );
};
