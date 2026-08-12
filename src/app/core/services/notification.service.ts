import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  private _toasts = signal<ToastMessage[]>([]);

  // Readonly signal of toasts
  public toasts$ = this._toasts.asReadonly();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  private show(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
    const id = this.nextId++;
    const newToast: ToastMessage = { id, type, message };

    this._toasts.update((current) => [...current, newToast]);

    setTimeout(() => {
      this.dismiss(id);
    }, 4000);
  }

  dismiss(id: number): void {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
