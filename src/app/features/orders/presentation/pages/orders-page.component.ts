import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrdersService } from '../../infrastructure/services/orders.service';
import { OrdersApi } from '../../infrastructure/api/orders.api';
import { RestaurantTable } from '../../domain/models/orders.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      
      <!-- HEADER CON INDICADORES Y CONTADORES -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm animate-in fade-in duration-300">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Salón Principal</span>
            <span class="flex h-3 w-3 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Monitoreo y comandado en tiempo real.</p>
        </div>

        <!-- CONTADORES DE MESAS -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-xs font-semibold">
          <div class="px-4 py-2 text-center rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs">
            <span class="text-gray-400 block mb-0.5">Libres</span>
            <span class="text-emerald-600 text-lg font-bold">{{ stats().free }}</span>
          </div>
          <div class="px-4 py-2 text-center rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs">
            <span class="text-gray-400 block mb-0.5">Por Atender</span>
            <span class="text-amber-500 text-lg font-bold">{{ stats().unattended }}</span>
          </div>
          <div class="px-4 py-2 text-center rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs">
            <span class="text-gray-400 block mb-0.5">Ocupadas</span>
            <span class="text-blue-500 text-lg font-bold">{{ stats().occupied }}</span>
          </div>
          <div class="px-4 py-2 text-center rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs">
            <span class="text-gray-400 block mb-0.5">Total</span>
            <span class="text-gray-800 dark:text-gray-200 text-lg font-bold">{{ stats().total }}</span>
          </div>
        </div>
      </div>

      <!-- BARRA DE CONTROLES -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-xs">
        
        <!-- MODO DE VISTA (MAPA VS CARDS) -->
        <div class="inline-flex p-1 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200/50 dark:border-gray-800">
          <button 
            (click)="setViewMode('map')"
            [class.bg-white]="viewMode() === 'map'"
            [class.dark:bg-gray-800]="viewMode() === 'map'"
            [class.text-gray-900]="viewMode() === 'map'"
            [class.dark:text-white]="viewMode() === 'map'"
            [class.shadow-xs]="viewMode() === 'map'"
            [class.text-gray-500]="viewMode() !== 'map'"
            class="px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-2 cursor-pointer"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Mapa de Mesas
          </button>
          <button 
            (click)="setViewMode('cards')"
            [class.bg-white]="viewMode() === 'cards'"
            [class.dark:bg-gray-800]="viewMode() === 'cards'"
            [class.text-gray-900]="viewMode() === 'cards'"
            [class.dark:text-white]="viewMode() === 'cards'"
            [class.shadow-xs]="viewMode() === 'cards'"
            [class.text-gray-500]="viewMode() !== 'cards'"
            class="px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-2 cursor-pointer"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Pedidos Activos
          </button>
        </div>

        <!-- ACCIONES RÁPIDAS -->
        <div class="flex items-center gap-2">
          <button 
            (click)="openMergeModal()"
            class="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-xs rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Unir Mesas
          </button>
          <button 
            (click)="openTransferModal()"
            class="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-xs rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2m-9-18l-9 2m9 16V5m0 14L3 17M12 5l9 2M6 20h12" />
            </svg>
            Trasladar Comanda
          </button>
        </div>
      </div>

      <!-- VISTA MAPA DE MESAS (LAYOUT FÍSICO) -->
      <div *ngIf="viewMode() === 'map'" class="relative min-h-[600px] w-full bg-slate-50 dark:bg-gray-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-inner p-4 overflow-auto">
        <!-- Selector de Piso -->
        <div class="absolute top-4 left-4 z-10 inline-flex p-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl border border-gray-250/50 dark:border-gray-700 shadow-xs">
          @for (f of floors(); track f) {
            <button 
              (click)="activeFloor.set(f)"
              [class.bg-blue-600]="activeFloor() === f"
              [class.text-white]="activeFloor() === f"
              [class.text-gray-500]="activeFloor() !== f"
              class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              Piso {{ f }}
            </button>
          }
        </div>

        <!-- Contenedor del Layout a Escala -->
        <div class="relative w-[1200px] h-[800px] mt-12">
          @for (table of activeFloorTables(); track table.id) {
            <div 
              (click)="onTableClick(table)"
              [ngClass]="getStatusClasses(table)"
              [style.left.px]="table.positionX"
              [style.top.px]="table.positionY"
              class="absolute w-24 h-24 rounded-2xl flex flex-col items-center justify-between p-3.5 cursor-pointer relative shadow-md transition-all duration-300 transform hover:scale-[1.03]"
            >
              
              <!-- Icono superior/fusión/bloqueo -->
              <div class="w-full flex items-center justify-between">
                <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 uppercase tracking-wider text-gray-750 dark:text-gray-200">
                  M{{ table.number }}
                </span>
                
                <!-- Icono de anclaje de fusión -->
                <span *ngIf="table.anchorTableId" class="text-purple-650 dark:text-purple-400" title="Mesa fusionada">
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </span>
              </div>

              <!-- Numero de Mesa Central / Zona -->
              <div class="text-center">
                <span class="text-xs font-black text-gray-900 dark:text-white leading-none block">M{{ table.number }}</span>
                <span class="text-[9px] text-gray-400 font-bold block mt-1 uppercase">{{ table.zoneTag || 'Salón' }}</span>
              </div>

              <!-- Bloqueo del Mozo inferior -->
              <div class="w-full flex items-center justify-center min-h-[1.25rem]">
                @if (isTableLocked(table.id)) {
                  <div class="flex items-center gap-1 bg-red-100 dark:bg-red-950/50 px-1.5 py-0.5 rounded-full border border-red-200 dark:border-red-900/50 animate-pulse text-[8px] text-red-700 dark:text-red-300 font-bold" [title]="'Mesa bloqueada por ' + getLockWaiter(table.id)">
                    <span class="w-1 h-1 rounded-full bg-red-500"></span>
                    <span>{{ getWaiterInitials(getLockWaiter(table.id)) }}</span>
                  </div>
                }
              </div>

              <!-- Botón Desunir si es Ancla -->
              <button 
                *ngIf="isAnchorTable(table.id)"
                (click)="onUnmergeClick($event, table.id)"
                class="absolute -top-2 -right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg border border-red-500 cursor-pointer"
                title="Desunir grupo de mesas"
              >
                <svg class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          }
        </div>
      </div>

      <!-- VISTA CARDS (PEDIDOS ACTIVOS) -->
      <div *ngIf="viewMode() === 'cards'" class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-in fade-in duration-200">
        @for (table of activeTables(); track table.id) {
          <div 
            (click)="onTableClick(table)"
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 relative"
          >
            <div class="flex justify-between items-start mb-4">
              <div>
                <span class="text-2xl font-black text-gray-900 dark:text-white">Mesa {{ table.number }}</span>
                <span class="text-xs text-gray-400 block mt-0.5 uppercase">{{ table.zoneTag || 'Salón' }}</span>
              </div>
              <span [ngClass]="getStatusBadgeClasses(table.status)" class="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {{ getStatusText(table) }}
              </span>
            </div>

            <!-- Lock Info -->
            <div class="flex items-center justify-between text-xs border-t border-gray-100 dark:border-gray-700/60 pt-4 mt-2">
              <span class="text-gray-400 font-medium">Estado del Lock:</span>
              @if (isTableLocked(table.id)) {
                <span class="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  En uso por {{ getLockWaiter(table.id) }}
                </span>
              } @else {
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">Disponible</span>
              }
            </div>
          </div>
        }
        @if (activeTables().length === 0) {
          <div class="col-span-full py-16 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <svg class="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="font-semibold">No hay comensales ni pedidos activos en este momento.</p>
            <p class="text-xs text-gray-500 mt-1">Cambia a modo Mapa para abrir una nueva mesa.</p>
          </div>
        }
      </div>

    </div>

    <!-- MODAL PARA UNIR MESAS (MERGE) -->
    <app-modal-shell
      [open]="mergeModalOpen()"
      [title]="'Fusionar/Unir Mesas'"
      [description]="'Selecciona una mesa anfitriona (ancla) y las mesas adicionales para unirlas físicamente.'"
      [hasFooter]="true"
      (close)="closeMergeModal()"
    >
      <div class="space-y-4 text-sm text-foreground">
        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Mesa Ancla (Principal)</label>
          <select 
            [(ngModel)]="selectedAnchorId"
            (change)="onAnchorChange()"
            class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 font-semibold text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option [value]="null">-- Selecciona una mesa --</option>
            @for (table of mergeableAnchorTables(); track table.id) {
              <option [value]="table.id">Mesa M{{ table.number }} (Status: {{ getStatusText(table) }} - {{ table.zoneTag }})</option>
            }
          </select>
        </div>

        <div *ngIf="selectedAnchorId">
          <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Mesas a unirse (Deben estar libres)</label>
          <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200/50 dark:border-gray-800/80">
            @for (table of mergeableChildTables(); track table.id) {
              <label class="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750">
                <input 
                  type="checkbox"
                  [checked]="selectedChildIds.includes(table.id)"
                  (change)="toggleChildSelection(table.id)"
                  class="rounded text-blue-600 focus:ring-blue-500 focus:outline-none h-4 w-4"
                />
                <span class="font-bold text-gray-800 dark:text-gray-200">Mesa M{{ table.number }}</span>
              </label>
            }
            @if (mergeableChildTables().length === 0) {
              <p class="col-span-full text-center text-xs text-gray-400 py-4">No hay mesas libres disponibles para fusionar.</p>
            }
          </div>
        </div>
      </div>

      <div modalFooter class="flex items-center justify-end gap-2 w-full">
        <button 
          (click)="closeMergeModal()"
          class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs cursor-pointer transition-colors"
        >
          Cancelar
        </button>
        <button 
          (click)="submitMerge()"
          [disabled]="!selectedAnchorId || selectedChildIds.length === 0"
          class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          Guardar Fusión
        </button>
      </div>
    </app-modal-shell>

    <!-- MODAL PARA TRASLADAR COMANDA (TRANSFER) -->
    <app-modal-shell
      [open]="transferModalOpen()"
      [title]="'Trasladar Comanda'"
      [description]="'Traslada el pedido activo de una mesa hacia otra mesa disponible en el local.'"
      [hasFooter]="true"
      (close)="closeTransferModal()"
    >
      <div class="space-y-4 text-sm text-foreground">
        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Mesa de Origen (Con pedido activo)</label>
          <select 
            [(ngModel)]="selectedTransferFrom"
            class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 font-semibold text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option [value]="null">-- Selecciona origen --</option>
            @for (table of tablesWithActiveOrders(); track table.id) {
              <option [value]="table.id">Mesa M{{ table.number }} (Status: {{ getStatusText(table) }})</option>
            }
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Mesa de Destino (Debe estar libre)</label>
          <select 
            [(ngModel)]="selectedTransferTo"
            class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 font-semibold text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option [value]="null">-- Selecciona destino --</option>
            @for (table of freeTables(); track table.id) {
              <option [value]="table.id">Mesa M{{ table.number }} ({{ table.zoneTag }})</option>
            }
          </select>
        </div>
      </div>

      <div modalFooter class="flex items-center justify-end gap-2 w-full">
        <button 
          (click)="closeTransferModal()"
          class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs cursor-pointer transition-colors"
        >
          Cancelar
        </button>
        <button 
          (click)="submitTransfer()"
          [disabled]="!selectedTransferFrom || !selectedTransferTo"
          class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          Confirmar Traslado
        </button>
      </div>
    </app-modal-shell>
  `
})
export class OrdersPageComponent implements OnInit {
  public ordersService = inject(OrdersService);
  private api = inject(OrdersApi);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private session = inject(SessionService);

  public viewMode = signal<'map' | 'cards'>('map');
  public activeFloor = signal<number>(1);

  // Modal signals
  public mergeModalOpen = signal<boolean>(false);
  public transferModalOpen = signal<boolean>(false);

  // Merge state variables
  public selectedAnchorId: number | null = null;
  public selectedChildIds: number[] = [];

  // Transfer state variables
  public selectedTransferFrom: number | null = null;
  public selectedTransferTo: number | null = null;

  public floors = computed(() => {
    const list = this.ordersService.tables$();
    const floorSet = new Set<number>([1]);
    list.forEach(t => floorSet.add(t.floor));
    return Array.from(floorSet).sort((a, b) => a - b);
  });

  public activeFloorTables = computed(() => {
    return this.ordersService.tables$().filter(t => t.floor === this.activeFloor());
  });

  ngOnInit(): void {
    // Al cargar la vista, forzamos carga completa vía REST
    this.ordersService.loadTables();
    this.ordersService.loadTableLocks();
    this.ordersService.loadOrders();
  }

  setViewMode(mode: 'map' | 'cards'): void {
    this.viewMode.set(mode);
  }

  // CONTADORES Y ESTADÍSTICAS RÁPIDAS
  public stats = computed(() => {
    const list = this.ordersService.tables$();
    return {
      total: list.length,
      free: list.filter(t => t.status === 'FREE').length,
      unattended: list.filter(t => t.status === 'UNATTENDED').length,
      occupied: list.filter(t => t.status !== 'FREE').length
    };
  });

  public sortedTables = computed(() => {
    return [...this.ordersService.tables$()].sort((a, b) => a.number - b.number);
  });

  public activeTables = computed(() => {
    return this.ordersService.tables$().filter(t => t.status !== 'FREE');
  });

  public freeTables = computed(() => {
    return this.ordersService.tables$().filter(t => t.status === 'FREE' && !t.anchorTableId);
  });

  // LOCK UTILITIES
  isTableLocked(tableId: number): boolean {
    return !!this.ordersService.tableLocks$()[tableId];
  }

  getLockWaiter(tableId: number): string {
    return this.ordersService.tableLocks$()[tableId]?.waiterName || '';
  }

  getWaiterInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // CLICK EN MESA - LÓGICA DE LOCKING Y NAVEGACIÓN
  onTableClick(table: RestaurantTable): void {
    const currentUserId = this.session.getCurrentUserId();
    const lock = this.ordersService.tableLocks$()[table.id];

    if (lock) {
      // Si la mesa está bloqueada por mí, continúo
      // Nota: idealmente contrastamos waiterId. En esta especificación, si coincide con el mozo, o si está bloqueada por cualquiera, validamos contra el nombre.
      this.notify.info(`Mesa M${table.number} en uso por ${lock.waiterName}`);
      return;
    }

    // Mesa libre de locks en frontend -> Llama a lock en el backend
    this.api.lockTable(table.id).subscribe({
      next: () => {
        // Exito -> Navegar a detalle
        this.router.navigate(['/app/orders', table.id]);
      },
      error: (err) => {
        if (err.status === 409) {
          this.notify.error(`Mesa M${table.number} en uso por otro mozo.`);
        } else {
          this.notify.error('No se pudo bloquear la mesa.');
        }
      }
    });
  }

  // ESTILOS Y COLORES POR ESTADO DE MESA
  getStatusClasses(table: RestaurantTable): Record<string, boolean> {
    const isLocked = this.isTableLocked(table.id);
    const status = table.status;
    return {
      'bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-500': status === 'FREE' && !isLocked,
      'bg-red-50 hover:bg-red-100 border-2 border-red-500 text-red-800 dark:bg-red-950/20 dark:border-red-500 animate-pulse': status === 'UNATTENDED',
      'bg-sky-50 hover:bg-sky-100 border-2 border-sky-500 text-sky-800 dark:bg-sky-950/20 dark:border-sky-500': status === 'TAKING_ORDER',
      'bg-purple-50 hover:bg-purple-100 border-2 border-purple-500 text-purple-800 dark:bg-purple-950/20 dark:border-purple-500': status === 'WAITING_DISHES',
      'bg-orange-50 hover:bg-orange-100 border-2 border-orange-500 text-orange-800 dark:bg-orange-950/20 dark:border-orange-500': status === 'ALL_DELIVERED',
      'bg-pink-50 hover:bg-pink-100 border-2 border-pink-500 text-pink-800 dark:bg-pink-950/20 dark:border-pink-500': status === 'ISSUED_UNPAID',
      'bg-cyan-50 hover:bg-cyan-100 border-2 border-cyan-500 text-cyan-800 dark:bg-cyan-950/20 dark:border-cyan-500': status === 'PAID',
      // Estilo mesa bloqueada
      'border-red-650 opacity-90 ring-2 ring-red-400': isLocked
    };
  }

  getStatusBadgeClasses(status: string): Record<string, boolean> {
    return {
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300': status === 'FREE',
      'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300': status === 'UNATTENDED',
      'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300': status === 'TAKING_ORDER',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300': status === 'WAITING_DISHES',
      'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300': status === 'ALL_DELIVERED',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300': status === 'ISSUED_UNPAID',
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300': status === 'PAID'
    };
  }

  getStatusText(table: RestaurantTable): string {
    switch (table.status) {
      case 'FREE': return 'Libre';
      case 'UNATTENDED': return 'Cola';
      case 'TAKING_ORDER': return 'Comanda';
      case 'WAITING_DISHES': return 'Cocina';
      case 'ALL_DELIVERED': return 'Entrega';
      case 'ISSUED_UNPAID': return 'Precuenta';
      case 'PAID': return 'Pagado';
      default: return table.status;
    }
  }

  // MERGING TABLES ACTIONS
  openMergeModal(): void {
    this.selectedAnchorId = null;
    this.selectedChildIds = [];
    this.mergeModalOpen.set(true);
  }

  closeMergeModal(): void {
    this.mergeModalOpen.set(false);
  }

  mergeableAnchorTables = computed(() => {
    // Pueden ser anclas mesas activas o libres, pero no mesas ya hijas de otra fusión
    return this.ordersService.tables$().filter(t => !t.anchorTableId);
  });

  mergeableChildTables = computed(() => {
    // Mesas que pueden seleccionarse como secundarias (deben estar libres y sin fusiones previas)
    return this.ordersService.tables$().filter(t => 
      t.status === 'FREE' && 
      !t.anchorTableId && 
      t.id !== this.selectedAnchorId
    );
  });

  onAnchorChange(): void {
    this.selectedChildIds = [];
  }

  toggleChildSelection(tableId: number): void {
    if (this.selectedChildIds.includes(tableId)) {
      this.selectedChildIds = this.selectedChildIds.filter(id => id !== tableId);
    } else {
      this.selectedChildIds.push(tableId);
    }
  }

  submitMerge(): void {
    if (!this.selectedAnchorId || this.selectedChildIds.length === 0) return;
    this.api.mergeTables(this.selectedAnchorId, this.selectedChildIds).subscribe({
      next: () => {
        this.notify.success('Mesas fusionadas correctamente.');
        this.closeMergeModal();
        this.ordersService.loadTables();
      },
      error: () => this.notify.error('No se pudieron fusionar las mesas.')
    });
  }

  isAnchorTable(tableId: number): boolean {
    return this.ordersService.tables$().some(t => t.anchorTableId === tableId);
  }

  onUnmergeClick(event: MouseEvent, anchorTableId: number): void {
    event.stopPropagation(); // Evita navegar a la mesa
    if (confirm('¿Deseas desunir este grupo de mesas?')) {
      this.api.unmergeTables(anchorTableId).subscribe({
        next: () => {
          this.notify.success('Fusión de mesas disuelta.');
          this.ordersService.loadTables();
        },
        error: () => this.notify.error('No se pudieron desunir las mesas.')
      });
    }
  }

  // TRANSFER ORDER ACTIONS
  openTransferModal(): void {
    this.selectedTransferFrom = null;
    this.selectedTransferTo = null;
    this.transferModalOpen.set(true);
  }

  closeTransferModal(): void {
    this.transferModalOpen.set(false);
  }

  tablesWithActiveOrders = computed(() => {
    // Mesas con estado distinto a FREE y que no sean secundarias
    return this.ordersService.tables$().filter(t => t.status !== 'FREE' && !t.anchorTableId);
  });

  submitTransfer(): void {
    if (!this.selectedTransferFrom || !this.selectedTransferTo) return;
    this.api.transferOrder(this.selectedTransferFrom, this.selectedTransferTo).subscribe({
      next: () => {
        this.notify.success('Comanda trasladada con éxito.');
        this.closeTransferModal();
        this.ordersService.loadTables();
      },
      error: () => this.notify.error('No se pudo trasladar la comanda.')
    });
  }
}
