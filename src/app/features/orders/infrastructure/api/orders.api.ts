import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';
import { Order, OrderItem, RestaurantTable } from '../../domain/models/orders.model';

@Injectable({ providedIn: 'root' })
export class OrdersApi extends BaseApiService {
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
}
