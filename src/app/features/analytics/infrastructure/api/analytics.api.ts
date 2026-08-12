import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';

export interface DailyRevenueResource {
  totalRevenue: number;
}

export interface MonthlyRevenueResource {
  totalRevenue: number;
}

export interface NetProfitInfo {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  isApproximation: boolean;
}

export interface BreakevenInfo {
  fixedExpenses: number;
  averageTicket: number;
  breakevenSalesCount: number;
  isApproximation: boolean;
}

export interface ComparisonInfo {
  revenueA: number;
  revenueB: number;
  revenueDiff: number;
  expensesA: number;
  expensesB: number;
  expensesDiff: number;
  netProfitA: number;
  netProfitB: number;
  netProfitDiff: number;
  salesCountA: number;
  salesCountB: number;
  salesCountDiff: number;
  ticketAverageA: number;
  ticketAverageB: number;
  ticketAverageDiff: number;
}

export interface KitchenZonePerformanceInfo {
  zoneName: string;
  itemsCount: number;
  revenue: number;
}

export interface WaiterRankingInfo {
  waiterId: number;
  firstName: string;
  lastName: string;
  totalSales: number;
}

export interface ProductSalesInfo {
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  lowSalesAlert: boolean;
}

export interface DailyProductionInfo {
  date: string;
  quantity: number;
}

export interface ComboInfo {
  productA: string;
  productB: string;
  count: number;
}

export interface AnalyticsConfigResource {
  lowSalesThresholdUnits: number;
  lowSalesEvaluationPeriodDays: number;
  datePresets: string; // JSON String
}

@Injectable({ providedIn: 'root' })
export class AnalyticsApi extends BaseApiService {

  getDailyRevenue(date?: string): Observable<DailyRevenueResource> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = {};
    if (date) params['date'] = date;
    return this.http.get<DailyRevenueResource>(`${this.baseUrl}/analytics/revenue/daily`, { params });
  }

  getMonthlyRevenue(year?: number, month?: number): Observable<MonthlyRevenueResource> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = {};
    if (year) params['year'] = year;
    if (month) params['month'] = month;
    return this.http.get<MonthlyRevenueResource>(`${this.baseUrl}/analytics/revenue/monthly`, { params });
  }

  getNetProfit(from?: string, to?: string): Observable<NetProfitInfo> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<NetProfitInfo>(`${this.baseUrl}/analytics/net-profit`, { params });
  }

  getBreakeven(from?: string, to?: string): Observable<BreakevenInfo> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<BreakevenInfo>(`${this.baseUrl}/analytics/breakeven`, { params });
  }

  getComparison(fromA: string, toA: string, fromB: string, toB: string): Observable<ComparisonInfo> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = { fromA, toA, fromB, toB };
    return this.http.get<ComparisonInfo>(`${this.baseUrl}/analytics/compare`, { params });
  }

  getPresets(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/analytics/presets`);
  }

  getKitchenZonePerformance(from?: string, to?: string): Observable<KitchenZonePerformanceInfo[]> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<KitchenZonePerformanceInfo[]>(`${this.baseUrl}/analytics/kitchen-zone-performance`, { params });
  }

  getWaitersRanking(from?: string, to?: string): Observable<WaiterRankingInfo[]> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<WaiterRankingInfo[]>(`${this.baseUrl}/analytics/waiters/ranking`, { params });
  }

  getTopProducts(from?: string, to?: string, limit: number = 10): Observable<ProductSalesInfo[]> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = { limit };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<ProductSalesInfo[]>(`${this.baseUrl}/analytics/products/top`, { params });
  }

  getBottomProducts(from?: string, to?: string, limit: number = 10): Observable<ProductSalesInfo[]> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = { limit };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<ProductSalesInfo[]>(`${this.baseUrl}/analytics/products/bottom`, { params });
  }

  getDailyProduction(productId: number, from?: string, to?: string): Observable<DailyProductionInfo[]> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<DailyProductionInfo[]>(`${this.baseUrl}/analytics/products/${productId}/daily-production`, { params });
  }

  getTopCombos(from?: string, to?: string, limit: number = 5): Observable<ComboInfo[]> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = { limit };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<ComboInfo[]>(`${this.baseUrl}/analytics/combos/top`, { params });
  }

  exportReport(report: string, format: string, from?: string, to?: string, limit?: number): Observable<Blob> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = { report, format };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (limit) params['limit'] = limit;
    return this.http.get(`${this.baseUrl}/analytics/export`, { params, responseType: 'blob' });
  }

  getConfig(): Observable<AnalyticsConfigResource> {
    return this.http.get<AnalyticsConfigResource>(`${this.baseUrl}/analytics/config`);
  }

  updateConfig(payload: AnalyticsConfigResource): Observable<AnalyticsConfigResource> {
    return this.http.put<AnalyticsConfigResource>(`${this.baseUrl}/analytics/config`, payload);
  }
}
