import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';
import { UserSession } from '../../../../core/auth/services/session.service';

export interface SignInResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: UserSession;
}

@Injectable({ providedIn: 'root' })
export class AuthApi extends BaseApiService {
  signIn(email: string, password: string): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(`${this.baseUrl}/users/signin`, {
      email,
      password
    });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/forgot-password`, {
      email
    });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/reset-password`, {
      token,
      newPassword
    });
  }

  onboardRestaurant(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/restaurants/onboarding`, data);
  }

  getRestaurant(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/restaurants/${id}`);
  }
}
