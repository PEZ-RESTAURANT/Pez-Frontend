import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StaffApi, UserResource } from '../../infrastructure/api/staff.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';

@Component({
  selector: 'app-staff-accounts-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-6">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm animate-in fade-in duration-300">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Cuentas de Personal</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Administra los accesos, contraseñas y roles del sistema para tu equipo de trabajo.
          </p>
        </div>

        <button 
          (click)="openCreateModal()"
          class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider"
        >
          + Nueva Cuenta
        </button>
      </div>

      <!-- ================= LISTADO DE USUARIOS ================= -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-gray-100 dark:border-gray-850">
          <h3 class="text-sm font-black text-gray-400 uppercase tracking-wider">Cuentas Activas y Desactivadas</h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs font-bold text-gray-700 dark:text-gray-300">
            <thead>
              <tr class="bg-gray-50/70 dark:bg-gray-900/40 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100 dark:border-gray-855">
                <th class="p-4">Colaborador</th>
                <th class="p-4">Correo</th>
                <th class="p-4">Rol en Sistema</th>
                <th class="p-4">Estado</th>
                <th class="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-855">
              @for (user of users(); track user.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors">
                  <!-- Colaborador -->
                  <td class="p-4">
                    <div class="font-black text-sm text-gray-900 dark:text-white">
                      {{ user.firstName }} {{ user.lastName }}
                    </div>
                  </td>
                  
                  <!-- Correo -->
                  <td class="p-4 font-mono text-gray-600 dark:text-gray-450">{{ user.email }}</td>
                  
                  <!-- Roles -->
                  <td class="p-4">
                    <div class="flex flex-wrap gap-1">
                      @for (role of user.roles; track role) {
                        <span 
                          [ngClass]="getRoleBadgeClasses(role)"
                          class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border"
                        >
                          {{ role }}
                        </span>
                      }
                    </div>
                  </td>
                  
                  <!-- Estado -->
                  <td class="p-4">
                    @if (user.active) {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/50">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Activo
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-200 dark:border-rose-900/50">
                        <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Desactivado
                      </span>
                    }
                  </td>
                  
                  <!-- Acción -->
                  <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button 
                        (click)="navigateToPermissions(user.id)"
                        class="px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 dark:bg-gray-900 dark:hover:bg-indigo-950/20 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-900 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <svg class="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Permisos
                      </button>
                      <button 
                        (click)="openEditModal(user)"
                        class="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 dark:bg-gray-900 dark:hover:bg-blue-950/20 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-900 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @if (users().length === 0) {
                <tr>
                  <td colspan="5" class="p-8 text-center text-gray-400">
                    Cargando cuentas de personal o no se encontraron registros...
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- MODAL DE CREACIÓN / EDICIÓN -->
    <app-modal-shell
      [open]="isModalOpen()"
      [title]="editMode() ? 'Editar Cuenta' : 'Nueva Cuenta de Personal'"
      [description]="editMode() ? 'Modifica los datos de acceso o el estado de la cuenta del colaborador.' : 'Registra un nuevo usuario para otorgarle credenciales de acceso al sistema.'"
      [hasFooter]="true"
      (close)="closeModal()"
    >
      <form (submit)="saveUser()" class="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Nombre</label>
            <input 
              type="text"
              required
              [(ngModel)]="userForm.firstName"
              name="uFirstName"
              placeholder="Ej. Juan"
              class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Apellido</label>
            <input 
              type="text"
              required
              [(ngModel)]="userForm.lastName"
              name="uLastName"
              placeholder="Ej. Pérez"
              class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Correo Electrónico (Login)</label>
          <input 
            type="email"
            required
            [(ngModel)]="userForm.email"
            name="uEmail"
            placeholder="correo@ejemplo.com"
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- CONTRASEÑA: Solo en modo creación -->
        @if (!editMode()) {
          <div>
            <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Contraseña (Mínimo 8 caracteres)</label>
            <input 
              type="text"
              required
              minlength="8"
              [(ngModel)]="userForm.password"
              name="uPassword"
              placeholder="Define una contraseña segura"
              class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        }

        <!-- SELECCIONAR ROL -->
        <div>
          <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Rol asignado</label>
          <select 
            [(ngModel)]="userForm.requestedRole"
            name="uRole"
            required
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="WAITER">WAITER (Mozo)</option>
            <option value="CASHIER">CASHIER (Cajero)</option>
            <option value="COOK">COOK (Cocinero)</option>
            <option value="ADMIN">ADMIN (Administrador)</option>
          </select>
        </div>

        <!-- ACTIVAR/DESACTIVAR: Solo en modo edición -->
        @if (editMode()) {
          <div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-850">
            <input 
              type="checkbox"
              id="uActive"
              [(ngModel)]="userForm.active"
              name="uActive"
              class="w-4.5 h-4.5 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 focus:ring-2"
            />
            <label for="uActive" class="cursor-pointer">
              <span class="block font-black text-sm text-gray-900 dark:text-white">Cuenta activa</span>
              <span class="block text-[10px] font-bold text-gray-400 mt-0.5">
                Desactiva esta casilla para revocar inmediatamente el acceso al sistema sin borrar su historial de trabajo.
              </span>
            </label>
          </div>
        }

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button"
            (click)="closeModal()"
            class="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-850 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </app-modal-shell>
  `
})
export class StaffAccountsPageComponent implements OnInit {
  private api = inject(StaffApi);
  private notify = inject(NotificationService);
  private router = inject(Router);

  public users = signal<UserResource[]>([]);
  public isModalOpen = signal<boolean>(false);
  public editMode = signal<boolean>(false);

  public userForm = {
    id: 0,
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    requestedRole: 'WAITER' as 'ADMIN' | 'CASHIER' | 'WAITER' | 'COOK',
    active: true
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.api.getUsers().subscribe({
      next: (data) => this.users.set(data),
      error: () => this.notify.error('Error al cargar la lista de trabajadores.')
    });
  }

  openCreateModal(): void {
    this.editMode.set(false);
    this.userForm = {
      id: 0,
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      requestedRole: 'WAITER',
      active: true
    };
    this.isModalOpen.set(true);
  }

  openEditModal(user: UserResource): void {
    this.editMode.set(true);
    const mainRole = user.roles.length > 0 ? user.roles[0] : 'WAITER';
    this.userForm = {
      id: user.id,
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      requestedRole: mainRole as any,
      active: user.active
    };
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveUser(): void {
    if (!this.userForm.email.trim() || !this.userForm.firstName.trim() || !this.userForm.lastName.trim()) {
      this.notify.error('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    if (this.editMode()) {
      const payload = {
        email: this.userForm.email.trim(),
        firstName: this.userForm.firstName.trim(),
        lastName: this.userForm.lastName.trim(),
        requestedRole: this.userForm.requestedRole,
        active: this.userForm.active
      };
      this.api.updateUser(this.userForm.id, payload).subscribe({
        next: () => {
          this.notify.success('Cuenta de trabajador actualizada.');
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => this.notify.error(err.error?.message || err.error || 'Error al actualizar el usuario.')
      });
    } else {
      if (!this.userForm.password || this.userForm.password.length < 8) {
        this.notify.error('La contraseña debe tener un mínimo de 8 caracteres.');
        return;
      }
      const payload = {
        email: this.userForm.email.trim(),
        password: this.userForm.password,
        firstName: this.userForm.firstName.trim(),
        lastName: this.userForm.lastName.trim(),
        requestedRole: this.userForm.requestedRole
      };
      this.api.createUser(payload).subscribe({
        next: () => {
          this.notify.success('Nueva cuenta de colaborador creada con éxito.');
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => this.notify.error(err.error?.message || err.error || 'Error al crear el usuario.')
      });
    }
  }

  getRoleBadgeClasses(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50';
      case 'CASHIER':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50';
      case 'WAITER':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50';
      case 'COOK':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-900/50';
    }
  }

  navigateToPermissions(userId: number): void {
    this.router.navigate(['/app/admin/permissions'], { queryParams: { userId } });
  }
}
