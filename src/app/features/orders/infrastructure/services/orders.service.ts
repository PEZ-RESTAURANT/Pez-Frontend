import { Injectable, inject, signal, effect, OnDestroy } from '@angular/core';
import { OrdersApi } from '../api/orders.api';
import { Order, OrderItem, RestaurantTable } from '../../domain/models/orders.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { RealtimeService } from '../../../../core/realtime/services/realtime.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrdersService implements OnDestroy {
  private api = inject(OrdersApi);
  private notify = inject(NotificationService);
  private realtime = inject(RealtimeService);
  private sessionService = inject(SessionService);

  private _tables = signal<RestaurantTable[]>([]);
  private _orders = signal<Order[]>([]);
  private _attentionQueue = signal<RestaurantTable[]>([]);
  private _kitchenQueue = signal<OrderItem[]>([]);
  
  // tableId -> { waiterName }
  private _tableLocks = signal<Record<number, { waiterName: string }>>({});

  // Public readonly signals with $ suffix
  public tables$ = this._tables.asReadonly();
  public orders$ = this._orders.asReadonly();
  public attentionQueue$ = this._attentionQueue.asReadonly();
  public kitchenQueue$ = this._kitchenQueue.asReadonly();
  public tableLocks$ = this._tableLocks.asReadonly();

  private realtimeSub?: Subscription;

  constructor() {
    // Monitor restaurant session to subscribe to real-time events and load initial data
    effect(() => {
      const restaurantId = this.sessionService.getRestaurantId();
      if (restaurantId) {
        this.subscribeToRealtime(restaurantId);
        this.loadTables();
        this.loadTableLocks();
        this.loadOrders();
      } else {
        this.unsubscribeRealtime();
        this._tables.set([]);
        this._tableLocks.set({});
        this._orders.set([]);
      }
    });
  }

  loadTables(): void {
    this.api.getTables().subscribe({
      next: (tables) => this._tables.set(tables),
      error: () => this.notify.error('No se pudieron cargar las mesas del local.')
    });
  }

  loadTableLocks(): void {
    this.api.getActiveLocks().subscribe({
      next: (locks) => {
        const formattedLocks: Record<number, { waiterName: string }> = {};
        Object.entries(locks).forEach(([tableId, lockAny]) => {
          const lock = lockAny as any;
          formattedLocks[parseInt(tableId, 10)] = { waiterName: lock.waiterName };
        });
        this._tableLocks.set(formattedLocks);
      },
      error: () => this.notify.error('No se pudieron obtener los bloqueos activos de mesas.')
    });
  }

  loadOrders(): void {
    this.api.getAllOrders().subscribe({
      next: (orders) => this._orders.set(orders),
      error: () => this.notify.error('No se pudieron cargar las comandas.')
    });
  }

  loadAttentionQueue(): void {
    this.api.getAttentionQueue().subscribe({
      next: (queue) => this._attentionQueue.set(queue),
      error: () => this.notify.error('No se pudo cargar la cola de atención.')
    });
  }

  loadKitchenQueue(zoneId?: number): void {
    this.api.getKitchenQueue(zoneId).subscribe({
      next: (queue) => this._kitchenQueue.set(queue),
      error: () => this.notify.error('No se pudo cargar la cola de cocina.')
    });
  }

  createOrder(tableId: number, type: string, customerId?: number): void {
    this.api.createOrder(tableId, type, customerId).pipe(
      tap((newOrder) => {
        this._orders.update((current) => [...current, newOrder]);
        this.notify.success(`Comanda #${newOrder.id} creada con éxito.`);
      })
    ).subscribe();
  }

  addItemsToOrder(orderId: number, productId: number, quantity: number, note: string, waiterId: number): void {
    this.api.addItems(orderId, productId, quantity, note, waiterId).pipe(
      tap(() => {
        this.notify.success('Platos agregados a la comanda.');
        this.loadOrders();
      })
    ).subscribe();
  }

  changeItemKitchenStatus(orderId: number, itemId: number, status: string): void {
    this.api.changeItemStatus(orderId, itemId, status).pipe(
      tap(() => {
        this.notify.success('Estado del plato actualizado.');
        this.loadKitchenQueue();
      })
    ).subscribe();
  }

  // --- REAL-TIME EVENT HANDLERS (SURGICAL STATE UPDATE) ---

  private subscribeToRealtime(restaurantId: number): void {
    this.unsubscribeRealtime();

    this.realtimeSub = this.realtime.subscribeToTables(restaurantId).subscribe({
      next: (event) => {
        const type = event.eventType;
        const payload = event.payload;
        if (!type || !payload) return;

        // 1. Lock/Unlock handling
        if (type === 'TableLocked') {
          this._tableLocks.update(locks => ({
            ...locks,
            [payload.tableId]: { waiterName: payload.waiterName }
          }));
        } else if (type === 'TableUnlocked') {
          this._tableLocks.update(locks => {
            const copy = { ...locks };
            delete copy[payload.tableId];
            return copy;
          });
        }
        
        // 2. Table Status Updates
        else if (type === 'TableAttentionRequested') {
          this.updateTableStatus(payload.tableId, 'UNATTENDED');
        } else if (type === 'TableAttended') {
          this.updateTableStatus(payload.tableId, 'TAKING_ORDER');
        } else if (type === 'AllItemsDelivered') {
          this.updateTableStatus(payload.tableId, 'ALL_DELIVERED');
        } else if (type === 'ReceiptIssued') {
          this.updateTableStatus(payload.tableId, 'ISSUED_UNPAID');
        } else if (type === 'TableReleased') {
          this.updateTableStatus(payload.tableId, 'FREE', null);
        } else if (type === 'TablesMerged') {
          this.handleTablesMerged(payload.anchorTableId, payload.mergedTableIds);
        } else if (type === 'TablesUnmerged') {
          this.handleTablesUnmerged(payload.anchorTableId, payload.unmergedTableIds);
        } else if (type === 'OrderTransferred') {
          this.handleOrderTransferred(payload.fromTableId, payload.toTableId);
        }

        // Refresh orders context
        this.loadOrders();
      }
    });
  }

  private unsubscribeRealtime(): void {
    if (this.realtimeSub) {
      this.realtimeSub.unsubscribe();
      this.realtimeSub = undefined;
    }
  }

  private updateTableStatus(tableId: number, status: string, anchorTableId?: number | null): void {
    this._tables.update(current => current.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status,
          ...(anchorTableId !== undefined ? { anchorTableId: anchorTableId || undefined } : {})
        };
      }
      return t;
    }));
  }

  private handleTablesMerged(anchorTableId: number, mergedTableIds: number[]): void {
    const anchor = this._tables().find(t => t.id === anchorTableId);
    const status = anchor ? anchor.status : 'FREE';
    this._tables.update(current => current.map(t => {
      if (mergedTableIds.includes(t.id)) {
        return { ...t, status, anchorTableId };
      }
      return t;
    }));
  }

  private handleTablesUnmerged(anchorTableId: number, unmergedTableIds: number[]): void {
    this._tables.update(current => current.map(t => {
      if (unmergedTableIds.includes(t.id)) {
        return { ...t, status: 'FREE', anchorTableId: undefined };
      }
      return t;
    }));
  }

  private handleOrderTransferred(fromTableId: number, toTableId: number): void {
    const fromTable = this._tables().find(t => t.id === fromTableId);
    const status = fromTable ? fromTable.status : 'OCCUPIED';
    this._tables.update(current => current.map(t => {
      if (t.id === fromTableId) {
        return { ...t, status: 'FREE' };
      }
      if (t.id === toTableId) {
        return { ...t, status };
      }
      return t;
    }));
  }

  ngOnDestroy(): void {
    this.unsubscribeRealtime();
  }
}
