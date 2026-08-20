import { Injectable, inject, signal } from '@angular/core';
import { BaseApiService } from '../../http/base-api.service';
import { SessionService } from './session.service';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

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
  private _loaded = false;
  private _loadRequest$: Observable<UserPermission[]> | null = null;

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
      this._loaded = false;
      this._loadRequest$ = null;
      return of([]);
    }

    if (this._loadRequest$) {
      return this._loadRequest$;
    }

    this._loadRequest$ = this.http.get<UserPermission[]>(`${this.baseUrl}/accounts/me/permissions`).pipe(
      tap((perms) => {
        const grantedSet = new Set<string>();
        perms.forEach((p) => {
          if (p.granted) {
            grantedSet.add(p.code);
          }
        });
        this._permissions.set(grantedSet);
        this._loaded = true;
        this._loadRequest$ = null;
      }),
      catchError((err) => {
        console.error('Error loading user permissions:', err);
        this._permissions.set(new Set());
        this._loaded = false;
        this._loadRequest$ = null;
        return of([]);
      })
    );

    return this._loadRequest$;
  }

  checkPermission(code: string): Observable<boolean> {
    if (this._loaded) {
      return of(this.hasPermission(code));
    }
    return this.loadPermissions().pipe(
      map(() => this.hasPermission(code))
    );
  }

  hasPermission(code: string): boolean {
    return this._permissions().has(code);
  }

  clearPermissions(): void {
    this._permissions.set(new Set());
    this._loaded = false;
    this._loadRequest$ = null;
  }
}
