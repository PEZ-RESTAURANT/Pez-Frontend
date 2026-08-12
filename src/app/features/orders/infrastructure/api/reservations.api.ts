import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';

export interface Reservation {
  id: number;
  customerName: string;
  customerPhone: string;
  customerId?: number;
  reservationDateTime: string; // ISO format
  partySize: number;
  notes?: string;
  tableId?: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReservationPayload {
  customerName: string;
  customerPhone: string;
  customerId?: number;
  reservationDateTime: string;
  partySize: number;
  notes?: string;
  tableId?: number;
}

export interface UpdateReservationPayload {
  customerName: string;
  customerPhone: string;
  customerId?: number;
  reservationDateTime: string;
  partySize: number;
  notes?: string;
  tableId?: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
}

@Injectable({ providedIn: 'root' })
export class ReservationsApi extends BaseApiService {

  createReservation(payload: CreateReservationPayload): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations`, payload);
  }

  getReservations(date?: string, status?: string): Observable<Reservation[]> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = {};
    if (date) params['date'] = date;
    if (status) params['status'] = status;
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations`, { params });
  }

  updateReservation(id: number, payload: UpdateReservationPayload): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.baseUrl}/reservations/${id}`, payload);
  }

  cancelReservation(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reservations/${id}/cancel`, {});
  }

  completeReservation(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reservations/${id}/complete`, {});
  }

  noShowReservation(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reservations/${id}/no-show`, {});
  }
}
