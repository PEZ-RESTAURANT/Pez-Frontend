import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OrderDetailPageComponent, CartLine } from './order-detail-page.component';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../../infrastructure/services/orders.service';
import { OrdersApi } from '../../infrastructure/api/orders.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { of } from 'rxjs';
import { Product } from '../../domain/models/orders.model';
import { signal } from '@angular/core';

describe('OrderDetailPageComponent - Cart Logic Rules', () => {
  let component: OrderDetailPageComponent;
  let fixture: ComponentFixture<OrderDetailPageComponent>;

  const mockProduct1: Product = {
    id: 101,
    name: 'Ceviche Clásico',
    price: 35.0,
    category: { id: 1, name: 'MARINA' },
    estimatedPrepTimeMinutes: 12,
    active: true
  };

  const mockProduct2: Product = {
    id: 102,
    name: 'Lomo Saltado',
    price: 40.0,
    category: { id: 3, name: 'CRIOLLA' },
    estimatedPrepTimeMinutes: 15,
    active: true
  };

  beforeEach(async () => {
    const mockOrdersService = {
      tables$: signal([]),
      tableLocks$: signal({}),
      orders$: signal([])
    };

    const mockOrdersApi = {
      getProducts: () => of([mockProduct1, mockProduct2]),
      lockTable: () => of(void 0),
      unlockTable: () => of(void 0),
      getActiveLocks: () => of({})
    };

    const mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);
    
    const mockSessionService = {
      getRestaurantId: () => 1,
      getCurrentUserId: () => 10,
      getToken: () => 'mock-jwt-token',
      currentUser$: signal({ id: 10, firstName: 'Juan', lastName: 'Perez', roles: ['ADMIN'] }),
      isAuthenticated$: signal(true)
    };

    const mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    const mockActivatedRoute = {
      paramMap: of({
        get: (key: string) => '1'
      })
    };

    await TestBed.configureTestingModule({
      imports: [OrderDetailPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: OrdersApi, useValue: mockOrdersApi },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: SessionService, useValue: mockSessionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should group items of the same product with the same observation', () => {
    // 1. Añadimos Ceviche con nota vacía
    component.selectedProduct.set(mockProduct1);
    component.modalQuantity.set(2);
    component.modalNote = '';
    component.submitAddProduct();

    expect(component.cart().length).toBe(1);
    expect(component.cart()[0].product.id).toBe(101);
    expect(component.cart()[0].quantity).toBe(2);
    expect(component.cart()[0].note).toBe('');

    // 2. Añadimos el mismo Ceviche con nota vacía de nuevo
    component.selectedProduct.set(mockProduct1);
    component.modalQuantity.set(3);
    component.modalNote = '   '; // Espacios en blanco que se limpian
    component.submitAddProduct();

    // Debería acumularse en la misma línea
    expect(component.cart().length).toBe(1);
    expect(component.cart()[0].quantity).toBe(5);
    expect(component.cart()[0].note).toBe('');
  });

  it('should separate items of the same product with different observations', () => {
    // 1. Añadimos Ceviche sin picante
    component.selectedProduct.set(mockProduct1);
    component.modalQuantity.set(1);
    component.modalNote = 'Sin picante';
    component.submitAddProduct();

    expect(component.cart().length).toBe(1);

    // 2. Añadimos Ceviche bien picante
    component.selectedProduct.set(mockProduct1);
    component.modalQuantity.set(2);
    component.modalNote = 'Bien picante';
    component.submitAddProduct();

    // Deberían estar en líneas separadas del carrito
    expect(component.cart().length).toBe(2);
    expect(component.cart()[0].product.id).toBe(101);
    expect(component.cart()[0].note).toBe('Sin picante');
    expect(component.cart()[0].quantity).toBe(1);

    expect(component.cart()[1].product.id).toBe(101);
    expect(component.cart()[1].note).toBe('Bien picante');
    expect(component.cart()[1].quantity).toBe(2);
  });

  it('should add different products as separate lines in the cart', () => {
    // 1. Añadimos Ceviche
    component.selectedProduct.set(mockProduct1);
    component.modalQuantity.set(1);
    component.modalNote = '';
    component.submitAddProduct();

    // 2. Añadimos Lomo Saltado
    component.selectedProduct.set(mockProduct2);
    component.modalQuantity.set(1);
    component.modalNote = '';
    component.submitAddProduct();

    expect(component.cart().length).toBe(2);
    expect(component.cart()[0].product.id).toBe(101);
    expect(component.cart()[1].product.id).toBe(102);
  });
});
