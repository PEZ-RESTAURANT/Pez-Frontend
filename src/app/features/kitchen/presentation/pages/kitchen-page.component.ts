import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KitchenApi, KitchenZone, KitchenQueueItem } from '../../infrastructure/api/kitchen.api';
import { Product } from '../../../orders/domain/models/orders.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { RealtimeService } from '../../../../core/realtime/services/realtime.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-kitchen-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">

      <!-- HEADER Y SELECCIÓN DE ZONA -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm animate-in fade-in duration-300">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Monitor de Cocina (KDS)</span>
            <span class="flex h-3.5 w-3.5 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </span>
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Preparaciones activas en cola de cocina.</p>
        </div>

        <!-- ZONE CHIPS SELECTOR -->
        <div class="flex flex-wrap items-center gap-2">
          @for (zone of zones(); track zone.id) {
            <button 
              (click)="selectZone(zone.id)"
              [class.bg-blue-600]="selectedZoneId() === zone.id"
              [class.text-white]="selectedZoneId() === zone.id"
              [class.border-blue-600]="selectedZoneId() === zone.id"
              [class.bg-gray-50]="selectedZoneId() !== zone.id"
              [class.dark:bg-gray-900]="selectedZoneId() !== zone.id"
              [class.text-gray-600]="selectedZoneId() !== zone.id"
              [class.dark:text-gray-400]="selectedZoneId() !== zone.id"
              [class.border-gray-200]="selectedZoneId() !== zone.id"
              [class.dark:border-gray-800]="selectedZoneId() !== zone.id"
              class="px-5 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all shadow-xs"
            >
              {{ zone.name | uppercase }}
            </button>
          }
        </div>
      </div>

      <!-- BOARD DE PREPARACIONES (KDS GRID) -->
      @if (selectedZoneId()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (item of queue(); track item.id) {
            <div 
              [ngClass]="getCardClasses(item)"
              class="rounded-2xl border-2 p-5 flex flex-col justify-between min-h-[220px] shadow-sm transition-all duration-300 relative"
            >
              
              <!-- CARD HEADER -->
              <div class="space-y-1">
                <div class="flex justify-between items-start">
                  <!-- MESA / PEDIDO ORIGEN -->
                  <span class="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                    {{ item.tableNumber ? 'Mesa M' + item.tableNumber : 'Para Llevar' }}
                  </span>
                  
                  <!-- ID DE COMANDA -->
                  <span class="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                    Pedido #{{ item.orderId }}
                  </span>
                </div>

                <!-- DISH NAME & QUANTITY -->
                <div class="flex items-baseline justify-between pt-2">
                  <h3 class="text-lg font-black text-gray-900 dark:text-white leading-tight">
                    {{ getProductName(item.productId) }}
                  </h3>
                  <span class="text-lg font-black text-blue-600 dark:text-blue-400 ml-2 shrink-0">
                    x{{ item.quantity }}
                  </span>
                </div>

                <!-- OBSERVACIÓN DESTACADA -->
                @if (item.note) {
                  <div class="bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-900/50 text-purple-800 dark:text-purple-300 p-2.5 rounded-lg text-xs font-extrabold flex items-start gap-1.5 mt-2">
                    <svg class="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>OBS: {{ item.note }}</span>
                  </div>
                }
              </div>

              <!-- CARD FOOTER & ACTIONS -->
              <div class="mt-4 pt-3 border-t border-gray-150 dark:border-gray-700/60 flex items-center justify-between">
                <!-- TIMER TRANSCURRIDO IN VIVO -->
                <div class="flex flex-col text-left">
                  <span class="text-[9px] uppercase font-bold text-gray-400">Transcurrido</span>
                  <span class="text-xs font-black text-gray-700 dark:text-gray-300">
                    {{ getElapsedTimeText(item.id, item.createdAt) }}
                  </span>
                </div>

                <!-- ACCIÓN DIRECTA SIN MODAL -->
                @if (item.status === 'PENDING') {
                  <button 
                    (click)="startPrep(item.id)"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider"
                  >
                    Empezar
                  </button>
                } @else if (item.status === 'IN_PREPARATION') {
                  <button 
                    (click)="markReady(item.id)"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider"
                  >
                    Listo
                  </button>
                }
              </div>

            </div>
          }
          @if (queue().length === 0) {
            <div class="col-span-full py-20 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <svg class="h-16 w-16 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 class="font-extrabold text-lg">Cola Vacía</h3>
              <p class="text-xs text-gray-500 mt-1">No hay pedidos pendientes de preparación en la zona de {{ getActiveZoneName() }}.</p>
            </div>
          }
        </div>
      } @else {
        <div class="py-20 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700">
          <p class="font-bold">Selecciona una zona de cocina para cargar el monitor.</p>
        </div>
      }

    </div>
  `
})
export class KitchenPageComponent implements OnInit, OnDestroy {
  private api = inject(KitchenApi);
  private notify = inject(NotificationService);
  private realtime = inject(RealtimeService);
  private session = inject(SessionService);

  public zones = signal<KitchenZone[]>([]);
  public selectedZoneId = signal<number | null>(null);
  public queue = signal<KitchenQueueItem[]>([]);
  public products = signal<Product[]>([]);

  // Ticking time signal: maps itemId to elapsed seconds
  private elapsedSeconds = signal<Record<number, number>>({});

  private timerSubscription?: Subscription;
  private wsSubscription?: Subscription;

  constructor() {
    // Escucha cambios en el restaurantId de la sesión para subscribirse a los eventos del WebSocket de Cocina
    effect(() => {
      const restaurantId = this.session.getRestaurantId();
      if (restaurantId) {
        this.subscribeToKitchenWebSocket(restaurantId);
      } else {
        this.unsubscribeWS();
      }
    });
  }

  ngOnInit(): void {
    // 1. Cargar las zonas disponibles
    this.api.getZones().subscribe({
      next: (zs) => {
        this.zones.set(zs);

        // Restaurar zona seleccionada de localStorage
        const stored = localStorage.getItem('pez-kds-zone-id');
        if (stored) {
          const id = parseInt(stored, 10);
          if (zs.some(z => z.id === id)) {
            this.selectZone(id);
          }
        } else if (zs.length > 0) {
          // Default a la primera zona
          this.selectZone(zs[0].id);
        }
      },
      error: () => this.notify.error('No se pudieron obtener las zonas de cocina del local.')
    });

    // 2. Cargar catálogo de productos
    this.api.getProducts().subscribe({
      next: (prods) => this.products.set(prods),
      error: () => this.notify.error('No se pudo cargar el catálogo de platos.')
    });

    // 3. Temporizador en vivo que incrementa el contador de segundos transcurridos cada 1s
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateTimers();
    });
  }

  selectZone(zoneId: number): void {
    this.selectedZoneId.set(zoneId);
    localStorage.setItem('pez-kds-zone-id', zoneId.toString());
    this.loadQueue();
  }

  getActiveZoneName(): string {
    const active = this.zones().find(z => z.id === this.selectedZoneId());
    return active ? active.name : '';
  }

  loadQueue(): void {
    const zoneId = this.selectedZoneId();
    if (!zoneId) return;

    this.api.getQueueByZone(zoneId).subscribe({
      next: (q) => {
        // Ordenar en cola FIFO (primero en entrar, primero en salir) por fecha de creación
        const sorted = [...q].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        this.queue.set(sorted);
        this.updateTimers();
      },
      error: () => this.notify.error('No se pudo cargar la cola de cocina.')
    });
  }

  // --- WEBSOCKET SYNC ---
  private subscribeToKitchenWebSocket(restaurantId: number): void {
    this.unsubscribeWS();
    this.wsSubscription = this.realtime.subscribeToKitchen(restaurantId).subscribe({
      next: (event) => {
        const type = event.eventType;
        const payload = event.payload;
        if (!type || !payload) return;

        if (type === 'ItemOrdered') {
          // Si es un plato nuevo, recargamos la cola en segundo plano (DOM reconcile track by item.id evitará parpadeos)
          this.loadQueueSilently();
        } else if (type === 'ItemStatusChanged') {
          const itemId = payload.itemId;
          const newStatus = payload.newStatus;
          
          if (newStatus === 'READY' || newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
            // Remover quirúrgicamente del estado local
            this.queue.update(q => q.filter(item => item.id !== itemId));
          } else {
            // Actualizar estado de preparación quirúrgicamente en el estado local
            this.queue.update(q => q.map(item => item.id === itemId ? { ...item, status: newStatus } : item));
          }
        }
      }
    });
  }

  loadQueueSilently(): void {
    const zoneId = this.selectedZoneId();
    if (!zoneId) return;

    this.api.getQueueByZone(zoneId).subscribe({
      next: (q) => {
        const sorted = [...q].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        this.queue.set(sorted);
        this.updateTimers();
      }
    });
  }

  private unsubscribeWS(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = undefined;
    }
  }

  // --- TIMER UTILITIES ---
  private updateTimers(): void {
    const newTimes: Record<number, number> = {};
    const now = Date.now();
    this.queue().forEach(item => {
      const elapsed = Math.floor((now - new Date(item.createdAt).getTime()) / 1000);
      newTimes[item.id] = Math.max(0, elapsed);
    });
    this.elapsedSeconds.set(newTimes);
  }

  getElapsedTimeText(itemId: number, createdAt: string): string {
    const totalSeconds = this.elapsedSeconds()[itemId];
    if (totalSeconds === undefined) return 'Calculando...';

    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  }

  // --- PRODUCT INFO LOOKUP ---
  getProductName(productId: number): string {
    const prod = this.products().find(p => p.id === productId);
    return prod ? prod.name : `Plato #${productId}`;
  }

  // --- URGENCIA CROMÁTICA ---
  public getUrgencyLevel(item: KitchenQueueItem): 'NORMAL' | 'AMBER' | 'RED' {
    const totalSeconds = this.elapsedSeconds()[item.id] || 0;
    const elapsedMinutes = totalSeconds / 60;

    const prod = this.products().find(p => p.id === item.productId);
    // Umbral de tiempo estimado
    const prepLimit = prod && prod.estimatedPrepTimeMinutes ? prod.estimatedPrepTimeMinutes : 10;

    if (elapsedMinutes >= prepLimit * 1.5) {
      return 'RED';
    } else if (elapsedMinutes >= prepLimit) {
      return 'AMBER';
    }
    return 'NORMAL';
  }

  getCardClasses(item: KitchenQueueItem): Record<string, boolean> {
    const urgency = this.getUrgencyLevel(item);
    const inPrep = item.status === 'IN_PREPARATION';

    return {
      // Normal / Neutro
      'bg-white border-gray-250 dark:bg-gray-800 dark:border-gray-700': urgency === 'NORMAL' && !inPrep,
      'bg-blue-50/20 border-blue-400 dark:bg-blue-950/15 dark:border-blue-900': urgency === 'NORMAL' && inPrep,
      // Ámbar (Alerta inicial de demora)
      'bg-amber-50/40 border-amber-400 text-amber-900 dark:bg-amber-950/15 dark:border-amber-900/60 dark:text-amber-300': urgency === 'AMBER',
      // Rojo (Demora crítica, parpadeo sutil)
      'bg-red-50/50 border-red-500 text-red-950 dark:bg-red-950/25 dark:border-red-900 dark:text-red-200 shadow-lg ring-1 ring-red-400/50': urgency === 'RED'
    };
  }

  // --- ACTIONS (KITCHEN TRANSITIONS) ---
  startPrep(itemId: number): void {
    this.api.startPreparation(itemId).subscribe({
      next: () => {
        this.notify.success('Preparación iniciada.');
        this.loadQueue();
      },
      error: () => this.notify.error('No se pudo iniciar la preparación del plato.')
    });
  }

  markReady(itemId: number): void {
    this.api.markReady(itemId).subscribe({
      next: () => {
        this.notify.success('Plato marcado como listo.');
        this.loadQueue();
      },
      error: () => this.notify.error('No se pudo marcar el plato como listo.')
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeWS();
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
}
