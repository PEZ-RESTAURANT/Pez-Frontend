import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  actionRoute?: string;
  actionLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  private _toasts = signal<ToastMessage[]>([]);

  // Readonly signal of toasts
  public toasts$ = this._toasts.asReadonly();

  success(message: string, actionRoute?: string, actionLabel?: string): void {
    this.show('success', message, actionRoute, actionLabel);
  }

  error(message: string, actionRoute?: string, actionLabel?: string): void {
    this.show('error', message, actionRoute, actionLabel);
  }

  info(message: string, actionRoute?: string, actionLabel?: string): void {
    this.show('info', message, actionRoute, actionLabel);
  }

  warning(message: string, actionRoute?: string, actionLabel?: string): void {
    this.show('warning', message, actionRoute, actionLabel);
  }

  private show(
    type: 'success' | 'error' | 'info' | 'warning', 
    message: string, 
    actionRoute?: string, 
    actionLabel?: string
  ): void {
    const id = this.nextId++;
    const newToast: ToastMessage = { id, type, message, actionRoute, actionLabel };

    this._toasts.update((current) => [...current, newToast]);

    setTimeout(() => {
      this.dismiss(id);
    }, 6000); // 6s to allow reading and clicking action link
  }

  dismiss(id: number): void {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
