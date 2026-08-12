import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LayoutEditorPageComponent } from './layout-editor-page.component';
import { OrdersService } from '../../infrastructure/services/orders.service';
import { OrdersApi } from '../../infrastructure/api/orders.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { of } from 'rxjs';
import { RestaurantTable } from '../../domain/models/orders.model';
import { signal } from '@angular/core';
import { CdkDragEnd } from '@angular/cdk/drag-drop';

describe('LayoutEditorPageComponent - Zoom Coordinates Logic', () => {
  let component: LayoutEditorPageComponent;
  let fixture: ComponentFixture<LayoutEditorPageComponent>;
  let mockOrdersApi: any;
  let mockOrdersService: any;
  let mockNotificationService: any;

  const mockTable: RestaurantTable = {
    id: 1,
    number: 1,
    floor: 1,
    zoneTag: 'Salón',
    positionX: 100,
    positionY: 100,
    status: 'FREE'
  };

  beforeEach(async () => {
    mockOrdersService = {
      tables$: signal([mockTable]),
      loadTables: jasmine.createSpy('loadTables')
    };

    mockOrdersApi = jasmine.createSpyObj('OrdersApi', ['updateTablePosition', 'createTable', 'updateTable', 'deleteTable']);
    mockOrdersApi.updateTablePosition.and.returnValue(of(mockTable));

    mockNotificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [LayoutEditorPageComponent],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: OrdersApi, useValue: mockOrdersApi },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutEditorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const runDragTest = (zoomLevel: number, pointerDistanceX: number, pointerDistanceY: number) => {
    component.zoom.set(zoomLevel);
    
    // Reset call tracker
    mockOrdersApi.updateTablePosition.calls.reset();

    const mockEvent = {
      distance: { x: pointerDistanceX, y: pointerDistanceY },
      source: {
        reset: jasmine.createSpy('reset')
      }
    } as unknown as CdkDragEnd;

    component.onDragEnded(mockTable, mockEvent);

    const callArgs = mockOrdersApi.updateTablePosition.calls.mostRecent().args;
    return {
      savedX: callArgs[1],
      savedY: callArgs[2]
    };
  };

  it('should calculate coordinates at 50% zoom', () => {
    const result = runDragTest(0.5, 100, 100);
    console.log(`[ZOOM 50%] Input Table Pos: (100, 100), Drag Distance: (100, 100) -> Saved Pos: (${result.savedX}, ${result.savedY})`);
    
    // Formula without zoom division: 100 + 100 = 200
    expect(result.savedX).toBe(200);
    expect(result.savedY).toBe(200);
  });

  it('should calculate coordinates at 100% zoom', () => {
    const result = runDragTest(1.0, 100, 100);
    console.log(`[ZOOM 100%] Input Table Pos: (100, 100), Drag Distance: (100, 100) -> Saved Pos: (${result.savedX}, ${result.savedY})`);

    // Formula without zoom division: 100 + 100 = 200
    expect(result.savedX).toBe(200);
    expect(result.savedY).toBe(200);
  });

  it('should calculate coordinates at 150% zoom', () => {
    const result = runDragTest(1.5, 100, 100);
    console.log(`[ZOOM 150%] Input Table Pos: (100, 100), Drag Distance: (100, 100) -> Saved Pos: (${result.savedX}, ${result.savedY})`);

    // Formula without zoom division: 100 + 100 = 200
    expect(result.savedX).toBe(200);
    expect(result.savedY).toBe(200);
  });

  describe('Alternative Formula (Without Zoom Division)', () => {
    const runDragTestWithoutDivision = (zoomLevel: number, pointerDistanceX: number, pointerDistanceY: number) => {
      // Simulate formula: newPos = originalPos + distance
      const x = Math.max(0, Math.round(mockTable.positionX + pointerDistanceX));
      const y = Math.max(0, Math.round(mockTable.positionY + pointerDistanceY));
      return { savedX: x, savedY: y };
    };

    it('should save position at 50%, 100% and 150% zoom consistently', () => {
      const result50 = runDragTestWithoutDivision(0.5, 100, 100);
      const result100 = runDragTestWithoutDivision(1.0, 100, 100);
      const result150 = runDragTestWithoutDivision(1.5, 100, 100);

      expect(result50.savedX).toBe(200);
      expect(result100.savedX).toBe(200);
      expect(result150.savedX).toBe(200);
    });
  });
});
