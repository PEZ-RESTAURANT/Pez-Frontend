import { Injectable, inject, signal } from '@angular/core';
import { BaseApiService } from '../../http/base-api.service';
import { SessionService } from './session.service';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface UserPermission {
  code: string;
  module: string;
  description: string;
  granted: boolean;
}

@Injectable({ providedIn: 'root' })
export class PermissionService extends BaseApiService {
  private session = inject(SessionService);
  private _permissions = signal<Set<string>>(new Set());

  // Expose signal of permissions (Set of strings) as readonly
  public permissions$ = this._permissions.asReadonly();

  constructor() {
    super();
    if (this.session.isAuthenticated$()) {
      this.loadPermissions().subscribe();
    }
  }

  loadPermissions(): Observable<UserPermission[]> {
    if (!this.session.isAuthenticated$()) {
      this._permissions.set(new Set());
      return of([]);
    }

    return this.http.get<UserPermission[]>(`${this.baseUrl}/accounts/me/permissions`).pipe(
      tap((perms) => {
        const grantedSet = new Set<string>();
        perms.forEach((p) => {
          if (p.granted) {
            grantedSet.add(p.code);
          }
        });
        this._permissions.set(grantedSet);
      }),
      catchError((err) => {
        console.error('Error loading user permissions:', err);
        this._permissions.set(new Set());
        return of([]);
      })
    );
  }

  hasPermission(code: string): boolean {
    return this._permissions().has(code);
  }

  clearPermissions(): void {
    this._permissions.set(new Set());
  }
}
