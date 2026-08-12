import { TestBed, ComponentFixture } from '@angular/core/testing';
import { KitchenPageComponent } from './kitchen-page.component';
import { KitchenApi, KitchenQueueItem } from '../../infrastructure/api/kitchen.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { RealtimeService } from '../../../../core/realtime/services/realtime.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { of } from 'rxjs';
import { Product } from '../../../orders/domain/models/orders.model';
import { signal } from '@angular/core';

describe('KitchenPageComponent - Urgency Chromatic Levels', () => {
  let component: KitchenPageComponent;
  let fixture: ComponentFixture<KitchenPageComponent>;

  const mockProductWithPrep: Product = {
    id: 201,
    name: 'Ceviche Mixto',
    price: 38.0,
    category: { id: 1, name: 'MARINA' },
    estimatedPrepTimeMinutes: 10, // 10 minutos
    active: true
  };

  const mockProductWithoutPrep: Product = {
    id: 202,
    name: 'Inca Kola 1L',
    price: 10.0,
    category: { id: 2, name: 'BEBIDAS' },
    estimatedPrepTimeMinutes: 0, // No definido / 0
    active: true
  };

  beforeEach(async () => {
    const mockKitchenApi = {
      getZones: () => of([{ id: 1, name: 'Marina' }]),
      getQueueByZone: () => of([]),
      getProducts: () => of([mockProductWithPrep, mockProductWithoutPrep]),
      startPreparation: () => of(void 0),
      markReady: () => of(void 0)
    };

    const mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    const mockRealtimeService = {
      subscribeToKitchen: () => of({ eventType: '', payload: {} })
    };
    const mockSessionService = {
      getRestaurantId: () => 1,
      getCurrentUserId: () => 5,
      getToken: () => 'token'
    };

    await TestBed.configureTestingModule({
      imports: [KitchenPageComponent],
      providers: [
        { provide: KitchenApi, useValue: mockKitchenApi },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: RealtimeService, useValue: mockRealtimeService },
        { provide: SessionService, useValue: mockSessionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KitchenPageComponent);
    component = fixture.componentInstance;
    
    // Asignar los productos directamente a la señal
    component.products.set([mockProductWithPrep, mockProductWithoutPrep]);
    
    fixture.detectChanges();
  });

  it('should return NORMAL when elapsed time is below preparation limit', () => {
    const item: KitchenQueueItem = {
      id: 1,
      orderId: 10,
      productId: 201, // Ceviche (10m)
      quantity: 1,
      note: '',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // Simulamos 5 minutos transcurridos (5 * 60 = 300 segundos)
    component['elapsedSeconds'].set({ 1: 300 });

    const urgency = component.getUrgencyLevel(item);
    expect(urgency).toBe('NORMAL');
  });

  it('should return AMBER when elapsed time exceeds estimated prep limit but is below 1.5x', () => {
    const item: KitchenQueueItem = {
      id: 2,
      orderId: 10,
      productId: 201, // Ceviche (10m)
      quantity: 1,
      note: '',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // Simulamos 11 minutos transcurridos (11 * 60 = 660 segundos)
    component['elapsedSeconds'].set({ 2: 660 });

    const urgency = component.getUrgencyLevel(item);
    expect(urgency).toBe('AMBER');
  });

  it('should return RED when elapsed time exceeds 1.5x preparation limit', () => {
    const item: KitchenQueueItem = {
      id: 3,
      orderId: 10,
      productId: 201, // Ceviche (10m, 1.5x = 15m)
      quantity: 1,
      note: '',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // Simulamos 16 minutos transcurridos (16 * 60 = 960 segundos)
    component['elapsedSeconds'].set({ 3: 960 });

    const urgency = component.getUrgencyLevel(item);
    expect(urgency).toBe('RED');
  });

  it('should fall back to default thresholds (10m Amber / 15m Red) when product prep limit is not defined', () => {
    const item: KitchenQueueItem = {
      id: 4,
      orderId: 10,
      productId: 202, // Inca Kola (0m prep time)
      quantity: 1,
      note: '',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // 1. Menos de 10 minutos (5m) -> NORMAL
    component['elapsedSeconds'].set({ 4: 300 });
    expect(component.getUrgencyLevel(item)).toBe('NORMAL');

    // 2. Más de 10 minutos pero menos de 15m (12m) -> AMBER
    component['elapsedSeconds'].set({ 4: 720 });
    expect(component.getUrgencyLevel(item)).toBe('AMBER');

    // 3. Más de 15 minutos (16m) -> RED
    component['elapsedSeconds'].set({ 4: 960 });
    expect(component.getUrgencyLevel(item)).toBe('RED');
  });
});
