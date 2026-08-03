import { Injectable, inject, signal, effect, OnDestroy } from '@angular/core';
import { RxStomp, RxStompState } from '@stomp/rx-stomp';
import { Observable, BehaviorSubject, timer, of } from 'rxjs';
import { map, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { SessionService } from '../../auth/services/session.service';
import { environment } from '../../../../environments/environment';

export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private sessionService = inject(SessionService);
  private rxStomp = new RxStomp();

  // Signal for raw connection status
  private _connectionStatus = signal<ConnectionStatus>('DISCONNECTED');
  public connectionStatus$ = this._connectionStatus.asReadonly();

  // Signal indicating if the UI should show a "Reconnecting" warning (only if disconnected for > 2 seconds)
  private _showReconnectingWarning = signal<boolean>(false);
  public showReconnectingWarning$ = this._showReconnectingWarning.asReadonly();

  constructor() {
    this.setupStateTracking();

    // Effect to monitor JWT token changes and reconnect WebSocket with fresh credentials
    effect(() => {
      const user = this.sessionService.currentUser$();
      const token = this.sessionService.getToken();
      if (user && token) {
        this.updateTokenAndReconnect(token);
      } else {
        this.disconnect();
      }
    });
  }

  private setupStateTracking(): void {
    // Subscribe to StompState
    this.rxStomp.connectionState$.subscribe((state: RxStompState) => {
      const status = this.mapState(state);
      this._connectionStatus.set(status);

      // Handle reconnecting warning timer
      if (status === 'CONNECTED') {
        this._showReconnectingWarning.set(false);
      } else if (status === 'CONNECTING' || status === 'DISCONNECTED') {
        // If it remains disconnected or connecting for more than 2 seconds, trigger warning
        timer(2000).subscribe(() => {
          const currentStatus = this._connectionStatus();
          if (currentStatus !== 'CONNECTED') {
            this._showReconnectingWarning.set(true);
          }
        });
      }
    });
  }

  private mapState(state: RxStompState): ConnectionStatus {
    switch (state) {
      case RxStompState.OPEN:
        return 'CONNECTED';
      case RxStompState.CONNECTING:
        return 'CONNECTING';
      case RxStompState.CLOSED:
      case RxStompState.CLOSING:
      default:
        return 'DISCONNECTED';
    }
  }

  private getBrokerUrl(): string {
    const apiBaseUrl = environment.serverBaseUrl || 'http://localhost:8080/api/v1';
    // Remove the /api/v1 or similar path suffix at the end if present
    const baseUrlClean = apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    const wsProto = baseUrlClean.startsWith('https') ? 'wss' : 'ws';
    const host = baseUrlClean.replace(/^https?:\/\//, '');
    return `${wsProto}://${host}/ws`;
  }

  private updateTokenAndReconnect(token: string): void {
    const brokerUrl = this.getBrokerUrl();
    this.rxStomp.configure({
      brokerURL: brokerUrl,
      connectHeaders: {
        Authorization: 'Bearer ' + token
      },
      heartbeatIncoming: 0, // No incoming heartbeats required
      heartbeatOutgoing: 20000, // 20s outgoing heartbeat
      reconnectDelay: 5000, // 5s reconnect delay
    });

    if (this.rxStomp.active) {
      // Re-activate stomp with the new config/token
      this.rxStomp.deactivate().then(() => {
        this.rxStomp.activate();
      });
    } else {
      this.rxStomp.activate();
    }
  }

  private disconnect(): void {
    if (this.rxStomp.active) {
      this.rxStomp.deactivate();
    }
  }

  // General watch method
  public watch(topic: string): Observable<any> {
    return this.rxStomp.watch(topic).pipe(
      map(message => {
        try {
          return JSON.parse(message.body);
        } catch {
          return message.body;
        }
      })
    );
  }

  // Topic subscriptions
  public subscribeToTables(restaurantId: number): Observable<any> {
    return this.watch(`/topic/restaurants/${restaurantId}/tables`);
  }

  public subscribeToKitchen(restaurantId: number): Observable<any> {
    return this.watch(`/topic/restaurants/${restaurantId}/kitchen`);
  }

  public subscribeToAlerts(restaurantId: number): Observable<any> {
    return this.watch(`/topic/restaurants/${restaurantId}/alerts`);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
