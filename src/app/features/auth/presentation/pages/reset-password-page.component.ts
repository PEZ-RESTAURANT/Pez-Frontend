import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../infrastructure/api/auth.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { InputDirective } from '../../../../shared/ui/input/input.directive';
import { ButtonDirective } from '../../../../shared/ui/button/button.directive';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InputDirective, ButtonDirective],
  template: `
    <div class="space-y-6">
      <div class="text-center space-y-2">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">Establecer contraseña</h2>
        <p class="text-sm text-gray-500">Crea una nueva contraseña segura para tu cuenta</p>
      </div>

      @if (resetSuccess()) {
        <div class="p-4 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 rounded-lg text-sm font-semibold space-y-4">
          <p>¡Contraseña actualizada exitosamente!</p>
          <button
            (click)="goToLogin()"
            appButton
            userClass="w-full mt-2"
          >
            Ir al inicio de sesión
          </button>
        </div>
      } @else if (tokenError()) {
        <div class="p-4 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 rounded-lg text-sm font-semibold space-y-4">
          <p>{{ errorMessage() }}</p>
          <a
            routerLink="/auth/forgot-password"
            class="block text-center text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold transition-all"
          >
            Solicitar un nuevo enlace
          </a>
        </div>
      } @else {
        <form (submit)="onSubmit($event)" class="space-y-4">
          <div class="space-y-1.5">
            <label for="password" class="text-sm font-semibold text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              [(ngModel)]="password"
              appInput
              placeholder="Nueva contraseña (min. 6 caracteres)"
              required
              minlength="6"
              autocomplete="new-password"
            />
          </div>

          <div class="space-y-1.5">
            <label for="confirmPassword" class="text-sm font-semibold text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              [(ngModel)]="confirmPassword"
              appInput
              placeholder="Confirma tu nueva contraseña"
              required
              autocomplete="new-password"
            />
            <div *ngIf="password && confirmPassword && password !== confirmPassword" class="text-xs text-red-600 font-bold mt-1">
              * Las contraseñas no coinciden.
            </div>
          </div>

          <button
            type="submit"
            appButton
            userClass="w-full mt-2"
            [disabled]="loading()"
          >
            {{ loading() ? 'Actualizando contraseña...' : 'Actualizar contraseña' }}
          </button>
        </form>
      }

      <div class="text-center">
        <a
          routerLink="/auth/login"
          class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold transition-all cursor-pointer inline-flex items-center gap-1"
        >
          Volver a iniciar sesión
        </a>
      </div>
    </div>
  `
})
export class ResetPasswordPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authApi = inject(AuthApi);
  private notifier = inject(NotificationService);

  token = '';
  password = '';
  confirmPassword = '';
  loading = signal<boolean>(false);
  resetSuccess = signal<boolean>(false);
  tokenError = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    // Leer token de query string
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';

      if (!this.token) {
        this.notifier.warning('El enlace de recuperación es inválido o no contiene un token.');
        this.router.navigate(['/auth/forgot-password']);
      }
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.password || !this.confirmPassword || !this.token) return;

    if (this.password !== this.confirmPassword) {
      this.notifier.error('Las contraseñas no coinciden. Por favor verifique.');
      return;
    }

    if (this.password.length < 6) {
      this.notifier.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.loading.set(true);
    this.authApi.resetPassword(this.token, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.resetSuccess.set(true);
        this.notifier.success('Contraseña actualizada con éxito.');
      },
      error: (err) => {
        this.loading.set(false);
        this.tokenError.set(true);
        this.errorMessage.set(err.error?.message || 'El enlace de recuperación es inválido o ha expirado.');
        this.notifier.error(this.errorMessage());
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
