import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { OrdersService } from '../../infrastructure/services/orders.service';
import { OrdersApi } from '../../infrastructure/api/orders.api';
import { RestaurantTable } from '../../domain/models/orders.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';

@Component({
  selector: 'app-layout-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, ModalShellComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm animate-in fade-in duration-300">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Editor de Layout de Mesas</span>
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Diseña y posiciona en tiempo real las mesas de los diferentes pisos de tu restaurante.
          </p>
        </div>

        <!-- CONTROLES GLOBALES -->
        <div class="flex items-center gap-2">
          <!-- SELECTOR DE PISO -->
          <div class="inline-flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-800 shadow-xs">
            @for (f of floors(); track f) {
              <button 
                (click)="activeFloor.set(f)"
                [class.bg-white]="activeFloor() === f"
                [class.dark:bg-gray-800]="activeFloor() === f"
                [class.text-gray-900]="activeFloor() === f"
                [class.dark:text-white]="activeFloor() === f"
                [class.shadow-xs]="activeFloor() === f"
                [class.text-gray-500]="activeFloor() !== f"
                class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Piso {{ f }}
              </button>
            }
            <button 
              (click)="addNewFloor()"
              class="px-2.5 py-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              title="Añadir Piso"
            >
              +
            </button>
          </div>

          <!-- BOTÓN NUEVA MESA -->
          <button 
            (click)="createTable()"
            class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider"
          >
            + Nueva Mesa
          </button>
        </div>
      </div>

      <!-- LAYOUT & SIDEBAR EDITOR -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <!-- LIENZO DE DIBUJO (CDK CANVAS) - 8 COLS -->
        <div class="lg:col-span-8 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex flex-col space-y-4">
          <!-- BARRA INTERNA DE ZOOMS Y VISTA -->
          <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black uppercase text-gray-400">Zoom:</span>
              <button 
                (click)="zoomOut()"
                [disabled]="zoom() <= 0.5"
                class="p-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-750 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-black disabled:opacity-50 cursor-pointer w-8 h-8"
              >
                -
              </button>
              <span class="text-xs font-black text-gray-700 dark:text-gray-300 w-12 text-center">{{ (zoom() * 100).toFixed(0) }}%</span>
              <button 
                (click)="zoomIn()"
                [disabled]="zoom() >= 2.0"
                class="p-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-750 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-black disabled:opacity-50 cursor-pointer w-8 h-8"
              >
                +
              </button>
              <button 
                (click)="zoomReset()"
                class="px-2 py-1 text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-bold"
              >
                Reset
              </button>
            </div>

            <!-- LEYENDA ESPACIAL -->
            <div class="flex items-center gap-4 text-[10px] font-black uppercase text-gray-400">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 bg-blue-500 rounded-md"></span>
                <span>Piso Actual</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md"></span>
                <span>Piso Inferior de Fondo</span>
              </div>
            </div>
          </div>

          <!-- CANVAS WRAPPER OVERFLOW -->
          <div class="relative w-full h-[550px] bg-slate-50 dark:bg-gray-950/20 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner overflow-auto canvas-boundary">
            <!-- SCALE CONTAINER FOR ZOOM -->
            <div 
              [style.transform]="'scale(' + zoom() + ')'"
              [style.transformOrigin]="'top left'"
              class="relative w-[1200px] h-[1000px] transition-transform duration-100"
            >
              
              <!-- 1. CAPA DE FONDO: PISO INFERIOR DIFUMINADO -->
              @if (activeFloor() > 1) {
                @for (bgTable of backgroundTables(); track bgTable.id) {
                  <div 
                    [style.left.px]="bgTable.positionX"
                    [style.top.px]="bgTable.positionY"
                    class="absolute w-20 h-20 rounded-xl bg-gray-200/50 dark:bg-gray-800/40 border border-gray-300/30 dark:border-gray-700/20 flex flex-col items-center justify-center pointer-events-none opacity-40 blur-[1px]"
                  >
                    <span class="text-sm font-black text-gray-400">M{{ bgTable.number }}</span>
                    <span class="text-[8px] text-gray-400 font-extrabold uppercase mt-0.5">Piso {{ bgTable.floor }}</span>
                  </div>
                }
              }

              <!-- 2. CAPA PRINCIPAL: MESAS PISO ACTIVO ARRASTRABLES -->
              @for (table of activeFloorTables(); track table.id) {
                <div 
                  cdkDrag
                  [cdkDragBoundary]="'.canvas-boundary'"
                  (cdkDragEnded)="onDragEnded(table, $event)"
                  (click)="selectTable(table)"
                  [style.left.px]="table.positionX"
                  [style.top.px]="table.positionY"
                  [class.border-blue-500]="selectedTable()?.id === table.id"
                  [class.ring-2]="selectedTable()?.id === table.id"
                  [class.ring-blue-500/25]="selectedTable()?.id === table.id"
                  class="absolute w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg hover:border-blue-300 cursor-move flex flex-col items-center justify-between p-3 select-none transition-shadow"
                >
                  <div class="w-full flex items-center justify-between">
                    <span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-900 text-gray-500">
                      M{{ table.number }}
                    </span>
                    @if (table.anchorTableId) {
                      <span class="text-purple-500" title="Fusionada">
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </span>
                    }
                  </div>

                  <span class="text-xs font-black text-gray-800 dark:text-gray-200">{{ table.zoneTag || 'Salón' }}</span>
                  <span class="text-[8px] text-gray-400 font-extrabold">{{ table.positionX }}, {{ table.positionY }}</span>
                </div>
              }

            </div>
          </div>
        </div>

        <!-- SIDEBAR DE DETALLES Y EDICIÓN - 4 COLS -->
        <div class="lg:col-span-4">
          @if (selectedTable(); as table) {
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4 animate-in slide-in-from-right duration-250">
              <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Mesa M{{ table.number }}</h3>
              
              <form (submit)="saveTableDetails()" class="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
                <div>
                  <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Número de Mesa</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    [(ngModel)]="tableForm.number"
                    name="tNum"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Piso</label>
                  <select 
                    [(ngModel)]="tableForm.floor"
                    name="tFloor"
                    required
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    @for (f of floors(); track f) {
                      <option [value]="f">Piso {{ f }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Zona (Texto Libre)</label>
                  <input 
                    type="text"
                    [(ngModel)]="tableForm.zoneTag"
                    name="tZone"
                    placeholder="Ej. Terraza, VIP, Salón"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div class="pt-3 border-t border-gray-150 dark:border-gray-800 flex gap-2">
                  <button 
                    type="submit"
                    class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer text-center"
                  >
                    Guardar Cambios
                  </button>
                  <button 
                    type="button"
                    (click)="deleteTable(table)"
                    class="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 font-bold text-xs rounded-xl cursor-pointer"
                    title="Eliminar Mesa"
                  >
                    Eliminar
                  </button>
                </div>
              </form>
            </div>
          } @else {
            <div class="bg-gray-50/50 dark:bg-gray-900/30 p-8 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <svg class="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Haz clic sobre una mesa para editar sus propiedades de piso, número o zona.
            </div>
          }
        </div>

      </div>

    </div>
  `
})
export class LayoutEditorPageComponent implements OnInit {
  public ordersService = inject(OrdersService);
  private api = inject(OrdersApi);
  private notify = inject(NotificationService);

  public activeFloor = signal<number>(1);
  public zoom = signal<number>(1.0);
  
  public selectedTable = signal<RestaurantTable | null>(null);
  public tableForm = { number: 0, floor: 1, zoneTag: '' };

  // Floors configured in the system. Default to at least Piso 1.
  public floors = signal<number[]>([1, 2]);

  // Active Floor Tables
  public activeFloorTables = computed(() => {
    return this.ordersService.tables$().filter(t => t.floor === this.activeFloor());
  });

  // Background Floor Tables (render Piso - 1 as reference)
  public backgroundTables = computed(() => {
    const bgFloor = this.activeFloor() - 1;
    if (bgFloor < 1) return [];
    return this.ordersService.tables$().filter(t => t.floor === bgFloor);
  });

  ngOnInit(): void {
    this.ordersService.loadTables();
    
    // Automatically identify existing floors from tables list
    effect(() => {
      const list = this.ordersService.tables$();
      const floorSet = new Set<number>([1, 2]); // Start with at least 1 and 2
      list.forEach(t => floorSet.add(t.floor));
      const sorted = Array.from(floorSet).sort((a, b) => a - b);
      this.floors.set(sorted);
    }, { allowSignalWrites: true });
  }

  // --- FLOORS ACTIONS ---
  addNewFloor(): void {
    const nextFloor = Math.max(...this.floors()) + 1;
    this.floors.set([...this.floors(), nextFloor]);
    this.activeFloor.set(nextFloor);
    this.notify.success(`Piso ${nextFloor} habilitado en el editor.`);
  }

  // --- ZOOM ACTIONS ---
  zoomIn(): void {
    this.zoom.set(Math.min(2.0, this.zoom() + 0.1));
  }

  zoomOut(): void {
    this.zoom.set(Math.max(0.5, this.zoom() - 0.1));
  }

  zoomReset(): void {
    this.zoom.set(1.0);
  }

  // --- DRAG ENDED (AUTO POSITION SAVE) ---
  onDragEnded(table: RestaurantTable, event: CdkDragEnd): void {
    const element = event.source.getRootElement();
    const parentRect = element.parentElement!.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // Calculate drag position relative to the scaled container parent element
    const x = Math.max(0, Math.round((elementRect.left - parentRect.left) / this.zoom()));
    const y = Math.max(0, Math.round((elementRect.top - parentRect.top) / this.zoom()));

    this.api.updateTablePosition(table.id, x, y).subscribe({
      next: () => {
        this.notify.success(`Mesa M${table.number} posicionada.`);
        this.ordersService.loadTables();
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Error al guardar la posición de la mesa.');
        event.source.reset(); // Revert back
      }
    });
  }

  // --- SELECTION ---
  selectTable(table: RestaurantTable): void {
    this.selectedTable.set(table);
    this.tableForm = {
      number: table.number,
      floor: table.floor,
      zoneTag: table.zoneTag || ''
    };
  }

  // --- CRUD ACTIONS ---
  createTable(): void {
    const list = this.ordersService.tables$();
    
    // Auto-calculate the next logical table number
    const maxNumber = list.length > 0 ? Math.max(...list.map(t => t.number)) : 0;
    const nextNumber = maxNumber + 1;

    // Adjust position incrementally so they don't overlay
    const count = list.length;
    const posX = 50 + (count % 6) * 45;
    const posY = 50 + Math.floor(count / 6) * 45;

    this.api.createTable(
      nextNumber,
      this.activeFloor(),
      'Salón',
      posX,
      posY
    ).subscribe({
      next: (newTable) => {
        this.notify.success(`Mesa M${nextNumber} creada.`);
        this.ordersService.loadTables();
        this.selectTable(newTable);
      },
      error: () => this.notify.error('No se pudo crear la mesa nueva.')
    });
  }

  saveTableDetails(): void {
    const table = this.selectedTable();
    if (!table) return;

    const { number, floor, zoneTag } = this.tableForm;
    if (number <= 0) {
      this.notify.error('El número de mesa debe ser positivo.');
      return;
    }

    this.api.updateTable(table.id, number, floor, zoneTag.trim()).subscribe({
      next: () => {
        this.notify.success('Detalles de la mesa actualizados.');
        this.selectedTable.set(null);
        this.ordersService.loadTables();
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Error al actualizar los detalles.');
      }
    });
  }

  deleteTable(table: RestaurantTable): void {
    if (!confirm(`¿Estás seguro de eliminar permanentemente la mesa M${table.number}?`)) return;

    this.api.deleteTable(table.id).subscribe({
      next: () => {
        this.notify.success(`Mesa M${table.number} eliminada.`);
        this.selectedTable.set(null);
        this.ordersService.loadTables();
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'No se puede eliminar la mesa en este momento.');
      }
    });
  }
}
