import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../infrastructure/api/auth.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { InputDirective } from '../../../../shared/ui/input/input.directive';
import { ButtonDirective } from '../../../../shared/ui/button/button.directive';

@Component({
  selector: 'app-register-restaurant-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InputDirective, ButtonDirective],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      
      <!-- Top header / logo -->
      <div class="mb-6 flex flex-col items-center gap-2">
        <div class="bg-blue-600 dark:bg-blue-500 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/30">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </div>
        <span class="text-xl font-black text-gray-900 dark:text-white">Al Toque</span>
      </div>

      <!-- Main card container -->
      <div class="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-xl space-y-6">
        
        <div class="text-center space-y-1">
          <h2 class="text-2xl font-black text-gray-900 dark:text-white">Registrar mi restaurante</h2>
          <p class="text-sm text-gray-500">Completa los datos para dar de alta tu restaurante en el sistema.</p>
        </div>

        <form (submit)="onSubmit($event)" class="space-y-6">
          
          <!-- Section 1: Restaurant Info -->
          <div class="space-y-4">
            <h3 class="text-sm font-extrabold tracking-wide uppercase text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700/80 pb-2">
              1. Datos del Restaurante
            </h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label for="name" class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Nombre Comercial</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  [(ngModel)]="form.name"
                  appInput
                  placeholder="Mi Restaurante"
                  required
                />
              </div>
              <div class="space-y-1.5">
                <label for="businessDocumentNumber" class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">RUC / DNI</label>
                <input
                  id="businessDocumentNumber"
                  type="text"
                  name="businessDocumentNumber"
                  [(ngModel)]="form.businessDocumentNumber"
                  appInput
                  placeholder="20123456789"
                  required
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label for="address" class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Dirección Completa</label>
              <input
                id="address"
                type="text"
                name="address"
                [(ngModel)]="form.address"
                appInput
                placeholder="Av. La Mar 123, Miraflores"
                required
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label for="contactEmail" class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Correo de Contacto</label>
                <input
                  id="contactEmail"
                  type="email"
                  name="contactEmail"
                  [(ngModel)]="form.contactEmail"
                  appInput
                  placeholder="contacto@mi-restaurante.com"
                  required
                />
              </div>
              <div class="space-y-1.5">
                <label for="contactPhone" class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Teléfono</label>
                <input
                  id="contactPhone"
                  type="text"
                  name="contactPhone"
                  [(ngModel)]="form.contactPhone"
                  appInput
                  placeholder="999888777"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Section 2: Admin Info -->
          <div class="space-y-4">
            <h3 class="text-sm font-extrabold tracking-wide uppercase text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700/80 pb-2">
              2. Cuenta de Administrador
            </h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label for="adminFirstName" class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Nombre</label>
                <input
                  id="adminFirstName"
                  type="text"
                  name="adminFirstName"
                  [(ngModel)]="form.adminFirstName"
                  appInput
                  placeholder="Juan"
                  required
                />
              </div>
              <div class="space-y-1.5">
                <label for="adminLastName" class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Apellido</label>
                <input
                  id="adminLastName"
                  type="text"
                  name="adminLastName"
                  [(ngModel)]="form.adminLastName"
                  appInput
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label for="adminEmail" class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Correo de Acceso</label>
                <input
                  id="adminEmail"
                  type="email"
                  name="adminEmail"
                  [(ngModel)]="form.adminEmail"
                  appInput
                  placeholder="admin@mi-restaurante.com"
                  required
                />
              </div>
              <div class="space-y-1.5">
                <label for="adminPassword" class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Contraseña</label>
                <input
                  id="adminPassword"
                  type="password"
                  name="adminPassword"
                  [(ngModel)]="form.adminPassword"
                  appInput
                  placeholder="••••••••"
                  required
                  minlength="6"
                />
              </div>
            </div>
          </div>

          <!-- Section 3: Invitation -->
          <div class="space-y-4">
            <h3 class="text-sm font-extrabold tracking-wide uppercase text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700/80 pb-2">
              3. Código de Acceso
            </h3>
            
            <div class="space-y-1.5">
              <label for="inviteCode" class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Código de Invitación</label>
              <input
                id="inviteCode"
                type="text"
                name="inviteCode"
                [(ngModel)]="form.inviteCode"
                appInput
                placeholder="Ingresa el código proporcionado"
                required
              />
              <p class="text-[11px] text-gray-500 dark:text-gray-400">
                El registro es restringido. Si no cuentas con un código de acceso, ponte en contacto con nuestro equipo comercial (contacto&#64;pezrestaurante.pe).
              </p>
            </div>
          </div>

          <!-- Submit and Go Back -->
          <div class="pt-4 space-y-3">
            <button
              type="submit"
              appButton
              userClass="w-full py-3"
              [disabled]="loading"
            >
              {{ loading ? 'Registrando restaurante...' : 'Registrar restaurante' }}
            </button>

            <a
              routerLink="/"
              class="block text-center text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-all"
            >
              Cancelar y volver a la Landing
            </a>
          </div>

        </form>

      </div>
    </div>
  `
})
export class RegisterRestaurantPageComponent {
  private authApi = inject(AuthApi);
  private notifier = inject(NotificationService);
  private router = inject(Router);

  loading = false;

  form = {
    name: '',
    businessDocumentNumber: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    inviteCode: ''
  };

  onSubmit(event: Event): void {
    event.preventDefault();
    
    // Simple frontend validations
    if (!this.form.name || !this.form.businessDocumentNumber || !this.form.contactEmail || 
        !this.form.contactPhone || !this.form.address || !this.form.adminFirstName || !this.form.adminLastName || 
        !this.form.adminEmail || !this.form.adminPassword || !this.form.inviteCode) {
      this.notifier.warning('Todos los campos son obligatorios.');
      return;
    }

    if (this.form.adminPassword.length < 6) {
      this.notifier.warning('La contraseña del administrador debe tener al menos 6 caracteres.');
      return;
    }

    this.loading = true;
    this.authApi.onboardRestaurant(this.form).subscribe({
      next: (res) => {
        this.loading = false;
        this.notifier.success('¡Restaurante registrado con éxito! Ahora puedes iniciar sesión con tu cuenta de administrador.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.loading = false;
        // Parse error message
        let errMsg = 'Ocurrió un error al procesar tu solicitud.';
        if (err.status === 403) {
          errMsg = 'Código de invitación inválido. Por favor, contacta a contacto@pezrestaurante.pe o con tu asesor de ventas.';
        } else if (err.error?.message) {
          errMsg = err.error.message;
        }
        this.notifier.error(errMsg);
      }
    });
  }
}
