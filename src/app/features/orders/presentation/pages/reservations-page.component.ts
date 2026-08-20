import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationsApi, Reservation } from '../../infrastructure/api/reservations.api';
import { OrdersService } from '../../infrastructure/services/orders.service';
import { LoyaltyApi } from '../../../loyalty/infrastructure/api/loyalty.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { PermissionService } from '../../../../core/auth/services/permission.service';
import { PERMISSIONS } from '../../../../core/config/permissions';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import { SelectDirective } from '../../../../shared/ui/select/select.directive';

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, SelectDirective],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Reservas de Mesas</span>
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Programación diaria de reservaciones y control de llegada de clientes.
          </p>
        </div>

        @if (canManageReservations()) {
          <button 
            (click)="openCreateModal()"
            class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-all uppercase tracking-wider"
          >
            + Nueva Reserva
          </button>
        }
      </div>

      <!-- ================= CONTROLS & DATE SELECTOR ================= -->
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 shadow-xs flex items-center gap-3">
        <div class="flex flex-col">
          <span class="text-[9px] uppercase font-black tracking-wider text-gray-400 mb-1">Fecha de Consulta</span>
          <input 
            type="date" 
            [(ngModel)]="filterDate"
            (change)="loadReservations()"
            class="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-bold text-xs text-gray-900 dark:text-white focus:outline-none"
          />
        </div>

        <button 
          (click)="loadReservations()"
          class="px-4 py-2.5 bg-gray-100 hover:bg-gray-250 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-750 dark:text-white font-bold text-xs rounded-xl border border-gray-250 dark:border-gray-800 cursor-pointer self-end"
        >
          Refrescar
        </button>
      </div>

      <!-- ================= LIST OF RESERVATIONS ================= -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
        <h3 class="text-xs font-black uppercase text-gray-400 tracking-wider">Planificación del Día</h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-bold border-collapse">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-800 text-[9px] uppercase text-gray-400 tracking-wider">
                <th class="py-2.5 px-3">Hora</th>
                <th class="py-2.5 px-3">Cliente</th>
                <th class="py-2.5 px-3">Teléfono</th>
                <th class="py-2.5 px-3">Pax</th>
                <th class="py-2.5 px-3">Mesa Asignada</th>
                <th class="py-2.5 px-3">Estado</th>
                @if (canManageReservations()) {
                  <th class="py-2.5 px-3 text-right">Acciones</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              @for (res of reservations(); track res.id) {
                @let tbl = getTableInfo(res.tableId);
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                  <td class="py-3 px-3 font-extrabold text-gray-900 dark:text-white text-sm">
                    {{ res.reservationDateTime | date:'HH:mm' }}
                  </td>
                  <td class="py-3 px-3">
                    <div class="flex items-center gap-1.5">
                      <span>{{ res.customerName }}</span>
                      @if (res.customerId) {
                        <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 rounded text-[8px] font-black uppercase">
                          Fidelizado
                        </span>
                      }
                    </div>
                  </td>
                  <td class="py-3 px-3 text-gray-400 font-mono">{{ res.customerPhone }}</td>
                  <td class="py-3 px-3">{{ res.partySize }} personas</td>
                  <td class="py-3 px-3 text-gray-900 dark:text-white">
                    {{ tbl ? ('Mesa ' + tbl.number + ' (' + tbl.zoneTag + ')') : 'Sin asignar' }}
                  </td>
                  <td class="py-3 px-3">
                    <span 
                      [class.bg-blue-100]="res.status === 'CONFIRMED'"
                      [class.text-blue-700]="res.status === 'CONFIRMED'"
                      [class.bg-emerald-100]="res.status === 'COMPLETED'"
                      [class.text-emerald-700]="res.status === 'COMPLETED'"
                      [class.bg-rose-100]="res.status === 'CANCELLED'"
                      [class.text-rose-700]="res.status === 'CANCELLED'"
                      [class.bg-gray-200]="res.status === 'NO_SHOW'"
                      [class.text-gray-700]="res.status === 'NO_SHOW'"
                      class="px-2 py-0.5 rounded text-[9px] font-black uppercase border"
                    >
                      {{ translateStatus(res.status) }}
                    </span>
                  </td>
                  @if (canManageReservations()) {
                    <td class="py-3 px-3 text-right">
                      @if (res.status === 'CONFIRMED') {
                        <div class="flex items-center justify-end gap-1.5">
                          <button 
                            (click)="completeReservation(res)"
                            class="px-2 py-1 bg-emerald-600 hover:bg-emerald-750 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer"
                            title="Completada / Sentado"
                          >
                            Llegó
                          </button>
                          <button 
                            (click)="noShowReservation(res)"
                            class="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-[9px] font-black uppercase cursor-pointer"
                            title="No Show / Inasistencia"
                          >
                            No Show
                          </button>
                          <button 
                            (click)="cancelReservation(res)"
                            class="px-2 py-1 bg-rose-600 hover:bg-rose-750 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer"
                            title="Cancelar reserva"
                          >
                            Cancelar
                          </button>
                        </div>
                      } @else {
                        <span class="text-gray-400 italic text-[10px]">-</span>
                      }
                    </td>
                  }
                </tr>
              }
              @if (reservations().length === 0) {
                <tr>
                  <td colspan="7" class="py-8 text-center text-gray-400 italic">
                    No hay reservas registradas para esta fecha.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- ================= MODAL: REGISTRAR / CREAR RESERVA ================= -->
    <app-modal-shell
      [open]="isCreateModalOpen()"
      title="Registrar Nueva Reserva"
      description="Registra una reserva para un cliente y opcionalmente asigna una mesa."
      (close)="closeCreateModal()"
    >
      <form (submit)="saveReservation()" class="space-y-4">
        
        <!-- Phone Search for Autocomplete (Loyalty link) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-black uppercase text-gray-400 mb-1">Teléfono del Cliente *</label>
            <div class="flex gap-1.5">
              <input 
                type="text" 
                required
                [(ngModel)]="form.customerPhone"
                (ngModelChange)="onPhoneChange($event)"
                name="resPhone"
                placeholder="Ej. 999888777"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <!-- Name -->
          <div>
            <label class="block text-xs font-black uppercase text-gray-400 mb-1">Nombre Completo *</label>
            <input 
              type="text" 
              required
              [(ngModel)]="form.customerName"
              name="resName"
              placeholder="Ej. Juan Pérez"
              class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Reservation DateTime local string -->
          <div>
            <label class="block text-xs font-black uppercase text-gray-400 mb-1">Fecha y Hora *</label>
            <input 
              type="datetime-local" 
              required
              [(ngModel)]="formDateTimeInput"
              name="resDateTime"
              class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <!-- Party Size -->
          <div>
            <label class="block text-xs font-black uppercase text-gray-400 mb-1">Tamaño del Grupo *</label>
            <input 
              type="number" 
              min="1"
              required
              [(ngModel)]="form.partySize"
              name="resPartySize"
              class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <!-- Optional Table Assignation -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Mesa Asignada (Opcional)</label>
          <select appSelect
            [(ngModel)]="form.tableId"
            name="resTable"
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none"
          >
            <option [ngValue]="null">Confirmar mesa al llegar (Sin asignar)</option>
            @for (table of availableTables(); track table.id) {
              <option [ngValue]="table.id">Mesa M{{ table.number }} (Piso {{ table.floor }} - {{ table.zoneTag }})</option>
            }
          </select>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Notas / Requerimientos</label>
          <textarea 
            [(ngModel)]="form.notes"
            name="resNotes"
            rows="2"
            placeholder="Alergias, mesa preferencial, cumpleaños, etc..."
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeCreateModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            [disabled]="!form.customerName.trim() || !form.customerPhone.trim() || !formDateTimeInput"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Registrar Reserva
          </button>
        </div>
      </form>
    </app-modal-shell>
  `
})
export class ReservationsPageComponent implements OnInit {
  private api = inject(ReservationsApi);
  public ordersService = inject(OrdersService);
  private loyaltyApi = inject(LoyaltyApi);
  private notify = inject(NotificationService);
  private permissionService = inject(PermissionService);

  private getLocalDateString(d: Date = new Date()): string {
    const tzoffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzoffset).toISOString().split('T')[0];
  }

  public readonly PERMISSIONS = PERMISSIONS;

  // Permissions
  public canManageReservations = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.RESERVATIONS.MANAGE));

  // State Signals
  public filterDate = '';
  public reservations = signal<Reservation[]>([]);

  // Modal Visibility
  public isCreateModalOpen = signal<boolean>(false);

  // Forms Inputs
  public formDateTimeInput = '';
  public form = { customerName: '', customerPhone: '', customerId: null as number | null, partySize: 2, notes: '', tableId: null as number | null };

  // Tables helper
  public availableTables = computed(() => {
    return [...this.ordersService.tables$()].sort((a, b) => a.number - b.number);
  });

  ngOnInit(): void {
    this.filterDate = this.getLocalDateString();
    this.ordersService.loadTables();
    this.loadReservations();
  }

  loadReservations(): void {
    if (!this.filterDate) return;
    this.api.getReservations(this.filterDate).subscribe({
      next: (data) => {
        // Sort by reservation datetime
        const sorted = data.sort((a, b) => a.reservationDateTime.localeCompare(b.reservationDateTime));
        this.reservations.set(sorted);
      },
      error: () => this.notify.error('No se pudieron cargar las reservas del día.')
    });
  }

  getTableInfo(tableId: number | undefined): any {
    if (!tableId) return null;
    return this.ordersService.tables$().find(t => t.id === tableId);
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'Confirmada';
      case 'COMPLETED': return 'Completada';
      case 'CANCELLED': return 'Cancelada';
      case 'NO_SHOW': return 'No Show';
      default: return status;
    }
  }

  // --- AUTOCOMPLETE LOYALTY CLIENT BY PHONE ---
  onPhoneChange(phone: string): void {
    if (phone && phone.trim().length >= 7) {
      this.loyaltyApi.getCustomerByPhone(phone.trim()).subscribe({
        next: (cust) => {
          this.form.customerName = cust.fullName;
          this.form.customerId = cust.id;
          this.notify.success(`Cliente fidelizado autocompletado: ${cust.fullName}`);
        },
        error: () => {
          // Reset loyalty link but preserve name typing
          this.form.customerId = null;
        }
      });
    } else {
      this.form.customerId = null;
    }
  }

  // --- ACTIONS ---
  openCreateModal(): void {
    this.form = { customerName: '', customerPhone: '', customerId: null, partySize: 2, notes: '', tableId: null };
    // Prefill local date-time string
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
    this.formDateTimeInput = localISOTime;
    
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  saveReservation(): void {
    const { customerName, customerPhone, customerId, partySize, notes, tableId } = this.form;
    if (!customerName.trim() || !customerPhone.trim() || !this.formDateTimeInput) {
      this.notify.error('Completa los campos obligatorios.');
      return;
    }

    // Send local date-time directly to avoid timezone shift bugs
    const reservationDateTime = this.formDateTimeInput;

    this.api.createReservation({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerId: customerId ? customerId : undefined,
      reservationDateTime,
      partySize,
      notes: notes.trim() ? notes.trim() : undefined,
      tableId: tableId ? tableId : undefined
    }).subscribe({
      next: () => {
        this.notify.success('Reserva registrada correctamente.');
        this.closeCreateModal();
        this.loadReservations();
      },
      error: (err) => this.notify.error(err.error?.message || 'Error al registrar la reserva.')
    });
  }

  cancelReservation(res: Reservation): void {
    if (confirm(`¿Deseas cancelar la reserva a nombre de ${res.customerName}?`)) {
      this.api.cancelReservation(res.id).subscribe({
        next: () => {
          this.notify.success('Reserva cancelada.');
          this.loadReservations();
        },
        error: () => this.notify.error('No se pudo cancelar la reserva.')
      });
    }
  }

  completeReservation(res: Reservation): void {
    this.api.completeReservation(res.id).subscribe({
      next: () => {
        this.notify.success('Reserva marcada como completada (Llegó).');
        this.loadReservations();
      },
      error: () => this.notify.error('No se pudo completar la reserva.')
    });
  }

  noShowReservation(res: Reservation): void {
    this.api.noShowReservation(res.id).subscribe({
      next: () => {
        this.notify.success('Reserva marcada como No Show.');
        this.loadReservations();
      },
      error: () => this.notify.error('No se pudo registrar inasistencia.')
    });
  }
}
