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
          @for (group of groupedQueue(); track group.orderId) {
            <div 
              class="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex flex-col justify-between min-h-[220px] shadow-sm transition-all duration-300 relative"
            >
              
              <!-- CARD HEADER -->
              <div class="space-y-4">
                <div class="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700/60">
                  <!-- MESA / PEDIDO ORIGEN -->
                  <span class="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-gray-750 dark:text-gray-300">
                    {{ group.tableNumber ? 'Mesa M' + group.tableNumber : 'Para Llevar' }}
                  </span>
                  
                  <!-- ID DE COMANDA -->
                  <span class="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                    Pedido #{{ group.orderId }}
                  </span>
                </div>

                <!-- ITEMS LIST -->
                <div class="divide-y divide-gray-100 dark:divide-gray-700/60 space-y-3">
                  @for (item of group.items; track item.id) {
                    <div class="pt-2 flex flex-col gap-1.5 transition-all" [class.opacity-40]="item.status === 'READY'" [class.line-through]="item.status === 'READY'">
                      <div class="flex items-baseline justify-between">
                        <span class="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {{ getProductName(item.productId) }}
                        </span>
                        <span class="text-sm font-extrabold text-blue-600 dark:text-blue-400 shrink-0 ml-2">
                          x{{ item.quantity }}
                        </span>
                      </div>
                      
                      @if (item.note) {
                        <div class="text-[10px] text-purple-705 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/20 px-2 py-1 rounded">
                          OBS: {{ item.note }}
                        </div>
                      }

                      <!-- Item status/actions -->
                      <div class="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                        <span class="font-semibold">{{ getElapsedTimeText(item.id, item.createdAt) }}</span>
                        
                        <!-- Status Badge or Action Button -->
                        <div>
                          @if (item.status === 'PENDING') {
                            <button 
                              (click)="startPrep(item.id)"
                              class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer uppercase text-[9px] border-none"
                            >
                              Empezar
                            </button>
                          } @else if (item.status === 'IN_PREPARATION') {
                            <button 
                              (click)="markReady(item.id)"
                              class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer uppercase text-[9px] border-none"
                            >
                              Listo
                            </button>
                          } @else {
                            <span class="text-emerald-500 font-extrabold">✓ LISTO</span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>

              </div>

            </div>
          }
          @if (groupedQueue().length === 0) {
            <div class="col-span-full py-20 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <svg class="h-16 w-16 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 class="font-extrabold text-lg">Cola Vacía</h3>
              <p class="text-xs text-gray-500 mt-1">No hay comandas activas pendientes de preparación en la zona de {{ getActiveZoneName() }}.</p>
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

  // Local state to track items completed in this KDS screen session to strike them out
  private sessionItemsMap = new Map<number, KitchenQueueItem>();
  public localReadyItemIds = signal<Set<number>>(new Set<number>());

  // Computed signal to group KDS items by comanda (orderId)
  public groupedQueue = computed(() => {
    const activeItems = this.queue();
    const readyIds = this.localReadyItemIds();

    // 1. Gather active orders
    const activeOrderIds = new Set<number>();
    activeItems.forEach(item => {
      activeOrderIds.add(item.orderId);
      this.sessionItemsMap.set(item.id, item);
    });

    // Combine active items with cached ones that were marked ready
    const combined: KitchenQueueItem[] = [];
    const includedIds = new Set<number>();

    activeItems.forEach(item => {
      if (readyIds.has(item.id)) {
        combined.push({ ...item, status: 'READY' });
      } else {
        combined.push(item);
      }
      includedIds.add(item.id);
    });

    this.sessionItemsMap.forEach(item => {
      if (activeOrderIds.has(item.orderId) && !includedIds.has(item.id)) {
        if (readyIds.has(item.id) || item.status === 'READY') {
          combined.push({ ...item, status: 'READY' });
          includedIds.add(item.id);
        }
      }
    });

    // 2. Group by orderId
    const groupsMap = new Map<number, KitchenQueueItem[]>();
    combined.forEach(item => {
      if (!groupsMap.has(item.orderId)) {
        groupsMap.set(item.orderId, []);
      }
      groupsMap.get(item.orderId)!.push(item);
    });

    // 3. Filter completed groups and format resource DTOs
    const finalGroups: { orderId: number; tableNumber?: number; createdAt: string; items: KitchenQueueItem[] }[] = [];
    
    groupsMap.forEach((items, orderId) => {
      const allReady = items.every(item => item.status === 'READY' || readyIds.has(item.id));
      if (!allReady) {
        // Sort items: PENDING first, IN_PREPARATION second, READY last
        const sortedItems = [...items].sort((a, b) => {
          const statusOrder = { 'PENDING': 0, 'IN_PREPARATION': 1, 'READY': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });

        const first = items[0];
        const minCreatedAt = items.reduce((min, it) => 
          new Date(it.createdAt).getTime() < new Date(min).getTime() ? it.createdAt : min, 
          first.createdAt
        );

        finalGroups.push({
          orderId,
          tableNumber: first.tableNumber,
          createdAt: minCreatedAt,
          items: sortedItems
        });
      } else {
        // Clear finished comanda items from local caches
        items.forEach(item => {
          this.sessionItemsMap.delete(item.id);
          if (readyIds.has(item.id)) {
            readyIds.delete(item.id);
          }
        });
      }
    });

    // Sort by comanda timestamp oldest first (FIFO)
    return finalGroups.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  constructor() {
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
    this.api.getZones().subscribe({
      next: (zs) => {
        this.zones.set(zs);

        const stored = localStorage.getItem('pez-kds-zone-id');
        if (stored) {
          const id = parseInt(stored, 10);
          if (zs.some(z => z.id === id)) {
            this.selectZone(id);
          }
        } else if (zs.length > 0) {
          this.selectZone(zs[0].id);
        }
      },
      error: () => this.notify.error('No se pudieron obtener las zonas de cocina del local.')
    });

    this.api.getProducts().subscribe({
      next: (prods) => this.products.set(prods),
      error: () => this.notify.error('No se pudo cargar el catálogo de platos.')
    });

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
        const sorted = [...q].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        this.queue.set(sorted);
        this.updateTimers();
      },
      error: () => this.notify.error('No se pudo cargar la cola de cocina.')
    });
  }

  private subscribeToKitchenWebSocket(restaurantId: number): void {
    this.unsubscribeWS();
    this.wsSubscription = this.realtime.subscribeToKitchen(restaurantId).subscribe({
      next: (event) => {
        const type = event.eventType;
        const payload = event.payload;
        if (!type || !payload) return;

        if (type === 'ItemOrdered') {
          this.loadQueueSilently();
        } else if (type === 'ItemStatusChanged') {
          const itemId = payload.itemId;
          const newStatus = payload.newStatus;
          
          if (newStatus === 'READY' || newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
            if (newStatus === 'READY') {
              this.localReadyItemIds.update(set => {
                const newSet = new Set(set);
                newSet.add(itemId);
                return newSet;
              });
              const cached = this.sessionItemsMap.get(itemId);
              if (cached) {
                this.sessionItemsMap.set(itemId, { ...cached, status: 'READY' });
              }
            }
            this.queue.update(q => q.filter(item => item.id !== itemId));
          } else {
            this.queue.update(q => q.map(item => item.id === itemId ? { ...item, status: newStatus } : item));
          }
        } else if (type === 'ItemCancelled') {
          const itemId = payload.itemId;
          this.queue.update(q => q.filter(item => item.id !== itemId));
          this.notify.warning('Un plato en cola ha sido anulado.');
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

  private updateTimers(): void {
    const newTimes: Record<number, number> = {};
    const now = Date.now();
    this.sessionItemsMap.forEach(item => {
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

  getProductName(productId: number): string {
    const prod = this.products().find(p => p.id === productId);
    return prod ? prod.name : `Plato #${productId}`;
  }

  public getUrgencyLevel(item: KitchenQueueItem): 'NORMAL' | 'AMBER' | 'RED' {
    const totalSeconds = this.elapsedSeconds()[item.id] || 0;
    const elapsedMinutes = totalSeconds / 60;

    const prod = this.products().find(p => p.id === item.productId);
    const prepLimit = prod && prod.estimatedPrepTimeMinutes ? prod.estimatedPrepTimeMinutes : 10;

    if (elapsedMinutes >= prepLimit * 1.5) {
      return 'RED';
    } else if (elapsedMinutes >= prepLimit) {
      return 'AMBER';
    }
    return 'NORMAL';
  }

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
    this.localReadyItemIds.update(set => {
      const newSet = new Set(set);
      newSet.add(itemId);
      return newSet;
    });
    const cached = this.sessionItemsMap.get(itemId);
    if (cached) {
      this.sessionItemsMap.set(itemId, { ...cached, status: 'READY' });
    }

    this.api.markReady(itemId).subscribe({
      next: () => {
        this.notify.success('Plato marcado como listo.');
        this.loadQueue();
      },
      error: () => {
        this.localReadyItemIds.update(set => {
          const newSet = new Set(set);
          newSet.delete(itemId);
          return newSet;
        });
        if (cached) {
          this.sessionItemsMap.set(itemId, cached);
        }
        this.notify.error('No se pudo marcar el plato como listo.');
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeWS();
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
}
