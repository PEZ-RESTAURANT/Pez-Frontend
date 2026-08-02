import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../../core/auth/services/session.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
      @if (sessionService.currentUser$(); as user) {
        <h2 class="text-2xl font-bold mb-2">¡Bienvenido, {{ user.firstName }}!</h2>
        <p class="text-gray-500">Has ingresado exitosamente al sistema de gestión de PEZ.</p>
        
        <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm">
          <strong>Tus roles asignados:</strong> <span class="capitalize">{{ user.roles.join(', ') }}</span>
        </div>
      } @else {
        <h2 class="text-2xl font-bold mb-2">Dashboard Principal</h2>
        <p class="text-gray-500">Cargando información de tu sesión...</p>
      }
    </div>
  `
})
export class DashboardPageComponent {
  public sessionService = inject(SessionService);
}
