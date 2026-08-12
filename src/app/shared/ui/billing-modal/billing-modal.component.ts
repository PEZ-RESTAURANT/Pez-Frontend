import { Component, Input, Output, EventEmitter, OnInit, inject, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalShellComponent } from '../modal/modal-shell.component';
import { CashRegisterApi, PaymentMethodConfig, SalePayment, Sale } from '../../../features/cashregister/infrastructure/api/cashregister.api';
import { Order, Product } from '../../../features/orders/domain/models/orders.model';
import { NotificationService } from '../../../core/services/notification.service';
import { OrdersApi } from '../../../features/orders/infrastructure/api/orders.api';
import { OrdersService } from '../../../features/orders/infrastructure/services/orders.service';
import { PrintPreviewComponent } from '../../../features/orders/presentation/components/print-preview.component';
import { LookupApi } from '../../../features/billing/infrastructure/api/lookup.api';
import { SelectOnFocusDirective } from '../../../shared/utils/select-on-focus.directive';

@Component({
  selector: 'app-billing-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, PrintPreviewComponent, SelectOnFocusDirective],
  template: `
    <app-modal-shell
      [open]="open"
      title="Cobro de Comanda"
      [description]="'Registra el comprobante y los pagos para la Comanda #' + (order?.id)"
      (close)="onCloseClick()"
    >
      @if (billingStep() === 1) {
        
        <!-- STEP 1: EMISION DE COMPROBANTE -->
        <form (submit)="emitReceipt()" class="space-y-4">
          <div>
            <label class="block text-xs font-black uppercase text-gray-400 mb-1">Tipo de Comprobante</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                type="button"
                (click)="billingForm.documentType = 'BOLETA'"
                [class.bg-blue-600]="billingForm.documentType === 'BOLETA'"
                [class.text-white]="billingForm.documentType === 'BOLETA'"
                [class.border-blue-600]="billingForm.documentType === 'BOLETA'"
                [class.bg-gray-50]="billingForm.documentType !== 'BOLETA'"
                [class.dark:bg-gray-900]="billingForm.documentType !== 'BOLETA'"
                class="py-2.5 rounded-xl text-xs font-black border cursor-pointer text-center transition-all"
              >
                Boleta
              </button>
              <button 
                type="button"
                (click)="billingForm.documentType = 'FACTURA_ELECTRONICA'"
                [class.bg-blue-600]="billingForm.documentType === 'FACTURA_ELECTRONICA'"
                [class.text-white]="billingForm.documentType === 'FACTURA_ELECTRONICA'"
                [class.border-blue-600]="billingForm.documentType === 'FACTURA_ELECTRONICA'"
                [class.bg-gray-50]="billingForm.documentType !== 'FACTURA_ELECTRONICA'"
                [class.dark:bg-gray-900]="billingForm.documentType !== 'FACTURA_ELECTRONICA'"
                class="py-2.5 rounded-xl text-xs font-black border cursor-pointer text-center transition-all"
              >
                Factura
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-black uppercase text-gray-400 mb-1 flex justify-between items-center">
              <span>{{ billingForm.documentType === 'FACTURA_ELECTRONICA' ? 'RUC del Cliente' : 'Documento (DNI/RUC - Opcional)' }}</span>
              <span *ngIf="loadingLookup()" class="text-[10px] text-blue-500 font-bold lowercase flex items-center gap-1">
                <span class="w-2.5 h-2.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                buscando...
              </span>
            </label>
            <input 
              type="text" 
              [(ngModel)]="billingForm.customerDocumentNumber"
              name="docNum"
              (ngModelChange)="onDocumentNumberChange($event)"
              [required]="billingForm.documentType === 'FACTURA_ELECTRONICA'"
              placeholder="Ej. 20601234567"
              class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-xs font-black uppercase text-gray-400 mb-1">
              {{ billingForm.documentType === 'FACTURA_ELECTRONICA' ? 'Razón Social' : 'Nombre del Cliente (Opcional)' }}
            </label>
            <input 
              type="text" 
              [(ngModel)]="billingForm.customerName"
              name="custName"
              [required]="billingForm.documentType === 'FACTURA_ELECTRONICA'"
              placeholder="Ej. Alimentos del Mar S.A.C."
              class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="pt-4 flex items-center justify-between border-t border-gray-150 dark:border-gray-700/60">
            <span class="text-sm font-bold text-gray-500">Total a Cobrar:</span>
            <span class="text-xl font-black text-gray-900 dark:text-white">
              S/{{ selectedOrderSaleTotal().toFixed(2) }}
            </span>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              (click)="onCloseClick()"
              [disabled]="submitting()"
              class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              [disabled]="(billingForm.documentType === 'FACTURA_ELECTRONICA' && (!billingForm.customerDocumentNumber || billingForm.customerDocumentNumber.length !== 11)) || submitting()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <span *ngIf="submitting()" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Emitir Comprobante
            </button>
          </div>
        </form>

      } @else if (billingStep() === 2) {
        
        <!-- STEP 2: REGISTRO DE PAGOS DIVISIBLES -->
        <div class="space-y-5">
          <div class="p-4 bg-gray-50 dark:bg-gray-950/30 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold justify-between">
            <div>
              <span class="text-gray-400 block mb-0.5">Total de la Cuenta</span>
              <span class="text-base font-black text-gray-800 dark:text-gray-200">S/{{ selectedOrderSaleTotal().toFixed(2) }}</span>
            </div>
            <div>
              <span class="text-gray-400 block mb-0.5">Monto Registrado</span>
              <span class="text-base font-black text-blue-600 dark:text-blue-400">S/{{ getRegisteredSum().toFixed(2) }}</span>
            </div>
            <div>
              <span class="text-gray-400 block mb-0.5">Saldo Restante</span>
              <span 
                [class.text-red-500]="getRemainingAmount() > 0"
                [class.text-emerald-500]="getRemainingAmount() === 0"
                [class.text-amber-500]="getRemainingAmount() < 0"
                class="text-base font-black"
              >
                S/{{ getRemainingAmount().toFixed(2) }}
              </span>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-black uppercase text-gray-400">Métodos de Pago</h4>
              <button 
                type="button"
                (click)="addPaymentLine()"
                class="px-3 py-1.5 text-[11px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-extrabold rounded-lg border border-blue-200/50 dark:border-blue-900/50 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Añadir Método
              </button>
            </div>

            <!-- PAYMENT LINES -->
            @for (line of paymentLines; track $index) {
              <div class="flex gap-2 items-center">
                <select 
                  [(ngModel)]="line.method"
                  class="flex-1 px-3 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white min-h-[46px]"
                >
                  @for (opt of paymentMethodsOptions(); track opt.id) {
                    <option [value]="opt.type">{{ opt.name }}</option>
                  }
                </select>

                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  [(ngModel)]="line.amount"
                  placeholder="0.00"
                  class="w-32 px-3 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-black text-xs text-gray-900 dark:text-white text-right min-h-[46px]"
                />

                @if (paymentLines.length > 1) {
                  <button 
                    type="button"
                    (click)="removePaymentLine($index)"
                    class="w-11 h-11 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer border border-transparent"
                    title="Eliminar método de pago"
                  >
                    <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                }
              </div>
            }
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-gray-150 dark:border-gray-700/60">
            <button 
              type="button" 
              (click)="onCloseClick()"
              [disabled]="submitting()"
              class="px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              Cancelar
            </button>
            <button 
              type="button"
              (click)="confirmPayments()"
              [disabled]="!isPaymentComplete() || submitting()"
              class="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <span *ngIf="submitting()" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Confirmar Pago
            </button>
          </div>
        </div>

      } @else if (billingStep() === 3) {
        
        <!-- STEP 3: CONFIRMACIÓN EXITOSA -->
        <div class="text-center py-6 space-y-4">
          <div class="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full animate-bounce">
            <svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div class="space-y-1">
            <h3 class="text-xl font-extrabold text-gray-900 dark:text-white">Pago Registrado</h3>
            <p class="text-sm text-gray-500">
              La comanda ha sido cobrada y cancelada con éxito.
            </p>
            <span class="text-xs text-gray-400 block pt-1 font-bold">Hora del cobro: {{ successTime() | date:'mediumTime' }}</span>
          </div>

          <!-- TICKET PREVIEW -->
          <div class="mx-auto my-4 max-h-[300px] overflow-y-auto border border-gray-150 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-950 p-2">
            <app-print-preview
              [order]="order || undefined"
              [sale]="completedSale()"
              [tableNumber]="order ? getTableNumber(order.tableId) : 0"
              mode="venta"
              [products]="products()"
              [width]="72"
              [cancelledItems]="cancelledItems()"
            ></app-print-preview>
          </div>

          <div class="flex justify-center gap-2 pt-2">
            <button 
              (click)="triggerPrint()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
            <button 
              (click)="onSuccessClose()"
              class="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white dark:text-gray-900 text-white font-black text-xs rounded-xl cursor-pointer shadow-sm uppercase tracking-wider"
            >
              Cerrar
            </button>
          </div>
        </div>

      }
    </app-modal-shell>
  `
})
export class BillingModalComponent implements OnInit, OnChanges {
  private api = inject(CashRegisterApi);
  private notify = inject(NotificationService);
  private ordersService = inject(OrdersService);
  private ordersApi = inject(OrdersApi);
  private lookupApi = inject(LookupApi);

  public products = signal<Product[]>([]);
  public completedSale = signal<Sale | null>(null);
  public submitting = signal<boolean>(false);
  public loadingLookup = signal<boolean>(false);
  public cancelledItems = signal<any[]>([]);

  @Input() open = false;
  @Input() order: Order | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<void>();

  public billingStep = signal<number>(1); // 1 = Receipt, 2 = Payments, 3 = Success
  public selectedOrderSaleTotal = signal<number>(0);
  public currentSaleId: number | null = null;
  public successTime = signal<Date | null>(null);

  public billingForm = {
    documentType: 'BOLETA' as 'BOLETA' | 'FACTURA_ELECTRONICA',
    customerDocumentNumber: '',
    customerName: ''
  };

  public paymentLines: SalePayment[] = [];
  public activePaymentMethodsOptions = signal<PaymentMethodConfig[]>([]);

  // Fallback payment options (in case seeder fails or config database is empty)
  public paymentMethodsOptions = computed(() => {
    const activeConfigs = this.activePaymentMethodsOptions();
    if (activeConfigs && activeConfigs.length > 0) {
      return activeConfigs;
    }
    return [
      { id: 1, name: 'Efectivo', type: 'CASH', active: true },
      { id: 2, name: 'Tarjeta', type: 'CARD', active: true },
      { id: 3, name: 'Yape', type: 'YAPE', active: true },
      { id: 4, name: 'Plin', type: 'PLIN', active: true },
      { id: 5, name: 'Transferencia', type: 'TRANSFER', active: true }
    ] as PaymentMethodConfig[];
  });

  ngOnInit(): void {
    this.loadPaymentMethods();
    this.loadProducts();
  }

  loadProducts(): void {
    this.ordersApi.getProducts().subscribe({
      next: (prods) => this.products.set(prods),
      error: () => this.notify.error('No se pudieron cargar los productos para el comprobante.')
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open && this.order) {
      this.initFlow();
    }
  }

  loadPaymentMethods(): void {
    this.api.getActivePaymentMethods().subscribe({
      next: (methods) => this.activePaymentMethodsOptions.set(methods),
      error: () => this.notify.error('No se pudo cargar el catálogo de formas de pago.')
    });
  }

  initFlow(): void {
    if (!this.order) return;
    this.completedSale.set(null);
    this.selectedOrderSaleTotal.set(this.getOrderTotal(this.order));
    this.billingForm = {
      documentType: 'BOLETA',
      customerDocumentNumber: '',
      customerName: ''
    };
    this.paymentLines = [];

    this.ordersApi.getOrderCancellations(this.order.id).subscribe({
      next: (events) => this.cancelledItems.set(events),
      error: () => this.cancelledItems.set([])
    });

    // Validar si ya existe una venta PENDING para esta comanda
    this.api.getSales().subscribe({
      next: (sales) => {
        const existing = sales.find(s => s.orderId === this.order!.id && s.status === 'PENDING');
        if (existing) {
          this.currentSaleId = existing.id;
          this.selectedOrderSaleTotal.set(existing.totalAmount);
          this.billingStep.set(2);
          this.addPaymentLine();
        } else {
          this.billingStep.set(1);
        }
      },
      error: () => {
        this.billingStep.set(1);
      }
    });
  }

  onCloseClick(): void {
    this.close.emit();
  }

  onSuccessClose(): void {
    this.close.emit();
    this.paymentSuccess.emit();
  }

  onDocumentNumberChange(doc: string): void {
    if (!doc) return;
    const cleanDoc = doc.trim();

    if (!/^\d+$/.test(cleanDoc)) {
      return;
    }

    if (cleanDoc.length === 8) {
      this.performLookup(cleanDoc, 'DNI');
    } else if (cleanDoc.length === 11) {
      this.performLookup(cleanDoc, 'RUC');
    }
  }

  performLookup(doc: string, type: 'DNI' | 'RUC'): void {
    this.loadingLookup.set(true);
    // 1. Intentar buscar en el histórico local de ventas
    this.api.findSaleByRuc(doc).subscribe({
      next: (sales) => {
        if (sales && sales.length > 0) {
          const latest = sales[sales.length - 1];
          if (latest.customerName) {
            this.billingForm.customerName = latest.customerName;
            this.notify.success(`Cliente autocompletado desde histórico: ${latest.customerName}`);
            this.loadingLookup.set(false);
            return;
          }
        }

        // 2. Si no existe en el histórico local, hacer consulta externa
        const lookupObs = type === 'DNI'
          ? this.lookupApi.lookupDni(doc)
          : this.lookupApi.lookupRuc(doc);

        lookupObs.subscribe({
          next: (res) => {
            this.loadingLookup.set(false);
            if (res && res.success && res.name) {
              this.billingForm.customerName = res.name;
              this.notify.success(`Cliente autocompletado (Sunat/Reniec): ${res.name}`);
            }
          },
          error: () => {
            this.loadingLookup.set(false);
            // Fallback silencioso (el usuario ingresa los datos de forma manual)
          }
        });
      },
      error: () => {
        this.loadingLookup.set(false);
      }
    });
  }

  emitReceipt(): void {
    if (!this.order) return;
    const { documentType, customerDocumentNumber, customerName } = this.billingForm;

    if (documentType === 'FACTURA_ELECTRONICA' && (!customerDocumentNumber || customerDocumentNumber.length !== 11)) {
      this.notify.error('El RUC para una factura debe tener 11 dígitos.');
      return;
    }

    this.submitting.set(true);
    this.api.createSale(this.order.id, documentType, customerDocumentNumber, customerName).subscribe({
      next: (saleId) => {
        this.currentSaleId = saleId;
        this.submitting.set(false);
        this.billingStep.set(2);
        this.addPaymentLine();
      },
      error: () => {
        this.submitting.set(false);
        this.notify.error('No se pudo emitir el comprobante de pago.');
      }
    });
  }

  addPaymentLine(): void {
    const remaining = this.getRemainingAmount();
    const defaultMethod = this.paymentMethodsOptions().length > 0 ? this.paymentMethodsOptions()[0].type : 'CASH';
    this.paymentLines.push({
      method: defaultMethod,
      amount: remaining > 0 ? remaining : 0
    });
  }

  removePaymentLine(index: number): void {
    this.paymentLines.splice(index, 1);
  }

  getRegisteredSum(): number {
    return this.paymentLines.reduce((sum, line) => sum + (line.amount || 0), 0);
  }

  getRemainingAmount(): number {
    const total = this.selectedOrderSaleTotal();
    return Number((total - this.getRegisteredSum()).toFixed(2));
  }

  isPaymentComplete(): boolean {
    return Math.abs(this.getRemainingAmount()) < 0.01;
  }

  confirmPayments(): void {
    if (!this.currentSaleId) return;

    if (!this.isPaymentComplete()) {
      this.notify.error('La suma de pagos debe coincidir exactamente con el total.');
      return;
    }

    const payments = this.paymentLines.map(l => ({ method: l.method, amount: l.amount }));

    this.submitting.set(true);
    this.api.registerPayments(this.currentSaleId, payments).subscribe({
      next: () => {
        // Cargar los detalles de la venta creada para pasarlos al PrintPreview
        this.api.getSales().subscribe({
          next: (sales) => {
            const sale = sales.find(s => s.id === this.currentSaleId);
            if (sale) {
              this.completedSale.set(sale);
            }
            this.submitting.set(false);
            this.successTime.set(new Date());
            this.billingStep.set(3);
          },
          error: () => {
            this.submitting.set(false);
            this.successTime.set(new Date());
            this.billingStep.set(3);
          }
        });
      },
      error: () => {
        this.submitting.set(false);
        this.notify.error('No se pudieron registrar los pagos de la venta.');
      }
    });
  }

  getTableNumber(tableId?: number): number {
    if (!tableId) return 0;
    const table = this.ordersService.tables$().find(t => t.id === tableId);
    return table ? table.number : 0;
  }

  triggerPrint(): void {
    window.print();
  }

  getOrderTotal(order: Order): number {
    if (!order.items) return 0;
    return order.items.reduce((sum, item) => sum + (item.quantity * item.unitPriceSnapshot), 0);
  }
}
