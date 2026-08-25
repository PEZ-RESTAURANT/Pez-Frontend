import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      @for (toast of notificationService.toasts$(); track toast.id) {
        <div
          class="flex items-center justify-between gap-3 p-4 rounded-lg border shadow-lg pointer-events-auto transition-all duration-300 transform translate-y-0 scale-100 animate-in slide-in-from-right-5"
          [class.bg-green-50]="toast.type === 'success'"
          [class.text-green-800]="toast.type === 'success'"
          [class.border-green-200]="toast.type === 'success'"
          [class.bg-red-50]="toast.type === 'error'"
          [class.text-red-800]="toast.type === 'error'"
          [class.border-red-200]="toast.type === 'error'"
          [class.bg-blue-50]="toast.type === 'info'"
          [class.text-blue-800]="toast.type === 'info'"
          [class.border-blue-200]="toast.type === 'info'"
          [class.bg-amber-50]="toast.type === 'warning'"
          [class.text-amber-800]="toast.type === 'warning'"
          [class.border-amber-200]="toast.type === 'warning'"
          role="alert"
        >
          <div class="flex items-center gap-2 flex-1">
            @if (toast.type === 'success') {
              <svg class="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            } @else if (toast.type === 'error') {
              <svg class="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            } @else if (toast.type === 'warning') {
              <svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            } @else {
              <svg class="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium">{{ toast.message }}</span>
              @if (toast.actionRoute) {
                <button
                  type="button"
                  (click)="navigate(toast.actionRoute, toast.id)"
                  class="self-start text-xs font-bold underline text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                >
                  {{ toast.actionLabel || 'Resolver aquí' }}
                </button>
              }
            </div>
          </div>

          <button
            type="button"
            (click)="notificationService.dismiss(toast.id)"
            class="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded cursor-pointer self-start"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span class="sr-only">Cerrar</span>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  public notificationService = inject(NotificationService);
  private router = inject(Router);

  navigate(route: string, id: number): void {
    this.router.navigate([route]);
    this.notificationService.dismiss(id);
  }
}
