import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NotificationService } from '../../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((err) => {
      const apiMessage = err.error?.message || err.error?.errorCode;
      const fallbackMessage = err.message || 'Error inesperado en el servidor';
      const message = typeof err.error === 'string' ? err.error : (apiMessage || fallbackMessage);

      notify.error(message);

      return throwError(() => err);
    })
  );
};
