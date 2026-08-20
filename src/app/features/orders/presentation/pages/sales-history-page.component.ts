import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CashRegisterApi, Sale, CashRegister, PaymentMethodConfig } from '../../../cashregister/infrastructure/api/cashregister.api';
import { PermissionService } from '../../../../core/auth/services/permission.service';
import { PERMISSIONS } from '../../../../core/config/permissions';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import { PrintPreviewComponent } from '../components/print-preview.component';
import { SelectDirective } from '../../../../shared/ui/select/select.directive';
import { InputDirective } from '../../../../shared/ui/input/input.directive';
import { ButtonDirective } from '../../../../shared/ui/button/button.directive';
import { PrintAgentService } from '../../../../core/printing/print-agent.service';
import { AuthApi } from '../../../auth/infrastructure/api/auth.api';
import { SessionService } from '../../../../core/auth/services/session.service';

@Component({
  selector: 'app-sales-history-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    HasPermissionDirective,
    ModalShellComponent,
    PrintPreviewComponent,
    SelectDirective,
    InputDirective,
    ButtonDirective
  ],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      
      <!-- HEADER -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Historial de Ventas
          </h1>
          <p class="mt-1.5 text-sm text-slate-500">
            Consulta, reimprime o anula transacciones y comprobantes emitidos en el restaurante.
          </p>
        </div>
      </div>

      <!-- FILTERS CARD -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 class="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Filtros de Búsqueda
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <!-- Rango de Fechas -->
          <div class="space-y-1.5 col-span-1 md:col-span-2">
            <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Rango de Fechas</label>
            <div class="flex gap-2">
              <input 
                appInput 
                type="date" 
                [(ngModel)]="filterStartDate"
                (change)="onDateFilterChange()"
                class="flex-1"
              />
              <input 
                appInput 
                type="date" 
                [(ngModel)]="filterEndDate"
                (change)="onDateFilterChange()"
                class="flex-1"
              />
            </div>
          </div>

          <!-- Turno de Caja -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Turno de Caja</label>
            <select 
              appSelect 
              [(ngModel)]="selectedRegisterId" 
              (change)="onRegisterChange($event)"
              class="w-full"
            >
              <option [value]="null">Todos los Turnos</option>
              <option *ngFor="let reg of cashRegisters()" [value]="reg.id">
                Turno #{{ reg.id }} ({{ reg.createdAt | date:'dd/MM HH:mm' }} - {{ reg.closedAt ? (reg.closedAt | date:'HH:mm') : 'Abierto' }})
              </option>
            </select>
          </div>

          <!-- Medio de Pago -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Medio de Pago</label>
            <select 
              appSelect 
              [(ngModel)]="selectedPaymentMethod" 
              (change)="onPaymentMethodChange()"
              class="w-full"
            >
              <option value="">Todos</option>
              <option *ngFor="let method of paymentMethods()" [value]="method.type">
                {{ method.name }}
              </option>
            </select>
          </div>

        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          
          <!-- Búsqueda General -->
          <div class="space-y-1.5 col-span-1 md:col-span-3">
            <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Búsqueda Rápida</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <i-lucide name="search" class="h-4 w-4"></i-lucide>
              </span>
              <input 
                appInput 
                type="text" 
                [(ngModel)]="searchTerm" 
                (ngModelChange)="onSearchQueryChange()"
                placeholder="Buscar por correlativo (B001-...), RUC/DNI o cliente..."
                class="w-full pl-9"
              />
            </div>
          </div>

          <!-- Limpiar filtros -->
          <div class="flex items-end">
            <button 
              appButton 
              variant="outline" 
              (click)="resetFilters()"
              class="w-full h-[40px] flex justify-center items-center gap-2"
            >
              <i-lucide name="refresh-cw" class="h-4 w-4"></i-lucide>
              Limpiar Filtros
            </button>
          </div>

        </div>
      </div>

      <!-- SALES TABLE CARD -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left text-slate-500 dark:text-slate-400 border-collapse">
            <thead class="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th class="px-6 py-4">Fecha/Hora</th>
                <th class="px-6 py-4">Documento / Correlativo</th>
                <th class="px-6 py-4">Mesa / Comanda</th>
                <th class="px-6 py-4">Cliente / RUC</th>
                <th class="px-6 py-4">Cajero / Mozo</th>
                <th class="px-6 py-4 text-right">Monto Total</th>
                <th class="px-6 py-4 text-center">Estado</th>
                <th class="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="paginatedSales().length === 0" class="border-b border-slate-100 dark:border-slate-800">
                <td colspan="8" class="text-center py-10 text-slate-400 font-medium">
                  No se encontraron ventas registradas con los filtros seleccionados.
                </td>
              </tr>
              <tr 
                *ngFor="let sale of paginatedSales()" 
                [ngClass]="{
                  'opacity-60 bg-slate-50/50 dark:bg-slate-800/10 line-through decoration-red-500 decoration-2': sale.status === 'VOIDED',
                  'hover:bg-slate-50/70 dark:hover:bg-slate-800/30': sale.status !== 'VOIDED'
                }"
                class="border-b border-slate-100 dark:border-slate-800 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ sale.createdAt | date:'dd/MM/yyyy HH:mm' }}
                </td>
                <td class="px-6 py-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  <div class="flex flex-col">
                    <span>{{ sale.ticketNumber || 'N/A' }}</span>
                    <span class="text-[10px] text-slate-400 font-normal uppercase">
                      {{ getDocTypeLabel(sale.documentType) }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="font-semibold text-slate-700 dark:text-slate-300">
                      {{ sale.orderId ? 'Comanda #' + sale.orderId : 'N/A' }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 max-w-[200px] truncate">
                  <div class="flex flex-col">
                    <span class="font-medium text-slate-800 dark:text-slate-200">
                      {{ sale.customerName || 'PÚBLICO GENERAL' }}
                    </span>
                    <span class="text-xs text-slate-400">
                      {{ sale.customerDocumentNumber || '00000000' }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-col text-xs text-slate-600 dark:text-slate-400">
                    <span><strong>Caja:</strong> {{ sale.cashierName || 'Sistema' }}</span>
                    <span><strong>Mozo:</strong> {{ sale.waiterName || 'S/M' }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right font-black text-slate-950 dark:text-white whitespace-nowrap">
                  S/{{ sale.totalAmount | number:'1.2-2' }}
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <span 
                    [ngClass]="{
                      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40': sale.status === 'PAID',
                      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/40': sale.status === 'ISSUED_UNPAID',
                      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/40': sale.status === 'VOIDED'
                    }"
                    class="px-2.5 py-1 text-xs font-bold rounded-full border"
                  >
                    {{ getStatusLabel(sale.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <div class="flex justify-center gap-1.5">
                    
                    <!-- Eye detail button -->
                    <button 
                      appButton 
                      variant="ghost" 
                      size="sm"
                      (click)="openDetail(sale)"
                      title="Ver detalle"
                    >
                      <i-lucide name="eye" class="h-4 w-4 text-slate-500"></i-lucide>
                    </button>

                    <!-- Reprint button -->
                    <button 
                      appButton 
                      variant="ghost" 
                      size="sm"
                      (click)="openReprint(sale)"
                      title="Reimprimir comprobante"
                    >
                      <i-lucide name="printer" class="h-4 w-4 text-slate-500"></i-lucide>
                    </button>

                    <!-- Void button -->
                    <button 
                      *hasPermission="PERMISSIONS.BILLING.VOID_SALE"
                      [disabled]="sale.status === 'VOIDED'"
                      appButton 
                      variant="ghost" 
                      size="sm"
                      (click)="openVoidConfirm(sale)"
                      class="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:pointer-events-none"
                      title="Anular venta"
                    >
                      <i-lucide name="x" class="h-4 w-4"></i-lucide>
                    </button>

                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION BAR -->
        <div class="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 gap-4">
          <span class="text-xs font-semibold text-slate-500">
            Mostrando {{ getPaginationStart() }} al {{ getPaginationEnd() }} de {{ totalCount() }} registros
          </span>
          <div class="flex items-center gap-2">
            <button 
              appButton 
              variant="outline" 
              size="sm" 
              [disabled]="currentPage() === 1"
              (click)="prevPage()"
            >
              Anterior
            </button>
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
              Pág. {{ currentPage() }} de {{ totalPages() }}
            </span>
            <button 
              appButton 
              variant="outline" 
              size="sm" 
              [disabled]="currentPage() === totalPages() || totalPages() === 0"
              (click)="nextPage()"
            >
              Siguiente
            </button>
          </div>
        </div>

      </div>

    </div>

    <!-- DETAIL MODAL -->
    <app-modal-shell 
      [open]="isDetailOpen()" 
      (close)="isDetailOpen.set(false)"
      [title]="'Detalle de la Venta ' + (selectedSale()?.ticketNumber || '')"
    >
      <div class="space-y-4 max-w-lg" *ngIf="selectedSale() as sale">
        
        <!-- RED BANNER IF VOIDED -->
        <div *ngIf="sale.status === 'VOIDED'" class="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-3 text-red-700">
          <i-lucide name="alert-triangle" class="h-5 w-5 shrink-0"></i-lucide>
          <div class="text-xs space-y-1">
            <p class="font-extrabold uppercase">Transacción Anulada</p>
            <p><strong>Motivo:</strong> {{ sale.voidedReason }}</p>
            <p><strong>Anulado por:</strong> {{ sale.voidedBy }} ({{ sale.voidedAt | date:'dd/MM/yyyy HH:mm' }})</p>
          </div>
        </div>

        <!-- INFO GRID -->
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p class="text-slate-400 font-bold">Cliente</p>
            <p class="font-semibold text-slate-800">{{ sale.customerName || 'PÚBLICO GENERAL' }}</p>
          </div>
          <div>
            <p class="text-slate-400 font-bold">DNI / RUC</p>
            <p class="font-semibold text-slate-800">{{ sale.customerDocumentNumber || '00000000' }}</p>
          </div>
          <div>
            <p class="text-slate-400 font-bold">Cajero / Operador</p>
            <p class="font-semibold text-slate-800">{{ sale.cashierName || 'Sistema' }}</p>
          </div>
          <div>
            <p class="text-slate-400 font-bold">Mozo Responsable</p>
            <p class="font-semibold text-slate-800">{{ sale.waiterName || 'Sin Mozo' }}</p>
          </div>
        </div>

        <!-- TIMES TIMELINE -->
        <div class="border-t border-slate-100 pt-3">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tiempos de Servicio</h3>
          <div class="grid grid-cols-3 gap-2 text-[10px] text-slate-600">
            <div class="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
              <span class="block text-slate-400 font-bold">Apertura</span>
              <span class="font-semibold">{{ (sale.orderCreatedAt | date:'HH:mm:ss') || 'S/D' }}</span>
            </div>
            <div class="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
              <span class="block text-slate-400 font-bold">Entrega</span>
              <span class="font-semibold">{{ (sale.orderDeliveredAt | date:'HH:mm:ss') || 'S/D' }}</span>
            </div>
            <div class="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
              <span class="block text-slate-400 font-bold">Cobro</span>
              <span class="font-semibold">{{ (sale.createdAt | date:'HH:mm:ss') || 'S/D' }}</span>
            </div>
          </div>
        </div>

        <!-- ITEMS BREAKDOWN -->
        <div class="border-t border-slate-100 pt-3">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Productos Comandados</h3>
          <div class="max-h-40 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
            <div *ngFor="let item of sale.details" class="flex justify-between items-center text-xs py-1 border-b border-slate-100 last:border-0">
              <div class="max-w-[280px]">
                <p class="font-bold text-slate-800">{{ item.productName }}</p>
                <span class="text-[10px] text-slate-400">S/{{ item.unitPrice | number:'1.2-2' }} x {{ item.quantity }}</span>
              </div>
              <span class="font-black text-slate-900">S/{{ (item.quantity * item.unitPrice) | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>

        <!-- PAYMENTS METHOD -->
        <div class="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
          <div>
            <p class="text-slate-400 font-bold">Métodos de Pago</p>
            <div class="flex gap-1.5 flex-wrap mt-1">
              <span *ngFor="let pay of sale.payments" class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                {{ getPaymentMethodLabel(pay.method) }}: S/{{ pay.amount | number:'1.2-2' }}
              </span>
            </div>
          </div>
          <div class="text-right">
            <p class="text-slate-400 font-bold">Total Venta</p>
            <p class="text-lg font-black text-slate-950">S/{{ sale.totalAmount | number:'1.2-2' }}</p>
          </div>
        </div>

        <!-- ACTIONS INSIDE DETAIL -->
        <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button 
            appButton 
            variant="outline" 
            (click)="isDetailOpen.set(false)"
          >
            Cerrar
          </button>
        </div>

      </div>
    </app-modal-shell>

    <!-- VOID CONFIRMATION MODAL -->
    <app-modal-shell 
      [open]="isVoidConfirmOpen()" 
      (close)="isVoidConfirmOpen.set(false)"
      [title]="'Anular Comprobante'"
    >
      <div class="space-y-4 max-w-sm">
        
        <div class="flex gap-3 text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs">
          <i-lucide name="alert-triangle" class="h-5 w-5 shrink-0"></i-lucide>
          <div class="space-y-1">
            <p class="font-extrabold uppercase">Confirmación Requerida</p>
            <p>Se anulará permanentemente el comprobante fiscal y se generará un movimiento de reverso en efectivo por <strong>S/{{ selectedSale()?.totalAmount | number:'1.2-2' }}</strong>.</p>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700">Motivo de Anulación (obligatorio)</label>
          <textarea 
            appInput 
            rows="3" 
            [(ngModel)]="voidReasonText"
            placeholder="Ingrese el motivo de la anulación (mínimo 5 caracteres)..."
            class="w-full"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            appButton 
            variant="outline" 
            [disabled]="isVoiding()"
            (click)="isVoidConfirmOpen.set(false)"
          >
            Cancelar
          </button>
          <button 
            appButton 
            variant="destructive" 
            [disabled]="isVoiding() || !isValidReason()"
            (click)="confirmVoid()"
          >
            {{ isVoiding() ? 'Anulando...' : 'Confirmar Anulación' }}
          </button>
        </div>

      </div>
    </app-modal-shell>

    <!-- PRINT PREVIEW MODAL -->
    <app-modal-shell 
      [open]="isReprintOpen()" 
      (close)="isReprintOpen.set(false)"
      [title]="'Reimprimir Ticket'"
    >
      <div class="space-y-4 max-w-sm flex flex-col items-center">
        
        <!-- PRINT AREA CONTAINER -->
        <div class="border border-slate-200 p-4 rounded-xl bg-slate-50 max-h-[450px] overflow-y-auto w-full">
          <app-print-preview 
            *ngIf="isReprintOpen() && selectedSale() as sale"
            [sale]="sale" 
            [order]="getReprintFakeOrder(sale)"
            [products]="getReprintFakeProducts(sale)"
            [tableNumber]="0" 
            [mode]="'venta'" 
            [width]="80"
          ></app-print-preview>
        </div>

        <!-- ACTIONS FOR PRINT -->
        <div class="flex justify-end gap-2 w-full pt-2">
          <button 
            appButton 
            variant="outline" 
            (click)="isReprintOpen.set(false)"
          >
            Cerrar
          </button>
          <button 
            appButton 
            (click)="printTicket()"
          >
            <i-lucide name="printer" class="h-4 w-4 mr-2"></i-lucide>
            Imprimir Ticket
          </button>
        </div>

      </div>
    </app-modal-shell>
  `
})
export class SalesHistoryPageComponent implements OnInit {

  public PERMISSIONS = PERMISSIONS;
  private api = inject(CashRegisterApi);
  private permissionService = inject(PermissionService);
  private printAgent = inject(PrintAgentService);
  private authApi = inject(AuthApi);
  private session = inject(SessionService);

  // States
  sales = signal<Sale[]>([]);
  cashRegisters = signal<CashRegister[]>([]);
  paymentMethods = signal<PaymentMethodConfig[]>([]);
  
  // Filters
  filterStartDate = '';
  filterEndDate = '';
  selectedRegisterId: string | null = null;
  selectedPaymentMethod = '';
  searchTerm = '';

  // Local Pagination
  currentPage = signal<number>(1);
  pageSize = 10;

  // Modals controllers
  selectedSale = signal<Sale | null>(null);
  isDetailOpen = signal<boolean>(false);
  isVoidConfirmOpen = signal<boolean>(false);
  isReprintOpen = signal<boolean>(false);

  voidReasonText = '';
  isVoiding = signal<boolean>(false);

  ngOnInit() {
    this.initDates();
    this.loadPaymentMethods();
    this.loadRegisters();
    this.loadSales();
  }

  initDates() {
    const today = new Date();
    const formatted = today.toISOString().split('T')[0];
    this.filterStartDate = formatted;
    this.filterEndDate = formatted;
  }

  loadPaymentMethods() {
    this.api.getActivePaymentMethods().subscribe({
      next: (res) => this.paymentMethods.set(res),
      error: (err) => console.error('Error loading payment methods:', err)
    });
  }

  loadRegisters() {
    this.api.getCashRegisters().subscribe({
      next: (res) => this.cashRegisters.set(res),
      error: (err) => console.error('Error loading cash registers:', err)
    });
  }

  loadSales() {
    if (!this.filterStartDate || !this.filterEndDate) return;
    this.api.getSalesWithDates(this.filterStartDate, this.filterEndDate).subscribe({
      next: (res) => {
        this.sales.set(res);
        this.currentPage.set(1);
      },
      error: (err) => console.error('Error loading sales list:', err)
    });
  }

  // Handle Date Filter change
  onDateFilterChange() {
    this.loadSales();
  }

  // Handle register filter change
  onRegisterChange(event: any) {
    const val = event.target.value;
    if (val === 'null' || !val) {
      this.selectedRegisterId = null;
      this.loadSales();
      return;
    }

    const reg = this.cashRegisters().find(c => c.id === Number(val));
    if (reg) {
      // Set date filters to match shift opening date
      const openDate = reg.createdAt.split('T')[0];
      this.filterStartDate = openDate;
      this.filterEndDate = openDate;
      this.loadSales();
    }
  }

  onPaymentMethodChange() {
    this.currentPage.set(1);
  }

  onSearchQueryChange() {
    this.currentPage.set(1);
  }

  resetFilters() {
    this.initDates();
    this.selectedRegisterId = null;
    this.selectedPaymentMethod = '';
    this.searchTerm = '';
    this.loadSales();
  }

  // Filter Pipeline (Computed Signal)
  filteredSales = computed(() => {
    let list = this.sales();

    // 1. Shift register filter
    if (this.selectedRegisterId !== null && this.selectedRegisterId !== 'null') {
      const regId = Number(this.selectedRegisterId);
      const reg = this.cashRegisters().find(c => c.id === regId);
      if (reg) {
        const start = new Date(reg.createdAt).getTime();
        const end = reg.closedAt ? new Date(reg.closedAt).getTime() : new Date().getTime();
        list = list.filter(s => {
          const saleTime = new Date(s.createdAt).getTime();
          return saleTime >= start && saleTime <= end;
        });
      }
    }

    // 2. Payment method filter
    if (this.selectedPaymentMethod) {
      list = list.filter(s => 
        s.payments && s.payments.some(p => p.method === this.selectedPaymentMethod)
      );
    }

    // 3. Search query filter
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      list = list.filter(s => {
        const ticketMatch = s.ticketNumber && s.ticketNumber.toLowerCase().includes(term);
        const nameMatch = s.customerName && s.customerName.toLowerCase().includes(term);
        const docMatch = s.customerDocumentNumber && s.customerDocumentNumber.includes(term);
        const idMatch = s.orderId && s.orderId.toString().includes(term);
        return ticketMatch || nameMatch || docMatch || idMatch;
      });
    }

    // Sort: newest first
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  // Local Pagination Calculations
  paginatedSales = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredSales().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredSales().length / this.pageSize);
  });

  totalCount = computed(() => {
    return this.filteredSales().length;
  });

  getPaginationStart(): number {
    if (this.filteredSales().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  getPaginationEnd(): number {
    const end = this.currentPage() * this.pageSize;
    const count = this.filteredSales().length;
    return end > count ? count : end;
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  // Modals Actions
  openDetail(sale: Sale) {
    this.selectedSale.set(sale);
    this.isDetailOpen.set(true);
  }

  openReprint(sale: Sale) {
    this.selectedSale.set(sale);
    this.isReprintOpen.set(true);
  }

  openVoidConfirm(sale: Sale) {
    this.selectedSale.set(sale);
    this.voidReasonText = '';
    this.isVoidConfirmOpen.set(true);
  }

  isValidReason(): boolean {
    return !!(this.voidReasonText && this.voidReasonText.trim().length >= 5);
  }

  confirmVoid() {
    const sale = this.selectedSale();
    if (!sale || !this.isValidReason()) return;

    this.isVoiding.set(true);
    this.api.voidSale(sale.id, this.voidReasonText).subscribe({
      next: () => {
        this.isVoiding.set(false);
        this.isVoidConfirmOpen.set(false);
        this.loadSales(); // Reload the sales list to reflect status change
      },
      error: (err) => {
        this.isVoiding.set(false);
        console.error('Error voiding sale:', err);
        alert(err.error?.message || 'Error al anular la venta.');
      }
    });
  }

  printTicket() {
    const sale = this.selectedSale();
    if (!sale) return;

    this.printAgent.checkAgentStatus().subscribe(isAlive => {
      if (isAlive) {
        const restaurantId = this.session.getRestaurantId();
        if (restaurantId) {
          this.authApi.getRestaurant(restaurantId).subscribe({
            next: (resInfo) => {
              const fakeOrder = this.getReprintFakeOrder(sale);
              const ops = this.printAgent.formatReceipt(
                resInfo,
                fakeOrder,
                sale,
                'venta',
                0
              );
              this.printAgent.sendPrintJob(ops).subscribe({
                next: () => this.isReprintOpen.set(false),
                error: () => alert('Error al reimprimir el comprobante.')
              });
            },
            error: () => {
              const defaultInfo = {
                name: this.session.getRestaurantName() || 'RESTAURANTE AL TOQUE',
                address: 'AV. PRINCIPAL 123',
                businessDocumentNumber: '20123456789',
                contactPhone: '(01) 444-5555'
              };
              const fakeOrder = this.getReprintFakeOrder(sale);
              const ops = this.printAgent.formatReceipt(
                defaultInfo,
                fakeOrder,
                sale,
                'venta',
                0
              );
              this.printAgent.sendPrintJob(ops).subscribe({
                next: () => this.isReprintOpen.set(false)
              });
            }
          });
        }
      } else {
        alert('Al Toque Print Agent no está corriendo en este dispositivo. No se puede imprimir físicamente.');
      }
    });
  }

  // Reprint Mappers for PrintPreviewComponent
  getReprintFakeOrder(sale: Sale): any {
    return {
      id: sale.orderId,
      createdAt: sale.orderCreatedAt || sale.createdAt,
      items: sale.details.map((d, index) => ({
        id: index + 1,
        productId: index + 1,
        unitPriceSnapshot: d.unitPrice,
        quantity: d.quantity,
        note: d.note
      }))
    };
  }

  getReprintFakeProducts(sale: Sale): any[] {
    return sale.details.map((d, index) => ({
      id: index + 1,
      name: d.productName
    }));
  }

  // Labels Translation
  getDocTypeLabel(docType: string): string {
    switch (docType) {
      case 'BOLETA': return 'Boleta de Venta';
      case 'FACTURA_ELECTRONICA': return 'Factura Electrónica';
      case 'RECEIPT': return 'Boleta (S/F)';
      case 'INVOICE': return 'Factura (S/F)';
      case 'NOTE': return 'Nota de Venta';
      default: return docType;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PAID': return 'Cobrada';
      case 'ISSUED_UNPAID': return 'Emitida No Pagada';
      case 'VOIDED': return 'Anulada';
      default: return status;
    }
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'CASH': return 'Efectivo';
      case 'CARD': return 'Tarjeta';
      case 'YAPE': return 'Yape';
      case 'PLIN': return 'Plin';
      case 'TRANSFER': return 'Transferencia';
      default: return method;
    }
  }
}
