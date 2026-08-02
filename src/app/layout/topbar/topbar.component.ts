import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '../../core/auth/services/session.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent],
  template: `
    <header class="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-foreground flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Panel de Control</h1>
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
export class TopbarComponent {
  public sessionService = inject(SessionService);
  private router = inject(Router);

  logout(): void {
    this.sessionService.clearSession();
    this.router.navigate(['/auth/login']);
  }
}
