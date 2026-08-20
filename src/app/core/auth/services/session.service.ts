import { Injectable, signal, computed } from '@angular/core';

export interface UserSession {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly TOKEN_KEY = 'pez-auth-token';
  private readonly USER_KEY = 'pez-auth-user';

  private _currentUser = signal<UserSession | null>(null);
  private _isAuthenticated = signal<boolean>(false);

  // Readonly signals using the $ suffix
  public currentUser$ = this._currentUser.asReadonly();
  public isAuthenticated$ = this._isAuthenticated.asReadonly();
  public restaurantName$ = computed(() => {
    this._isAuthenticated();
    return this.getRestaurantName() || '';
  });

  constructor() {
    this.restoreSession();
  }

  saveSession(token: string, user: UserSession): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
    this._isAuthenticated.set(true);
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRestaurantId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.restaurantId || null;
    } catch {
      return null;
    }
  }

  getRestaurantName(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.restaurantName || null;
    } catch {
      return null;
    }
  }

  getCurrentUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ? parseInt(payload.sub, 10) : null;
    } catch {
      return null;
    }
  }

  private restoreSession(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = Date.now() > payload.exp * 1000;

        if (!isExpired) {
          this._currentUser.set(JSON.parse(userJson));
          this._isAuthenticated.set(true);
          return;
        }
      } catch (e) {
        // parsing failed
      }
    }
    this.clearSession();
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() > payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
