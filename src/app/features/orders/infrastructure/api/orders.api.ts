import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';
import { Order, OrderItem, RestaurantTable, Product } from '../../domain/models/orders.model';

@Injectable({ providedIn: 'root' })
export class OrdersApi extends BaseApiService {
  getTables(): Observable<RestaurantTable[]> {
    return this.http.get<RestaurantTable[]>(`${this.baseUrl}/tables`);
  }

  createTable(number: number, floor: number, zoneTag: string, positionX: number, positionY: number): Observable<RestaurantTable> {
    return this.http.post<RestaurantTable>(`${this.baseUrl}/tables`, { number, floor, zoneTag, positionX, positionY });
  }

  updateTable(id: number, number: number, floor: number, zoneTag: string): Observable<RestaurantTable> {
    return this.http.put<RestaurantTable>(`${this.baseUrl}/tables/${id}`, { number, floor, zoneTag });
  }

  updateTablePosition(id: number, positionX: number, positionY: number): Observable<RestaurantTable> {
    return this.http.put<RestaurantTable>(`${this.baseUrl}/tables/${id}/position`, { positionX, positionY });
  }

  deleteTable(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tables/${id}`);
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders`);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${id}`);
  }

  getAttentionQueue(): Observable<RestaurantTable[]> {
    return this.http.get<RestaurantTable[]>(`${this.baseUrl}/orders/queue/attention`);
  }

  getKitchenQueue(zoneId?: number): Observable<OrderItem[]> {
    let params = new HttpParams();
    if (zoneId) {
      params = params.set('zoneId', zoneId.toString());
    }
    return this.http.get<OrderItem[]>(`${this.baseUrl}/orders/queue/kitchen`, { params });
  }

  createOrder(tableId: number, type: string, customerId?: number): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, {
      tableId,
      type,
      customerId
    });
  }

  addItems(orderId: number, productId: number, quantity: number, note: string, waiterId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/orders/${orderId}/items`, {
      productId,
      quantity,
      note,
      waiterId
    });
  }

  changeItemStatus(orderId: number, itemId: number, status: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/orders/${orderId}/items/${itemId}/status`, null, {
      params: { status }
    });
  }

  // --- NUEVOS ENDPOINTS DE BLOQUEO Y ACCIONES DE MESAS ---

  getActiveLocks(): Observable<Record<number, any>> {
    return this.http.get<Record<number, any>>(`${this.baseUrl}/tables/locks`);
  }

  lockTable(tableId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/tables/${tableId}/lock`, null);
  }

  unlockTable(tableId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/tables/${tableId}/unlock`, null);
  }

  forceUnlockTable(tableId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/tables/${tableId}/force-unlock`, null);
  }

  mergeTables(anchorTableId: number, tableIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/tables/${anchorTableId}/merge`, { tableIds });
  }

  unmergeTables(anchorTableId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/tables/${anchorTableId}/unmerge`, null);
  }

  transferOrder(fromTableId: number, toTableId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/tables/${fromTableId}/transfer-order`, { toTableId });
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }

  getCustomerByPhone(phone: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/customers/by-phone/${phone}`);
  }
}
