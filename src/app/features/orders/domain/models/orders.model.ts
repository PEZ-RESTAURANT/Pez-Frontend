export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type OrderStatus = 'FREE' | 'UNATTENDED' | 'TAKING_ORDER' | 'WAITING_DISHES' | 'ALL_DELIVERED' | 'ISSUED_UNPAID' | 'PAID';

export type OrderItemStatus = 'PENDING' | 'IN_PREPARATION' | 'READY' | 'DELIVERED';

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  note: string;
  waiterId: number;
  unitPriceSnapshot: number;
  status: OrderItemStatus;
  readyAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface PriceAdjustment {
  id: number;
  scope: string;
  validity: string;
  startAt?: string;
  endAt?: string;
  newValue: number;
  reason: string;
}

export interface Order {
  id: number;
  tableId?: number;
  type: OrderType;
  customerId?: number;
  status: OrderStatus;
  attendedAt?: string;
  createdAt: string;
  items: OrderItem[];
  priceAdjustments: PriceAdjustment[];
}

export interface RestaurantTable {
  id: number;
  tableNumber: string;
  capacity: number;
  status: string;
  posX: number;
  posY: number;
  zoneId?: number;
}
