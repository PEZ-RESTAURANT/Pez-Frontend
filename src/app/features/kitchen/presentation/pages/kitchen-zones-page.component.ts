import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KitchenApi, KitchenZone, PrintStation } from '../../infrastructure/api/kitchen.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import { SelectDirective } from '../../../../shared/ui/select/select.directive';
import { PrintAgentService } from '../../../../core/printing/print-agent.service';

@Component({
  selector: 'app-kitchen-zones-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, SelectDirective],
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-6">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm animate-in fade-in duration-300">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Zonas de Cocina</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Administra las diferentes estaciones de preparación para el despacho de comandas.
          </p>
        </div>

        <button 
          (click)="openCreateModal()"
          class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider"
        >
          + Nueva Zona
        </button>
      </div>

      <!-- ================= LISTADO DE ZONAS ================= -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-gray-100 dark:border-gray-850">
          <h3 class="text-sm font-black text-gray-400 uppercase tracking-wider">Catálogo de Estaciones</h3>
        </div>

        <div class="divide-y divide-gray-100 dark:divide-gray-850">
          @for (zone of zones(); track zone.id) {
            <div class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors">
              <div class="flex items-center gap-3">
                <span 
                  class="w-2.5 h-2.5 rounded-full"
                  [class.bg-emerald-500]="!zone.printingEnabled"
                  [class.bg-orange-500]="zone.printingEnabled"
                  [title]="zone.printingEnabled ? 'Impresión térmica activada' : 'KDS en pantalla'"
                ></span>
                <div>
                  <span class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ zone.name }}</span>
                  <span class="ml-2 text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                    {{ zone.printingEnabled ? 'Ticket Físico (Impresora)' : 'KDS Digital' }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button 
                  (click)="openEditModal(zone)"
                  class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors cursor-pointer"
                  title="Editar zona"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  (click)="deleteZone(zone)"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          }
          @if (zones().length === 0) {
            <div class="p-8 text-center text-gray-400">
              No hay zonas de cocina configuradas en este momento.
            </div>
          }
        </div>
      </div>

      <!-- ================= NOTA DE INSTALACIÓN (KIOSK PRINTING) ================= -->
      <div class="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 rounded-2xl p-5 space-y-3">
        <div class="flex items-center gap-2 text-blue-800 dark:text-blue-400">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 class="font-extrabold text-sm uppercase tracking-wide">Instrucciones de Instalación de Tickets</h4>
        </div>
        <p class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-normal">
          Para que el sistema imprima comandas y comprobantes en ticket térmico sin solicitar confirmación en cada pedido:
        </p>
        <ol class="list-decimal pl-5 text-xs text-blue-700/90 dark:text-blue-300/90 space-y-1.5 font-normal">
          <li>Defina la ticketera térmica correspondiente como la <strong>impresora predeterminada del sistema operativo</strong> (Windows/macOS).</li>
          <li>Inicie el navegador Google Chrome con el parámetro de ejecución <code>--kiosk-printing</code> en el acceso directo de la máquina.</li>
          <li>Seleccione a continuación el puesto de trabajo/estación correspondiente para registrar la trazabilidad de impresión.</li>
        </ol>
      </div>

      <!-- ================= PUESTO DE ESTE DISPOSITIVO ================= -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Puesto de Auditoría -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm p-6 space-y-4">
          <div>
            <h3 class="text-base font-extrabold text-gray-900 dark:text-white">Estación de Auditoría</h3>
            <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Asigna este navegador a un puesto para auditar y rastrear quién originó cada comanda.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
            <select appSelect
              [(ngModel)]="selectedStationName"
              (change)="saveSelectedStation()"
              class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Sin Puesto Asignado --</option>
              @for (station of stations(); track station.id) {
                <option [value]="station.name">{{ station.name }}</option>
              }
            </select>
          </div>
          <div class="flex items-center text-xs font-bold text-emerald-600 gap-1.5" *ngIf="selectedStationName()">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Asignado a: {{ selectedStationName() }}
          </div>
        </div>

        <!-- Impresora Física del Terminal -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm p-6 space-y-4">
          <div>
            <h3 class="text-base font-extrabold text-gray-900 dark:text-white">Ticketera Física Local</h3>
            <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Selecciona la ticketera (USB directo WinUSB o Spooler) conectada localmente a este equipo.
            </p>
          </div>

          <div class="flex flex-col gap-3 w-full">
            @if (!agentActive()) {
              <div class="text-xs font-bold text-amber-600 dark:text-amber-400 py-2">
                ⚠️ Al Toque Print Agent no está corriendo en este equipo. Inícialo para configurar.
              </div>
            } @else {
              <select appSelect
                [(ngModel)]="selectedPrinterName"
                (change)="saveSelectedPrinter()"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Sin Impresora Local --</option>
                @for (pr of localPrinters(); track pr) {
                  <option [value]="pr">{{ pr }}</option>
                }
              </select>
              
              <button
                (click)="detectUsbPrinters()"
                [disabled]="detecting()"
                class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <svg *ngIf="detecting()" class="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ detecting() ? 'Esperando autorización UAC...' : 'Detectar Impresoras USB (WinUSB)' }}</span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- ================= ESTACIONES DE IMPRESIÓN ================= -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-gray-100 dark:border-gray-850">
          <h3 class="text-sm font-black text-gray-400 uppercase tracking-wider">Estaciones de Impresión (Puestos de Trabajo)</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-normal">Crea las estaciones físicas del restaurante para configurar dispositivos.</p>
        </div>

        <div class="p-5 bg-gray-50/50 dark:bg-gray-850/20 border-b border-gray-100 dark:border-gray-850 flex flex-col sm:flex-row gap-3">
          <input 
            type="text"
            [(ngModel)]="newStationName"
            placeholder="Ej. Caja Principal, Mozo Tablet A, Barra 1"
            class="flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            (click)="createStation()"
            [disabled]="!newStationName.trim()"
            class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider whitespace-nowrap"
          >
            + Agregar Estación
          </button>
        </div>

        <div class="divide-y divide-gray-100 dark:divide-gray-850">
          @for (station of stations(); track station.id) {
            <div class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors">
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ station.name }}</span>
              </div>

              <button 
                (click)="deleteStation(station)"
                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                title="Eliminar Estación"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          }
          @if (stations().length === 0) {
            <div class="p-8 text-center text-gray-400">
              No hay estaciones de impresión configuradas.
            </div>
          }
        </div>
      </div>

    </div>

    <!-- MODAL DE CREACIÓN / EDICIÓN -->
    <app-modal-shell
      [open]="isModalOpen()"
      [title]="editMode() ? 'Editar Zona' : 'Nueva Zona de Cocina'"
      [description]="editMode() ? 'Modifica el nombre o el canal de comandas para la zona de cocina.' : 'Registra una nueva zona para agrupar y filtrar la preparación de tus productos.'"
      [hasFooter]="true"
      (close)="closeModal()"
    >
      <form (submit)="saveZone()" class="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
        <div>
          <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Nombre de la Zona</label>
          <input 
            type="text"
            required
            [(ngModel)]="zoneForm.name"
            name="zName"
            placeholder="Ej. Parrilla, Barra, Calientes"
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex items-center gap-3 pt-2">
          <input 
            type="checkbox"
            [(ngModel)]="zoneForm.printingEnabled"
            name="zPrinting"
            id="zPrinting"
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label for="zPrinting" class="select-none font-bold text-sm text-gray-750 dark:text-gray-300 cursor-pointer">
            Habilitar impresión física de comandas (Ticketera)
          </label>
        </div>

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
            [disabled]="!zoneForm.name.trim()"
            class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
          >
            {{ editMode() ? 'Actualizar' : 'Guardar Zona' }}
          </button>
        </div>
      </form>
    </app-modal-shell>
  `
})
export class KitchenZonesPageComponent implements OnInit {
  private api = inject(KitchenApi);
  private notify = inject(NotificationService);
  private printAgent = inject(PrintAgentService);

  public zones = signal<KitchenZone[]>([]);
  public stations = signal<PrintStation[]>([]);
  public selectedStationName = signal<string>('');
  public newStationName = '';

  // Configuración de impresora local
  public agentActive = signal<boolean>(false);
  public localPrinters = signal<string[]>([]);
  public selectedPrinterName = '';
  public detecting = signal<boolean>(false);

  public isModalOpen = signal<boolean>(false);
  public editMode = signal<boolean>(false);

  public zoneForm = { id: 0, name: '', printingEnabled: false };

  ngOnInit(): void {
    this.loadZones();
    this.loadStations();
    const savedStation = localStorage.getItem('altoque-selected-print-station') || '';
    this.selectedStationName.set(savedStation);
    this.checkAgentAndLoadPrinters();
  }

  checkAgentAndLoadPrinters(): void {
    this.printAgent.checkAgentStatus().subscribe({
      next: (active) => {
        this.agentActive.set(active);
        if (active) {
          this.printAgent.getSystemPrinters().subscribe({
            next: (list) => {
              this.localPrinters.set(list);
              this.selectedPrinterName = this.printAgent.getSelectedPrinter();
            }
          });
        }
      }
    });
  }

  saveSelectedPrinter(): void {
    this.printAgent.saveSelectedPrinter(this.selectedPrinterName);
    this.notify.success('Impresora local asignada a este terminal.');
  }

  detectUsbPrinters(): void {
    this.detecting.set(true);
    this.notify.info('Solicitando vinculación de driver WinUSB. Confirma la autorización de administrador (UAC).');
    
    this.printAgent.detectNewPrinters().subscribe({
      next: (res) => {
        this.detecting.set(false);
        if (res && res.success) {
          this.notify.success(res.message || 'Vinculación de driver WinUSB completada.');
          this.checkAgentAndLoadPrinters();
        } else {
          this.notify.error(res?.error || 'Error al vincular el driver.');
        }
      },
      error: (err) => {
        this.detecting.set(false);
        const errMsg = err.error?.error || err.error?.message || 'Autorización denegada (UAC cancelado) o error del agente.';
        this.notify.error(errMsg);
      }
    });
  }

  loadZones(): void {
    this.api.getZones().subscribe({
      next: (data) => this.zones.set(data),
      error: () => this.notify.error('Error al cargar las zonas de cocina.')
    });
  }

  loadStations(): void {
    this.api.getPrintStations().subscribe({
      next: (data) => this.stations.set(data),
      error: () => this.notify.error('Error al cargar las estaciones de impresión.')
    });
  }

  createStation(): void {
    const name = this.newStationName.trim();
    if (!name) return;
    this.api.createPrintStation(name).subscribe({
      next: () => {
        this.newStationName = '';
        this.notify.success('Estación de impresión agregada.');
        this.loadStations();
      },
      error: (err) => this.notify.error(err.error?.message || 'Error al crear la estación.')
    });
  }

  deleteStation(station: PrintStation): void {
    if (!confirm(`¿Deseas eliminar la estación "${station.name}"?`)) return;
    this.api.deletePrintStation(station.id).subscribe({
      next: () => {
        this.notify.success('Estación eliminada.');
        if (this.selectedStationName() === station.name) {
          this.selectedStationName.set('');
          localStorage.removeItem('altoque-selected-print-station');
        }
        this.loadStations();
      },
      error: (err) => this.notify.error(err.error?.message || 'Error al eliminar la estación.')
    });
  }

  saveSelectedStation(): void {
    localStorage.setItem('altoque-selected-print-station', this.selectedStationName());
    this.notify.success('Estación predeterminada asignada a este navegador.');
  }

  openCreateModal(): void {
    this.editMode.set(false);
    this.zoneForm = { id: 0, name: '', printingEnabled: false };
    this.isModalOpen.set(true);
  }

  openEditModal(zone: KitchenZone): void {
    this.editMode.set(true);
    this.zoneForm = { id: zone.id, name: zone.name, printingEnabled: zone.printingEnabled };
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveZone(): void {
    const name = this.zoneForm.name.trim();
    if (!name) return;

    if (this.editMode()) {
      this.api.updateZone(this.zoneForm.id, name, this.zoneForm.printingEnabled).subscribe({
        next: () => {
          this.notify.success('Zona de cocina actualizada.');
          this.closeModal();
          this.loadZones();
        },
        error: (err) => this.notify.error(err.error?.message || 'Error al actualizar la zona.')
      });
    } else {
      this.api.createZone(name, this.zoneForm.printingEnabled).subscribe({
        next: () => {
          this.notify.success('Zona de cocina creada.');
          this.closeModal();
          this.loadZones();
        },
        error: (err) => this.notify.error(err.error?.message || 'Error al crear la zona de cocina.')
      });
    }
  }

  deleteZone(zone: KitchenZone): void {
    const msg = `¿Estás seguro de eliminar permanentemente la zona de cocina "${zone.name}"?\n\n` +
                `IMPORTANTE: Todos los productos asociados perderán su asignación y pasarán a procesarse en la cola general de cocina.`;
    
    if (!confirm(msg)) return;

    this.api.deleteZone(zone.id).subscribe({
      next: () => {
        this.notify.success(`Zona "${zone.name}" eliminada.`);
        this.loadZones();
      },
      error: (err) => this.notify.error(err.error?.message || 'No se pudo eliminar la zona.')
    });
  }
}
