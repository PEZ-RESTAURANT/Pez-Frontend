import { Component, inject, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionService } from '../../core/auth/services/session.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { RealtimeService } from '../../core/realtime/services/realtime.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent],
  template: `
    <header class="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-foreground flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
      <div class="flex items-center gap-3">
        <!-- Hamburger Button for Mobile -->
        <button 
          (click)="toggleMobileMenu.emit()"
          class="md:hidden p-2 rounded-lg hover:bg-gray-150 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer border-none flex items-center justify-center bg-transparent"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div class="flex items-center gap-1.5">
          <h1 class="text-base sm:text-lg font-black text-gray-900 dark:text-white">Al Toque</h1>
          @if (sessionService.restaurantName$(); as name) {
            <span class="text-xs font-semibold text-gray-400 dark:text-gray-500">· {{ name }}</span>
          }
        </div>
      </div>

      <div class="flex items-center gap-4">
        <app-theme-toggle></app-theme-toggle>

        @if (sessionService.currentUser$(); as user) {
          <div class="flex items-center gap-3">
            <div class="flex flex-col text-right hidden sm:flex">
              <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ user.firstName }} {{ user.lastName }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{ user.roles.join(', ') }}</span>
            </div>
            <button
              (click)="logout()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20 text-sm font-medium transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Salir</span>
            </button>
          </div>
        }
      </div>
    </header>
  `
})
export class TopbarComponent implements OnInit, OnDestroy {
  public sessionService = inject(SessionService);
  private router = inject(Router);
  private realtime = inject(RealtimeService);
  private notify = inject(NotificationService);

  private alertsSub?: Subscription;

  @Output() toggleMobileMenu = new EventEmitter<void>();

  ngOnInit(): void {
    const restaurantId = this.sessionService.getRestaurantId();
    if (restaurantId) {
      this.alertsSub = this.realtime.subscribeToAlerts(restaurantId).subscribe({
        next: (event) => {
          if (event && event.eventType === 'AttendanceRecorded') {
            const checkType = event.payload.checkIn ? 'ENTRADA' : 'SALIDA';
            this.notify.success(`Asistencia: ¡Huella confirmada! Registró marcaje de ${checkType}.`);
          } else if (event && event.eventType === 'UnmappedFingerprintEventOccurred') {
            this.notify.warning(`Huella no reconocida — ID ${event.payload.deviceUserId} marcó asistencia, vincúlala a un trabajador.`);
          } else if (event && event.eventType === 'UnresolvedAttendanceDetected') {
            const currentUser = this.sessionService.currentUser$();
            if (currentUser && currentUser.roles) {
              const notifiedRoles: string[] = event.payload.notifiedRoles || [];
              const matches = currentUser.roles.some((r: string) => notifiedRoles.includes(r.toUpperCase()));
              if (matches) {
                this.notify.warning(
                  'Se detectaron asistencias sin salida al cerrar turno. Haz clic aquí para resolverlas.',
                  '/app/staff/attendance/unresolved',
                  'Resolver'
                );
              }
            }
          }
        },
        error: (err) => {
          console.error('Error on global alerts WebSocket subscription:', err);
        }
      });
    }
  }

  logout(): void {
    this.sessionService.clearSession();
    window.location.href = '/auth/login';
  }

  ngOnDestroy(): void {
    if (this.alertsSub) {
      this.alertsSub.unsubscribe();
    }
  }
}
