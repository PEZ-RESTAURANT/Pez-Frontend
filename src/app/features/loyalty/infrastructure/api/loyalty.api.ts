import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';

export interface CustomerResource {
  id: number;
  phone: string;
  fullName: string;
  email?: string;
  birthday?: string;
  address?: string;
  documentNumber?: string;
  lastPaymentMethod?: string;
  affiliated?: boolean;
  dataConsentAccepted: boolean;
  dataConsentDate?: string;
  pointsBalance: number;
}

export interface CreateCustomerPayload {
  phone: string;
  fullName: string;
  email?: string;
  birthday?: string;
  address?: string;
  dataConsentAccepted: boolean;
}

export interface SubmitSurveyPayload {
  favoriteDish: string;
  favoriteDrink: string;
  serviceSatisfaction: number; // 1 to 5
  foodSatisfaction: number;    // 1 to 5
  suggestion?: string;
  date?: string;
}

export interface SurveyResponseResource {
  showReviewPrompt: boolean;
  reviewUrl?: string;
}

export interface PointsTransactionResource {
  id: number;
  customerId: number;
  type: 'EARNED' | 'REDEEMED' | 'REFUNDED' | 'MANUAL';
  amount: number;
  saleId?: number;
  date: string;
}

export interface LoyaltyConfigResource {
  minPurchaseAmountForPoints: number;
  pointsPerCurrencyUnit: number;
  reviewSatisfactionThreshold: number;
  googleReviewUrl: string;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyApi extends BaseApiService {

  registerCustomer(payload: CreateCustomerPayload): Observable<CustomerResource> {
    return this.http.post<CustomerResource>(`${this.baseUrl}/customers`, payload);
  }

  getCustomerByPhone(phone: string): Observable<CustomerResource> {
    return this.http.get<CustomerResource>(`${this.baseUrl}/customers/by-phone/${phone}`);
  }

  getCustomerById(id: number): Observable<CustomerResource> {
    return this.http.get<CustomerResource>(`${this.baseUrl}/customers/${id}`);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/customers/${id}`);
  }

  submitSurvey(id: number, payload: SubmitSurveyPayload): Observable<SurveyResponseResource> {
    return this.http.post<SurveyResponseResource>(`${this.baseUrl}/customers/${id}/survey`, payload);
  }

  redeemPoints(id: number, points: number, date?: string): Observable<PointsTransactionResource> {
    return this.http.post<PointsTransactionResource>(`${this.baseUrl}/customers/${id}/redeem-points`, { points, date });
  }

  getPointsHistory(id: number): Observable<PointsTransactionResource[]> {
    return this.http.get<PointsTransactionResource[]>(`${this.baseUrl}/customers/${id}/points-history`);
  }

  getConfig(): Observable<LoyaltyConfigResource> {
    return this.http.get<LoyaltyConfigResource>(`${this.baseUrl}/loyalty/config`);
  }

  updateConfig(payload: LoyaltyConfigResource): Observable<LoyaltyConfigResource> {
    return this.http.put<LoyaltyConfigResource>(`${this.baseUrl}/loyalty/config`, payload);
  }

  sendPromotion(customerId: number, subject: string, message: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/customers/${customerId}/send-promotion`, { subject, message });
  }
}
