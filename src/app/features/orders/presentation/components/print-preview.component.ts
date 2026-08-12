import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, Product } from '../../domain/models/orders.model';
import { Sale } from '../../../cashregister/infrastructure/api/cashregister.api';

@Component({
  selector: 'app-print-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bg-white text-black p-4 font-mono shadow-md border border-gray-200 mx-auto"
      [style.width]="width + 'mm'"
      style="font-size: 12px; line-height: 1.25;"
    >
      <!-- HEADER COMPROBANTE -->
      <div class="text-center space-y-1 mb-4">
        <h3 class="font-extrabold text-lg uppercase">Restaurante PEZ</h3>
        <p class="text-[10px]">AV. LA MAR 123 - MIRAFLORES</p>
        <p class="text-[10px]">R.U.C. 20123456789</p>
        <p class="text-[10px]">Telf: (01) 444-5555</p>
        <div class="border-b border-dashed border-black my-2"></div>
        
        @if (mode === 'pre-cuenta') {
          <div class="bg-black text-white py-1 px-2 font-black text-sm uppercase tracking-wide my-1">
            *** PRE-CUENTA ***
            <div class="text-[9px] font-normal leading-tight">NO VÁLIDO COMO COMPROBANTE DE PAGO</div>
          </div>
        } @else {
          <div class="font-black text-sm uppercase my-1">
            {{ sale?.documentType === 'FACTURA_ELECTRONICA' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA' }}
          </div>
          <p class="text-[10px] font-bold">
            {{ sale?.documentType === 'FACTURA_ELECTRONICA' ? 'F001' : 'B001' }}-0000{{ order?.id }}
          </p>
        }
      </div>

      <!-- DATOS DE LA COMANDA -->
      <div class="space-y-1 mb-4 text-[11px]">
        <p><span class="font-bold">Mesa:</span> M{{ tableNumber }}</p>
        <p><span class="font-bold">Fecha:</span> {{ (sale?.createdAt || order?.createdAt) | date:'dd/MM/yyyy HH:mm' }}</p>
        <p><span class="font-bold">Comanda:</span> #{{ order?.id }}</p>
        @if (mode === 'venta' && sale) {
          @if (sale.customerDocumentNumber) {
            <p>
              <span class="font-bold">
                {{ sale.documentType === 'FACTURA_ELECTRONICA' ? 'R.U.C.:' : 'D.N.I./R.U.C.:' }}
              </span> 
              {{ sale.customerDocumentNumber }}
            </p>
          }
          @if (sale.customerName) {
            <p><span class="font-bold">Cliente:</span> {{ sale.customerName }}</p>
          }
        } @else if (order?.customerId) {
          <p><span class="font-bold">Cliente ID:</span> {{ order?.customerId }}</p>
        }
      </div>

      <div class="border-b border-dashed border-black my-2"></div>

      <!-- DETALLE DE ITEMS -->
      <table class="w-full text-left text-[11px]">
        <thead>
          <tr class="border-b border-dashed border-black">
            <th class="py-1 font-bold">Cant.</th>
            <th class="py-1 font-bold">Descripción</th>
            <th class="py-1 font-bold text-right">P. Unit</th>
            <th class="py-1 font-bold text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          @for (item of order?.items; track item.id) {
            <tr class="align-top">
              <td class="py-1 pr-2">{{ item.quantity }}</td>
              <td class="py-1">
                <div>{{ getProductName(item.productId) }}</div>
                <div *ngIf="item.note" class="text-[9px] text-gray-700 italic pl-1">* Obs: {{ item.note }}</div>
              </td>
              <td class="py-1 text-right pr-1">S/{{ item.unitPriceSnapshot | number:'1.2-2' }}</td>
              <td class="py-1 text-right">S/{{ (item.quantity * item.unitPriceSnapshot) | number:'1.2-2' }}</td>
            </tr>
          }
        </tbody>
      </table>

      <!-- DETALLE DE ÍTEMS ANULADOS (Trazabilidad) -->
      @if (cancelledItems && cancelledItems.length > 0) {
        <div class="border-b border-dashed border-red-600 my-2"></div>
        <div class="text-[9px] text-red-650 font-black uppercase mb-1">*** ÍTEMS ANULADOS (TRAZABILIDAD) ***</div>
        <table class="w-full text-left text-[10px] text-red-600/80 italic">
          <tbody>
            @for (item of cancelledItems; track item.id) {
              <tr class="align-top">
                <td class="py-0.5 pr-2">x{{ item.payload?.quantity || 1 }}</td>
                <td class="py-0.5">
                  <div>{{ getProductName(item.payload?.productId) }}</div>
                  <div class="text-[8px] font-bold">* Motivo: {{ item.payload?.cancellationReason === 'WRONG_ORDER' ? 'Error Pedido' : item.payload?.cancellationReason === 'CUSTOMER_CHANGED_MIND' ? 'Cambio Opinión' : item.payload?.cancellationReason === 'DISH_DELAYED' ? 'Plato Demorado' : 'Otro' }} - {{ item.payload?.detail }}</div>
                </td>
                <td class="py-0.5 text-right">S/{{ (item.payload?.quantity * item.payload?.unitPriceSnapshot) | number:'1.2-2' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }

      <div class="border-b border-dashed border-black my-2"></div>

      <!-- TOTALES -->
      <div class="space-y-1.5 text-[12px] font-bold">
        <div class="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>S/{{ subtotal() | number:'1.2-2' }}</span>
        </div>
        <div *ngIf="discount() > 0" class="flex justify-between text-red-700">
          <span>DESCUENTOS:</span>
          <span>-S/{{ discount() | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-sm font-black border-t border-dashed border-black pt-1.5">
          <span>TOTAL A PAGAR:</span>
          <span>S/{{ total() | number:'1.2-2' }}</span>
        </div>
      </div>

      <div class="border-b border-dashed border-black my-2"></div>

      <!-- MÉTODOS DE PAGO (SOLO PARA VENTA REAL) -->
      @if (mode === 'venta') {
        <div class="text-[11px] space-y-1 mb-4">
          <p class="font-bold underline">Desglose de Pago:</p>
          @if (sale && sale.payments && sale.payments.length > 0) {
            @for (payment of sale.payments; track $index) {
              <div class="flex justify-between">
                <span>{{ translatePaymentMethod(payment.method) }}:</span>
                <span>S/{{ payment.amount | number:'1.2-2' }}</span>
              </div>
            }
          } @else {
            <div class="flex justify-between">
              <span>Efectivo:</span>
              <span>S/{{ total() | number:'1.2-2' }}</span>
            </div>
          }
          <p class="text-[9px] text-gray-650 mt-2">Cajero: Operador de Caja</p>
        </div>
        <div class="border-b border-dashed border-black my-2"></div>
      }

      <!-- FOOTER -->
      <div class="text-center text-[10px] space-y-1 mt-4">
        <p class="font-bold">¡GRACIAS POR SU VISITA!</p>
        <p>Visite: www.pezrestaurante.pe</p>
        <p *ngIf="mode === 'venta'" class="text-[8px] mt-2">Representación impresa de la boleta de venta electrónica.</p>
      </div>

    </div>
  `
})
export class PrintPreviewComponent {
  @Input() order?: Order;
  @Input() sale?: Sale | null = null;
  @Input() tableNumber: number = 0;
  @Input() mode: 'pre-cuenta' | 'venta' = 'pre-cuenta';
  @Input() width: number = 80; // 80mm base width, customizable
  @Input() cancelledItems: any[] = [];

  @Input() products: Product[] = [];

  getProductName(productId: number): string {
    const prod = this.products.find(p => p.id === productId);
    return prod ? prod.name : `Producto #${productId}`;
  }

  translatePaymentMethod(method: string): string {
    switch (method) {
      case 'CASH': return 'Efectivo';
      case 'CARD': return 'Tarjeta';
      case 'YAPE': return 'Yape';
      case 'PLIN': return 'Plin';
      case 'TRANSFER': return 'Transferencia';
      default: return method;
    }
  }

  subtotal = computed(() => {
    if (!this.order) return 0;
    return this.order.items.reduce((acc, item) => acc + (item.quantity * item.unitPriceSnapshot), 0);
  });

  discount = computed(() => {
    if (!this.order || !this.order.priceAdjustments) return 0;
    return this.order.priceAdjustments.reduce((acc, adj) => acc + adj.newValue, 0); // Placeholder
  });

  total = computed(() => {
    return Math.max(0, this.subtotal() - this.discount());
  });
}
