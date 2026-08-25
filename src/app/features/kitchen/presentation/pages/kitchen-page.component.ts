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

      <!-- KDS TOOLBAR (TABS AND FILTERS) -->
      <div *ngIf="selectedZoneId()" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 shadow-2xs">
        <!-- Tabs -->
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-fit">
          <button 
            (click)="currentTab.set('active')"
            [class.bg-white]="currentTab() === 'active'"
            [class.dark:bg-gray-800]="currentTab() === 'active'"
            [class.text-blue-600]="currentTab() === 'active'"
            [class.dark:text-blue-400]="currentTab() === 'active'"
            [class.text-gray-500]="currentTab() !== 'active'"
            class="px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all border-none"
          >
            📋 Cola Activa ({{ activeGroups().length }})
          </button>
          <button 
            (click)="currentTab.set('history')"
            [class.bg-white]="currentTab() === 'history'"
            [class.dark:bg-gray-800]="currentTab() === 'history'"
            [class.text-blue-600]="currentTab() === 'history'"
            [class.dark:text-blue-400]="currentTab() === 'history'"
            [class.text-gray-500]="currentTab() !== 'history'"
            class="px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all border-none"
          >
            ✓ Historial completados ({{ completedGroups().length }})
          </button>
        </div>

        <!-- History configuration selector -->
        <div *ngIf="currentTab() === 'history'" class="flex items-center gap-2 animate-in fade-in">
          <label class="text-[10px] font-black uppercase text-gray-400">Ver completados de las últimas:</label>
          <select 
            [(ngModel)]="historyHours"
            class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            <option [value]="1">1 hora</option>
            <option [value]="3">3 horas (Default)</option>
            <option [value]="6">6 horas</option>
            <option [value]="12">12 horas</option>
          </select>
        </div>
      </div>

      <!-- BOARD DE PREPARACIONES (KDS GRID) -->
      @if (selectedZoneId()) {
        
        <!-- Tab 1: Active Queue -->
        @if (currentTab() === 'active') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-200">
            @for (group of activeGroups(); track group.orderId + '-' + group.createdAt) {
              <div 
                [class]="getGroupUrgencyClass(group)"
                class="rounded-2xl border-2 p-5 flex flex-col justify-between min-h-[220px] shadow-sm transition-all duration-300 relative"
              >
                
                <!-- CARD HEADER -->
                <div class="space-y-4">
                  <div class="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700/60">
                    <!-- TICKET ORIGIN -->
                    <span class="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-gray-750 dark:text-gray-300">
                      {{ getOrderTypeLabel(group) }}
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
                          <div class="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/20 px-2 py-1 rounded">
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
            @if (activeGroups().length === 0) {
              <div class="col-span-full py-20 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <svg class="h-16 w-16 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 class="font-extrabold text-lg">Cola Vacía</h3>
                <p class="text-xs text-gray-500 mt-1">No hay comandas activas pendientes de preparación en la zona de {{ getActiveZoneName() }}.</p>
              </div>
            }
          </div>
        }

        <!-- Tab 2: Completed History -->
        @if (currentTab() === 'history') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-200">
            @for (group of completedGroups(); track group.orderId + '-' + group.createdAt) {
              <div 
                [class]="getGroupUrgencyClass(group)"
                class="rounded-2xl border-2 p-5 flex flex-col justify-between min-h-[220px] shadow-sm transition-all duration-300 relative"
              >
                
                <!-- CARD HEADER -->
                <div class="space-y-4">
                  <div class="flex justify-between items-center pb-2 border-b border-gray-150 dark:border-gray-700/50">
                    <!-- TICKET ORIGIN -->
                    <span class="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-gray-400">
                      {{ getOrderTypeLabel(group) }}
                    </span>
                    
                    <!-- ID DE COMANDA -->
                    <span class="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                      Pedido #{{ group.orderId }}
                    </span>
                  </div>

                  <!-- ITEMS LIST -->
                  <div class="divide-y divide-gray-100 dark:divide-gray-700/60 space-y-3">
                    @for (item of group.items; track item.id) {
                      <div class="pt-2 flex flex-col gap-1.5 transition-all opacity-60 line-through">
                        <div class="flex items-baseline justify-between">
                          <span class="text-sm font-bold text-gray-500 dark:text-gray-400">
                            {{ getProductName(item.productId) }}
                          </span>
                          <span class="text-sm font-extrabold text-gray-400 shrink-0 ml-2">
                            x{{ item.quantity }}
                          </span>
                        </div>
                        
                        @if (item.note) {
                          <div class="text-[10px] text-gray-450 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded">
                            OBS: {{ item.note }}
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- CARD FOOTER (Completion timestamp) -->
                <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-[10px] text-emerald-500 font-bold">
                  <span>✓ COMPLETO</span>
                  <span class="text-gray-400 font-semibold">{{ getCompletionTimeText(group) }}</span>
                </div>

              </div>
            }
            @if (completedGroups().length === 0) {
              <div class="col-span-full py-20 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <svg class="h-16 w-16 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="font-extrabold text-lg">Historial Vacío</h3>
                <p class="text-xs text-gray-500 mt-1">No se encontraron tickets completados en las últimas {{ historyHours() }} horas para la zona de {{ getActiveZoneName() }}.</p>
              </div>
            }
          </div>
        }

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

  // Navigation tab and history duration setting
  public currentTab = signal<'active' | 'history'>('active');
  public historyHours = signal<number>(3);

  // Ticking time signal: maps itemId to elapsed seconds
  private elapsedSeconds = signal<Record<number, number>>({});

  private timerSubscription?: Subscription;
  private wsSubscription?: Subscription;

  // Local state to track items completed in this KDS screen session to strike them out
  private sessionItemsMap = new Map<number, KitchenQueueItem>();
  public localReadyItemIds = signal<Set<number>>(new Set<number>());

  // Computed signal to parse and group KDS items by comanda (orderId) and round (createdAt diff <= 5s)
  public allGroups = computed(() => {
    const activeItems = this.queue();
    const readyIds = this.localReadyItemIds();

    // Combine active items with local ready updates
    const combined: KitchenQueueItem[] = activeItems.map(item => {
      if (readyIds.has(item.id)) {
        return { ...item, status: 'READY' as const };
      }
      return item;
    });

    // Group items by orderId and round (createdAt difference <= 5 seconds)
    const groups: { orderId: number; tableNumber?: number; createdAt: string; items: KitchenQueueItem[] }[] = [];
    
    const orderItemsMap = new Map<number, KitchenQueueItem[]>();
    combined.forEach(item => {
      if (!orderItemsMap.has(item.orderId)) {
        orderItemsMap.set(item.orderId, []);
      }
      orderItemsMap.get(item.orderId)!.push(item);
    });

    orderItemsMap.forEach((items, orderId) => {
      const sorted = [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      let currentRound: KitchenQueueItem[] = [];
      let prevTime: number | null = null;
      
      sorted.forEach(item => {
        const itemTime = new Date(item.createdAt).getTime();
        if (prevTime === null || (itemTime - prevTime) <= 3000) {
          currentRound.push(item);
        } else {
          if (currentRound.length > 0) {
            groups.push({
              orderId,
              tableNumber: currentRound[0].tableNumber,
              createdAt: currentRound[0].createdAt,
              items: currentRound
            });
          }
          currentRound = [item];
        }
        prevTime = itemTime;
      });
      
      if (currentRound.length > 0) {
        groups.push({
          orderId,
          tableNumber: currentRound[0].tableNumber,
          createdAt: currentRound[0].createdAt,
          items: currentRound
        });
      }
    });

    return groups;
  });

  // Active tickets computed (FIFO)
  public activeGroups = computed(() => {
    const groups = this.allGroups();
    const readyIds = this.localReadyItemIds();
    
    const active = groups.filter(g => {
      // It is active if at least one item is NOT ready
      return g.items.some(item => item.status !== 'READY' && !readyIds.has(item.id));
    });

    // Sort items inside each active group (PENDING first, IN_PREPARATION next, READY last)
    active.forEach(g => {
      g.items.sort((a, b) => {
        const statusOrder = { 'PENDING': 0, 'IN_PREPARATION': 1, 'READY': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });
    });

    // Sort active tickets oldest first (FIFO)
    return active.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  // Completed history tickets computed (LIFO - newest first)
  public completedGroups = computed(() => {
    const groups = this.allGroups();
    const readyIds = this.localReadyItemIds();
    const windowHours = this.historyHours();
    const cutoffTime = Date.now() - (windowHours * 60 * 60 * 1000);

    const completed = groups.filter(g => {
      // It is completed if ALL items are ready
      const allReady = g.items.every(item => item.status === 'READY' || readyIds.has(item.id));
      if (!allReady) return false;

      // Find completion time (max readyAt or max createdAt if readyAt is missing)
      const compTime = g.items.reduce((max, item) => {
        const t = item.readyAt ? new Date(item.readyAt).getTime() : new Date(item.createdAt).getTime();
        return t > max ? t : max;
      }, 0);

      return compTime >= cutoffTime;
    });

    // Sort completed tickets newest first (LIFO)
    return completed.sort((a, b) => {
      const aTime = a.items.reduce((max, item) => {
        const t = item.readyAt ? new Date(item.readyAt).getTime() : new Date(item.createdAt).getTime();
        return t > max ? t : max;
      }, 0);
      const bTime = b.items.reduce((max, item) => {
        const t = item.readyAt ? new Date(item.readyAt).getTime() : new Date(item.createdAt).getTime();
        return t > max ? t : max;
      }, 0);
      return bTime - aTime;
    });
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

        const stored = localStorage.getItem('altoque-kds-zone-id');
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
    localStorage.setItem('altoque-kds-zone-id', zoneId.toString());
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
          
          if (newStatus === 'READY') {
            this.localReadyItemIds.update(set => {
              const newSet = new Set(set);
              newSet.add(itemId);
              return newSet;
            });
            this.queue.update(q => q.map(item => item.id === itemId ? { ...item, status: 'READY', readyAt: new Date().toISOString() } : item));
          } else if (newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
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

  getProductName(productId: number): string {
    const prod = this.products().find(p => p.id === productId);
    return prod ? prod.name : `Plato #${productId}`;
  }

  getGroupUrgencyClass(group: any): string {
    if (this.currentTab() === 'history') {
      return 'border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/40 opacity-75';
    }
    
    let highestUrgency: string = 'NORMAL';
    group.items.forEach((item: any) => {
      if (item.status !== 'READY') {
        const urg = this.getUrgencyLevel(item);
        if (urg === 'RED') highestUrgency = 'RED';
        else if (urg === 'AMBER' && highestUrgency !== 'RED') highestUrgency = 'AMBER';
      }
    });

    if (highestUrgency === 'RED') {
      return 'border-red-500 dark:border-red-650 bg-red-55/10 dark:bg-red-950/5 animate-pulse';
    } else if (highestUrgency === 'AMBER') {
      return 'border-amber-500 dark:border-amber-600 bg-amber-50/10 dark:bg-amber-950/5';
    }
    return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';
  }

  getOrderTypeLabel(group: any): string {
    const type = group.items[0]?.orderType || 'DINE_IN';
    if (type === 'DELIVERY') return '🛵 Delivery';
    if (type === 'TAKEAWAY') return '🛍️ Llevar';
    return group.tableNumber ? `Mesa M${group.tableNumber}` : 'Salón';
  }

  getCompletionTimeText(group: any): string {
    const maxTime = group.items.reduce((max: number, item: any) => {
      const t = item.readyAt ? new Date(item.readyAt).getTime() : new Date(item.createdAt).getTime();
      return t > max ? t : max;
    }, 0);
    if (!maxTime) return 'Completado';
    const date = new Date(maxTime);
    return 'Listo a las ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
