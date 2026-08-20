import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApi } from '../../infrastructure/api/auth.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { InputDirective } from '../../../../shared/ui/input/input.directive';
import { ButtonDirective } from '../../../../shared/ui/button/button.directive';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InputDirective, ButtonDirective],
  template: `
    <div class="space-y-6">
      <div class="text-center space-y-2">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">Recuperar contraseña</h2>
        <p class="text-sm text-gray-500">Ingresa tu correo para recibir las instrucciones</p>
      </div>

      @if (submitted()) {
        <div class="p-4 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 rounded-lg text-sm font-semibold space-y-3">
          <p>{{ statusMessage() }}</p>
          <p class="text-xs text-gray-500 font-normal">Revisa tu bandeja de entrada o la consola del servidor si estás en desarrollo.</p>
        </div>
      } @else {
        <form (submit)="onSubmit($event)" class="space-y-4">
          <div class="space-y-1.5">
            <label for="email" class="text-sm font-semibold text-gray-700 dark:text-gray-300">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              name="email"
              [(ngModel)]="email"
              appInput
              placeholder="empleado@pez.com"
              required
              autocomplete="email"
            />
          </div>

          <button
            type="submit"
            appButton
            userClass="w-full mt-2"
            [disabled]="loading()"
          >
            {{ loading() ? 'Enviando instrucciones...' : 'Enviar instrucciones' }}
          </button>
        </form>
      }

      <div class="text-center">
        <a
          routerLink="/auth/login"
          class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold transition-all cursor-pointer inline-flex items-center gap-1"
        >
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a iniciar sesión
        </a>
      </div>
    </div>
  `
})
export class ForgotPasswordPageComponent {
  private authApi = inject(AuthApi);
  private notifier = inject(NotificationService);

  email = '';
  loading = signal<boolean>(false);
  submitted = signal<boolean>(false);
  statusMessage = signal<string>('');

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.email) return;

    this.loading.set(true);
    this.authApi.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.submitted.set(true);
        this.statusMessage.set(res.message);
        this.notifier.success('Instrucciones enviadas correctamente.');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Ocurrió un error al procesar tu solicitud.';
        this.notifier.error(msg);
      }
    });
  }
}
