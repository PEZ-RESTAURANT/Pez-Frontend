import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { APP_SETTINGS } from '../config/app.settings';
import { throwError } from 'rxjs';

export abstract class BaseApiService {
  protected http = inject(HttpClient);
  protected baseUrl = APP_SETTINGS.apiUrl;

  protected handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
