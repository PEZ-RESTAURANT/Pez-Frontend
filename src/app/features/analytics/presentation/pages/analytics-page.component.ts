import { Component, OnInit, OnDestroy, inject, signal, computed, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { 
  AnalyticsApi, 
  NetProfitInfo, 
  BreakevenInfo, 
  ComparisonInfo, 
  KitchenZonePerformanceInfo, 
  WaiterRankingInfo, 
  ProductSalesInfo, 
  DailyProductionInfo, 
  ComboInfo, 
  AnalyticsConfigResource 
} from '../../infrastructure/api/analytics.api';
import { CatalogApi, Product } from '../../../catalog/infrastructure/api/catalog.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { PermissionService } from '../../../../core/auth/services/permission.service';
import { PERMISSIONS } from '../../../../core/config/permissions';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Métricas & Analíticas</span>
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Visualización de ingresos, ganancia neta, punto de equilibrio, rendimiento de zonas y mozos.
          </p>
        </div>

        <div class="flex gap-2">
          @if (canManageConfig()) {
            <button 
              (click)="openConfigModal()"
              class="px-4 py-2.5 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-750 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all uppercase tracking-wider"
            >
              Configurar Umbrales
            </button>
          }
        </div>
      </div>

      <!-- ================= DATE FILTER BAR ================= -->
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Preset selector -->
          <div class="flex flex-col">
            <span class="text-[9px] uppercase font-black tracking-wider text-gray-400 mb-1">Preset de Fecha</span>
            <select 
              [(ngModel)]="selectedPresetKey"
              (change)="onPresetChange()"
              class="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-bold text-xs text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="CUSTOM">Rango Libre (Personalizado)</option>
              @for (presetName of presetNames(); track presetName) {
                <option [value]="presetName">{{ presetName }}</option>
              }
            </select>
          </div>

          <!-- From Date -->
          <div class="flex flex-col">
            <span class="text-[9px] uppercase font-black tracking-wider text-gray-400 mb-1">Desde</span>
            <input 
              type="date" 
              [disabled]="selectedPresetKey !== 'CUSTOM'"
              [(ngModel)]="fromDate"
              class="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-bold text-xs text-gray-900 dark:text-white focus:outline-none disabled:opacity-50"
            />
          </div>

          <!-- To Date -->
          <div class="flex flex-col">
            <span class="text-[9px] uppercase font-black tracking-wider text-gray-400 mb-1">Hasta</span>
            <input 
              type="date" 
              [disabled]="selectedPresetKey !== 'CUSTOM'"
              [(ngModel)]="toDate"
              class="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-bold text-xs text-gray-900 dark:text-white focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <button 
          (click)="queryAll()"
          class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer self-end md:self-auto"
        >
          Consultar Rango
        </button>
      </div>

      <!-- ================= KEY METRIC CARDS ================= -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Metrics 1: Ingresos consolidados -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase font-black tracking-wider text-gray-400">Ingresos Consolidados</span>
            <span class="text-blue-600 dark:text-blue-400 text-lg">💰</span>
          </div>
          @if (netProfitInfo(); as profit) {
            <p class="text-3xl font-black text-gray-900 dark:text-white mt-3">
              S/ {{ profit.totalRevenue | number:'1.2-2' }}
            </p>
            <p class="text-[10px] text-gray-400 font-bold mt-1">Total facturado en el rango seleccionado.</p>
          } @else {
            <div class="h-10 w-24 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-md mt-3"></div>
          }
        </div>

        <!-- Metrics 2: Ganancia Neta (Honesty warning badge) -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase font-black tracking-wider text-gray-400">Ganancia Neta Consolidada</span>
            <span class="text-emerald-600 text-lg">📈</span>
          </div>
          @if (netProfitInfo(); as profit) {
            <p class="text-3xl font-black mt-3" [class.text-emerald-600]="profit.netProfit >= 0" [class.text-rose-600]="profit.netProfit < 0">
              S/ {{ profit.netProfit | number:'1.2-2' }}
            </p>
            
            <div class="flex items-center gap-1.5 mt-2">
              <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded" 
                    [class.bg-emerald-100]="profit.netProfit >= 0"
                    [class.text-emerald-800]="profit.netProfit >= 0"
                    [class.bg-rose-100]="profit.netProfit < 0"
                    [class.text-rose-800]="profit.netProfit < 0"
              >
                Gastos: S/ {{ profit.totalExpenses | number:'1.2-2' }}
              </span>

              @if (profit.isApproximation) {
                <span 
                  class="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded cursor-help"
                  title="Estimado — No incluye gastos de personal fijos no registrados manualmente en Caja."
                >
                  ⚠️ Estimado
                </span>
              }
            </div>
          } @else {
            <div class="h-10 w-24 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-md mt-3"></div>
          }
        </div>

        <!-- Metrics 3: Punto de equilibrio (Honesty tooltip note) -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase font-black tracking-wider text-gray-400">Punto de Equilibrio</span>
            <span class="text-purple-600 text-lg">⚖️</span>
          </div>
          @if (breakevenInfo(); as bkeven) {
            <p class="text-3xl font-black text-gray-900 dark:text-white mt-3">
              {{ bkeven.breakevenSalesCount }} transacciones
            </p>
            
            <div class="flex items-center gap-1.5 mt-2">
              <span class="text-[9px] font-black uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                Ticket Prom.: S/ {{ bkeven.averageTicket | number:'1.2-2' }}
              </span>

              @if (bkeven.isApproximation) {
                <span 
                  class="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded cursor-help"
                  title="Estimación aproximada — No incluye costo real o merma física de insumos."
                >
                  ⚠️ Estimado
                </span>
              }
            </div>
          } @else {
            <div class="h-10 w-24 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-md mt-3"></div>
          }
        </div>

      </div>

      <!-- ================= CHARTS GRID ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- CHART 1: COMPARATIVA DE PERÍODOS -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
            <div>
              <h3 class="text-sm font-black uppercase text-gray-400 tracking-wider">Comparativa de Períodos</h3>
              <p class="text-[10px] text-gray-400 font-bold mt-0.5">Compara el rango actual (A) con un rango secundario (B).</p>
            </div>
            
            <div class="flex items-center gap-1.5">
              <input 
                type="date" 
                [(ngModel)]="compareFrom"
                class="px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-bold text-[10px] text-gray-900 dark:text-white focus:outline-none"
              />
              <span class="text-gray-400 font-black text-[10px]">al</span>
              <input 
                type="date" 
                [(ngModel)]="compareTo"
                class="px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-bold text-[10px] text-gray-900 dark:text-white focus:outline-none"
              />
              <button 
                (click)="compareRanges()"
                class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-[9px] uppercase tracking-wider cursor-pointer"
              >
                Comparar
              </button>
            </div>
          </div>

          <div class="relative w-full h-64 flex items-center justify-center">
            <canvas id="comparisonChartCanvas"></canvas>
            @if (!comparisonInfo()) {
              <div class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center text-xs font-bold text-gray-400 italic">
                Selecciona fechas y presiona Comparar para cargar el gráfico.
              </div>
            }
          </div>

          <!-- Diff details comparison info box -->
          @if (comparisonInfo(); as comp) {
            <div class="grid grid-cols-3 gap-2 text-center text-[10px] font-bold bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <span class="text-gray-400 uppercase tracking-wider block">Ingreso A vs B</span>
                <span class="font-black text-xs" [class.text-emerald-600]="comp.revenueDiff >= 0" [class.text-rose-600]="comp.revenueDiff < 0">
                  {{ comp.revenueDiff >= 0 ? '+' : '' }}S/ {{ comp.revenueDiff | number:'1.2-2' }}
                </span>
              </div>
              <div>
                <span class="text-gray-400 uppercase tracking-wider block">Gastos A vs B</span>
                <span class="font-black text-xs text-rose-600">
                  {{ comp.expensesDiff >= 0 ? '+' : '' }}S/ {{ comp.expensesDiff | number:'1.2-2' }}
                </span>
              </div>
              <div>
                <span class="text-gray-400 uppercase tracking-wider block">Neto A vs B</span>
                <span class="font-black text-xs" [class.text-emerald-600]="comp.netProfitDiff >= 0" [class.text-rose-600]="comp.netProfitDiff < 0">
                  {{ comp.netProfitDiff >= 0 ? '+' : '' }}S/ {{ comp.netProfitDiff | number:'1.2-2' }}
                </span>
              </div>
            </div>
          }
        </div>

        <!-- CHART 2: RANKING DE MOZOS -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <div>
              <h3 class="text-sm font-black uppercase text-gray-400 tracking-wider">Ventas por Colaborador</h3>
              <p class="text-[10px] text-gray-400 font-bold mt-0.5">Ranking de ventas acumuladas por mozo.</p>
            </div>

            <!-- Export waiters -->
            <div class="flex gap-1">
              <button 
                (click)="exportReport('waiters-ranking', 'pdf')"
                class="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 text-gray-500 dark:text-gray-300 font-black text-[9px] uppercase tracking-wider rounded-lg border border-gray-200 dark:border-gray-800"
              >
                PDF
              </button>
              <button 
                (click)="exportReport('waiters-ranking', 'excel')"
                class="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 text-gray-500 dark:text-gray-300 font-black text-[9px] uppercase tracking-wider rounded-lg border border-gray-200 dark:border-gray-800"
              >
                Excel
              </button>
            </div>
          </div>

          <div class="relative w-full h-64 flex items-center justify-center">
            <canvas id="waitersChartCanvas"></canvas>
            @if (waiters().length === 0) {
              <div class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center text-xs font-bold text-gray-400 italic">
                No hay mozos con ventas en el rango seleccionado.
              </div>
            }
          </div>
        </div>

        <!-- CHART 3: RENDIMIENTO POR ZONA DE COCINA -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
          <div>
            <h3 class="text-sm font-black uppercase text-gray-400 tracking-wider">Rendimiento por Zona de Cocina</h3>
            <p class="text-[10px] text-gray-400 font-bold mt-0.5">Distribución de recaudación e ítems procesados por zona.</p>
          </div>

          <div class="relative w-full h-64 flex items-center justify-center">
            <canvas id="kitchenZonesChartCanvas"></canvas>
            @if (kitchenZones().length === 0) {
              <div class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center text-xs font-bold text-gray-400 italic">
                No hay actividad de cocina en el rango seleccionado.
              </div>
            }
          </div>
        </div>

        <!-- CHART 4: PRODUCCIÓN DIARIA POR PRODUCTO -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 class="text-sm font-black uppercase text-gray-400 tracking-wider">Producción Diaria de Plato</h3>
              <p class="text-[10px] text-gray-400 font-bold mt-0.5">Cantidad diaria de platos preparados en cocina.</p>
            </div>

            <!-- Product selector -->
            <select 
              [(ngModel)]="selectedProductId"
              (change)="onProductChange()"
              class="px-2.5 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-bold text-[10px] text-gray-900 dark:text-white focus:outline-none max-w-[200px]"
            >
              <option [ngValue]="null" disabled selected>Selecciona plato...</option>
              @for (p of products(); track p.id) {
                <option [ngValue]="p.id">{{ p.name }}</option>
              }
            </select>
          </div>

          <div class="relative w-full h-64 flex items-center justify-center">
            <canvas id="productionChartCanvas"></canvas>
            @if (production().length === 0) {
              <div class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center text-xs font-bold text-gray-400 italic">
                Selecciona un plato en el buscador de arriba para graficar su producción diaria.
              </div>
            }
          </div>
        </div>

      </div>

      <!-- ================= TABLES SECTION ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- TABLE 1: PRODUCTOS TOP/BOTTOM (Honest alert highlight) -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <div>
              <h3 class="text-sm font-black uppercase text-gray-400 tracking-wider">Rendimiento del Catálogo</h3>
              <p class="text-[10px] text-gray-400 font-bold mt-0.5">Productos con mayor y menor número de ventas.</p>
            </div>

            <!-- Export buttons -->
            <div class="flex gap-1">
              <button 
                (click)="exportReport('top-products', 'pdf')"
                class="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 text-gray-500 dark:text-gray-300 font-black text-[9px] uppercase tracking-wider rounded-lg border border-gray-200 dark:border-gray-800"
              >
                Top PDF
              </button>
              <button 
                (click)="exportReport('bottom-products', 'pdf')"
                class="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 text-gray-500 dark:text-gray-300 font-black text-[9px] uppercase tracking-wider rounded-lg border border-gray-200 dark:border-gray-800"
              >
                Bottom PDF
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-bold border-collapse">
              <thead>
                <tr class="border-b border-gray-100 dark:border-gray-800 text-[9px] uppercase text-gray-400 tracking-wider">
                  <th class="py-2 px-3">Producto</th>
                  <th class="py-2 px-3">Vendidos</th>
                  <th class="py-2 px-3 text-right">Recaudado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-150/50 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                <!-- TOP PRODUCTS -->
                <tr class="bg-gray-50/30"><td colspan="3" class="py-1 px-3 text-[9px] uppercase font-black text-blue-600 bg-blue-50/10">Top de Ventas</td></tr>
                @for (tp of topProducts(); track tp.productName) {
                  <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-900/10" [class.bg-rose-50/40]="tp.lowSalesAlert" [class.dark:bg-rose-950/10]="tp.lowSalesAlert">
                    <td class="py-2.5 px-3">
                      <div class="flex items-center gap-2">
                        <span>{{ tp.productName }}</span>
                        @if (tp.lowSalesAlert) {
                          <span class="px-2 py-0.5 bg-rose-600 text-white font-black text-[8px] uppercase rounded">
                            Bajo Rendimiento
                          </span>
                        }
                      </div>
                    </td>
                    <td class="py-2.5 px-3 font-mono font-bold">{{ tp.quantitySold }} uds</td>
                    <td class="py-2.5 px-3 text-right font-black text-gray-900 dark:text-white">
                      S/ {{ tp.totalRevenue | number:'1.2-2' }}
                    </td>
                  </tr>
                }

                <!-- BOTTOM PRODUCTS -->
                <tr class="bg-gray-50/30"><td colspan="3" class="py-1 px-3 text-[9px] uppercase font-black text-rose-600 bg-rose-50/10">Bajo Rendimiento</td></tr>
                @for (bp of bottomProducts(); track bp.productName) {
                  <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-900/10" [class.bg-rose-50/40]="bp.lowSalesAlert" [class.dark:bg-rose-950/10]="bp.lowSalesAlert">
                    <td class="py-2.5 px-3">
                      <div class="flex items-center gap-2">
                        <span>{{ bp.productName }}</span>
                        @if (bp.lowSalesAlert) {
                          <span class="px-2 py-0.5 bg-rose-600 text-white font-black text-[8px] uppercase rounded">
                            Bajo Rendimiento
                          </span>
                        }
                      </div>
                    </td>
                    <td class="py-2.5 px-3 font-mono font-bold">{{ bp.quantitySold }} uds</td>
                    <td class="py-2.5 px-3 text-right font-black text-gray-900 dark:text-white">
                      S/ {{ bp.totalRevenue | number:'1.2-2' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- TABLE 2: COMBOS MÁS PEDIDOS -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <div>
              <h3 class="text-sm font-black uppercase text-gray-400 tracking-wider">Combos Más Pedidos Juntos</h3>
              <p class="text-[10px] text-gray-400 font-bold mt-0.5">Parejas de productos comprados en un mismo pedido.</p>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-bold border-collapse">
              <thead>
                <tr class="border-b border-gray-100 dark:border-gray-800 text-[9px] uppercase text-gray-400 tracking-wider">
                  <th class="py-2 px-3">Plato A</th>
                  <th class="py-2 px-3">Plato B</th>
                  <th class="py-2 px-3 text-right">Pedidos Juntos</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                @for (combo of combos(); track combo.productA + combo.productB) {
                  <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                    <td class="py-3 px-3 text-gray-900 dark:text-white">{{ combo.productA }}</td>
                    <td class="py-3 px-3 text-gray-900 dark:text-white">{{ combo.productB }}</td>
                    <td class="py-3 px-3 text-right font-black text-blue-600 dark:text-blue-400">
                      {{ combo.count }} pedidos
                    </td>
                  </tr>
                }
                @if (combos().length === 0) {
                  <tr>
                    <td colspan="3" class="py-8 text-center text-gray-400 italic">
                      No hay combos coincidentes para este período.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>

    <!-- ================= MODAL: CONFIGURACIÓN DE UMBRALES ================= -->
    <app-modal-shell
      [open]="isConfigModalOpen()"
      title="Configurar Umbrales de Analítica"
      description="Establece los límites para clasificar productos en bajo rendimiento y los presets de fechas."
      (close)="closeConfigModal()"
    >
      <form (submit)="saveConfig()" class="space-y-4">
        
        <!-- Sales units threshold -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Umbral de Ventas Bajas (Unidades vendidas)</label>
          <input 
            type="number" 
            min="1"
            required
            [(ngModel)]="configForm.lowSalesThresholdUnits"
            name="cfgThreshold"
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none"
          />
        </div>

        <!-- Evaluation days -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Período de Evaluación de Alerta (Días)</label>
          <input 
            type="number" 
            min="1"
            required
            [(ngModel)]="configForm.lowSalesEvaluationPeriodDays"
            name="cfgPeriod"
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none"
          />
        </div>

        <!-- Date presets JSON -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Presets de Fechas (JSON de presets)</label>
          <textarea 
            required
            [(ngModel)]="configForm.datePresets"
            name="cfgPresets"
            rows="5"
            placeholder='{"Preset Name": {"from": "YYYY-MM-DD", "to": "YYYY-MM-DD"}}'
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold font-mono text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeConfigModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Guardar Umbrales
          </button>
        </div>
      </form>
    </app-modal-shell>
  `
})
export class AnalyticsPageComponent implements OnInit, OnDestroy {
  private api = inject(AnalyticsApi);
  private catalogApi = inject(CatalogApi);
  private notify = inject(NotificationService);
  private permissionService = inject(PermissionService);

  public readonly PERMISSIONS = PERMISSIONS;

  // Permissions
  public canManageConfig = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.ANALYTICS.MANAGE_CONFIG));

  // Date Filters State (defaulting to last 30 days)
  public fromDate = '';
  public toDate = '';
  
  public selectedPresetKey = 'CUSTOM';
  public presets = signal<any>({});
  public presetNames = computed(() => Object.keys(this.presets()));

  // Comparison period state
  public compareFrom = '';
  public compareTo = '';

  // Data signals
  public netProfitInfo = signal<NetProfitInfo | null>(null);
  public breakevenInfo = signal<BreakevenInfo | null>(null);
  public comparisonInfo = signal<ComparisonInfo | null>(null);
  public waiters = signal<WaiterRankingInfo[]>([]);
  public kitchenZones = signal<KitchenZonePerformanceInfo[]>([]);
  public topProducts = signal<ProductSalesInfo[]>([]);
  public bottomProducts = signal<ProductSalesInfo[]>([]);
  public combos = signal<ComboInfo[]>([]);

  // Product Selection for daily production
  public products = signal<Product[]>([]);
  public selectedProductId: number | null = null;
  public production = signal<DailyProductionInfo[]>([]);

  // Chart instances
  private comparisonChart: Chart | null = null;
  private waitersChart: Chart | null = null;
  private kitchenZonesChart: Chart | null = null;
  private productionChart: Chart | null = null;

  // Config modal State
  public isConfigModalOpen = signal<boolean>(false);
  public configForm = { lowSalesThresholdUnits: 5, lowSalesEvaluationPeriodDays: 30, datePresets: '{}' };

  ngOnInit(): void {
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const toLocalDateStr = (d: Date) => (new Date(d.getTime() - (d.getTimezoneOffset() * 60000))).toISOString().split('T')[0];

    this.fromDate = toLocalDateStr(thirtyDaysAgo);
    this.toDate = toLocalDateStr(today);

    // Set default comparison date range to previous 30 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(today.getDate() - 60);
    this.compareFrom = toLocalDateStr(sixtyDaysAgo);
    this.compareTo = toLocalDateStr(thirtyDaysAgo);

    this.loadPresets();
    this.loadProductsList();
    this.queryAll();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  destroyCharts(): void {
    if (this.comparisonChart) this.comparisonChart.destroy();
    if (this.waitersChart) this.waitersChart.destroy();
    if (this.kitchenZonesChart) this.kitchenZonesChart.destroy();
    if (this.productionChart) this.productionChart.destroy();
  }

  loadPresets(): void {
    this.api.getPresets().subscribe({
      next: (rawObj) => {
        // If it's a string from DB, parse it
        if (typeof rawObj === 'string') {
          try {
            this.presets.set(JSON.parse(rawObj));
          } catch {
            this.presets.set({});
          }
        } else {
          this.presets.set(rawObj || {});
        }
      },
      error: () => console.warn('No se pudieron cargar presets de fechas.')
    });
  }

  loadProductsList(): void {
    this.catalogApi.getProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        if (data.length > 0) {
          this.selectedProductId = data[0].id;
          this.loadProductProduction();
        }
      }
    });
  }

  onPresetChange(): void {
    if (this.selectedPresetKey !== 'CUSTOM') {
      const selected = this.presets()[this.selectedPresetKey];
      if (selected && selected.from && selected.to) {
        this.fromDate = selected.from;
        this.toDate = selected.to;
      }
    }
  }

  queryAll(): void {
    if (!this.fromDate || !this.toDate) {
      this.notify.error('Selecciona una fecha de inicio y fin.');
      return;
    }

    // 1. Fetch Net Profit Consolidation
    this.api.getNetProfit(this.fromDate, this.toDate).subscribe({
      next: (data) => this.netProfitInfo.set(data),
      error: () => this.notify.error('Error al cargar ingresos y ganancias netas.')
    });

    // 2. Fetch Breakeven Details
    this.api.getBreakeven(this.fromDate, this.toDate).subscribe({
      next: (data) => this.breakevenInfo.set(data),
      error: () => this.notify.error('Error al cargar punto de equilibrio.')
    });

    // 3. Fetch Waiters Ranking Chart & Grid
    this.api.getWaitersRanking(this.fromDate, this.toDate).subscribe({
      next: (data) => {
        this.waiters.set(data);
        this.initWaitersChart(data);
      },
      error: () => this.notify.error('Error al cargar el ranking de mozos.')
    });

    // 4. Fetch Kitchen Performance Chart
    this.api.getKitchenZonePerformance(this.fromDate, this.toDate).subscribe({
      next: (data) => {
        this.kitchenZones.set(data);
        this.initKitchenZonesChart(data);
      },
      error: () => this.notify.error('Error al cargar rendimiento de cocina.')
    });

    // 5. Fetch Top / Bottom Products
    this.api.getTopProducts(this.fromDate, this.toDate, 5).subscribe({
      next: (data) => this.topProducts.set(data),
      error: () => this.notify.error('Error al cargar top productos.')
    });

    this.api.getBottomProducts(this.fromDate, this.toDate, 5).subscribe({
      next: (data) => this.bottomProducts.set(data),
      error: () => this.notify.error('Error al cargar bottom productos.')
    });

    // 6. Fetch Top combos
    this.api.getTopCombos(this.fromDate, this.toDate, 5).subscribe({
      next: (data) => this.combos.set(data),
      error: () => this.notify.error('Error al cargar combos.')
    });

    // 7. Load daily production if a product is selected
    this.loadProductProduction();
  }

  onProductChange(): void {
    this.loadProductProduction();
  }

  loadProductProduction(): void {
    if (!this.selectedProductId) return;
    this.api.getDailyProduction(this.selectedProductId, this.fromDate, this.toDate).subscribe({
      next: (data) => {
        this.production.set(data);
        this.initProductionChart(data);
      },
      error: () => this.notify.error('No se pudo cargar la producción diaria del plato.')
    });
  }

  // --- COMPARE METRICS ---
  compareRanges(): void {
    if (!this.compareFrom || !this.compareTo) {
      this.notify.error('Selecciona el rango secundario (B) para realizar la comparación.');
      return;
    }

    this.api.getComparison(this.fromDate, this.toDate, this.compareFrom, this.compareTo).subscribe({
      next: (data) => {
        this.comparisonInfo.set(data);
        this.initComparisonChart(data);
        this.notify.success('Comparación de períodos actualizada.');
      },
      error: () => this.notify.error('Error al contrastar períodos de analíticas.')
    });
  }

  // --- CHART GENERATION HANDLERS ---
  initComparisonChart(data: ComparisonInfo): void {
    if (this.comparisonChart) {
      this.comparisonChart.destroy();
    }

    const canvas = document.getElementById('comparisonChartCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    this.comparisonChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Recaudado', 'Gastos', 'Neto'],
        datasets: [
          {
            label: 'Período A',
            data: [data.revenueA, data.expensesA, data.netProfitA],
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Período B',
            data: [data.revenueB, data.expensesB, data.netProfitB],
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { boxWidth: 12, font: { weight: 'bold', size: 10 } } }
        },
        scales: {
          y: { ticks: { font: { size: 9, weight: 'bold' } } },
          x: { ticks: { font: { size: 9, weight: 'bold' } } }
        }
      }
    });
  }

  initWaitersChart(data: WaiterRankingInfo[]): void {
    if (this.waitersChart) {
      this.waitersChart.destroy();
    }

    const canvas = document.getElementById('waitersChartCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    this.waitersChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(item => `${item.firstName} ${item.lastName.charAt(0)}.`),
        datasets: [
          {
            label: 'Ventas (S/)',
            data: data.map(item => item.totalSales),
            backgroundColor: 'rgba(99, 102, 241, 0.85)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { ticks: { font: { size: 9, weight: 'bold' } } },
          x: { ticks: { font: { size: 9, weight: 'bold' } } }
        }
      }
    });
  }

  initKitchenZonesChart(data: KitchenZonePerformanceInfo[]): void {
    if (this.kitchenZonesChart) {
      this.kitchenZonesChart.destroy();
    }

    const canvas = document.getElementById('kitchenZonesChartCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    this.kitchenZonesChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map(item => `${item.zoneName} (${item.itemsCount} platos)`),
        datasets: [
          {
            data: data.map(item => item.revenue),
            backgroundColor: [
              'rgba(244, 63, 94, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(234, 179, 8, 0.8)',
              'rgba(168, 85, 247, 0.8)'
            ],
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { weight: 'bold', size: 9 } } }
        }
      }
    });
  }

  initProductionChart(data: DailyProductionInfo[]): void {
    if (this.productionChart) {
      this.productionChart.destroy();
    }

    const canvas = document.getElementById('productionChartCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    this.productionChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(item => item.date),
        datasets: [
          {
            label: 'Cantidad Preparada',
            data: data.map(item => item.quantity),
            borderColor: 'rgb(234, 179, 8)',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { ticks: { stepSize: 1, font: { size: 9, weight: 'bold' } } },
          x: { ticks: { font: { size: 9, weight: 'bold' } } }
        }
      }
    });
  }

  // --- REPORT EXPORT ---
  exportReport(reportType: string, format: string): void {
    this.api.exportReport(reportType, format, this.fromDate, this.toDate).subscribe({
      next: (blob) => {
        const fileURL = window.URL.createObjectURL(blob);
        const fileLink = document.createElement('a');
        fileLink.href = fileURL;
        
        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        fileLink.download = `${reportType}_report.${ext}`;
        fileLink.click();
        
        this.notify.success(`Descarga del archivo ${reportType}.${ext} completada.`);
      },
      error: () => this.notify.error('Ocurrió un error al exportar el reporte.')
    });
  }

  // --- CONFIG DETAILS ---
  openConfigModal(): void {
    this.api.getConfig().subscribe({
      next: (cfg) => {
        this.configForm = {
          lowSalesThresholdUnits: cfg.lowSalesThresholdUnits,
          lowSalesEvaluationPeriodDays: cfg.lowSalesEvaluationPeriodDays,
          datePresets: cfg.datePresets
        };
        this.isConfigModalOpen.set(true);
      },
      error: () => this.notify.error('No se pudo cargar la configuración de analíticas.')
    });
  }

  closeConfigModal(): void {
    this.isConfigModalOpen.set(false);
  }

  saveConfig(): void {
    const { lowSalesThresholdUnits, lowSalesEvaluationPeriodDays, datePresets } = this.configForm;
    if (lowSalesThresholdUnits <= 0 || lowSalesEvaluationPeriodDays <= 0) {
      this.notify.error('Ingresa umbrales numéricos válidos.');
      return;
    }

    try {
      JSON.parse(datePresets);
    } catch {
      this.notify.error('El campo de presets de fechas debe ser un JSON válido de la forma: {"preset": {"from": "...", "to": "..."}}');
      return;
    }

    this.api.updateConfig(this.configForm).subscribe({
      next: () => {
        this.notify.success('Configuración de analítica guardada.');
        this.closeConfigModal();
        this.loadPresets();
        this.queryAll();
      },
      error: () => this.notify.error('Error al actualizar los umbrales de rendimiento.')
    });
  }
}
