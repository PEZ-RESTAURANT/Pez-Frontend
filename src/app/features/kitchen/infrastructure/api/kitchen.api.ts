import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';
import { Product } from '../../../orders/domain/models/orders.model';

export interface KitchenZone {
  id: number;
  name: string;
  printingEnabled: boolean;
}

export interface PrintStation {
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
  tableNumber?: number;
  readyAt?: string;
  orderType?: string;
}

@Injectable({ providedIn: 'root' })
export class KitchenApi extends BaseApiService {
  
  getZones(): Observable<KitchenZone[]> {
    return this.http.get<KitchenZone[]>(`${this.baseUrl}/kitchen/zones`);
  }

  createZone(name: string, printingEnabled: boolean): Observable<KitchenZone> {
    return this.http.post<KitchenZone>(`${this.baseUrl}/kitchen/zones`, { name, printingEnabled });
  }

  updateZone(id: number, name: string, printingEnabled: boolean): Observable<KitchenZone> {
    return this.http.put<KitchenZone>(`${this.baseUrl}/kitchen/zones/${id}`, { name, printingEnabled });
  }

  deleteZone(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/kitchen/zones/${id}`);
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

  // Print Stations endpoints
  getPrintStations(): Observable<PrintStation[]> {
    return this.http.get<PrintStation[]>(`${this.baseUrl}/kitchen/print-stations`);
  }

  createPrintStation(name: string): Observable<PrintStation> {
    return this.http.post<PrintStation>(`${this.baseUrl}/kitchen/print-stations`, { name });
  }

  deletePrintStation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/kitchen/print-stations/${id}`);
  }

  // Manual Audit Logging endpoint
  logAuditEvent(eventType: string, module: string, deviceId: string, payload: any, reason?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/audit-events`, {
      eventType,
      module,
      deviceId,
      payload,
      reason
    });
  }
}
