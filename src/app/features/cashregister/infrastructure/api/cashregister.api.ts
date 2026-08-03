import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';

export interface MovementsSummary {
  totalSales: number;
  totalManualIncome: number;
  totalManualExpense: number;
}

export interface CashMovement {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  reason: 'SUPPLIER_PAYMENT' | 'CASH_WITHDRAWAL' | 'PETTY_CASH' | 'OTHER';
  note: string;
  createdAt: string;
}

export interface CashRegister {
  id: number;
  openingBalance: number;
  currentBalance: number;
  status: 'OPEN' | 'CLOSED';
  summary?: MovementsSummary;
  createdAt: string;
  closedAt?: string;
  movements: CashMovement[];
}

export interface PaymentMethodConfig {
  id: number;
  name: string;
  type: 'CASH' | 'CARD' | 'YAPE' | 'PLIN' | 'TRANSFER';
  active: boolean;
}

export interface SalePayment {
  method: 'CASH' | 'CARD' | 'YAPE' | 'PLIN' | 'TRANSFER';
  amount: number;
}

export interface SaleDetail {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: number;
  orderId: number;
  documentType: 'NOTE' | 'RECEIPT' | 'INVOICE' | 'BOLETA' | 'FACTURA_ELECTRONICA';
  customerDocumentNumber?: string;
  customerName?: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  payments: SalePayment[];
  details: SaleDetail[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CashRegisterApi extends BaseApiService {

  getCurrentRegister(): Observable<CashRegister> {
    return this.http.get<CashRegister>(`${this.baseUrl}/cash-registers/current`);
  }

  openRegister(openingBalance: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/cash-registers/open`, { openingBalance });
  }

  closeRegisterWithDeclaration(id: number, declaredAmount: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/cash-registers/${id}/close-with-declaration`, { declaredAmount });
  }

  addMovement(type: 'INCOME' | 'EXPENSE', amount: number, reason: string, note: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/cash-registers/movements`, { type, amount, reason, note });
  }

  getRegisterMovements(id: number, type?: string): Observable<CashMovement[]> {
    let url = `${this.baseUrl}/cash-registers/${id}/movements`;
    if (type) {
      url += `?type=${type}`;
    }
    return this.http.get<CashMovement[]>(url);
  }

  createSale(orderId: number, documentType: string, customerDocumentNumber?: string, customerName?: string): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/sales`, {
      orderId,
      documentType,
      customerDocumentNumber,
      customerName
    });
  }

  getSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.baseUrl}/sales`);
  }

  registerPayments(saleId: number, payments: SalePayment[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/sales/${saleId}/payments`, { payments });
  }

  findSaleByRuc(ruc: string): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.baseUrl}/sales`, {
      params: { customerDocumentNumber: ruc }
    });
  }

  getActivePaymentMethods(): Observable<PaymentMethodConfig[]> {
    return this.http.get<PaymentMethodConfig[]>(`${this.baseUrl}/payment-methods/active`);
  }
}
