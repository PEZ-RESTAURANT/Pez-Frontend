import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';

export interface UserResource {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  active: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  requestedRole: 'ADMIN' | 'CASHIER' | 'WAITER' | 'COOK';
}

export interface UpdateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  requestedRole: 'ADMIN' | 'CASHIER' | 'WAITER' | 'COOK';
  active: boolean;
}

export interface UserPermission {
  code: string;
  module: string;
  description: string;
  granted: boolean;
  isOverride: boolean;
  roleDefaultValue: boolean;
  overrideGrantedBy?: string;
  overrideDate?: string;
  overrideReason?: string;
}

export interface OverridePayload {
  permissionCode: string;
  value: 'GRANTED' | 'REVOKED';
  reason?: string;
}

// ================= STAFF MODULE TYPES =================
export interface StaffProfile {
  id: number;
  accountId: number;
  paymentType: 'DAILY' | 'BIWEEKLY' | 'MONTHLY';
  agreedAmount: number;
  fingerprintConsent: boolean;
  fingerprintConsentDate?: string;
}

export interface CreateStaffProfilePayload {
  accountId: number;
  paymentType: 'DAILY' | 'BIWEEKLY' | 'MONTHLY';
  agreedAmount: number;
}

export interface AttendanceRecord {
  id: number;
  staffProfileId: number;
  checkInAt?: string;
  checkOutAt?: string;
  method: 'FINGERPRINT_HASH' | 'MANUAL_BY_ADMIN';
}

export interface PayrollAdjustment {
  id: number;
  staffProfileId: number;
  type: 'ADVANCE' | 'CONSUMPTION_DEDUCTION';
  amount: number;
  saleId?: number;
  registeredBy: string;
  date: string;
}

export interface Sanction {
  id: number;
  staffProfileId: number;
  type: 'UNJUSTIFIED_ABSENCE' | 'LATE_ARRIVAL' | 'MISCONDUCT' | 'BROKEN_ITEMS' | 'OTHER';
  reason: string;
  registeredBy: string;
  date: string;
}

export interface OvertimeRecord {
  id: number;
  staffProfileId: number;
  hours: number;
  date: string;
  registeredBy: string;
}

export interface PaymentSummary {
  agreedAmount: number;
  totalAdvances: number;
  totalDeductions: number;
  totalOvertimeHours: number;
  netPending: number;
}

@Injectable({ providedIn: 'root' })
export class StaffApi extends BaseApiService {

  // --- IAM USERS ACCOUNTS MAPPINGS ---
  getUsers(): Observable<UserResource[]> {
    return this.http.get<UserResource[]>(`${this.baseUrl}/users`);
  }

  getUserById(id: number): Observable<UserResource> {
    return this.http.get<UserResource>(`${this.baseUrl}/users/${id}`);
  }

  createUser(payload: CreateUserPayload): Observable<UserResource> {
    return this.http.post<UserResource>(`${this.baseUrl}/users`, payload);
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<UserResource> {
    return this.http.put<UserResource>(`${this.baseUrl}/users/${id}`, payload);
  }

  getEffectivePermissionsForUser(userId: number): Observable<UserPermission[]> {
    return this.http.get<UserPermission[]>(`${this.baseUrl}/users/${userId}/permissions`);
  }

  createOrUpdateOverride(userId: number, payload: OverridePayload): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/users/${userId}/permissions/override`, payload);
  }

  deleteOverride(userId: number, permissionCode: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}/permissions/override/${permissionCode}`);
  }

  // --- STAFF PROFILES MAPPINGS ---
  getProfiles(): Observable<StaffProfile[]> {
    return this.http.get<StaffProfile[]>(`${this.baseUrl}/staff/profiles`);
  }

  createProfile(payload: CreateStaffProfilePayload): Observable<StaffProfile> {
    return this.http.post<StaffProfile>(`${this.baseUrl}/staff/profiles`, payload);
  }

  updateProfile(id: number, payload: CreateStaffProfilePayload): Observable<StaffProfile> {
    return this.http.put<StaffProfile>(`${this.baseUrl}/staff/profiles/${id}`, payload);
  }

  recordFingerprintConsent(id: number, consent: boolean): Observable<StaffProfile> {
    return this.http.post<StaffProfile>(`${this.baseUrl}/staff/profiles/${id}/fingerprint-consent`, { consent });
  }

  // --- ATTENDANCE MAPPINGS ---
  getAttendance(id: number): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.baseUrl}/staff/profiles/${id}/attendance`);
  }

  checkIn(payload: { staffProfileId: number, method: string, checkInAt?: string }): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.baseUrl}/staff/attendance/check-in`, payload);
  }

  checkOut(payload: { staffProfileId: number, checkOutAt?: string }): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.baseUrl}/staff/attendance/check-out`, payload);
  }

  // --- PAYROLL ADJUSTMENTS MAPPINGS ---
  getPayrollAdjustments(id: number): Observable<PayrollAdjustment[]> {
    return this.http.get<PayrollAdjustment[]>(`${this.baseUrl}/staff/profiles/${id}/payroll-adjustments`);
  }

  createPayrollAdjustment(id: number, payload: { type: string, amount: number, date?: string }): Observable<PayrollAdjustment> {
    return this.http.post<PayrollAdjustment>(`${this.baseUrl}/staff/profiles/${id}/payroll-adjustments`, payload);
  }

  // --- SANCTIONS MAPPINGS ---
  getSanctions(id: number): Observable<Sanction[]> {
    return this.http.get<Sanction[]>(`${this.baseUrl}/staff/profiles/${id}/sanctions`);
  }

  createSanction(id: number, payload: { type: string, reason: string, date?: string }): Observable<Sanction> {
    return this.http.post<Sanction>(`${this.baseUrl}/staff/profiles/${id}/sanctions`, payload);
  }

  // --- OVERTIME MAPPINGS ---
  getOvertime(id: number): Observable<OvertimeRecord[]> {
    return this.http.get<OvertimeRecord[]>(`${this.baseUrl}/staff/profiles/${id}/overtime`);
  }

  createOvertime(id: number, payload: { hours: number, date?: string }): Observable<OvertimeRecord> {
    return this.http.post<OvertimeRecord>(`${this.baseUrl}/staff/profiles/${id}/overtime`, payload);
  }

  // --- SUMMARY MAPPINGS ---
  getPaymentSummary(id: number): Observable<PaymentSummary> {
    return this.http.get<PaymentSummary>(`${this.baseUrl}/staff/profiles/${id}/payment-summary`);
  }
}
