import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { APP_SETTINGS } from '../config/app.settings';
import { throwError } from 'rxjs';

/**
 * Clase base para todos los servicios de API del frontend.
 * Centraliza el prefijo de versión de la API ('/api/v1'). Ningún servicio de feature
 * ni archivo individual debe concatenar '/api/v1' a mano. Las configuraciones de
 * entornos (environment) definen solo la URL raíz del servidor.
 */
export abstract class BaseApiService {
  protected http = inject(HttpClient);
  protected baseUrl = `${APP_SETTINGS.apiUrl}/api/v1`;

  protected handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
