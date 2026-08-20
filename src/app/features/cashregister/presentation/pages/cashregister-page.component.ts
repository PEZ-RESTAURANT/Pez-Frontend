import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashRegisterApi, CashRegister, CashMovement, PaymentMethodConfig, SalePayment, Sale } from '../../infrastructure/api/cashregister.api';
import { OrdersApi } from '../../../orders/infrastructure/api/orders.api';
import { Order, RestaurantTable } from '../../../orders/domain/models/orders.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { RealtimeService } from '../../../../core/realtime/services/realtime.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import { BillingModalComponent } from '../../../../shared/ui/billing-modal/billing-modal.component';
import { SelectDirective } from '../../../../shared/ui/select/select.directive';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cashregister-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, BillingModalComponent, SelectDirective],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm animate-in fade-in duration-300">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Control de Caja</span>
            @if (isOpen()) {
              <span class="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                Abierto
              </span>
            } @else {
              <span class="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gray-400 text-white">
                Cerrado
              </span>
            }
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            @if (isOpen()) {
              Turno activo. Registra movimientos, emite comprobantes y gestiona pagos de comandas.
            } @else {
              No hay turnos abiertos. Por favor abre caja para poder cobrar pedidos.
            }
          </p>
        </div>

        @if (isOpen()) {
          <div class="flex flex-wrap items-center gap-2">
            <button 
              (click)="openMovementModal()"
              class="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider min-h-[44px]"
            >
              Movimiento Manual
            </button>
            <button 
              (click)="openCloseShiftModal()"
              class="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider min-h-[44px]"
            >
              Cerrar Turno
            </button>
          </div>
        }
      </div>

      <!-- ================= PANTALLA APERTURA DE CAJA ================= -->
      @if (!isOpen()) {
        <div class="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-md animate-in zoom-in-[0.98] duration-200">
          <div class="text-center space-y-2 mb-6">
            <div class="inline-flex p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-extrabold text-gray-900 dark:text-white">Apertura de Caja</h3>
            <p class="text-sm text-gray-500">Declara el saldo inicial en efectivo para iniciar el turno.</p>
          </div>

          <form (submit)="openShift()" class="space-y-4">
            <div>
              <label class="block text-xs font-black uppercase text-gray-400 mb-1.5">Monto Inicial en Efectivo (S/)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                required
                name="openingBalance"
                [(ngModel)]="openingBalanceInput"
                placeholder="0.00"
                class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button 
              type="submit"
              class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl cursor-pointer transition-colors shadow-md uppercase tracking-wider"
            >
              Abrir Turno de Caja
            </button>
          </form>
        </div>
      } @else {
        
        <!-- ================= VISTA PRINCIPAL (TURNO ABIERTO) ================= -->
        <!-- CUADRO DE INDICADORES -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs">
            <span class="text-[10px] font-black uppercase text-gray-400 tracking-wider">Efectivo Esperado en Caja</span>
            <h3 class="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              S/{{ register()?.currentBalance?.toFixed(2) }}
            </h3>
            <p class="text-xs text-gray-400 mt-2">Saldo inicial: S/{{ register()?.openingBalance?.toFixed(2) }}</p>
          </div>

          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs">
            <span class="text-[10px] font-black uppercase text-gray-400 tracking-wider">Ventas del Turno</span>
            <h3 class="text-3xl font-black text-gray-900 dark:text-white mt-1">
              S/{{ register()?.summary?.totalSales?.toFixed(2) || '0.00' }}
            </h3>
            <p class="text-xs text-gray-400 mt-2">Facturado e ingresado en caja.</p>
          </div>

          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs">
            <span class="text-[10px] font-black uppercase text-gray-400 tracking-wider">Movimientos Manuales</span>
            <h3 class="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
              S/{{ getManualNetTotal().toFixed(2) }}
            </h3>
            <div class="flex items-center gap-3 text-[10px] text-gray-400 mt-2 font-bold">
              <span class="text-emerald-500">Ingresos: +{{ register()?.summary?.totalManualIncome?.toFixed(2) || '0.00' }}</span>
              <span class="text-red-500">Egresos: -{{ register()?.summary?.totalManualExpense?.toFixed(2) || '0.00' }}</span>
            </div>
          </div>

        </div>

        <!-- MAIN LAYOUT COLA & HISTORIAL -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- COLA DE CUENTAS POR COBRAR (7 COLUMNS) -->
          <div class="lg:col-span-7 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs space-y-4">
            <h3 class="text-lg font-black text-gray-900 dark:text-white">Cuentas por Cobrar (Comandas)</h3>
            
            <div class="space-y-3">
              @for (order of pendingOrders(); track order.id) {
                <div class="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                        {{ getTableLabel(order.tableId) }}
                      </span>
                      @if (order.status === 'ISSUED_UNPAID') {
                        <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                          Precuenta Emitida
                        </span>
                      } @else if (order.status === 'ALL_DELIVERED') {
                        <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                          Entregado Completo
                        </span>
                      }
                    </div>
                    <span class="text-xs text-gray-400 font-bold block pt-1">Comanda #{{ order.id }} &bull; Atendido el {{ order.attendedAt | date:'shortTime' }}</span>
                  </div>

                  <div class="flex items-center gap-4">
                    <span class="text-lg font-black text-gray-800 dark:text-gray-200">
                      S/{{ getOrderTotal(order).toFixed(2) }}
                    </span>
                    <button 
                      (click)="startBillingFlow(order)"
                      class="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider min-h-[44px] flex items-center justify-center"
                    >
                      Cobrar
                    </button>
                  </div>
                </div>
              }
              @if (pendingOrders().length === 0) {
                <div class="py-12 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <svg class="h-12 w-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <p class="font-bold text-sm">Sin comandas pendientes</p>
                  <p class="text-xs text-gray-500 mt-0.5">Todas las cuentas están pagadas u ocupadas en mesa.</p>
                </div>
              }
            </div>
          </div>

          <!-- HISTORIAL DE MOVIMIENTOS (5 COLUMNS) -->
          <div class="lg:col-span-5 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-black text-gray-900 dark:text-white">Movimientos del Turno</h3>
              
              <!-- FILTROS -->
              <div class="inline-flex p-0.5 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-250/20">
                <button 
                  (click)="setFilter('ALL')"
                  [class.bg-white]="movementFilter() === 'ALL'"
                  [class.dark:bg-gray-800]="movementFilter() === 'ALL'"
                  [class.text-gray-900]="movementFilter() === 'ALL'"
                  [class.dark:text-white]="movementFilter() === 'ALL'"
                  [class.shadow-xs]="movementFilter() === 'ALL'"
                  [class.text-gray-500]="movementFilter() !== 'ALL'"
                  class="px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer"
                >
                  Todos
                </button>
                <button 
                  (click)="setFilter('INCOME')"
                  [class.bg-white]="movementFilter() === 'INCOME'"
                  [class.dark:bg-gray-800]="movementFilter() === 'INCOME'"
                  [class.text-gray-900]="movementFilter() === 'INCOME'"
                  [class.dark:text-white]="movementFilter() === 'INCOME'"
                  [class.shadow-xs]="movementFilter() === 'INCOME'"
                  [class.text-gray-500]="movementFilter() !== 'INCOME'"
                  class="px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer"
                >
                  Ingresos
                </button>
                <button 
                  (click)="setFilter('EXPENSE')"
                  [class.bg-white]="movementFilter() === 'EXPENSE'"
                  [class.dark:bg-gray-800]="movementFilter() === 'EXPENSE'"
                  [class.text-gray-900]="movementFilter() === 'EXPENSE'"
                  [class.dark:text-white]="movementFilter() === 'EXPENSE'"
                  [class.shadow-xs]="movementFilter() === 'EXPENSE'"
                  [class.text-gray-500]="movementFilter() !== 'EXPENSE'"
                  class="px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer"
                >
                  Egresos
                </button>
              </div>
            </div>

            <div class="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              @for (mov of filteredMovements(); track mov.id) {
                <div class="p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800 flex items-start justify-between text-xs">
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-1.5">
                      <span 
                        [class.bg-emerald-500/10]="mov.type === 'INCOME'"
                        [class.text-emerald-500]="mov.type === 'INCOME'"
                        [class.bg-red-500/10]="mov.type === 'EXPENSE'"
                        [class.text-red-500]="mov.type === 'EXPENSE'"
                        class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                      >
                        {{ mov.type === 'INCOME' ? 'Ingreso' : 'Egreso' }}
                      </span>
                      <span class="font-extrabold text-gray-600 dark:text-gray-300">
                        {{ getReasonLabel(mov.reason) }}
                      </span>
                    </div>
                    @if (mov.note) {
                      <p class="text-gray-400 dark:text-gray-500 text-[11px] leading-tight pt-1">
                        {{ mov.note }}
                      </p>
                    }
                    <span class="text-[9px] text-gray-400 block pt-0.5">
                      {{ mov.createdAt | date:'shortTime' }}
                    </span>
                  </div>

                  <span 
                    [class.text-emerald-600]="mov.type === 'INCOME'"
                    [class.text-red-600]="mov.type === 'EXPENSE'"
                    class="font-black text-sm shrink-0"
                  >
                    {{ mov.type === 'INCOME' ? '+' : '-' }}S/{{ mov.amount.toFixed(2) }}
                  </span>
                </div>
              }
              @if (filteredMovements().length === 0) {
                <div class="py-12 text-center text-gray-400 text-xs">
                  No hay movimientos registrados.
                </div>
              }
            </div>
          </div>

        </div>

      }

    </div>

    <!-- ================= MODAL REGISTRO MOVIMIENTO MANUAL ================= -->
    <app-modal-shell
      [open]="isMovementModalOpen()"
      title="Nuevo Movimiento Manual"
      description="Registra ingresos o egresos directos de caja."
      (close)="closeMovementModal()"
    >
      <form (submit)="saveMovement()" class="space-y-4">
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Tipo de Movimiento</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              type="button"
              (click)="manualMovementForm.type = 'INCOME'"
              [class.bg-emerald-600]="manualMovementForm.type === 'INCOME'"
              [class.text-white]="manualMovementForm.type === 'INCOME'"
              [class.border-emerald-600]="manualMovementForm.type === 'INCOME'"
              [class.bg-gray-50]="manualMovementForm.type !== 'INCOME'"
              [class.dark:bg-gray-900]="manualMovementForm.type !== 'INCOME'"
              class="py-2.5 rounded-xl text-xs font-black border cursor-pointer text-center transition-all"
            >
              Ingreso
            </button>
            <button 
              type="button"
              (click)="manualMovementForm.type = 'EXPENSE'"
              [class.bg-red-600]="manualMovementForm.type === 'EXPENSE'"
              [class.text-white]="manualMovementForm.type === 'EXPENSE'"
              [class.border-red-600]="manualMovementForm.type === 'EXPENSE'"
              [class.bg-gray-50]="manualMovementForm.type !== 'EXPENSE'"
              [class.dark:bg-gray-900]="manualMovementForm.type !== 'EXPENSE'"
              class="py-2.5 rounded-xl text-xs font-black border cursor-pointer text-center transition-all"
            >
              Egreso
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Concepto/Motivo</label>
          <select appSelect
            [(ngModel)]="manualMovementForm.reason"
            name="reason"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="SUPPLIER_PAYMENT">Pago a Proveedor</option>
            <option value="CASH_WITHDRAWAL">Retiro de Efectivo</option>
            <option value="PETTY_CASH">Caja Chica</option>
            <option value="OTHER">Otro (Detallar obligatoriamente en nota)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Monto (S/)</label>
          <input 
            type="number" 
            step="0.01" 
            min="0.01"
            required
            [(ngModel)]="manualMovementForm.amount"
            name="amount"
            placeholder="0.00"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Nota/Justificación</label>
          <textarea 
            [(ngModel)]="manualMovementForm.note"
            name="note"
            rows="3"
            [required]="manualMovementForm.reason === 'OTHER'"
            placeholder="Escribe los detalles del movimiento aquí..."
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          ></textarea>
          @if (manualMovementForm.reason === 'OTHER' && !manualMovementForm.note) {
            <span class="text-[10px] text-red-500 font-bold block pt-1">La nota es obligatoria si seleccionas "Otro".</span>
          }
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeMovementModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            [disabled]="manualMovementForm.reason === 'OTHER' && !manualMovementForm.note"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Guardar
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL COBRO DE CUENTA ================= -->
    <app-billing-modal
      [open]="isBillingModalOpen()"
      [order]="selectedOrder()"
      (close)="closeBillingModal()"
      (paymentSuccess)="loadState()"
    ></app-billing-modal>

    <!-- ================= MODAL CIERRE DE TURNO ================= -->
    <app-modal-shell
      [open]="isCloseShiftModalOpen()"
      title="Cierre de Turno y Arqueo"
      description="Declara el efectivo físico total que se retira de la caja."
      (close)="closeCloseShiftModal()"
    >
      <form (submit)="closeShift()" class="space-y-4">
        <div class="p-4 bg-gray-50 dark:bg-gray-950/30 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between text-xs font-bold">
          <span class="text-gray-400">Efectivo Esperado en Sistema:</span>
          <span class="text-gray-800 dark:text-gray-200">S/{{ register()?.currentBalance?.toFixed(2) }}</span>
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1.5">Efectivo Físico Declarado (S/)</label>
          <input 
            type="number" 
            step="0.01" 
            min="0"
            required
            name="declaredAmount"
            [(ngModel)]="declaredAmountInput"
            placeholder="0.00"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeCloseShiftModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider"
          >
            Confirmar Arqueo y Cierre
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL ARQUEO FINAL (DESCUADRES) ================= -->
    <app-modal-shell
      [open]="isArqueoReportOpen()"
      title="Reporte de Arqueo Final"
      description="Resultado de la auditoría de caja al cerrar el turno."
      (close)="closeArqueoReport()"
    >
      @if (arqueoReport()) {
        <div class="space-y-5 text-xs font-bold text-gray-700 dark:text-gray-300">
          
          <div class="text-center py-2">
            @if (arqueoReport()?.mismatched) {
              <div class="inline-flex p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl mb-2">
                <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 class="text-lg font-black text-red-600 dark:text-red-400">CAJA DESCUADRADA</h3>
              <p class="text-xs text-gray-500 font-bold mt-1">
                Se ha detectado una discrepancia entre el efectivo declarado y el esperado.
              </p>
            } @else {
              <div class="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl mb-2">
                <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 class="text-lg font-black text-emerald-600 dark:text-emerald-400">CAJA CUADRADA</h3>
              <p class="text-xs text-gray-500 font-bold mt-1">El efectivo declarado coincide exactamente con el sistema.</p>
            }
          </div>

          <div class="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            <div class="flex justify-between p-3">
              <span>Monto Esperado en Sistema:</span>
              <span class="font-extrabold text-gray-900 dark:text-white">S/{{ arqueoReport()?.expected?.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between p-3">
              <span>Monto Físico Declarado:</span>
              <span class="font-extrabold text-gray-900 dark:text-white">S/{{ arqueoReport()?.declared?.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between p-3 bg-gray-50 dark:bg-gray-850/30">
              <span>Diferencia / Discrepancia:</span>
              <span 
                [class.text-red-500]="arqueoReport()?.mismatched"
                [class.text-emerald-500]="!arqueoReport()?.mismatched"
                class="font-black text-sm"
              >
                S/{{ arqueoReport()?.difference?.toFixed(2) }}
              </span>
            </div>
          </div>

          <div class="flex justify-center pt-2">
            <button 
              (click)="closeArqueoReport()"
              class="px-6 py-2 bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white dark:text-gray-900 text-white font-black text-xs rounded-xl cursor-pointer"
            >
              Entendido
            </button>
          </div>

        </div>
      }
    </app-modal-shell>
  `
})
export class CashRegisterPageComponent implements OnInit, OnDestroy {
  private api = inject(CashRegisterApi);
  private ordersApi = inject(OrdersApi);
  private notify = inject(NotificationService);
  private realtime = inject(RealtimeService);
  private session = inject(SessionService);

  public isOpen = signal<boolean>(false);
  public register = signal<CashRegister | null>(null);
  public pendingOrders = signal<Order[]>([]);
  public tables = signal<RestaurantTable[]>([]);
  public activePaymentMethodsOptions = signal<PaymentMethodConfig[]>([]);

  public movementFilter = signal<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  // Input states
  public openingBalanceInput: number = 0;
  public declaredAmountInput: number = 0;

  // Manual movement form state
  public manualMovementForm = {
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    reason: 'SUPPLIER_PAYMENT' as 'SUPPLIER_PAYMENT' | 'CASH_WITHDRAWAL' | 'PETTY_CASH' | 'OTHER',
    amount: 0,
    note: ''
  };

  // Billing Flow state
  public billingForm = {
    documentType: 'BOLETA' as 'BOLETA' | 'FACTURA_ELECTRONICA',
    customerDocumentNumber: '',
    customerName: ''
  };

  public selectedOrder = signal<Order | null>(null);
  public selectedOrderSaleTotal = signal<number>(0);
  public billingStep = signal<number>(1); // 1 = Receipt, 2 = Payments, 3 = Success
  public successTime = signal<Date | null>(null);
  private currentSaleId: number | null = null;
  public paymentLines: SalePayment[] = [];

  // Modals visibility signals
  public isMovementModalOpen = signal<boolean>(false);
  public isBillingModalOpen = signal<boolean>(false);
  public isCloseShiftModalOpen = signal<boolean>(false);
  public isArqueoReportOpen = signal<boolean>(false);

  // Arqueo Report final data
  public arqueoReport = signal<{ expected: number, declared: number, difference: number, mismatched: boolean } | null>(null);

  // WS subscription
  private wsAlertsSubscription?: Subscription;

  // Fallback payment options (in case seeder fails or config database is empty)
  public paymentMethodsOptions = computed(() => {
    const activeConfigs = this.activePaymentMethodsOptions();
    if (activeConfigs.length > 0) {
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

  public filteredMovements = computed(() => {
    const reg = this.register();
    if (!reg || !reg.movements) return [];

    const f = this.movementFilter();
    if (f === 'ALL') {
      return [...reg.movements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return reg.movements
      .filter(m => m.type === f)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  constructor() {
    // Escucha cambios en el restaurantId de la sesión para subscribirse a las alertas del WebSocket
    effect(() => {
      const restaurantId = this.session.getRestaurantId();
      if (restaurantId) {
        this.subscribeToAlertsWebSocket(restaurantId);
      } else {
        this.unsubscribeWS();
      }
    });
  }

  ngOnInit(): void {
    this.loadState();
    this.loadTables();
  }

  loadState(): void {
    // 1. Obtener la caja activa
    this.api.getCurrentRegister().subscribe({
      next: (reg) => {
        this.register.set(reg);
        this.isOpen.set(reg.status === 'OPEN');
        if (reg.status === 'OPEN') {
          this.loadPendingOrders();
          this.loadPaymentMethods();
        }
      },
      error: (err) => {
        // Asume caja cerrada si da un error de turnos (ej. 400 Bad Request por CashRegisterNotOpenException)
        this.isOpen.set(false);
        this.register.set(null);
      }
    });
  }

  loadTables(): void {
    this.ordersApi.getTables().subscribe({
      next: (ts) => this.tables.set(ts),
      error: () => this.notify.error('No se pudo cargar el listado de mesas.')
    });
  }

  loadPendingOrders(): void {
    this.ordersApi.getAllOrders().subscribe({
      next: (orders) => {
        // Filtrar comandas que esperan pago (ISSUED_UNPAID) o que ya fueron entregadas pero no cobradas (ALL_DELIVERED)
        const pending = orders.filter(o => o.status === 'ISSUED_UNPAID' || o.status === 'ALL_DELIVERED');
        this.pendingOrders.set(pending);
      },
      error: () => this.notify.error('No se pudieron obtener las comandas pendientes.')
    });
  }

  loadPaymentMethods(): void {
    this.api.getActivePaymentMethods().subscribe({
      next: (methods) => this.activePaymentMethodsOptions.set(methods),
      error: () => this.notify.error('No se pudo cargar el catálogo de formas de pago.')
    });
  }

  // --- LIFE CYCLE ACTIONS ---
  openShift(): void {
    if (this.openingBalanceInput < 0) {
      this.notify.error('El balance inicial no puede ser negativo.');
      return;
    }

    this.api.openRegister(this.openingBalanceInput).subscribe({
      next: () => {
        this.notify.success('Caja abierta correctamente.');
        this.loadState();
      },
      error: () => this.notify.error('Error al abrir la caja registradora.')
    });
  }

  // --- MANUAL MOVEMENTS ---
  openMovementModal(): void {
    this.manualMovementForm = {
      type: 'INCOME',
      reason: 'SUPPLIER_PAYMENT',
      amount: 0,
      note: ''
    };
    this.isMovementModalOpen.set(true);
  }

  closeMovementModal(): void {
    this.isMovementModalOpen.set(false);
  }

  saveMovement(): void {
    const { type, amount, reason, note } = this.manualMovementForm;
    if (amount <= 0) {
      this.notify.error('El monto debe ser mayor a cero.');
      return;
    }
    if (reason === 'OTHER' && !note.trim()) {
      this.notify.error('La nota es obligatoria si el motivo es "Otro".');
      return;
    }

    this.api.addMovement(type, amount, reason, note).subscribe({
      next: () => {
        this.notify.success('Movimiento registrado.');
        this.closeMovementModal();
        this.loadState();
      },
      error: () => this.notify.error('Error al registrar el movimiento manual.')
    });
  }

  getManualNetTotal(): number {
    const reg = this.register();
    if (!reg) return 0;
    const income = reg.summary?.totalManualIncome || 0;
    const expense = reg.summary?.totalManualExpense || 0;
    return income - expense;
  }

  setFilter(filter: 'ALL' | 'INCOME' | 'EXPENSE'): void {
    this.movementFilter.set(filter);
  }

  // --- BILLING AND PAYMENT FLOW ---
  startBillingFlow(order: Order): void {
    this.selectedOrder.set(order);
    this.selectedOrderSaleTotal.set(this.getOrderTotal(order));
    this.billingForm = {
      documentType: 'BOLETA',
      customerDocumentNumber: '',
      customerName: ''
    };
    this.paymentLines = [];

    // Validar si ya existe una venta PENDING para esta comanda
    this.api.getSales().subscribe({
      next: (sales) => {
        const existing = sales.find(s => s.orderId === order.id && s.status === 'PENDING');
        if (existing) {
          this.currentSaleId = existing.id;
          this.selectedOrderSaleTotal.set(existing.totalAmount);
          this.billingStep.set(2);
          this.addPaymentLine();
          this.isBillingModalOpen.set(true);
        } else {
          this.billingStep.set(1);
          this.isBillingModalOpen.set(true);
        }
      },
      error: () => {
        // En caso de error, ir por el flujo estándar de creación
        this.billingStep.set(1);
        this.isBillingModalOpen.set(true);
      }
    });
  }

  closeBillingModal(): void {
    this.isBillingModalOpen.set(false);
    this.selectedOrder.set(null);
  }

  onRucChange(ruc: string): void {
    if (ruc && ruc.trim().length === 11) {
      // Búsqueda puntual del RUC del lado del servidor
      this.api.findSaleByRuc(ruc.trim()).subscribe({
        next: (sales) => {
          if (sales && sales.length > 0) {
            const latest = sales[sales.length - 1];
            if (latest.customerName) {
              this.billingForm.customerName = latest.customerName;
              this.notify.success(`Cliente autocompletado: ${latest.customerName}`);
            }
          }
        }
      });
    }
  }

  emitReceipt(): void {
    const order = this.selectedOrder();
    if (!order) return;

    const { documentType, customerDocumentNumber, customerName } = this.billingForm;

    if (documentType === 'FACTURA_ELECTRONICA' && (!customerDocumentNumber || customerDocumentNumber.length !== 11)) {
      this.notify.error('El RUC para una factura debe tener 11 dígitos.');
      return;
    }

    this.api.createSale(order.id, documentType, customerDocumentNumber, customerName).subscribe({
      next: (saleId) => {
        this.currentSaleId = saleId;
        this.billingStep.set(2);
        this.addPaymentLine();
      },
      error: () => this.notify.error('No se pudo emitir el comprobante de pago.')
    });
  }

  addPaymentLine(): void {
    const remaining = this.getRemainingAmount();
    // Default config uses CASH or the first active payment method configured
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

    // Convertir líneas a formato del backend
    const payments = this.paymentLines.map(l => ({ method: l.method, amount: l.amount }));

    this.api.registerPayments(this.currentSaleId, payments).subscribe({
      next: () => {
        this.successTime.set(new Date());
        this.billingStep.set(3);
        this.loadState(); // Recarga caja y comandas pendientes
      },
      error: () => this.notify.error('No se pudieron registrar los pagos de la venta.')
    });
  }

  // --- CLOSE SHIFT & ARQUEO ---
  openCloseShiftModal(): void {
    this.declaredAmountInput = 0;
    this.isCloseShiftModalOpen.set(true);
  }

  closeCloseShiftModal(): void {
    this.isCloseShiftModalOpen.set(false);
  }

  closeShift(): void {
    const reg = this.register();
    if (!reg) return;

    if (this.declaredAmountInput < 0) {
      this.notify.error('El monto declarado no puede ser negativo.');
      return;
    }

    this.api.closeRegisterWithDeclaration(reg.id, this.declaredAmountInput).subscribe({
      next: () => {
        const expected = reg.currentBalance;
        const declared = this.declaredAmountInput;
        const diff = Number((declared - expected).toFixed(2));
        const mismatched = Math.abs(diff) >= 0.01;

        // Mostrar reporte final
        this.arqueoReport.set({
          expected,
          declared,
          difference: diff,
          mismatched
        });

        this.closeCloseShiftModal();
        this.isOpen.set(false);
        this.register.set(null);
        this.isArqueoReportOpen.set(true);

        if (mismatched) {
          this.notify.error('El arqueo final detectó un descuadre en caja.');
        } else {
          this.notify.success('Caja cerrada con arqueo cuadrado.');
        }
      },
      error: () => this.notify.error('No se pudo cerrar el turno de caja.')
    });
  }

  closeArqueoReport(): void {
    this.isArqueoReportOpen.set(false);
    this.arqueoReport.set(null);
    this.loadState();
  }

  // --- UTILITIES ---
  getTableLabel(tableId?: number): string {
    if (!tableId) return 'Para Llevar / Delivery';
    const t = this.tables().find(tab => tab.id === tableId);
    return t ? `Mesa M${t.number}` : `Mesa #${tableId}`;
  }

  getOrderTotal(order: Order): number {
    if (!order.items) return 0;
    return order.items.reduce((sum, item) => sum + (item.quantity * item.unitPriceSnapshot), 0);
  }

  getReasonLabel(reason: string): string {
    switch (reason) {
      case 'SUPPLIER_PAYMENT': return 'Pago a Proveedor';
      case 'CASH_WITHDRAWAL': return 'Retiro de Efectivo';
      case 'PETTY_CASH': return 'Caja Chica';
      case 'OTHER': return 'Otro';
      default: return reason;
    }
  }

  // --- WEBSOCKET ALERTS ---
  private subscribeToAlertsWebSocket(restaurantId: number): void {
    this.unsubscribeWS();
    this.wsAlertsSubscription = this.realtime.subscribeToAlerts(restaurantId).subscribe({
      next: (event) => {
        const type = event.eventType;
        const payload = event.payload;
        if (!type) return;

        if (type === 'CashRegisterMismatched') {
          this.notify.error(`ALERTA: Cierre de caja detectó descuadre de S/${payload.difference?.toFixed(2)} por cajero.`);
          this.loadState();
        } else if (type === 'ForcedCloseByCutoff') {
          this.notify.info('Aviso: Caja cerrada automáticamente por corte de turno programado.');
          this.loadState();
        }
      }
    });
  }

  private unsubscribeWS(): void {
    if (this.wsAlertsSubscription) {
      this.wsAlertsSubscription.unsubscribe();
      this.wsAlertsSubscription = undefined;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeWS();
  }
}
