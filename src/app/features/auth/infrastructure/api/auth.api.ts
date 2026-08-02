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
}
