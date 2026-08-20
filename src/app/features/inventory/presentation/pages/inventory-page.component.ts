import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogApi, Supply } from '../../../catalog/infrastructure/api/catalog.api';
import { InventoryApi, StockMovement } from '../../infrastructure/api/inventory.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { PermissionService } from '../../../../core/auth/services/permission.service';
import { PERMISSIONS } from '../../../../core/config/permissions';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import { SelectOnFocusDirective } from '../../../../shared/utils/select-on-focus.directive';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, SelectOnFocusDirective],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Control de Inventario y Stock</span>
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Gestión física del almacén, reabastecimientos, ajustes manuales y tracking de mermas.
          </p>
        </div>

        @if (canManageSupplies()) {
          <button 
            (click)="openSupplyCreateModal()"
            class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-all self-start md:self-auto"
          >
            + Nuevo Insumo
          </button>
        }
      </div>

      <!-- ================= ALERTS BANNER CARDS ================= -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Tarjeta Alerta 1: Bajo Stock -->
        <div class="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm">
          <div class="p-3 bg-amber-500/10 rounded-xl text-amber-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span class="text-[10px] font-black uppercase text-gray-400 tracking-wider">Insumos en Alerta de Bajo Stock</span>
            <div class="flex items-baseline gap-2 mt-0.5">
              <span class="text-2xl font-black text-gray-900 dark:text-white">{{ lowStockCount() }}</span>
              <span class="text-xs text-gray-400 font-extrabold">insumos por debajo del umbral mínimo</span>
            </div>
          </div>
        </div>

        <!-- Tarjeta Alerta 2: Descuadres de Stock (Stock Negativo) -->
        <div class="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm">
          <div class="p-3 bg-red-500/10 rounded-xl text-red-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <span class="text-[10px] font-black uppercase text-gray-400 tracking-wider">Insumos Desalineados (Stock Negativo)</span>
            <div class="flex items-baseline gap-2 mt-0.5">
              <span class="text-2xl font-black text-gray-900 dark:text-white">{{ mismatchedCount() }}</span>
              <span class="text-xs text-gray-400 font-extrabold">con descuadre crítico por comandas sin stock</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= CONTENT LAYOUT ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- SUPPLIES MAIN TABLE (8 COLUMNS) -->
        <div class="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 class="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>Almacén de Insumos</span>
            </h3>
            
            <!-- Search bar -->
            <div class="relative w-full sm:w-64">
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                placeholder="Buscar insumo..."
                class="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-bold border-collapse">
              <thead>
                <tr class="border-b border-gray-100 dark:border-gray-800 text-[10px] uppercase text-gray-400 tracking-wider">
                  <th class="py-3 px-4">Insumo</th>
                  <th class="py-3 px-4">Unidad</th>
                  <th class="py-3 px-4">Stock Mínimo</th>
                  <th class="py-3 px-4">Stock Actual</th>
                  <th class="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                @for (sup of filteredSupplies(); track sup.id) {
                  <tr 
                    (click)="selectSupply(sup)"
                    [class.bg-blue-50/30]="selectedSupply()?.id === sup.id"
                    [class.dark:bg-blue-950/5]="selectedSupply()?.id === sup.id"
                    [class.bg-red-500/5]="sup.currentStock < 0"
                    [class.bg-amber-500/5]="sup.currentStock >= 0 && sup.currentStock < sup.minThreshold"
                    class="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 cursor-pointer transition-colors border-l-4"
                    [class.border-l-transparent]="selectedSupply()?.id !== sup.id && sup.currentStock >= sup.minThreshold"
                    [class.border-l-blue-500]="selectedSupply()?.id === sup.id && sup.currentStock >= sup.minThreshold"
                    [class.border-l-amber-500]="sup.currentStock >= 0 && sup.currentStock < sup.minThreshold"
                    [class.border-l-red-500]="sup.currentStock < 0"
                  >
                    <td class="py-3.5 px-4 font-black text-gray-900 dark:text-white">
                      {{ sup.name }}
                    </td>
                    <td class="py-3.5 px-4 text-gray-500">{{ sup.unit || '-' }}</td>
                    <td class="py-3.5 px-4">
                      <span>Mín: {{ sup.minThreshold | number:'1.2-2' }}</span>
                      @if (sup.criticalThreshold) {
                        <div class="text-[10px] text-red-500 font-semibold mt-0.5">Crít: {{ sup.criticalThreshold | number:'1.2-2' }}</div>
                      }
                    </td>
                    <td class="py-3.5 px-4">
                      <span 
                        [class.text-amber-500]="sup.stockLevel === 'BAJO'"
                        [class.text-amber-600]="sup.stockLevel === 'CRITICO'"
                        [class.text-red-500]="sup.stockLevel === 'AGOTADO' || sup.currentStock < 0"
                        [class.text-emerald-600]="sup.stockLevel === 'ESTABLE' && sup.currentStock >= 0"
                        class="font-black text-sm"
                      >
                        {{ sup.currentStock | number:'1.2-2' }}
                      </span>
                      @if (sup.currentStock < 0) {
                        <span class="ml-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">Desalineado</span>
                      } @else if (sup.stockLevel === 'AGOTADO') {
                        <span class="ml-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">Agotado</span>
                      } @else if (sup.stockLevel === 'CRITICO') {
                        <span class="ml-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">Crítico</span>
                      } @else if (sup.stockLevel === 'BAJO') {
                        <span class="ml-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-yellow-500/10 text-amber-500">Bajo Stock</span>
                      }
                    </td>
                    <td class="py-3.5 px-4 text-right" (click)="$event.stopPropagation()">
                      <div class="flex justify-end gap-1.5">
                        @if (canRestock()) {
                          <button 
                            (click)="openRestockModal(sup)"
                            class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] cursor-pointer font-bold shadow-xs transition-colors"
                          >
                            Reabastecer
                          </button>
                        }
                        @if (canAdjust()) {
                          <button 
                            (click)="openAdjustModal(sup)"
                            class="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] cursor-pointer font-bold shadow-xs transition-colors"
                          >
                            Ajustar
                          </button>
                        }
                        @if (canManageSupplies()) {
                          <button 
                            (click)="openSupplyEditModal(sup)"
                            class="p-1.5 hover:bg-gray-150 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                            title="Editar Insumo"
                          >
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button 
                            (click)="promptDeleteSupply(sup)"
                            class="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-500"
                            title="Eliminar Insumo"
                          >
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
                @if (filteredSupplies().length === 0) {
                  <tr>
                    <td colspan="5" class="py-12 text-center text-gray-400 italic">
                      No se encontraron insumos con los filtros actuales.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- SUPPLY DETAILS & MOVEMENT HISTORY (4 COLUMNS) -->
        <div class="lg:col-span-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
          @if (selectedSupply(); as sup) {
            <div class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h4 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Historial de Stock</h4>
                  <span class="text-xs font-bold text-blue-600 dark:text-blue-400">{{ sup.name }}</span>
                </div>
                <span class="text-[10px] bg-gray-100 dark:bg-gray-900 text-gray-500 font-extrabold px-2.5 py-1 rounded-xl">
                  {{ sup.unit || 'u' }}
                </span>
              </div>

              <!-- List of Movements -->
              <div class="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                @for (m of movements(); track m.id) {
                  <div class="p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-150 dark:border-gray-800/80 text-xs flex justify-between gap-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-1.5">
                        <!-- Movement Type Badge -->
                        @if (m.type === 'RESTOCK') {
                          <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600">Reabastecido</span>
                        } @else if (m.type === 'SALE_DEDUCTION') {
                          <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-500/10 text-red-500">Venta</span>
                        } @else {
                          <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-600">Ajuste Manual</span>
                        }
                      </div>

                      @if (m.reason) {
                        <p class="text-gray-500 italic text-[11px]">{{ m.reason }}</p>
                      }
                      <p class="text-[9px] text-gray-400">
                        {{ m.registeredBy }} • {{ m.date | date:'dd/MM/yyyy HH:mm' }}
                      </p>
                    </div>

                    <div class="text-right flex flex-col justify-center">
                      <span 
                        [class.text-emerald-600]="m.type === 'RESTOCK'"
                        [class.text-red-500]="m.type === 'SALE_DEDUCTION'"
                        [class.text-blue-500]="m.type === 'MANUAL_ADJUSTMENT'"
                        class="font-black text-sm"
                      >
                        @if (m.type === 'RESTOCK') {
                          +{{ m.quantity | number:'1.2-2' }}
                        } @else if (m.type === 'SALE_DEDUCTION') {
                          -{{ m.quantity | number:'1.2-2' }}
                        } @else {
                          {{ m.quantity >= 0 ? '+' : '' }}{{ m.quantity | number:'1.2-2' }}
                        }
                      </span>
                    </div>
                  </div>
                }
                @if (movements().length === 0) {
                  <p class="text-center text-xs text-gray-400 italic py-8">
                    No se registran movimientos para este insumo.
                  </p>
                }
              </div>
            </div>
          } @else {
            <div class="py-16 text-center text-gray-400 bg-gray-50/50 dark:bg-gray-900/30 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <svg class="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              Selecciona un insumo de la lista para inspeccionar sus movimientos e historial de stock.
            </div>
          }
        </div>
      </div>

    </div>

    <!-- ================= MODAL: INSUMO (CREAR / EDITAR) ================= -->
    <app-modal-shell
      [open]="isSupplyModalOpen()"
      [title]="supplyModalEditMode() ? 'Editar Insumo' : 'Nuevo Insumo'"
      description="Registra la información maestro del insumo para recetas e inventario."
      (close)="closeSupplyModal()"
    >
      <form (submit)="saveSupply()" class="space-y-4">
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Nombre</label>
          <input 
            type="text" 
            required
            [(ngModel)]="supplyForm.name"
            name="sName"
            placeholder="Ej. Limón, Filete de Pescado, Ají Amarillo"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Unidad de Medida (Referencia)</label>
          <input 
            type="text" 
            [(ngModel)]="supplyForm.unit"
            name="sUnit"
            placeholder="Ej. Kg, Litros, Unidades, Atado"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Umbral de Alerta Mínimo</label>
          <input 
            type="number" 
            step="0.0001" 
            min="0"
            required
            [(ngModel)]="supplyForm.minThreshold"
            name="sThreshold"
            placeholder="0"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Umbral de Alerta Crítico (Envío Instantáneo)</label>
          <input 
            type="number" 
            step="0.0001" 
            min="0"
            [(ngModel)]="supplyForm.criticalThreshold"
            name="sCriticalThreshold"
            placeholder="Ej. Mitad del umbral mínimo"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeSupplyModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
          >
            Guardar Insumo
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL: REABASTECIMIENTO (RESTOCK) ================= -->
    <app-modal-shell
      [open]="isRestockModalOpen()"
      title="Reabastecer Insumo"
      [description]="'Registra el ingreso de stock para ' + selectedSupply()?.name"
      (close)="closeRestockModal()"
    >
      <form (submit)="restockSupply()" class="space-y-4">
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Cantidad a Ingresar ({{ selectedSupply()?.unit || 'unidades' }})</label>
          <input 
            type="number" 
            step="0.0001" 
            min="0.0001"
            required
            [(ngModel)]="inventoryQtyInput"
            name="restockQty"
            placeholder="0.00"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeRestockModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Confirmar Ingreso
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL: AJUSTE MANUAL (ADJUST) ================= -->
    <app-modal-shell
      [open]="isAdjustModalOpen()"
      title="Ajuste Manual de Inventario"
      [description]="'Registra la cantidad física exacta actual de ' + selectedSupply()?.name"
      (close)="closeAdjustModal()"
    >
      <form (submit)="adjustSupply()" class="space-y-4">
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Cantidad Física Actual en Almacén ({{ selectedSupply()?.unit || 'unidades' }})</label>
          <input 
            type="number" 
            step="0.0001" 
            min="0"
            required
            [(ngModel)]="inventoryQtyInput"
            name="adjustQty"
            placeholder="0.00"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Motivo / Justificación (Obligatorio)</label>
          <textarea 
            required
            [(ngModel)]="inventoryReasonInput"
            name="adjustReason"
            rows="3"
            placeholder="Ej. Desecho por merma, Regularización mensual..."
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeAdjustModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            [disabled]="!inventoryReasonInput.trim()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Ajustar Stock
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL: ELIMINAR INSUMO (CASCADING CONFIRMATION) ================= -->
    <app-modal-shell
      [open]="isDeleteConfirmModalOpen()"
      title="¿Eliminar Insumo?"
      description="Esta acción eliminará el insumo de forma permanente del sistema."
      (close)="closeDeleteConfirmModal()"
    >
      <div class="space-y-4">
        <!-- warning explanation -->
        <div class="p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500 text-xs font-bold leading-relaxed">
          <h5 class="text-sm font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Advertencia Crítica
          </h5>
          Esta acción es destructiva e irreversible. Eliminar este insumo eliminará automáticamente todos sus registros históricos de movimientos de stock y lo removerá de las recetas de todos los productos donde esté configurado.
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeDeleteConfirmModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            (click)="deleteSupply()"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Confirmar Eliminación
          </button>
        </div>
      </div>
    </app-modal-shell>
  `
})
export class InventoryPageComponent implements OnInit {
  private api = inject(CatalogApi);
  private inventoryApi = inject(InventoryApi);
  private notify = inject(NotificationService);
  private permissionService = inject(PermissionService);

  public readonly PERMISSIONS = PERMISSIONS;

  // Granular Permissions
  public canRestock = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.INVENTORY.RESTOCK));
  public canAdjust = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.INVENTORY.ADJUST_MANUAL));
  public canManageSupplies = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.CATALOG.EDIT_SUPPLIES_RECIPES));

  // State Signals
  public supplies = signal<Supply[]>([]);
  public selectedSupply = signal<Supply | null>(null);
  public movements = signal<StockMovement[]>([]);
  public lowStockCount = signal<number>(0);
  public mismatchedCount = signal<number>(0);

  // Search filter
  public searchQuery = '';

  // Modals Visibility
  public isSupplyModalOpen = signal<boolean>(false);
  public supplyModalEditMode = signal<boolean>(false);
  public isRestockModalOpen = signal<boolean>(false);
  public isAdjustModalOpen = signal<boolean>(false);
  public isDeleteConfirmModalOpen = signal<boolean>(false);

  // Forms Inputs
  public supplyForm = { id: 0, name: '', unit: '', minThreshold: 0, criticalThreshold: undefined as number | undefined };
  public inventoryQtyInput: number = 0;
  public inventoryReasonInput: string = '';

  public filteredSupplies = computed(() => {
    const list = this.supplies();
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter(s => s.name.toLowerCase().includes(query));
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loadSupplies();
    this.loadAlertsCount();
  }

  loadSupplies(): void {
    this.api.getSupplies().subscribe({
      next: (sups) => {
        this.supplies.set(sups);
        // If there's a selected supply, update it with fresh stock info
        const selected = this.selectedSupply();
        if (selected) {
          const fresh = sups.find(s => s.id === selected.id);
          if (fresh) {
            this.selectedSupply.set(fresh);
          }
        }
      },
      error: () => this.notify.error('Error al cargar los insumos.')
    });
  }

  loadAlertsCount(): void {
    this.inventoryApi.getLowStockAlerts().subscribe({
      next: (res) => this.lowStockCount.set(res.length),
      error: () => console.error('No se pudo cargar alertas de bajo stock.')
    });

    this.inventoryApi.getMismatchedAlerts().subscribe({
      next: (res) => this.mismatchedCount.set(res.length),
      error: () => console.error('No se pudo cargar alertas de descuadres.')
    });
  }

  selectSupply(sup: Supply | null): void {
    this.selectedSupply.set(sup);
    this.movements.set([]);
    if (sup) {
      this.inventoryApi.getSupplyMovements(sup.id).subscribe({
        next: (movs) => this.movements.set(movs),
        error: () => this.notify.error('No se pudo cargar el historial de movimientos.')
      });
    }
  }

  // --- SUPPLY CRUD ---
  openSupplyCreateModal(): void {
    this.supplyModalEditMode.set(false);
    this.supplyForm = { id: 0, name: '', unit: '', minThreshold: 0, criticalThreshold: undefined };
    this.isSupplyModalOpen.set(true);
  }

  openSupplyEditModal(sup: Supply): void {
    this.supplyModalEditMode.set(true);
    this.supplyForm = { id: sup.id, name: sup.name, unit: sup.unit || '', minThreshold: sup.minThreshold, criticalThreshold: sup.criticalThreshold };
    this.isSupplyModalOpen.set(true);
  }

  closeSupplyModal(): void {
    this.isSupplyModalOpen.set(false);
  }

  saveSupply(): void {
    const { id, name, unit, minThreshold, criticalThreshold } = this.supplyForm;
    if (!name.trim() || minThreshold < 0) {
      this.notify.error('Completa el nombre y un umbral mínimo válido.');
      return;
    }

    const parsedCritical = (criticalThreshold !== undefined && criticalThreshold !== null) ? Number(criticalThreshold) : undefined;

    if (this.supplyModalEditMode()) {
      this.api.updateSupply(id, name.trim(), unit.trim(), minThreshold, parsedCritical).subscribe({
        next: () => {
          this.notify.success('Insumo actualizado con éxito.');
          this.closeSupplyModal();
          this.loadAll();
        },
        error: () => this.notify.error('No se pudo actualizar el insumo.')
      });
    } else {
      this.api.createSupply(name.trim(), unit.trim(), minThreshold, parsedCritical).subscribe({
        next: () => {
          this.notify.success('Nuevo insumo registrado.');
          this.closeSupplyModal();
          this.loadAll();
        },
        error: () => this.notify.error('No se pudo crear el insumo.')
      });
    }
  }

  promptDeleteSupply(sup: Supply): void {
    this.selectedSupply.set(sup);
    this.isDeleteConfirmModalOpen.set(true);
  }

  closeDeleteConfirmModal(): void {
    this.isDeleteConfirmModalOpen.set(false);
  }

  deleteSupply(): void {
    const sup = this.selectedSupply();
    if (!sup) return;

    this.api.deleteSupply(sup.id).subscribe({
      next: () => {
        this.notify.success('Insumo eliminado del inventario.');
        this.closeDeleteConfirmModal();
        this.selectedSupply.set(null);
        this.loadAll();
      },
      error: () => this.notify.error('Error al intentar eliminar el insumo.')
    });
  }

  // --- RESTOCK ---
  openRestockModal(sup: Supply): void {
    this.selectedSupply.set(sup);
    this.inventoryQtyInput = 0;
    this.isRestockModalOpen.set(true);
  }

  closeRestockModal(): void {
    this.isRestockModalOpen.set(false);
  }

  restockSupply(): void {
    const sup = this.selectedSupply();
    if (!sup) return;

    if (this.inventoryQtyInput <= 0) {
      this.notify.error('La cantidad a ingresar debe ser mayor a cero.');
      return;
    }

    this.api.restockSupply(sup.id, this.inventoryQtyInput).subscribe({
      next: () => {
        this.notify.success(`Reabastecimiento registrado para: ${sup.name}`);
        this.closeRestockModal();
        this.loadAll();
        // Refresh movements for this supply
        this.selectSupply(sup);
      },
      error: () => this.notify.error('Error al registrar el reabastecimiento.')
    });
  }

  // --- MANUAL ADJUST ---
  openAdjustModal(sup: Supply): void {
    this.selectedSupply.set(sup);
    this.inventoryQtyInput = sup.currentStock;
    this.inventoryReasonInput = '';
    this.isAdjustModalOpen.set(true);
  }

  closeAdjustModal(): void {
    this.isAdjustModalOpen.set(false);
  }

  adjustSupply(): void {
    const sup = this.selectedSupply();
    if (!sup) return;

    if (this.inventoryQtyInput < 0) {
      this.notify.error('La cantidad en almacén no puede ser negativa.');
      return;
    }
    if (!this.inventoryReasonInput.trim()) {
      this.notify.error('La justificación es obligatoria.');
      return;
    }

    this.api.adjustSupply(sup.id, this.inventoryQtyInput, this.inventoryReasonInput.trim()).subscribe({
      next: () => {
        this.notify.success(`Ajuste manual aplicado para: ${sup.name}`);
        this.closeAdjustModal();
        this.loadAll();
        // Refresh movements for this supply
        this.selectSupply(sup);
      },
      error: () => this.notify.error('Error al aplicar el ajuste manual de inventario.')
    });
  }
}
