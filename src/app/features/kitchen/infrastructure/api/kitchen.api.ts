import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';
import { Product } from '../../../orders/domain/models/orders.model';

export interface KitchenZone {
  id: number;
  name: string;
}

export interface KitchenQueueItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  note: string;
  status: 'PENDING' | 'IN_PREPARATION' | 'READY';
  createdAt: string;
  tableNumber?: number; // Devolución directa del DTO del backend
}

@Injectable({ providedIn: 'root' })
export class KitchenApi extends BaseApiService {
  
  getZones(): Observable<KitchenZone[]> {
    return this.http.get<KitchenZone[]>(`${this.baseUrl}/kitchen/zones`);
  }

  getQueueByZone(zoneId: number): Observable<KitchenQueueItem[]> {
    return this.http.get<KitchenQueueItem[]>(`${this.baseUrl}/kitchen/zones/${zoneId}/queue`);
  }

  startPreparation(itemId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/kitchen/items/${itemId}/start-preparation`, null);
  }

  markReady(itemId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/kitchen/items/${itemId}/mark-ready`, null);
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }
}
