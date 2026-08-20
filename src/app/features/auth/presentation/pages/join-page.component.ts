import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StaffApi } from '../../../staff/infrastructure/api/staff.api';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-join-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-radial-gradient flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div class="w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-150 dark:border-gray-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        <!-- ================= BRAND / HEADER ================= -->
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl shadow-md">
            <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Únete al Equipo</h2>
          <p class="text-xs font-bold text-gray-500 dark:text-gray-400">
            Completa tu registro para empezar a trabajar en el sistema.
          </p>
        </div>

        <!-- ================= LOADING STATE ================= -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-8 space-y-3">
            <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-bold text-gray-500 dark:text-gray-400">Verificando código de invitación...</p>
          </div>
        }

        <!-- ================= INVALID STATE ================= -->
        @if (!loading() && inviteError()) {
          <div class="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div class="inline-flex p-3 bg-rose-100 dark:bg-rose-900/30 rounded-full text-rose-600 dark:text-rose-450">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="space-y-1">
              <h3 class="text-sm font-black text-rose-900 dark:text-rose-350">Invitación No Válida</h3>
              <p class="text-[11px] font-bold text-rose-700 dark:text-rose-400 leading-relaxed">
                {{ inviteError() }}
              </p>
            </div>
            <button 
              routerLink="/auth/login"
              class="w-full py-2.5 bg-gray-100 hover:bg-gray-250 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-black text-xs rounded-xl cursor-pointer transition-colors uppercase tracking-wider"
            >
              Ir al Inicio de Sesión
            </button>
          </div>
        }

        <!-- ================= FORM STATE ================= -->
        @if (!loading() && !inviteError()) {
          <div class="bg-blue-50/50 dark:bg-blue-950/5 border border-blue-100 dark:border-blue-900/20 rounded-2xl p-4 flex items-center gap-3">
            <span class="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase rounded-lg">
              {{ inviteRole() }}
            </span>
            <div class="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-snug">
              Invitación válida para restaurante registrado en el sistema.
            </div>
          </div>

          <form (submit)="acceptInvite()" class="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Nombre</label>
                <input 
                  type="text"
                  required
                  [(ngModel)]="form.firstName"
                  name="firstName"
                  placeholder="Ej. Carlos"
                  class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Apellido</label>
                <input 
                  type="text"
                  required
                  [(ngModel)]="form.lastName"
                  name="lastName"
                  placeholder="Ej. Medina"
                  class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Correo Electrónico (Para tu login)</label>
              <input 
                type="email"
                required
                readonly
                [(ngModel)]="form.email"
                name="email"
                class="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Contraseña (Mínimo 8 caracteres)</label>
              <input 
                type="password"
                required
                minlength="8"
                [(ngModel)]="form.password"
                name="password"
                placeholder="Elige una contraseña segura"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button 
              type="submit"
              [disabled]="submitting()"
              class="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl cursor-pointer shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
              @if (submitting()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Guardando Cuenta...
              } @else {
                Completar Registro e Ingresar
              }
            </button>
          </form>
        }

      </div>
    </div>
  `,
  styles: [`
    .bg-radial-gradient {
      background: radial-gradient(circle at top, #1e293b 0%, #0f172a 100%);
    }
    :host-context(.dark) .bg-radial-gradient {
      background: radial-gradient(circle at top, #0f172a 0%, #020617 100%);
    }
  `]
})
export class JoinPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private staffApi = inject(StaffApi);
  private notifier = inject(NotificationService);

  code = '';
  loading = signal(true);
  submitting = signal(false);
  inviteError = signal<string | null>(null);
  inviteRole = signal('');
  inviteEmail = signal('');

  form = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  ngOnInit() {
    this.code = this.route.snapshot.params['code'];
    if (!this.code) {
      this.inviteError.set('Código de invitación omitido.');
      this.loading.set(false);
      return;
    }
    this.verifyInvite();
  }

  verifyInvite() {
    this.staffApi.verifyStaffInvite(this.code).subscribe({
      next: (invite) => {
        this.inviteRole.set(invite.requestedRole);
        this.inviteEmail.set(invite.email);
        this.form.email = invite.email;
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const errMsg = err.error?.message || 'La invitación no es válida, ha sido revocada o ya expiró.';
        this.inviteError.set(errMsg);
      }
    });
  }

  acceptInvite() {
    if (!this.form.firstName || !this.form.lastName || !this.form.email || this.form.password.length < 8) {
      this.notifier.error('Completa todos los campos correctamente.');
      return;
    }

    this.submitting.set(true);
    this.staffApi.acceptStaffInvite(this.code, this.form).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifier.success('Cuenta de colaborador creada correctamente. ¡Bienvenido!');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.submitting.set(false);
        const errMsg = err.error?.message || 'Error al aceptar la invitación.';
        this.notifier.error(errMsg);
      }
    });
  }
}
