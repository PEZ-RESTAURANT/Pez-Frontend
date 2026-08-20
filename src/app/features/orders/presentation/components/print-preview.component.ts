import { Component, Input, computed, signal, inject, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, Product } from '../../domain/models/orders.model';
import { Sale } from '../../../cashregister/infrastructure/api/cashregister.api';
import { AuthApi } from '../../../auth/infrastructure/api/auth.api';
import { SessionService } from '../../../../core/auth/services/session.service';
import QrCreator from 'qr-creator';

@Component({
  selector: 'app-print-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ESTILOS DE IMPRESIÓN EXCLUSIVOS -->
    <style>
      @media print {
        /* Ocultar el resto de la interfaz y componentes de la web */
        body * {
          visibility: hidden !important;
        }
        /* Mostrar exclusivamente el contenedor del ticket */
        .ticket-print-container, .ticket-print-container * {
          visibility: visible !important;
        }
        /* Posicionar de forma absoluta en la esquina superior izquierda del papel */
        .ticket-print-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 8px !important;
          border: none !important;
          box-shadow: none !important;
          background: white !important;
          color: black !important;
        }
        /* Quitar cabeceras y pies de página impuestos por el navegador */
        @page {
          margin: 0;
          size: auto;
        }
      }
    </style>

    <div 
      class="bg-white text-black p-4 font-mono shadow-md border border-gray-200 mx-auto ticket-print-container"
      [style.width]="width + 'mm'"
      style="font-size: 11px; line-height: 1.35;"
    >
      <!-- HEADER COMPROBANTE -->
      <div class="text-center space-y-0.5 mb-3">
        <h3 class="font-black text-sm uppercase tracking-tight">{{ restaurantInfo()?.name || sessionService.restaurantName$() || 'RESTAURANTE' }}</h3>
        <p class="text-[9px] uppercase font-bold">{{ restaurantInfo()?.address || 'DIRECCIÓN NO REGISTRADA' }}</p>
        <p class="text-[9px] font-bold">R.U.C. {{ restaurantInfo()?.businessDocumentNumber || '00000000000' }}</p>
        <p class="text-[9px]">Telf: {{ restaurantInfo()?.contactPhone || 'S/T' }}</p>
        <div class="border-b border-dashed border-black my-2"></div>
        
        @if (mode === 'pre-cuenta') {
          <div class="bg-black text-white py-1 px-2 font-black text-xs uppercase tracking-wider my-2">
            *** PRE-CUENTA ***
            <div class="text-[8px] font-normal leading-tight normal-case mt-0.5">NO VÁLIDO COMO COMPROBANTE DE PAGO</div>
          </div>
        } @else {
          <!-- Rótulo del Documento Fiscal según SUNAT -->
          <div class="border border-black p-1.5 my-2 uppercase font-black text-center text-[10px] space-y-0.5">
            <div>{{ isFactura() ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA' }}</div>
            <div class="text-xs tracking-wider">{{ sale?.ticketNumber || 'B001-00000000' }}</div>
          </div>
        }
      </div>

      <!-- DATOS DE LA COMANDA -->
      <div class="space-y-0.5 mb-3 text-[10px]">
        <div class="flex justify-between">
          <span><strong>Mesa:</strong> M{{ tableNumber }}</span>
          <span><strong>Comanda:</strong> #{{ order?.id }}</span>
        </div>
        <p><strong>Fecha:</strong> {{ (sale?.createdAt || order?.createdAt) | date:'dd/MM/yyyy HH:mm' }}</p>
        
        @if (mode === 'venta') {
          <div class="border-t border-dotted border-black my-1 pt-1 space-y-0.5">
            @if (isFactura()) {
              <p><strong>R.U.C. Cliente:</strong> {{ sale?.customerDocumentNumber }}</p>
              <p><strong>Razón Social:</strong> {{ sale?.customerName }}</p>
              <p><strong>Dirección:</strong> Lima, Perú (Dirección Fiscal)</p>
            } @else {
              <p><strong>Cliente:</strong> {{ sale?.customerName || 'PÚBLICO GENERAL' }}</p>
              <p><strong>D.N.I. / Doc:</strong> {{ sale?.customerDocumentNumber || '00000000' }}</p>
            }
          </div>
        }
      </div>

      <div class="border-b border-dashed border-black my-2"></div>

      <!-- DETALLE DE ITEMS -->
      <table class="w-full text-left text-[10px] border-collapse">
        <thead>
          <tr class="border-b border-dashed border-black">
            <th class="py-1 font-bold w-[10%]">Cant.</th>
            <th class="py-1 font-bold w-[50%]">Descripción</th>
            <th class="py-1 font-bold text-right w-[20%]">P. Unit</th>
            <th class="py-1 font-bold text-right w-[20%]">Total</th>
          </tr>
        </thead>
        <tbody>
          @for (item of order?.items; track item.id) {
            <tr class="align-top border-b border-dotted border-gray-100">
              <td class="py-1">{{ item.quantity }}</td>
              <td class="py-1">
                <span class="font-bold">{{ getProductName(item.productId) }}</span>
                <div *ngIf="item.note" class="text-[8px] text-gray-700 italic pl-1 leading-normal">* Obs: {{ item.note }}</div>
              </td>
              <td class="py-1 text-right">S/{{ item.unitPriceSnapshot | number:'1.2-2' }}</td>
              <td class="py-1 text-right">S/{{ (item.quantity * item.unitPriceSnapshot) | number:'1.2-2' }}</td>
            </tr>
          }
        </tbody>
      </table>

      <!-- DETALLE DE ÍTEMS ANULADOS (Trazabilidad) -->
      @if (cancelledItems && cancelledItems.length > 0) {
        <div class="border-b border-dashed border-red-600 my-2"></div>
        <div class="text-[8px] text-red-600 font-bold uppercase mb-1">*** ÍTEMS ANULADOS (TRAZABILIDAD) ***</div>
        <table class="w-full text-left text-[9px] text-red-600/80 italic">
          <tbody>
            @for (item of cancelledItems; track item.id) {
              <tr class="align-top border-b border-dotted border-red-100">
                <td class="py-0.5 w-[15%]">x{{ item.payload?.quantity || 1 }}</td>
                <td class="py-0.5 w-[60%]">
                  <span class="font-bold">{{ getProductName(item.payload?.productId) }}</span>
                  <div class="text-[7px] font-bold leading-normal">* Motivo: {{ item.payload?.cancellationReason === 'WRONG_ORDER' ? 'Error Pedido' : item.payload?.cancellationReason === 'CUSTOMER_CHANGED_MIND' ? 'Cambio Opinión' : item.payload?.cancellationReason === 'DISH_DELAYED' ? 'Plato Demorado' : 'Otro' }} - {{ item.payload?.detail }}</div>
                </td>
                <td class="py-0.5 text-right w-[25%]">S/{{ (item.payload?.quantity * item.payload?.unitPriceSnapshot) | number:'1.2-2' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }

      <div class="border-b border-dashed border-black my-2"></div>

      <!-- TOTALES Y DESGLOSE DE IGV -->
      <div class="space-y-1 text-[10px] font-bold">
        <div class="flex justify-between">
          <span>OP. GRAVADA:</span>
          <span>S/{{ (total() / 1.18) | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between">
          <span>I.G.V. (18%):</span>
          <span>S/{{ (total() - (total() / 1.18)) | number:'1.2-2' }}</span>
        </div>
        <div *ngIf="discount() > 0" class="flex justify-between text-red-700">
          <span>DESCUENTOS:</span>
          <span>-S/{{ discount() | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-[11px] font-black border-t border-dashed border-black pt-1.5">
          <span>TOTAL A PAGAR:</span>
          <span>S/{{ total() | number:'1.2-2' }}</span>
        </div>
        
        <!-- Total en letras -->
        <div class="text-[9px] font-bold italic mt-2 text-left leading-normal">
          SON: {{ numberToWords(total()) }}
        </div>
      </div>

      <div class="border-b border-dashed border-black my-2"></div>

      <!-- MÉTODOS DE PAGO (SOLO PARA VENTA REAL) -->
      @if (mode === 'venta') {
        <div class="text-[10px] space-y-1 mb-3">
          <p class="font-bold underline">DESGLOSE DE PAGO:</p>
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
          <p class="text-[8px] text-gray-500 mt-2">Cajero: Operador de Caja</p>
        </div>
        <div class="border-b border-dashed border-black my-2"></div>
        
        <!-- LOCAL OFFLINE QR CODE CANVAS -->
        <div class="text-center my-3 py-1 bg-white flex justify-center">
          <canvas #qrCanvas id="qr-canvas" style="width: 110px; height: 110px;"></canvas>
        </div>

        <div class="text-center text-[8px] leading-relaxed my-2">
          Representación impresa de la {{ isFactura() ? 'Factura Electrónica' : 'Boleta de Venta Electrónica' }}.<br>
          Autorizado mediante Resolución de Superintendencia N° 018-2015/SUNAT.
        </div>
        <div class="border-b border-dashed border-black my-2"></div>
      }

      <!-- FOOTER -->
      <div class="text-center text-[9px] space-y-1 mt-3">
        <p class="font-bold">¡GRACIAS POR SU VISITA!</p>
        <p class="text-[7px] text-gray-500 mt-2">Impreso con software Al Toque</p>
      </div>
    </div>
  `
})
export class PrintPreviewComponent implements OnInit, OnChanges, AfterViewChecked {
  @Input() order?: Order;
  @Input() sale?: Sale | null = null;
  @Input() tableNumber: number = 0;
  @Input() mode: 'pre-cuenta' | 'venta' = 'pre-cuenta';
  @Input() width: number = 80; // Default width in mm
  @Input() cancelledItems: any[] = [];
  @Input() products: Product[] = [];

  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  public authApi = inject(AuthApi);
  public sessionService = inject(SessionService);

  restaurantInfo = signal<any>(null);
  private qrRendered = false;

  ngOnInit() {
    this.loadRestaurantInfo();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sale'] || changes['mode']) {
      this.qrRendered = false; // Reset to force re-render when sale changes
    }
  }

  ngAfterViewChecked() {
    if (this.mode === 'venta' && this.sale && !this.qrRendered && this.qrCanvas) {
      this.renderQrCode();
    }
  }

  private loadRestaurantInfo() {
    const id = this.sessionService.getRestaurantId();
    if (id) {
      this.authApi.getRestaurant(id).subscribe({
        next: (res) => this.restaurantInfo.set(res),
        error: () => {
          // Clean fallback
          this.restaurantInfo.set({
            name: this.sessionService.getRestaurantName() || 'RESTAURANTE',
            businessDocumentNumber: '20123456789',
            contactPhone: '(01) 444-5555',
            address: 'AV. LA MAR 123 - MIRAFLORES'
          });
        }
      });
    }
  }

  isFactura(): boolean {
    return this.sale?.documentType === 'FACTURA_ELECTRONICA' || this.sale?.documentType === 'INVOICE';
  }

  isBoleta(): boolean {
    return this.sale?.documentType === 'BOLETA' || this.sale?.documentType === 'RECEIPT';
  }

  private buildQrData(): string {
    const rucEmisor = this.restaurantInfo()?.businessDocumentNumber || '20123456789';
    const tipoComp = this.isFactura() ? '01' : '03'; // 01 Factura, 03 Boleta
    const ticketNum = this.sale?.ticketNumber || 'B001-00000001';
    const parts = ticketNum.split('-');
    const serie = parts[0] || 'B001';
    const correlativo = parts[1] || '00000001';
    const igv = (this.total() - (this.total() / 1.18)).toFixed(2);
    const totalVal = this.total().toFixed(2);
    const dateVal = this.sale?.createdAt ? this.sale.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
    const docReceptorType = this.isFactura() ? '6' : '1'; // 6 RUC, 1 DNI
    const docReceptor = this.sale?.customerDocumentNumber || '00000000';

    return `${rucEmisor}|${tipoComp}|${serie}|${correlativo}|${igv}|${totalVal}|${dateVal}|${docReceptorType}|${docReceptor}|`;
  }

  private renderQrCode() {
    const canvas = this.qrCanvas?.nativeElement;
    if (canvas) {
      this.qrRendered = true;
      const text = this.buildQrData();
      try {
        QrCreator.render({
          text: text,
          canvas: canvas,
          background: '#ffffff',
          fill: '#000000',
          size: 110
        });
      } catch (e) {
        console.error('Error rendering QR code local offline:', e);
      }
    }
  }

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
    return this.order.priceAdjustments.reduce((acc, adj) => acc + adj.newValue, 0);
  });

  total = computed(() => {
    return Math.max(0, this.subtotal() - this.discount());
  });

  numberToWords(num: number): string {
    const decimals = Math.round((num - Math.floor(num)) * 100);
    const decimalsStr = decimals < 10 ? '0' + decimals : decimals.toString();
    
    const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const specials = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const tensTwenty = ['VEINTE', 'VEINTIUNO', 'VEINTIDOS', 'VEINTITRES', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISEIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
    const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const convertGroup = (val: number): string => {
      if (val === 0) return '';
      if (val === 100) return 'CIEN';
      
      let words = '';
      const h = Math.floor(val / 100);
      const t = Math.floor((val % 100) / 10);
      const u = val % 10;
      
      if (h > 0) words += hundreds[h] + ' ';
      
      if (t === 1) {
        words += specials[u] + ' ';
      } else if (t === 2) {
        words += tensTwenty[u] + ' ';
      } else {
        if (t > 0) words += tens[t] + ' ';
        if (t > 0 && u > 0) words += 'Y ';
        if (u > 0) words += units[u] + ' ';
      }
      return words.trim();
    };

    const integerPart = Math.floor(num);
    if (integerPart === 0) return ('CERO Y ' + decimalsStr + '/100 SOLES').toUpperCase();
    
    let res = '';
    const thousands = Math.floor(integerPart / 1000);
    const remainder = integerPart % 1000;
    
    if (thousands > 0) {
      if (thousands === 1) {
        res += 'MIL ';
      } else {
        res += convertGroup(thousands) + ' MIL ';
      }
    }
    
    if (remainder > 0) {
      res += convertGroup(remainder) + ' ';
    }
    
    return (res.trim() + ' Y ' + decimalsStr + '/100 SOLES').toUpperCase();
  }
}
