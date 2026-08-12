import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffApi, UserResource, UserPermission, OverridePayload } from '../../infrastructure/api/staff.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';

@Component({
  selector: 'app-user-permissions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-6">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm animate-in fade-in duration-300">
        <div>
          <div class="flex items-center gap-2">
            <button 
              (click)="goBack()" 
              class="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer transition-all"
              title="Volver a Personal"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Gestión de Permisos</h2>
          </div>
          
          @if (user(); as u) {
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              Configurando accesos individuales para <span class="font-extrabold text-gray-900 dark:text-white">{{ u.firstName }} {{ u.lastName }}</span> ({{ u.email }}).
            </p>
          } @else {
            <p class="text-gray-500 dark:text-gray-400 mt-1">Cargando datos del colaborador...</p>
          }
        </div>

        @if (user(); as u) {
          <div class="flex flex-wrap gap-1">
            @for (role of u.roles; track role) {
              <span class="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50 rounded-xl text-xs font-black tracking-wider uppercase">
                Rol: {{ role }}
              </span>
            }
          </div>
        }
      </div>

      <!-- ================= WARNING BANNER FOR SELF-EDIT ================= -->
      @if (isEditingSelf()) {
        <div class="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl animate-in slide-in-from-top-4 duration-300">
          <svg class="h-5 w-5 text-amber-600 dark:text-amber-450 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 class="font-extrabold text-amber-900 dark:text-amber-400 text-sm">Advertencia: Cuenta Propia</h4>
            <p class="text-xs text-amber-700 dark:text-amber-450 mt-1">
              Estás configurando los permisos de tu propia cuenta de administrador. El permiso crítico <code class="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">permissions.manage</code> está bloqueado para edición por seguridad.
            </p>
          </div>
        </div>
      }

      <!-- ================= MAIN PERMISSIONS GRID BY MODULE ================= -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (moduleName of moduleOrder; track moduleName) {
          @if (groupedPermissions()[moduleName]; as perms) {
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs overflow-hidden">
              <!-- Module Header -->
              <div class="px-5 py-4 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-150 dark:border-gray-700 flex items-center justify-between">
                <span class="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                  Módulo: {{ getModuleDisplayName(moduleName) }}
                </span>
                <span class="text-[10px] font-black uppercase bg-gray-250 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">
                  {{ perms.length }} Permisos
                </span>
              </div>

              <!-- Module Body -->
              <div class="divide-y divide-gray-100 dark:divide-gray-700">
                @for (p of perms; track p.code) {
                  <div 
                    class="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all"
                    [ngClass]="{
                      'bg-amber-50/20 dark:bg-amber-950/5': p.isOverride
                    }"
                  >
                    <!-- Left: Description and Labels -->
                    <div class="space-y-2 max-w-lg">
                      <div class="font-bold text-xs text-gray-900 dark:text-white leading-relaxed">
                        {{ p.description }}
                      </div>
                      <div class="flex flex-wrap items-center gap-2">
                        <code class="font-mono text-[9px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-900/80 border border-gray-150 dark:border-gray-800 px-1.5 py-0.5 rounded font-bold">
                          {{ p.code }}
                        </code>

                        <!-- Default Status Badge -->
                        @if (!p.isOverride) {
                          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400 border border-gray-200 dark:border-gray-850">
                            Heredado de Rol ({{ p.granted ? 'Permitido' : 'Bloqueado' }})
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                            Anulación Manual ({{ p.granted ? 'Permitido' : 'Bloqueado' }})
                          </span>
                        }
                      </div>

                      <!-- Override Audit Details -->
                      @if (p.isOverride) {
                        <div class="text-[9px] text-gray-500 dark:text-gray-400 leading-snug border-l-2 border-amber-300 dark:border-amber-800 pl-2 mt-1">
                          Modificado por <span class="font-bold text-gray-700 dark:text-gray-300">{{ p.overrideGrantedBy }}</span>
                          @if (p.overrideDate) {
                            el {{ formatDate(p.overrideDate) }}
                          }
                          @if (p.overrideReason) {
                            <span class="block italic mt-0.5">Motivo: "{{ p.overrideReason }}"</span>
                          }
                        </div>
                      }
                    </div>

                    <!-- Right: Switch and Actions -->
                    <div class="flex items-center gap-3 shrink-0 self-end sm:self-start">
                      <!-- Restore Default Button -->
                      @if (p.isOverride && p.code !== 'permissions.manage') {
                        <button 
                          (click)="revertToDefault(p)"
                          class="p-1.5 bg-gray-50 hover:bg-rose-50 dark:bg-gray-900 dark:hover:bg-rose-950/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-rose-600 dark:text-gray-400 rounded-lg cursor-pointer transition-all flex items-center"
                          title="Restaurar al valor por defecto del rol"
                        >
                          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                      }

                      <!-- Toggle Switch -->
                      <label 
                        class="relative inline-flex items-center"
                        [ngClass]="{
                          'cursor-pointer': p.code !== 'permissions.manage',
                          'opacity-50 cursor-not-allowed': p.code === 'permissions.manage'
                        }"
                      >
                        <input 
                          type="checkbox"
                          [checked]="p.granted"
                          [disabled]="p.code === 'permissions.manage'"
                          (change)="onToggleChange(p, $event)"
                          class="sr-only peer"
                        >
                        <div class="w-9 h-5 bg-gray-200 dark:bg-gray-750 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                  </div>
                }
              </div>
            </div>
          }
        }
      </div>

    </div>

    <!-- ================= CONFIRM OVERRIDE MODAL ================= -->
    <app-modal-shell
      [open]="isConfirmModalOpen()"
      title="Confirmar Anulación de Permiso"
      description="Estás modificando la política de acceso heredada del rol para este usuario. Esta excepción se aplicará directamente sobre su cuenta."
      [hasFooter]="true"
      (close)="cancelOverride()"
    >
      @if (confirmingPermission(); as p) {
        <div class="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
          <!-- Policy Change Details -->
          <div class="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl space-y-2">
            <div class="font-extrabold text-gray-900 dark:text-white">{{ p.description }}</div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black uppercase text-gray-400">Valor por defecto del rol:</span>
              <span class="px-1.5 py-0.5 rounded font-black text-[9px] uppercase bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {{ p.roleDefaultValue ? 'Concedido' : 'Bloqueado' }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black uppercase text-gray-400">Nuevo valor manual:</span>
              <span class="px-1.5 py-0.5 rounded font-black text-[9px] uppercase font-black" 
                    [ngClass]="{
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450': confirmingTargetValue() === 'GRANTED',
                      'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450': confirmingTargetValue() === 'REVOKED'
                    }"
              >
                {{ confirmingTargetValue() === 'GRANTED' ? 'Otorgado' : 'Revocado' }}
              </span>
            </div>
          </div>

          <!-- Reason / Justification Input -->
          <div>
            <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">
              Motivo o Justificación de la Anulación (Opcional)
            </label>
            <textarea 
              [(ngModel)]="overrideReasonInput"
              rows="3"
              placeholder="Ej. Habilitado temporalmente para cubrir turnos de cajero, etc..."
              class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-2 pt-2">
            <button 
              type="button"
              (click)="cancelOverride()"
              class="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-850 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="button"
              (click)="confirmOverride()"
              class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
            >
              Confirmar Anulación
            </button>
          </div>
        </div>
      }
    </app-modal-shell>
  `
})
export class UserPermissionsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(StaffApi);
  private notify = inject(NotificationService);
  private session = inject(SessionService);

  // Signals
  public userId = signal<number | null>(null);
  public user = signal<UserResource | null>(null);
  public userPermissions = signal<UserPermission[]>([]);

  // Confirmation Modal Signals
  public isConfirmModalOpen = signal<boolean>(false);
  public confirmingPermission = signal<UserPermission | null>(null);
  public confirmingTargetValue = signal<'GRANTED' | 'REVOKED'>('GRANTED');
  public overrideReasonInput = '';

  // Order modules logical grouping
  public readonly moduleOrder = [
    'orders',
    'catalog',
    'cashregister',
    'inventory',
    'kitchen',
    'staff',
    'loyalty',
    'analytics',
    'iam',
    'permissions'
  ];

  // Self edit warning computed
  public isEditingSelf = computed(() => {
    const currentId = this.session.currentUser$()?.id;
    const targetId = this.userId();
    return currentId != null && targetId != null && currentId === targetId;
  });

  // Grouped permissions computed
  public groupedPermissions = computed(() => {
    const list = this.userPermissions();
    const groups: Record<string, UserPermission[]> = {};
    list.forEach(p => {
      const mod = p.module || 'other';
      if (!groups[mod]) {
        groups[mod] = [];
      }
      groups[mod].push(p);
    });
    return groups;
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id = params['userId'] ? parseInt(params['userId'], 10) : null;
      if (id) {
        this.userId.set(id);
        this.loadUserDetails(id);
        this.loadUserPermissions(id);
      } else {
        this.notify.error('No se especificó un identificador de usuario válido.');
        this.router.navigate(['/app/admin/staff-accounts']);
      }
    });
  }

  loadUserDetails(id: number): void {
    this.api.getUserById(id).subscribe({
      next: (data) => this.user.set(data),
      error: () => this.notify.error('No se pudo cargar la información del usuario.')
    });
  }

  loadUserPermissions(id: number): void {
    this.api.getEffectivePermissionsForUser(id).subscribe({
      next: (data) => this.userPermissions.set(data),
      error: () => this.notify.error('No se pudo cargar el listado de permisos.')
    });
  }

  goBack(): void {
    this.router.navigate(['/app/admin/staff-accounts']);
  }

  getModuleDisplayName(module: string): string {
    switch (module) {
      case 'orders': return 'Pedidos & Ventas';
      case 'catalog': return 'Catálogo & Menú';
      case 'cashregister': return 'Caja Registradora';
      case 'inventory': return 'Inventario';
      case 'kitchen': return 'Cocina';
      case 'staff': return 'Personal & Turnos';
      case 'loyalty': return 'Fidelización Clientes';
      case 'analytics': return 'Métricas & Reportes';
      case 'iam': return 'Cuentas de Acceso';
      case 'permissions': return 'Seguridad & Permisos';
      default: return module;
    }
  }

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }

  onToggleChange(p: UserPermission, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const originalValue = p.granted;
    const targetValue = checkbox.checked;

    // Prevent toggle action if user attempts edit on permissions.manage
    if (p.code === 'permissions.manage') {
      checkbox.checked = originalValue;
      return;
    }

    // 1. If currently has an override, toggle switches to either the other override value or deletes override
    if (p.isOverride) {
      // Reverting to default
      if (targetValue === p.roleDefaultValue) {
        this.revertToDefault(p);
      } else {
        // Toggle from GRANTED override to REVOKED override or vice versa
        this.openConfirmModal(p, targetValue ? 'GRANTED' : 'REVOKED');
      }
    } else {
      // 2. If it is role default value, we are creating an override
      this.openConfirmModal(p, targetValue ? 'GRANTED' : 'REVOKED');
    }

    // Revert check immediately until modal confirmation is accepted
    checkbox.checked = originalValue;
  }

  openConfirmModal(p: UserPermission, targetValue: 'GRANTED' | 'REVOKED'): void {
    this.confirmingPermission.set(p);
    this.confirmingTargetValue.set(targetValue);
    this.overrideReasonInput = '';
    this.isConfirmModalOpen.set(true);
  }

  cancelOverride(): void {
    this.isConfirmModalOpen.set(false);
    this.confirmingPermission.set(null);
  }

  confirmOverride(): void {
    const userId = this.userId();
    const p = this.confirmingPermission();
    const targetVal = this.confirmingTargetValue();
    if (!userId || !p) return;

    const payload: OverridePayload = {
      permissionCode: p.code,
      value: targetVal,
      reason: this.overrideReasonInput.trim() || undefined
    };

    this.api.createOrUpdateOverride(userId, payload).subscribe({
      next: () => {
        this.notify.success(`Anulación de permiso '${p.code}' aplicada correctamente.`);
        this.isConfirmModalOpen.set(false);
        this.confirmingPermission.set(null);
        this.loadUserPermissions(userId);
      },
      error: (err) => {
        this.notify.error(err.error?.message || err.error || 'Error al aplicar la anulación.');
        this.isConfirmModalOpen.set(false);
        this.confirmingPermission.set(null);
      }
    });
  }

  revertToDefault(p: UserPermission): void {
    const userId = this.userId();
    if (!userId) return;

    if (confirm(`¿Deseas eliminar la anulación manual de '${p.code}' y restaurar el comportamiento por defecto de su rol?`)) {
      this.api.deleteOverride(userId, p.code).subscribe({
        next: () => {
          this.notify.success(`Permiso '${p.code}' restaurado al comportamiento por defecto del rol.`);
          this.loadUserPermissions(userId);
        },
        error: (err) => {
          this.notify.error(err.error?.message || err.error || 'No se pudo restaurar el valor por defecto.');
        }
      });
    }
  }
}
