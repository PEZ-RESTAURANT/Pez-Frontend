import { Injectable, inject, signal } from '@angular/core';
import { OrdersApi } from '../api/orders.api';
import { Order, OrderItem, RestaurantTable } from '../../domain/models/orders.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private api = inject(OrdersApi);
  private notify = inject(NotificationService);

  private _orders = signal<Order[]>([]);
  private _attentionQueue = signal<RestaurantTable[]>([]);
  private _kitchenQueue = signal<OrderItem[]>([]);

  // Public readonly signals with $ suffix
  public orders$ = this._orders.asReadonly();
  public attentionQueue$ = this._attentionQueue.asReadonly();
  public kitchenQueue$ = this._kitchenQueue.asReadonly();

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
}
