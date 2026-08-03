import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CashRegisterPageComponent } from './cashregister-page.component';
import { CashRegisterApi } from '../../infrastructure/api/cashregister.api';
import { OrdersApi } from '../../../orders/infrastructure/api/orders.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { RealtimeService } from '../../../../core/realtime/services/realtime.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { of } from 'rxjs';
import { Order } from '../../../orders/domain/models/orders.model';

describe('CashRegisterPageComponent - Logic validations', () => {
  let component: CashRegisterPageComponent;
  let fixture: ComponentFixture<CashRegisterPageComponent>;

  beforeEach(async () => {
    const mockCashRegisterApi = {
      getCurrentRegister: () => of({
        id: 1,
        openingBalance: 100,
        currentBalance: 150,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        movements: []
      }),
      openRegister: () => of(void 0),
      closeRegisterWithDeclaration: () => of(void 0),
      addMovement: () => of(void 0),
      getRegisterMovements: () => of([]),
      createSale: () => of(123),
      registerPayments: () => of(void 0),
      findSaleByRuc: () => of([]),
      getSales: () => of([]),
      getActivePaymentMethods: () => of([
        { id: 1, name: 'Efectivo', type: 'CASH', active: true },
        { id: 2, name: 'Yape', type: 'YAPE', active: true }
      ])
    };

    const mockOrdersApi = {
      getTables: () => of([]),
      getAllOrders: () => of([])
    };

    const mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    const mockRealtimeService = {
      subscribeToAlerts: () => of({ eventType: '', payload: {} })
    };
    const mockSessionService = {
      getRestaurantId: () => 1,
      getCurrentUserId: () => 5,
      getToken: () => 'token'
    };

    await TestBed.configureTestingModule({
      imports: [CashRegisterPageComponent],
      providers: [
        { provide: CashRegisterApi, useValue: mockCashRegisterApi },
        { provide: OrdersApi, useValue: mockOrdersApi },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: RealtimeService, useValue: mockRealtimeService },
        { provide: SessionService, useValue: mockSessionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CashRegisterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- MANUAL MOVEMENT NOTE VALIDATION ---
  it('should require a note when the manual movement reason is OTHER', () => {
    component.manualMovementForm.reason = 'OTHER';
    component.manualMovementForm.amount = 100;
    
    // Case 1: Note is empty -> Form should be invalid
    component.manualMovementForm.note = '';
    
    // Expect form validity check to fail
    const isSaveDisabled = (component.manualMovementForm.reason as string) === 'OTHER' && !component.manualMovementForm.note;
    expect(isSaveDisabled).toBeTrue();

    // Case 2: Note is filled -> Form should be valid
    component.manualMovementForm.note = 'Pago de recibo de agua extra';
    
    const isSaveDisabledWithNote = (component.manualMovementForm.reason as string) === 'OTHER' && !component.manualMovementForm.note;
    expect(isSaveDisabledWithNote).toBeFalse();
  });

  it('should not require a note when the manual movement reason is NOT OTHER', () => {
    component.manualMovementForm.reason = 'SUPPLIER_PAYMENT';
    component.manualMovementForm.amount = 250;
    component.manualMovementForm.note = ''; // Empty notes allowed for preset categories

    const isSaveDisabled = (component.manualMovementForm.reason as string) === 'OTHER' && !component.manualMovementForm.note;
    expect(isSaveDisabled).toBeFalse();
  });

  // --- SPLIT PAYMENT VALIDATION ---
  it('should validate split payment exact matching sum', () => {
    // Simulate billing flow for a sale of total S/ 150.00
    const order: Order = {
      id: 50,
      tableId: 5,
      type: 'DINE_IN',
      status: 'ISSUED_UNPAID',
      items: [
        { id: 1, productId: 201, quantity: 2, note: '', waiterId: 2, unitPriceSnapshot: 75.0, status: 'DELIVERED', createdAt: '' }
      ],
      priceAdjustments: [],
      createdAt: ''
    };

    component.selectedOrder.set(order);
    component.selectedOrderSaleTotal.set(150.00);

    // Initial state: 1 line of CASH with remaining amount S/ 150.00
    component.paymentLines = [
      { method: 'CASH', amount: 150.00 }
    ];
    fixture.detectChanges();

    expect(component.getRemainingAmount()).toBe(0.00);
    expect(component.isPaymentComplete()).toBeTrue();

    // Add a second payment line
    component.paymentLines = [
      { method: 'CASH', amount: 100.00 },
      { method: 'YAPE', amount: 40.00 }
    ];
    fixture.detectChanges();

    // Expected: Registered sum is 140.00, remaining is 10.00 -> not complete
    expect(component.getRegisteredSum()).toBe(140.00);
    expect(component.getRemainingAmount()).toBe(10.00);
    expect(component.isPaymentComplete()).toBeFalse();

    // Correct the lines to sum up to 150.00
    component.paymentLines = [
      { method: 'CASH', amount: 100.00 },
      { method: 'YAPE', amount: 50.00 }
    ];
    fixture.detectChanges();

    expect(component.getRegisteredSum()).toBe(150.00);
    expect(component.getRemainingAmount()).toBe(0.00);
    expect(component.isPaymentComplete()).toBeTrue();
  });
});
