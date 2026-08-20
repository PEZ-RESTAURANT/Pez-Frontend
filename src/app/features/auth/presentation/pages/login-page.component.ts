import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../infrastructure/api/auth.api';
import { SessionService } from '../../../../core/auth/services/session.service';
import { PermissionService } from '../../../../core/auth/services/permission.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { InputDirective } from '../../../../shared/ui/input/input.directive';
import { ButtonDirective } from '../../../../shared/ui/button/button.directive';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, InputDirective, ButtonDirective, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="text-center space-y-2">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">Ingresar a Al Toque</h2>
        <p class="text-sm text-gray-500">Inicia sesión con tu cuenta de empleado</p>
      </div>

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

        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <label for="password" class="text-sm font-semibold text-gray-700 dark:text-gray-300">Contraseña</label>
            <a
              routerLink="/auth/forgot-password"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold transition-all cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <input
            id="password"
            type="password"
            name="password"
            [(ngModel)]="password"
            appInput
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <button
          type="submit"
          appButton
          userClass="w-full mt-2"
          [disabled]="loading()"
        >
          {{ loading() ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>
    </div>
  `
})
export class LoginPageComponent {
  private authApi = inject(AuthApi);
  private session = inject(SessionService);
  private permission = inject(PermissionService);
  private router = inject(Router);
  private notifier = inject(NotificationService);
 
  email = '';
  password = '';
  loading = signal<boolean>(false);
 
  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.email || !this.password) return;
 
    this.loading.set(true);
    this.authApi.signIn(this.email, this.password).subscribe({
      next: (res) => {
        this.session.saveSession(res.token, res.user);
 
        this.permission.loadPermissions().subscribe({
          next: () => {
            this.loading.set(false);
            this.notifier.success('¡Sesión iniciada con éxito!');
            this.router.navigate(['/app/dashboard']);
          },
          error: () => {
            this.loading.set(false);
            this.notifier.error('No se pudieron cargar los permisos del usuario.');
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Correo o contraseña incorrectos. Por favor, intente de nuevo.';
        this.notifier.error(msg);
      }
    });
  }
}
