import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';
import { Supply } from '../../../catalog/infrastructure/api/catalog.api';

export interface StockMovement {
  id: number;
  supplyId: number;
  type: 'RESTOCK' | 'SALE_DEDUCTION' | 'MANUAL_ADJUSTMENT';
  quantity: number;
  registeredBy: string;
  date: string;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryApi extends BaseApiService {

  getLowStockAlerts(): Observable<Supply[]> {
    return this.http.get<Supply[]>(`${this.baseUrl}/inventory/alerts/low-stock`);
  }

  getMismatchedAlerts(): Observable<Supply[]> {
    return this.http.get<Supply[]>(`${this.baseUrl}/inventory/alerts/mismatched`);
  }

  getSupplyMovements(supplyId: number): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.baseUrl}/inventory/supplies/${supplyId}/movements`);
  }
}
