import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StaffApi, AttendanceRecord, StaffProfile, UserResource } from '../../infrastructure/api/staff.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';

@Component({
  selector: 'app-unresolved-attendance-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <!-- HEADER -->
      <div class="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Resolución de Salidas Pendientes</span>
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Asistencias marcadas sin salida al cerrar turno. Asigna una hora de salida para regularizar su planilla de pagos.
          </p>
        </div>
        <button
          (click)="goBack()"
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer border border-gray-250 dark:border-gray-700 transition-all uppercase tracking-wider flex items-center gap-1.5"
        >
          ← Volver
        </button>
      </div>

      <!-- MAIN CARD -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-6">
        
        @if (loading()) {
          <div class="py-12 text-center text-gray-500 font-bold">
            Cargando asistencias pendientes...
          </div>
        } @else {
          
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-bold border-collapse">
              <thead>
                <tr class="border-b border-gray-100 dark:border-gray-800 text-[9px] uppercase text-gray-400 tracking-wider">
                  <th class="py-2.5 px-3">Colaborador</th>
                  <th class="py-2.5 px-3">Fecha</th>
                  <th class="py-2.5 px-3">Hora Entrada</th>
                  <th class="py-2.5 px-3">Método Entrada</th>
                  <th class="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                @for (record of unresolvedRecords(); track record.id) {
                  @let employee = getEmployeeDetails(record.staffProfileId);
                  <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                    <td class="py-4 px-3 font-extrabold text-gray-900 dark:text-white">
                      {{ employee.name }}
                      <span class="block text-[10px] text-gray-400 font-normal font-mono mt-0.5">{{ employee.email }}</span>
                    </td>
                    <td class="py-4 px-3">
                      {{ record.checkInAt | date:'dd/MM/yyyy' }}
                    </td>
                    <td class="py-4 px-3">
                      {{ record.checkInAt | date:'HH:mm:ss' }}
                    </td>
                    <td class="py-4 px-3">
                      <span 
                        [class.bg-emerald-100/50]="record.method === 'FINGERPRINT_HASH'"
                        [class.text-emerald-700]="record.method === 'FINGERPRINT_HASH'"
                        [class.bg-blue-100/50]="record.method === 'MANUAL_BY_ADMIN'"
                        [class.text-blue-700]="record.method === 'MANUAL_BY_ADMIN'"
                        class="px-2 py-0.5 rounded text-[9px] font-black uppercase"
                      >
                        {{ record.method === 'FINGERPRINT_HASH' ? 'Huella' : 'Manual' }}
                      </span>
                    </td>
                    <td class="py-4 px-3 text-right">
                      <button
                        (click)="openResolveModal(record)"
                        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all"
                      >
                        Corregir Salida
                      </button>
                    </td>
                  </tr>
                }
                @if (unresolvedRecords().length === 0) {
                  <tr>
                    <td colspan="5" class="py-12 text-center text-gray-400 italic font-medium">
                      🎉 ¡Todo al día! No se encontraron asistencias sin salida pendientes de resolución.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

        }

      </div>

      <!-- RESOLVE MODAL -->
      <app-modal-shell
        [open]="resolveModalOpen()"
        title="Resolver Marcaje de Salida"
        (closeModal)="closeResolveModal()"
      >
        @if (selectedRecord()) {
          @let emp = getEmployeeDetails(selectedRecord()!.staffProfileId);
          <div class="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
            <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl space-y-1.5 border border-gray-100 dark:border-gray-800">
              <div><span class="text-gray-400 font-bold uppercase text-[9px]">Empleado:</span> {{ emp.name }}</div>
              <div><span class="text-gray-400 font-bold uppercase text-[9px]">Entrada Registrada:</span> {{ selectedRecord()!.checkInAt | date:'dd/MM/yyyy HH:mm:ss' }}</div>
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Hora de Salida manual *</label>
              <input 
                type="datetime-local"
                [(ngModel)]="checkoutTimeInput"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p class="text-[10px] text-gray-400 mt-1 font-medium">
                Selecciona la hora real en que se retiró el empleado para regularizar el cálculo de horas regulares y extras.
              </p>
            </div>

            <div class="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                (click)="closeResolveModal()"
                class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                (click)="submitResolution()"
                [disabled]="submitting()"
                class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md disabled:opacity-50 transition-all uppercase tracking-wider"
              >
                {{ submitting() ? 'Guardando...' : 'Confirmar Resolución' }}
              </button>
            </div>
          </div>
        }
      </app-modal-shell>

    </div>
  `
})
export class UnresolvedAttendancePageComponent implements OnInit {
  private api = inject(StaffApi);
  private notify = inject(NotificationService);
  private router = inject(Router);

  public loading = signal<boolean>(false);
  public submitting = signal<boolean>(false);
  public resolveModalOpen = signal<boolean>(false);

  public unresolvedRecords = signal<AttendanceRecord[]>([]);
  public profiles = signal<StaffProfile[]>([]);
  public users = signal<UserResource[]>([]);

  public selectedRecord = signal<AttendanceRecord | null>(null);
  public checkoutTimeInput = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getUnresolvedAttendance().subscribe({
      next: (records) => {
        this.unresolvedRecords.set(records);
        
        // Fetch profiles and users to resolve names
        this.api.getProfiles().subscribe({
          next: (profs) => this.profiles.set(profs)
        });
        this.api.getUsers().subscribe({
          next: (usrs) => this.users.set(usrs)
        });

        this.loading.set(false);
      },
      error: () => {
        this.notify.error('No se pudieron cargar las asistencias pendientes.');
        this.loading.set(false);
      }
    });
  }

  getEmployeeDetails(profileId: number): { name: string, email: string } {
    const prof = this.profiles().find(p => p.id === profileId);
    if (!prof) return { name: 'Cargando...', email: '' };
    
    const user = this.users().find(u => u.id === prof.accountId);
    if (!user) return { name: 'Colaborador #' + prof.accountId, email: '' };

    return {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email
    };
  }

  openResolveModal(record: AttendanceRecord): void {
    this.selectedRecord.set(record);
    
    // Default to check-in time + 8 hours (or current time if check-in is recent)
    if (record.checkInAt) {
      const checkInDate = new Date(record.checkInAt);
      checkInDate.setHours(checkInDate.getHours() + 8);
      
      // format to YYYY-MM-DDTHH:mm
      const y = checkInDate.getFullYear();
      const m = String(checkInDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkInDate.getDate()).padStart(2, '0');
      const hh = String(checkInDate.getHours()).padStart(2, '0');
      const mm = String(checkInDate.getMinutes()).padStart(2, '0');
      
      this.checkoutTimeInput = `${y}-${m}-${d}T${hh}:${mm}`;
    }

    this.resolveModalOpen.set(true);
  }

  closeResolveModal(): void {
    this.resolveModalOpen.set(false);
    this.selectedRecord.set(null);
  }

  submitResolution(): void {
    const record = this.selectedRecord();
    if (!record) return;

    if (!this.checkoutTimeInput) {
      this.notify.error('Debes ingresar la hora de salida.');
      return;
    }

    this.submitting.set(true);
    this.api.resolveAttendance(record.id, { checkOutAt: this.checkoutTimeInput }).subscribe({
      next: () => {
        this.notify.success('Asistencia resuelta correctamente.');
        this.submitting.set(false);
        this.closeResolveModal();
        this.loadData();
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Error al resolver la asistencia.');
        this.submitting.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/app/staff']);
  }
}
