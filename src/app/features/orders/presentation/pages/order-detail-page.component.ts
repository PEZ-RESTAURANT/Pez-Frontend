import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../../infrastructure/services/orders.service';
import { OrdersApi } from '../../infrastructure/api/orders.api';
import { Product, Order, OrderItem } from '../../domain/models/orders.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import { PrintPreviewComponent } from '../components/print-preview.component';
import { environment } from '../../../../../environments/environment';

export interface CartLine {
  product: Product;
  quantity: number;
  note: string;
}

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, PrintPreviewComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      <!-- TOP ACTION BAR & INDICATOR -->
      <div class="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div class="flex items-center gap-3">
          <button 
            (click)="goBack()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
          >
            <svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h3 class="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Mesa M{{ tableNumber() }}</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-bold uppercase tracking-wider">
                Comandando
              </span>
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ zoneTag() }} - Piso {{ floor() }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- IMPRIMIR PRE-CUENTA -->
          <button 
            *ngIf="activeOrder()"
            (click)="openPrintModal('pre-cuenta')"
            class="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-xs font-bold rounded-lg border border-indigo-200/50 dark:border-indigo-900/50 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Pre-Cuenta
          </button>
          
          <!-- COBRAR / VENTA -->
          <button 
            *ngIf="activeOrder()"
            (click)="openPrintModal('venta')"
            class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Emitir Venta
          </button>
        </div>
      </div>

      <!-- MAIN LAYOUT -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT: CATALOG AND PRODUCT SELECTOR -->
        <div class="lg:col-span-8 space-y-6">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            
            <!-- SEARCH AND FILTER -->
            <div class="flex flex-col sm:flex-row items-center gap-3">
              <div class="relative flex-1 w-full">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  type="text" 
                  [(ngModel)]="searchTerm"
                  placeholder="Buscar platos o bebidas por nombre..." 
                  class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 pl-10 pr-4 font-medium text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                />
              </div>

              <!-- CATEGORY CHIPS -->
              <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                <button 
                  (click)="setSelectedCategory('ALL')"
                  [class.bg-blue-600]="selectedCategory() === 'ALL'"
                  [class.text-white]="selectedCategory() === 'ALL'"
                  [class.bg-gray-50]="selectedCategory() !== 'ALL'"
                  [class.dark:bg-gray-900]="selectedCategory() !== 'ALL'"
                  [class.text-gray-600]="selectedCategory() !== 'ALL'"
                  [class.dark:text-gray-400]="selectedCategory() !== 'ALL'"
                  class="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-800/80 cursor-pointer shadow-xs transition-all whitespace-nowrap"
                >
                  Todos
                </button>
                @for (cat of categories; track cat) {
                  <button 
                    (click)="setSelectedCategory(cat)"
                    [class.bg-blue-600]="selectedCategory() === cat"
                    [class.text-white]="selectedCategory() === cat"
                    [class.bg-gray-50]="selectedCategory() !== cat"
                    [class.dark:bg-gray-900]="selectedCategory() !== cat"
                    [class.text-gray-600]="selectedCategory() !== cat"
                    [class.dark:text-gray-400]="selectedCategory() !== cat"
                    class="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-800/80 cursor-pointer shadow-xs transition-all whitespace-nowrap"
                  >
                    {{ cat }}
                  </button>
                }
              </div>
            </div>

            <!-- PRODUCT GRID -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[550px] overflow-y-auto pr-1">
              @for (prod of filteredProducts(); track prod.id) {
                <div 
                  (click)="openAddProductModal(prod)"
                  class="bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-850 p-4 rounded-xl border border-gray-200/50 dark:border-gray-800/60 flex flex-col justify-between min-h-[120px] cursor-pointer shadow-xs transition-all hover:scale-[1.02]"
                >
                  <div>
                    <span class="text-[10px] uppercase font-bold text-gray-400 block mb-1">{{ prod.category }}</span>
                    <h4 class="font-extrabold text-sm text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">{{ prod.name }}</h4>
                  </div>
                  <div class="flex justify-between items-center mt-2.5">
                    <span class="font-black text-sm text-blue-600 dark:text-blue-400">S/{{ prod.price | number:'1.2-2' }}</span>
                    <span class="text-[10px] text-gray-400 font-semibold">{{ prod.estimatedPrepTimeMinutes }}m</span>
                  </div>
                </div>
              }
              @if (filteredProducts().length === 0) {
                <p class="col-span-full text-center text-sm text-gray-400 py-12">No se encontraron platos que coincidan con la búsqueda.</p>
              }
            </div>

          </div>

          <!-- HISTORIC CONSUMPTION (PAST ORDERS OF THE TABLE) -->
          <div *ngIf="activeOrder()" class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <h3 class="font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Consumos del Turno
            </h3>
            
            <div class="divide-y divide-gray-100 dark:divide-gray-700/60 max-h-56 overflow-y-auto pr-1">
              @for (item of activeOrder()?.items; track item.id) {
                <div class="py-3 flex justify-between items-start text-xs font-semibold">
                  <div>
                    <span class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ getProductName(item.productId) }}</span>
                    <span class="text-gray-400 ml-1.5">x{{ item.quantity }}</span>
                    <p *ngIf="item.note" class="text-[10px] text-gray-400 font-medium italic mt-0.5">* Obs: {{ item.note }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-500 font-bold">S/{{ (item.quantity * item.unitPriceSnapshot) | number:'1.2-2' }}</span>
                    <span [ngClass]="getItemStatusBadgeClasses(item.status)" class="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full">
                      {{ getItemStatusText(item.status) }}
                    </span>
                  </div>
                </div>
              }
            </div>

            <div class="flex items-center justify-between font-extrabold text-sm border-t border-gray-100 dark:border-gray-700/60 pt-4 mt-2">
              <span class="text-gray-500">Monto Parcial:</span>
              <span class="text-gray-900 dark:text-white">S/{{ getOrderTotal() | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>

        <!-- RIGHT: CHECKOUT CART COLUMN -->
        <div class="lg:col-span-4 space-y-6">
          
          <!-- CURRENT CART -->
          <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md space-y-5">
            <h3 class="font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Nueva Comanda (Carrito)
            </h3>

            <!-- CART LINES -->
            <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
              @for (line of cart(); track $index) {
                <div class="bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/80 flex justify-between items-start text-xs font-semibold relative animate-in slide-in-from-right duration-200">
                  <div class="space-y-1 pr-6 flex-1">
                    <h4 class="font-extrabold text-gray-800 dark:text-gray-100 leading-snug">{{ line.product.name }}</h4>
                    <span class="text-blue-600 dark:text-blue-400 font-bold block">S/{{ line.product.price | number:'1.2-2' }}</span>
                    <p *ngIf="line.note" class="text-[10px] text-gray-400 font-medium italic mt-1">* Obs: {{ line.note }}</p>
                  </div>

                  <!-- Cantidad Controls & Remove -->
                  <div class="flex flex-col items-end gap-2.5 shrink-0">
                    <button 
                      (click)="removeCartLine($index)"
                      class="text-red-500 hover:text-red-600 p-0.5 rounded cursor-pointer transition-colors"
                      title="Eliminar plato"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div class="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200/60 dark:border-gray-700 p-0.5 shadow-2xs text-[10px]">
                      <button 
                        (click)="decreaseCartLineQuantity($index)"
                        class="p-1 hover:bg-gray-50 dark:hover:bg-gray-750 font-black rounded cursor-pointer"
                      >
                        -
                      </button>
                      <span class="w-4 text-center font-extrabold text-gray-900 dark:text-white">{{ line.quantity }}</span>
                      <button 
                        (click)="increaseCartLineQuantity($index)"
                        class="p-1 hover:bg-gray-50 dark:hover:bg-gray-750 font-black rounded cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              }
              @if (cart().length === 0) {
                <div class="text-center py-12 text-gray-400">
                  <p class="font-bold">El carrito está vacío.</p>
                  <p class="text-[10px] text-gray-500 mt-1">Selecciona platos de la carta a la izquierda.</p>
                </div>
              }
            </div>

            <!-- LOYALTY SEARCH -->
            <div class="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cliente de Fidelización</label>
              
              <div class="flex gap-2">
                <input 
                  type="text" 
                  [(ngModel)]="loyaltyPhone"
                  placeholder="Ingresa teléfono..." 
                  class="flex-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <button 
                  (click)="searchLoyaltyCustomer()"
                  class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-2xs"
                >
                  Buscar
                </button>
              </div>

              @if (loyaltyCustomer()) {
                <div class="flex justify-between items-center text-xs bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-150 dark:border-gray-700/60 text-gray-700 dark:text-gray-300 font-semibold mt-1">
                  <span>{{ loyaltyCustomer()?.fullName }}</span>
                  <span class="text-blue-600 dark:text-blue-400 font-bold">{{ loyaltyCustomer()?.pointsBalance }} pts</span>
                </div>
              }
            </div>

            <!-- TOTALS -->
            <div class="border-t border-gray-100 dark:border-gray-700/60 pt-4 space-y-2 text-xs font-semibold">
              <div class="flex justify-between text-gray-400">
                <span>Subtotal Carrito:</span>
                <span>S/{{ getCartSubtotal() | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-base font-black text-gray-900 dark:text-white border-t border-gray-50 dark:border-gray-700/50 pt-2">
                <span>Total Comanda:</span>
                <span>S/{{ getCartSubtotal() | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- SEND BUTTON -->
            <button 
              (click)="sendToKitchen()"
              [disabled]="cart().length === 0"
              class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm rounded-xl cursor-pointer shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 2 9 18zm0 0v-8" />
              </svg>
              Enviar a Cocina
            </button>
          </div>
        </div>

      </div>

    </div>

    <!-- MODAL DE ADD PRODUCT QUANTITY / OBS -->
    <app-modal-shell
      [open]="addModalOpen()"
      [title]="selectedProduct()?.name || ''"
      [description]="'Establece la cantidad y añade observaciones especiales (ej. sin cebolla, bajo en sal).'"
      [hasFooter]="true"
      (close)="closeAddProductModal()"
    >
      <div class="space-y-4 text-sm text-foreground">
        <!-- Cantidad Selector -->
        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Cantidad</label>
          <div class="flex items-center gap-3">
            <button 
              (click)="decreaseQty()"
              class="w-10 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-lg font-black rounded-lg cursor-pointer transition-colors"
            >
              -
            </button>
            <span class="w-12 text-center text-xl font-extrabold text-gray-900 dark:text-white">{{ modalQuantity() }}</span>
            <button 
              (click)="increaseQty()"
              class="w-10 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-lg font-black rounded-lg cursor-pointer transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <!-- Observación Input -->
        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Instrucciones Especiales</label>
          <textarea 
            [(ngModel)]="modalNote"
            placeholder="Escribe alguna observación..."
            rows="3"
            class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 font-semibold text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none"
          ></textarea>
        </div>
      </div>

      <div modalFooter class="flex justify-end gap-2 w-full">
        <button 
          (click)="closeAddProductModal()"
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg cursor-pointer transition-colors"
        >
          Cancelar
        </button>
        <button 
          (click)="submitAddProduct()"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
        >
          Añadir al Pedido
        </button>
      </div>
    </app-modal-shell>

    <!-- MODAL DE CONFIRMACIÓN DE ENVÍO A COCINA -->
    <app-modal-shell
      [open]="kitchenSuccessModalOpen()"
      [title]="'¡Pedido Recibido!'"
      [description]="'La comanda ha sido enviada exitosamente a la cola de preparación en la cocina.'"
      [hasFooter]="true"
      (close)="closeKitchenSuccessModal()"
    >
      <div class="text-center py-6 space-y-4 text-foreground">
        <div class="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center border border-emerald-200 dark:border-emerald-900/50">
          <svg class="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="space-y-1">
          <p class="font-extrabold text-base">Pedido Despachado</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Hora de envío: <span class="font-bold">{{ successTime() }}</span></p>
        </div>
      </div>

      <div modalFooter class="w-full flex justify-center">
        <button 
          (click)="closeKitchenSuccessModal()"
          class="w-full max-w-xs py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs uppercase tracking-wider"
        >
          Entendido
        </button>
      </div>
    </app-modal-shell>

    <!-- MODAL DE VISTA PREVIA DE IMPRESIÓN (RECEIPT PREVIEW) -->
    <app-modal-shell
      [open]="printModalOpen()"
      [title]="printMode() === 'pre-cuenta' ? 'Vista Previa: Pre-Cuenta' : 'Vista Previa: Emisión de Venta'"
      [size]="'sm'"
      [hasFooter]="true"
      (close)="closePrintModal()"
    >
      <!-- Impresión Content -->
      <div class="bg-gray-100 dark:bg-gray-950 p-4 rounded-xl max-h-[70vh] overflow-y-auto">
        <app-print-preview 
          [order]="activeOrder()"
          [tableNumber]="tableNumber()"
          [mode]="printMode()"
          [products]="products()"
          [width]="80"
        ></app-print-preview>
      </div>

      <div modalFooter class="flex items-center justify-end gap-2 w-full">
        <button 
          (click)="closePrintModal()"
          class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs cursor-pointer transition-colors"
        >
          Cerrar
        </button>
        <button 
          (click)="triggerPrint()"
          class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir
        </button>
      </div>
    </app-modal-shell>
  `
})
export class OrderDetailPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public ordersService = inject(OrdersService);
  private api = inject(OrdersApi);
  private notify = inject(NotificationService);
  private session = inject(SessionService);

  public tableId: number = 0;
  public products = signal<Product[]>([]);
  public selectedCategory = signal<string>('ALL');
  public searchTerm = signal<string>('');

  // Cart and Modal State
  public cart = signal<CartLine[]>([]);
  public addModalOpen = signal<boolean>(false);
  public selectedProduct = signal<Product | null>(null);
  public modalQuantity = signal<number>(1);
  public modalNote = '';

  // Loyalty State
  public loyaltyPhone = '';
  public loyaltyCustomer = signal<any>(null);

  // Success dispatch modal
  public kitchenSuccessModalOpen = signal<boolean>(false);
  public successTime = signal<string>('');

  // Print modal State
  public printModalOpen = signal<boolean>(false);
  public printMode = signal<'pre-cuenta' | 'venta'>('pre-cuenta');

  private lockRefreshInterval?: any;

  // CATEGORÍAS FIJAS DE LA CARTA
  public categories: string[] = [
    'MARINA',
    'CRIOLLA',
    'BEBIDAS',
    'CHIFA',
    'JUGOS'
  ];

  ngOnInit(): void {
    // 1. Resolver ID de Mesa desde la URL
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('tableId');
      if (idStr) {
        this.tableId = parseInt(idStr, 10);
        
        // Cargar productos del catálogo
        this.api.getProducts().subscribe({
          next: (prods) => this.products.set(prods),
          error: () => this.notify.error('No se pudo cargar el catálogo de productos.')
        });

        // 2. Iniciar timer de lock refresco cada 90 segundos
        this.startLockRefreshTimer();
      }
    });

    // 3. Registrar los listeners del ciclo de vida del navegador (Tablet Screen Lock / Close)
    this.registerVisibilityListeners();
  }

  // DETECTORES DE CIERRE DE PESTAÑA / APAGADO DE PANTALLA TABLET
  private registerVisibilityListeners(): void {
    window.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('pagehide', this.handleVisibilityChange);
  }

  private unregisterVisibilityListeners(): void {
    window.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('pagehide', this.handleVisibilityChange);
  }

  // Lógica del visibilitychange / pagehide
  private handleVisibilityChange = (event: Event): void => {
    // Si la pestaña se oculta (visibilityState === 'hidden') o el evento es pagehide, liberamos de inmediato
    if (document.visibilityState === 'hidden' || event.type === 'pagehide') {
      const token = this.session.getToken();
      if (token && this.tableId) {
        const cleanUrl = (environment.serverBaseUrl || 'http://localhost:8080/api/v1').replace(/\/api\/v1\/?$/, '');
        const url = `${cleanUrl}/api/v1/tables/${this.tableId}/unlock`;
        
        // fetch con keepalive: true es el estándar moderno recomendado que sobrevive al cierre del navegador
        fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          keepalive: true
        });
      }
    }
  };

  private startLockRefreshTimer(): void {
    this.clearLockRefreshTimer();
    this.lockRefreshInterval = setInterval(() => {
      if (this.tableId) {
        this.api.lockTable(this.tableId).subscribe({
          error: () => this.notify.error('Fallo al renovar bloqueo temporal de mesa.')
        });
      }
    }, 90000); // 90 segundos
  }

  private clearLockRefreshTimer(): void {
    if (this.lockRefreshInterval) {
      clearInterval(this.lockRefreshInterval);
      this.lockRefreshInterval = undefined;
    }
  }

  // PROPIEDADES DE LA MESA CORRIENTE
  tableNumber = computed(() => {
    const table = this.ordersService.tables$().find(t => t.id === this.tableId);
    return table ? table.number : 0;
  });

  zoneTag = computed(() => {
    const table = this.ordersService.tables$().find(t => t.id === this.tableId);
    return table ? table.zoneTag : 'Salón';
  });

  floor = computed(() => {
    const table = this.ordersService.tables$().find(t => t.id === this.tableId);
    return table ? table.floor : 1;
  });

  // FILTRADO INCREMENTAL DE PRODUCTOS
  filteredProducts = computed(() => {
    const prods = this.products();
    const cat = this.selectedCategory();
    const query = this.searchTerm().toLowerCase();

    return prods.filter(p => {
      const matchesCat = cat === 'ALL' || p.category === cat;
      const matchesQuery = !query || p.name.toLowerCase().includes(query);
      return matchesCat && matchesQuery && p.active;
    });
  });

  setSelectedCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }

  // ACTIVE COMANDA/ORDER (TURN CONSUMPTION)
  activeOrder = computed(() => {
    return this.ordersService.orders$().find(o => o.tableId === this.tableId && o.status !== 'PAID');
  });

  getProductName(productId: number): string {
    const p = this.products().find(prod => prod.id === productId);
    return p ? p.name : `Producto #${productId}`;
  }

  getOrderTotal(): number {
    const order = this.activeOrder();
    if (!order) return 0;
    return order.items.reduce((acc, item) => acc + (item.quantity * item.unitPriceSnapshot), 0);
  }

  getItemStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'IN_PREPARATION': return 'Cocinando';
      case 'READY': return 'Listo';
      case 'DELIVERED': return 'Servido';
      default: return status;
    }
  }

  getItemStatusBadgeClasses(status: string): Record<string, boolean> {
    return {
      'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300': status === 'PENDING',
      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300': status === 'IN_PREPARATION',
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300': status === 'READY',
      'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300': status === 'DELIVERED'
    };
  }

  // CART LOGIC & MODAL SELECTIONS
  openAddProductModal(product: Product): void {
    this.selectedProduct.set(product);
    this.modalQuantity.set(1);
    this.modalNote = '';
    this.addModalOpen.set(true);
  }

  closeAddProductModal(): void {
    this.addModalOpen.set(false);
    this.selectedProduct.set(null);
  }

  increaseQty(): void {
    this.modalQuantity.update(q => q + 1);
  }

  decreaseQty(): void {
    this.modalQuantity.update(q => Math.max(1, q - 1));
  }

  // REGLA DE AGRUPACIÓN DEL CARRITO
  submitAddProduct(): void {
    const prod = this.selectedProduct();
    if (!prod) return;

    const qty = this.modalQuantity();
    const noteClean = this.modalNote.trim();

    this.cart.update(current => {
      // Regla de agrupación: mismo producto y misma nota (o ambas vacías) -> se acumula
      const existingIndex = current.findIndex(line => 
        line.product.id === prod.id && line.note === noteClean
      );

      if (existingIndex > -1) {
        const copy = [...current];
        copy[existingIndex].quantity += qty;
        return copy;
      } else {
        return [...current, { product: prod, quantity: qty, note: noteClean }];
      }
    });

    this.notify.success(`${prod.name} añadido al carrito.`);
    this.closeAddProductModal();
  }

  removeCartLine(index: number): void {
    this.cart.update(current => current.filter((_, i) => i !== index));
  }

  increaseCartLineQuantity(index: number): void {
    this.cart.update(current => {
      const copy = [...current];
      copy[index].quantity += 1;
      return copy;
    });
  }

  decreaseCartLineQuantity(index: number): void {
    this.cart.update(current => {
      const copy = [...current];
      if (copy[index].quantity > 1) {
        copy[index].quantity -= 1;
      }
      return copy;
    });
  }

  getCartSubtotal(): number {
    return this.cart().reduce((acc, line) => acc + (line.quantity * line.product.price), 0);
  }

  // LOYALTY INTEGRATION
  searchLoyaltyCustomer(): void {
    if (!this.loyaltyPhone.trim()) return;
    this.api.getCustomerByPhone(this.loyaltyPhone.trim()).subscribe({
      next: (cust) => {
        this.loyaltyCustomer.set(cust);
        this.notify.success(`Cliente ${cust.fullName} vinculado.`);
      },
      error: () => this.notify.error('Cliente de fidelización no encontrado.')
    });
  }

  // SUBMIT TO KITCHEN DESPATCH
  sendToKitchen(): void {
    const lines = this.cart();
    if (lines.length === 0) return;

    const waiterId = this.session.getCurrentUserId() || 1;
    const customerId = this.loyaltyCustomer()?.id || undefined;

    // Lógica secuencial:
    // 1. Si no hay comanda activa para esta mesa, primero creamos la comanda
    const active = this.activeOrder();
    
    if (!active) {
      this.api.createOrder(this.tableId, 'DINE_IN', customerId).subscribe({
        next: (newOrder) => {
          this.addItemsSequentially(newOrder.id, lines, waiterId);
        },
        error: () => this.notify.error('No se pudo inicializar la comanda en cocina.')
      });
    } else {
      this.addItemsSequentially(active.id, lines, waiterId);
    }
  }

  private addItemsSequentially(orderId: number, lines: CartLine[], waiterId: number): void {
    // Añadimos recursivamente para garantizar orden o procesamos en batch
    // Como el endpoint addItems del backend añade en comanda, enviamos las promesas juntas
    let completedCount = 0;
    
    lines.forEach(line => {
      this.api.addItems(orderId, line.product.id, line.quantity, line.note, waiterId).subscribe({
        next: () => {
          completedCount++;
          if (completedCount === lines.length) {
            this.handleKitchenSuccess();
          }
        },
        error: () => this.notify.error(`Error al enviar ${line.product.name} a cocina.`)
      });
    });
  }

  private handleKitchenSuccess(): void {
    this.cart.set([]); // Limpiar carrito
    this.ordersService.loadOrders(); // Recargar comanda del backend
    
    // Modal de confirmación explícito
    const now = new Date();
    this.successTime.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    this.kitchenSuccessModalOpen.set(true);
  }

  closeKitchenSuccessModal(): void {
    this.kitchenSuccessModalOpen.set(false);
  }

  // PRINTING AND RECEIPT ACTIONS
  openPrintModal(mode: 'pre-cuenta' | 'venta'): void {
    this.printMode.set(mode);
    this.printModalOpen.set(true);
  }

  closePrintModal(): void {
    this.printModalOpen.set(false);
  }

  triggerPrint(): void {
    // Disparar diálogo del navegador
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/app/orders']);
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    // Antes de recargar, aseguramos llamar al unlock síncrono
    this.ngOnDestroy();
  }

  ngOnDestroy(): void {
    // 1. Limpiar el sweep interval
    this.clearLockRefreshTimer();

    // 2. Remover listeners del navegador
    this.unregisterVisibilityListeners();

    // 3. Liberar la mesa
    if (this.tableId) {
      this.api.unlockTable(this.tableId).subscribe();
    }
  }
}
