import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogApi, Category, Product, Supply, RecipeItem } from '../../infrastructure/api/catalog.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm animate-in fade-in duration-300">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Administración de Catálogo</span>
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Mantenimiento de carta, insumos del almacén y recetas de preparación.
          </p>
        </div>

        <!-- TABS BAR -->
        <div class="inline-flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-250/20 shadow-xs">
          <button 
            (click)="setTab('products')"
            [class.bg-white]="activeTab() === 'products'"
            [class.dark:bg-gray-800]="activeTab() === 'products'"
            [class.text-gray-900]="activeTab() === 'products'"
            [class.dark:text-white]="activeTab() === 'products'"
            [class.shadow-xs]="activeTab() === 'products'"
            [class.text-gray-500]="activeTab() !== 'products'"
            class="px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Carta
          </button>
          <button 
            (click)="setTab('supplies')"
            [class.bg-white]="activeTab() === 'supplies'"
            [class.dark:bg-gray-800]="activeTab() === 'supplies'"
            [class.text-gray-900]="activeTab() === 'supplies'"
            [class.dark:text-white]="activeTab() === 'supplies'"
            [class.shadow-xs]="activeTab() === 'supplies'"
            [class.text-gray-500]="activeTab() !== 'supplies'"
            class="px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Insumos
          </button>
          <button 
            (click)="setTab('recipes')"
            [class.bg-white]="activeTab() === 'recipes'"
            [class.dark:bg-gray-800]="activeTab() === 'recipes'"
            [class.text-gray-900]="activeTab() === 'recipes'"
            [class.dark:text-white]="activeTab() === 'recipes'"
            [class.shadow-xs]="activeTab() === 'recipes'"
            [class.text-gray-500]="activeTab() !== 'recipes'"
            class="px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Recetas
          </button>
        </div>
      </div>

      <!-- ================= PESTAÑA: CARTA (PRODUCTOS & CATEGORÍAS) ================= -->
      @if (activeTab() === 'products') {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- SECCIÓN CATEGORÍAS (4 COLUMNS) -->
          <div class="lg:col-span-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-black text-gray-900 dark:text-white">Categorías</h3>
              <button 
                (click)="openCategoryCreateModal()"
                class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
              >
                + Nueva
              </button>
            </div>

            <div class="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
              <!-- ALL CATEGORIES FILTER OPTION -->
              <div 
                (click)="selectCategoryFilter(null)"
                [class.bg-blue-50]="selectedCategoryFilterId() === null"
                [class.dark:bg-blue-950/20]="selectedCategoryFilterId() === null"
                [class.text-blue-600]="selectedCategoryFilterId() === null"
                [class.dark:text-blue-400]="selectedCategoryFilterId() === null"
                [class.border-blue-200]="selectedCategoryFilterId() === null"
                class="px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer font-bold text-xs transition-all flex justify-between items-center"
              >
                <span>Todas las Categorías</span>
                <span class="text-[10px] text-gray-400 font-extrabold">{{ products().length }}</span>
              </div>

              @for (cat of categories(); track cat.id) {
                <div 
                  (click)="selectCategoryFilter(cat.id)"
                  [class.bg-blue-50]="selectedCategoryFilterId() === cat.id"
                  [class.dark:bg-blue-950/20]="selectedCategoryFilterId() === cat.id"
                  [class.text-blue-600]="selectedCategoryFilterId() === cat.id"
                  [class.dark:text-blue-400]="selectedCategoryFilterId() === cat.id"
                  [class.border-blue-200]="selectedCategoryFilterId() === cat.id"
                  class="px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer font-bold text-xs transition-all flex justify-between items-center group"
                >
                  <span>{{ cat.name }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-gray-400 font-extrabold">{{ getProductCountInCategory(cat.id) }}</span>
                    
                    <button 
                      (click)="openCategoryEditModal(cat, $event)"
                      class="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-opacity"
                      title="Renombrar"
                    >
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      (click)="deleteCategory(cat.id, $event)"
                      class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 rounded transition-opacity"
                      title="Eliminar"
                    >
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- SECCIÓN PRODUCTOS (8 COLUMNS) -->
          <div class="lg:col-span-8 space-y-4">
            
            <!-- BUSCADOR & NUEVO PRODUCTO -->
            <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div class="flex-1 min-w-[200px]">
                <input 
                  type="text"
                  placeholder="Buscar productos por nombre..."
                  [(ngModel)]="productSearchQuery"
                  class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                (click)="openProductCreateModal()"
                class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider"
              >
                + Nuevo Producto
              </button>
            </div>

            <!-- PRODUCT LAYOUT GRID & DETAIL SIDEBAR -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              <!-- GRID PRODUCTOS (7 COLUMNS) -->
              <div class="md:col-span-7 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                @for (prod of filteredProducts(); track prod.id) {
                  <div 
                    (click)="selectProduct(prod)"
                    [class.border-blue-500]="selectedProduct()?.id === prod.id"
                    [class.ring-2]="selectedProduct()?.id === prod.id"
                    [class.ring-blue-500/20]="selectedProduct()?.id === prod.id"
                    class="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer flex justify-between items-center"
                  >
                    <div class="space-y-1">
                      <h4 class="text-sm font-black text-gray-800 dark:text-gray-200">{{ prod.name }}</h4>
                      <div class="flex items-center gap-2">
                        <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900 text-gray-500">
                          {{ prod.category?.name }}
                        </span>
                        @if (!prod.active) {
                          <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-150/10 text-red-500">
                            Inactivo
                          </span>
                        }
                      </div>
                    </div>
                    <span class="text-sm font-black text-gray-900 dark:text-white">
                      S/{{ prod.price.toFixed(2) }}
                    </span>
                  </div>
                }
                @if (filteredProducts().length === 0) {
                  <div class="py-12 text-center text-gray-400 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl">
                    No se encontraron productos.
                  </div>
                }
              </div>

              <!-- DETALLE/EDICIÓN PRODUCTO (5 COLUMNS) -->
              <div class="md:col-span-5">
                @if (selectedProduct(); as prod) {
                  <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs space-y-4">
                    <h4 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Detalles de Producto</h4>
                    
                    <form (submit)="saveProduct()" class="space-y-3.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Nombre</label>
                        <input 
                          type="text"
                          required
                          [(ngModel)]="productEditForm.name"
                          name="prodName"
                          class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Precio (S/)</label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          [(ngModel)]="productEditForm.price"
                          name="prodPrice"
                          class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Categoría</label>
                        <select 
                          [(ngModel)]="productEditForm.categoryId"
                          name="prodCategory"
                          required
                          class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          @for (cat of categories(); track cat.id) {
                            <option [value]="cat.id">{{ cat.name }}</option>
                          }
                        </select>
                      </div>

                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Tiempo de Prep. (Minutos - Opcional)</label>
                        <input 
                          type="number"
                          min="0"
                          [(ngModel)]="productEditForm.estimatedPrepTimeMinutes"
                          name="prodPrep"
                          placeholder="Sin configurar"
                          class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div class="flex items-center justify-between py-1">
                        <span class="text-[10px] font-black uppercase text-gray-400">Producto Activo</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            [(ngModel)]="productEditForm.active" 
                            name="prodActive"
                            class="sr-only peer"
                          />
                          <div class="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div class="pt-3 border-t border-gray-150 dark:border-gray-800 flex gap-2">
                        <button 
                          type="submit"
                          class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer text-center"
                        >
                          Guardar
                        </button>
                        <button 
                          type="button"
                          (click)="goToRecipeFromProduct(prod)"
                          class="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                          title="Ver Receta"
                        >
                          Receta
                        </button>
                        <button 
                          type="button"
                          (click)="deleteProduct(prod.id)"
                          class="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 font-bold text-xs rounded-xl cursor-pointer"
                          title="Eliminar Producto"
                        >
                          Eliminar
                        </button>
                      </div>
                    </form>
                  </div>
                } @else {
                  <div class="bg-gray-50/50 dark:bg-gray-900/30 p-8 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                    <svg class="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Selecciona un producto de la lista para editar sus detalles.
                  </div>
                }
              </div>

            </div>

          </div>

        </div>
      }

      <!-- ================= PESTAÑA: INSUMOS (SUPPLY) ================= -->
      @if (activeTab() === 'supplies') {
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black text-gray-900 dark:text-white">Almacén de Insumos</h3>
            <button 
              (click)="openSupplyCreateModal()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              + Nuevo Insumo
            </button>
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
                @for (sup of supplies(); track sup.id) {
                  <tr 
                    [class.bg-amber-500/5]="isStockLow(sup)"
                    [class.bg-red-500/5]="sup.currentStock <= 0"
                    class="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors"
                  >
                    <td class="py-3.5 px-4 font-black text-gray-900 dark:text-white">{{ sup.name }}</td>
                    <td class="py-3.5 px-4 text-gray-500">{{ sup.unit || '-' }}</td>
                    <td class="py-3.5 px-4">{{ sup.minThreshold }}</td>
                    <td class="py-3.5 px-4">
                      <span 
                        [class.text-amber-500]="isStockLow(sup) && sup.currentStock > 0"
                        [class.text-red-500]="sup.currentStock <= 0"
                        class="font-black text-sm"
                      >
                        {{ sup.currentStock.toFixed(2) }}
                      </span>
                      @if (sup.currentStock <= 0) {
                        <span class="ml-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">Agotado</span>
                      } @else if (isStockLow(sup)) {
                        <span class="ml-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">Bajo Stock</span>
                      }
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex justify-end gap-1.5">
                        <button 
                          (click)="openRestockModal(sup)"
                          class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] cursor-pointer"
                        >
                          Reabastecer
                        </button>
                        <button 
                          (click)="openAdjustModal(sup)"
                          class="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] cursor-pointer"
                        >
                          Ajustar
                        </button>
                        <button 
                          (click)="openSupplyEditModal(sup)"
                          class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-900"
                        >
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          (click)="deleteSupply(sup.id)"
                          class="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-400"
                        >
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (supplies().length === 0) {
                  <tr>
                    <td colspan="5" class="py-12 text-center text-gray-400">
                      No hay insumos registrados. Crea uno nuevo para empezar.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================= PESTAÑA: RECETAS ================= -->
      @if (activeTab() === 'recipes') {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- SECCIÓN SELECTOR DE PLATO (4 COLUMNS) -->
          <div class="lg:col-span-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs space-y-4">
            <h3 class="text-base font-black text-gray-900 dark:text-white">Selección de Plato</h3>
            
            <div class="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              @for (prod of products(); track prod.id) {
                <div 
                  (click)="selectRecipeProduct(prod)"
                  [class.bg-blue-50]="recipeSelectedProduct()?.id === prod.id"
                  [class.dark:bg-blue-950/20]="recipeSelectedProduct()?.id === prod.id"
                  [class.text-blue-600]="recipeSelectedProduct()?.id === prod.id"
                  [class.dark:text-blue-400]="recipeSelectedProduct()?.id === prod.id"
                  [class.border-blue-200]="recipeSelectedProduct()?.id === prod.id"
                  class="px-3.5 py-2.5 rounded-xl border border-transparent hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer font-bold text-xs transition-all flex justify-between items-center"
                >
                  <span>{{ prod.name }}</span>
                  <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900 text-gray-500">
                    {{ prod.category?.name }}
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- DETALLE RECETA (8 COLUMNS) -->
          <div class="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xs space-y-4">
            @if (recipeSelectedProduct(); as prod) {
              
              <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 class="text-lg font-black text-gray-900 dark:text-white">Receta: {{ prod.name }}</h3>
                  <p class="text-xs text-gray-400 mt-0.5">Ingredientes descontados automáticamente al despachar este plato.</p>
                </div>
                <button 
                  (click)="openAddRecipeItemModal()"
                  class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  + Agregar Insumo
                </button>
              </div>

              <!-- TABLA DE LA RECETA -->
              <div class="space-y-3">
                @for (item of recipeItems(); track item.supplyId) {
                  <div class="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800/80 text-xs">
                    <div class="space-y-0.5">
                      <span class="font-black text-gray-900 dark:text-white">{{ item.supplyName }}</span>
                      <span class="text-gray-400 dark:text-gray-500 block">Medida de referencia: {{ item.supplyUnit || 'unidades' }}</span>
                    </div>

                    <div class="flex items-center gap-3">
                      <!-- EDIT QUANTITY INLINE -->
                      <div class="flex items-center gap-1.5">
                        <input 
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          [(ngModel)]="item.quantityUsed"
                          (change)="updateRecipeItemQty(item)"
                          class="w-24 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-750 rounded-lg text-right font-black"
                        />
                        <span class="text-gray-500 font-extrabold w-8 text-left pl-1">{{ item.supplyUnit || 'u' }}</span>
                      </div>

                      <button 
                        (click)="removeRecipeItem(item)"
                        class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                        title="Quitar de la receta"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                }
                @if (recipeItems().length === 0) {
                  <div class="py-12 text-center text-gray-400 text-xs border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    Esta receta está vacía. Agrega insumos para que se descuente stock en inventario.
                  </div>
                }
              </div>

            } @else {
              <div class="py-16 text-center text-gray-400 bg-gray-50/50 dark:bg-gray-900/30 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                <svg class="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
                Selecciona un plato de la lista para ver o diseñar su receta.
              </div>
            }
          </div>

        </div>
      }

    </div>

    <!-- ================= MODAL: CATEGORÍA (NUEVA / EDITAR) ================= -->
    <app-modal-shell
      [open]="isCategoryModalOpen()"
      [title]="categoryModalEditMode() ? 'Editar Categoría' : 'Nueva Categoría'"
      description="Ingresa el nombre descriptivo para agrupar los platos de la carta."
      (close)="closeCategoryModal()"
    >
      <form (submit)="saveCategory()" class="space-y-4">
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Nombre</label>
          <input 
            type="text" 
            required
            [(ngModel)]="categoryForm.name"
            name="catName"
            placeholder="Ej. Ceviches, Bebidas"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeCategoryModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
          >
            Guardar
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL: PRODUCTO (CREAR) ================= -->
    <app-modal-shell
      [open]="isProductCreateModalOpen()"
      title="Nuevo Producto"
      description="Completa los datos mínimos para agregar el nuevo plato a la carta."
      (close)="closeProductCreateModal()"
    >
      <form (submit)="createProduct()" class="space-y-4">
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Nombre del Plato</label>
          <input 
            type="text" 
            required
            [(ngModel)]="productCreateForm.name"
            name="pNewName"
            placeholder="Ej. Ceviche Mixto Especial"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Precio (S/)</label>
          <input 
            type="number" 
            step="0.01" 
            min="0.01"
            required
            [(ngModel)]="productCreateForm.price"
            name="pNewPrice"
            placeholder="0.00"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Categoría</label>
          <select 
            [(ngModel)]="productCreateForm.categoryId"
            name="pNewCategory"
            required
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option [value]="null" disabled selected>Selecciona categoría...</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeProductCreateModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            [disabled]="!productCreateForm.categoryId"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
          >
            Crear Producto
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL: INSUMO (CREAR / EDITAR) ================= -->
    <app-modal-shell
      [open]="isSupplyModalOpen()"
      [title]="supplyModalEditMode() ? 'Editar Insumo' : 'Nuevo Insumo'"
      description="Registra la información del insumo para auditoría de recetas."
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
            placeholder="Ej. Limón Norteño, Filete de Corvina"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Unidad (Texto Libre)</label>
          <input 
            type="text" 
            [(ngModel)]="supplyForm.unit"
            name="sUnit"
            placeholder="Ej. kg, litros, atado, unidades"
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
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Cantidad Real en Almacén ({{ selectedSupply()?.unit || 'unidades' }})</label>
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
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

    <!-- ================= MODAL: AGREGAR INGREDIENTE A RECETA ================= -->
    <app-modal-shell
      [open]="isAddRecipeItemModalOpen()"
      title="Agregar Insumo a la Receta"
      [description]="'Asigna un nuevo insumo a la preparación de ' + recipeSelectedProduct()?.name"
      (close)="closeAddRecipeItemModal()"
    >
      <form (submit)="addRecipeItem()" class="space-y-4">
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Seleccionar Insumo</label>
          <select 
            [(ngModel)]="recipeForm.supplyId"
            name="rNewSupply"
            required
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option [value]="null" disabled selected>Selecciona insumo...</option>
            @for (sup of supplies(); track sup.id) {
              <!-- Omitir insumos que ya están en la receta -->
              @if (!isSupplyAlreadyInRecipe(sup.id)) {
                <option [value]="sup.id">{{ sup.name }} ({{ sup.unit || 'u' }})</option>
              }
            }
          </select>
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Cantidad Utilizada por Porción</label>
          <div class="flex gap-2">
            <input 
              type="number" 
              step="0.0001" 
              min="0.0001"
              required
              [(ngModel)]="recipeForm.quantityUsed"
              name="rNewQty"
              placeholder="0.00"
              class="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span class="px-4 py-3 bg-gray-100 dark:bg-gray-850 rounded-xl text-xs font-extrabold text-gray-500 flex items-center min-w-[70px] justify-center">
              {{ getSelectedSupplyUnitLabel(recipeForm.supplyId) }}
            </span>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeAddRecipeItemModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            [disabled]="!recipeForm.supplyId"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
          >
            Añadir a la Receta
          </button>
        </div>
      </form>
    </app-modal-shell>
  `
})
export class CatalogPageComponent implements OnInit {
  private api = inject(CatalogApi);
  private notify = inject(NotificationService);

  public activeTab = signal<'products' | 'supplies' | 'recipes'>('products');

  // Shared Data
  public categories = signal<Category[]>([]);
  public products = signal<Product[]>([]);
  public supplies = signal<Supply[]>([]);
  public recipeItems = signal<RecipeItem[]>([]);

  // Filter & Search states
  public selectedCategoryFilterId = signal<number | null>(null);
  public productSearchQuery = '';

  // Selected details
  public selectedProduct = signal<Product | null>(null);
  public recipeSelectedProduct = signal<Product | null>(null);
  public selectedSupply = signal<Supply | null>(null);

  // Forms inputs state
  public categoryForm = { id: 0, name: '' };
  public productCreateForm = { name: '', price: 0, categoryId: null as number | null };
  public productEditForm = { name: '', price: 0, categoryId: 0, estimatedPrepTimeMinutes: null as number | null, active: true };
  public supplyForm = { id: 0, name: '', unit: '', minThreshold: 0 };
  public recipeForm = { supplyId: null as number | null, quantityUsed: 0 };
  public inventoryQtyInput: number = 0;
  public inventoryReasonInput: string = '';

  // Modals Visibility
  public isCategoryModalOpen = signal<boolean>(false);
  public categoryModalEditMode = signal<boolean>(false);
  
  public isProductCreateModalOpen = signal<boolean>(false);
  
  public isSupplyModalOpen = signal<boolean>(false);
  public supplyModalEditMode = signal<boolean>(false);
  
  public isRestockModalOpen = signal<boolean>(false);
  public isAdjustModalOpen = signal<boolean>(false);
  public isAddRecipeItemModalOpen = signal<boolean>(false);

  // Computed lists
  public filteredProducts = computed(() => {
    const list = this.products();
    const catId = this.selectedCategoryFilterId();
    const query = this.productSearchQuery.trim().toLowerCase();

    return list.filter(p => {
      const matchCat = catId === null || (p.category && p.category.id === catId);
      const matchQuery = !query || (p.name && p.name.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loadCategories();
    this.loadProducts();
    this.loadSupplies();
  }

  setTab(tab: 'products' | 'supplies' | 'recipes'): void {
    this.activeTab.set(tab);
    if (tab === 'recipes' && !this.recipeSelectedProduct() && this.products().length > 0) {
      // Auto select the first product when going to Recipes if none selected
      this.selectRecipeProduct(this.products()[0]);
    }
  }

  // --- LOADER HELPER METHODS ---
  loadCategories(): void {
    this.api.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.notify.error('Error al cargar la lista de categorías.')
    });
  }

  loadProducts(): void {
    this.api.getProducts().subscribe({
      next: (prods) => {
        this.products.set(prods);
        // Refresh selected product if any
        const currentSelected = this.selectedProduct();
        if (currentSelected) {
          const updated = prods.find(p => p.id === currentSelected.id);
          if (updated) this.selectProduct(updated);
        }
      },
      error: () => this.notify.error('Error al cargar la lista de productos.')
    });
  }

  loadSupplies(): void {
    this.api.getSupplies().subscribe({
      next: (sups) => this.supplies.set(sups),
      error: () => this.notify.error('Error al cargar la lista de insumos.')
    });
  }

  loadRecipe(productId: number): void {
    this.api.getRecipe(productId).subscribe({
      next: (items) => this.recipeItems.set(items),
      error: () => this.notify.error('Error al obtener la receta de este producto.')
    });
  }

  // --- CATEGORIES LIFE CRUD ---
  openCategoryCreateModal(): void {
    this.categoryModalEditMode.set(false);
    this.categoryForm = { id: 0, name: '' };
    this.isCategoryModalOpen.set(true);
  }

  openCategoryEditModal(cat: Category, event: MouseEvent): void {
    event.stopPropagation();
    this.categoryModalEditMode.set(true);
    this.categoryForm = { id: cat.id, name: cat.name };
    this.isCategoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen.set(false);
  }

  saveCategory(): void {
    if (!this.categoryForm.name.trim()) return;

    if (this.categoryModalEditMode()) {
      this.api.updateCategory(this.categoryForm.id, this.categoryForm.name).subscribe({
        next: () => {
          this.notify.success('Categoría renombrada.');
          this.closeCategoryModal();
          this.loadCategories();
          this.loadProducts(); // Refresh categories names inside products
        },
        error: (err) => this.notify.error(err.error?.message || 'Error al actualizar la categoría.')
      });
    } else {
      this.api.createCategory(this.categoryForm.name).subscribe({
        next: () => {
          this.notify.success('Nueva categoría creada.');
          this.closeCategoryModal();
          this.loadCategories();
        },
        error: (err) => this.notify.error(err.error?.message || 'Error al crear la categoría.')
      });
    }
  }

  deleteCategory(id: number, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    this.api.deleteCategory(id).subscribe({
      next: () => {
        this.notify.success('Categoría eliminada.');
        if (this.selectedCategoryFilterId() === id) {
          this.selectedCategoryFilterId.set(null);
        }
        this.loadCategories();
      },
      error: (err) => {
        const msg = err.error?.message || 'No se puede eliminar una categoría con productos activos.';
        this.notify.error(msg);
      }
    });
  }

  selectCategoryFilter(id: number | null): void {
    this.selectedCategoryFilterId.set(id);
  }

  getProductCountInCategory(categoryId: number): number {
    return this.products().filter(p => p.category && p.category.id === categoryId).length;
  }

  // --- PRODUCTS LIFE CRUD ---
  selectProduct(prod: Product): void {
    this.selectedProduct.set(prod);
    this.productEditForm = {
      name: String(prod.name),
      price: prod.price,
      categoryId: prod.category ? prod.category.id : 0,
      estimatedPrepTimeMinutes: prod.estimatedPrepTimeMinutes || null,
      active: prod.active
    };
  }

  openProductCreateModal(): void {
    // Default to currently selected category filter if possible
    const catFilter = this.selectedCategoryFilterId();
    this.productCreateForm = {
      name: '',
      price: 0,
      categoryId: catFilter ? catFilter : null
    };
    this.isProductCreateModalOpen.set(true);
  }

  closeProductCreateModal(): void {
    this.isProductCreateModalOpen.set(false);
  }

  createProduct(): void {
    const { name, price, categoryId } = this.productCreateForm;
    if (!name || price <= 0 || !categoryId) {
      this.notify.error('Completa los campos obligatorios.');
      return;
    }

    this.api.createProduct(name, price, categoryId).subscribe({
      next: () => {
        this.notify.success('Producto creado con éxito.');
        this.closeProductCreateModal();
        this.loadProducts();
      },
      error: () => this.notify.error('No se pudo crear el producto.')
    });
  }

  saveProduct(): void {
    const prod = this.selectedProduct();
    if (!prod) return;

    const { name, price, categoryId, estimatedPrepTimeMinutes, active } = this.productEditForm;

    if (!name.trim() || price <= 0 || !categoryId) {
      this.notify.error('Completa todos los campos correctamente.');
      return;
    }

    this.api.updateProduct(
      prod.id, 
      name.trim(), 
      price, 
      categoryId, 
      estimatedPrepTimeMinutes || undefined, 
      active
    ).subscribe({
      next: () => {
        this.notify.success('Producto actualizado.');
        this.loadProducts();
      },
      error: () => this.notify.error('Error al actualizar el producto.')
    });
  }

  deleteProduct(id: number): void {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    this.api.deleteProduct(id).subscribe({
      next: () => {
        this.notify.success('Producto eliminado.');
        this.selectedProduct.set(null);
        this.loadProducts();
      },
      error: () => this.notify.error('No se pudo eliminar el producto.')
    });
  }

  goToRecipeFromProduct(prod: Product): void {
    this.selectRecipeProduct(prod);
    this.setTab('recipes');
  }

  // --- SUPPLIES CRUD & INVENTORY ---
  openSupplyCreateModal(): void {
    this.supplyModalEditMode.set(false);
    this.supplyForm = { id: 0, name: '', unit: '', minThreshold: 0 };
    this.isSupplyModalOpen.set(true);
  }

  openSupplyEditModal(sup: Supply): void {
    this.supplyModalEditMode.set(true);
    this.supplyForm = { id: sup.id, name: sup.name, unit: sup.unit || '', minThreshold: sup.minThreshold };
    this.isSupplyModalOpen.set(true);
  }

  closeSupplyModal(): void {
    this.isSupplyModalOpen.set(false);
  }

  saveSupply(): void {
    const { id, name, unit, minThreshold } = this.supplyForm;
    if (!name.trim() || minThreshold < 0) {
      this.notify.error('Completa el nombre y el umbral mínimo.');
      return;
    }

    if (this.supplyModalEditMode()) {
      this.api.updateSupply(id, name.trim(), unit.trim(), minThreshold).subscribe({
        next: () => {
          this.notify.success('Insumo actualizado.');
          this.closeSupplyModal();
          this.loadSupplies();
        },
        error: () => this.notify.error('No se pudo actualizar el insumo.')
      });
    } else {
      this.api.createSupply(name.trim(), unit.trim(), minThreshold).subscribe({
        next: () => {
          this.notify.success('Insumo creado.');
          this.closeSupplyModal();
          this.loadSupplies();
        },
        error: () => this.notify.error('No se pudo registrar el insumo.')
      });
    }
  }

  deleteSupply(id: number): void {
    if (!confirm('¿Estás seguro de eliminar este insumo del almacén?')) return;

    this.api.deleteSupply(id).subscribe({
      next: () => {
        this.notify.success('Insumo eliminado.');
        this.loadSupplies();
      },
      error: () => this.notify.error('Error: este insumo podría estar en uso en alguna receta.')
    });
  }

  isStockLow(sup: Supply): boolean {
    return sup.currentStock < sup.minThreshold;
  }

  // --- RE-STOCK & ADJUSTS MANUALS ---
  openRestockModal(sup: Supply): void {
    this.selectedSupply.set(sup);
    this.inventoryQtyInput = 0;
    this.isRestockModalOpen.set(true);
  }

  closeRestockModal(): void {
    this.isRestockModalOpen.set(false);
    this.selectedSupply.set(null);
  }

  restockSupply(): void {
    const sup = this.selectedSupply();
    if (!sup) return;

    if (this.inventoryQtyInput <= 0) {
      this.notify.error('Ingresa una cantidad mayor a cero.');
      return;
    }

    this.api.restockSupply(sup.id, this.inventoryQtyInput).subscribe({
      next: () => {
        this.notify.success(`Reabastecimiento registrado para: ${sup.name}`);
        this.closeRestockModal();
        this.loadSupplies();
      },
      error: () => this.notify.error('Error al registrar el reabastecimiento.')
    });
  }

  openAdjustModal(sup: Supply): void {
    this.selectedSupply.set(sup);
    this.inventoryQtyInput = sup.currentStock; // Pre-fill with current stock for editing convenience
    this.inventoryReasonInput = '';
    this.isAdjustModalOpen.set(true);
  }

  closeAdjustModal(): void {
    this.isAdjustModalOpen.set(false);
    this.selectedSupply.set(null);
  }

  adjustSupply(): void {
    const sup = this.selectedSupply();
    if (!sup) return;

    if (this.inventoryQtyInput < 0) {
      this.notify.error('La cantidad física real no puede ser negativa.');
      return;
    }
    if (!this.inventoryReasonInput.trim()) {
      this.notify.error('La justificación es obligatoria.');
      return;
    }

    this.api.adjustSupply(sup.id, this.inventoryQtyInput, this.inventoryReasonInput.trim()).subscribe({
      next: () => {
        this.notify.success(`Ajuste de inventario aplicado para: ${sup.name}`);
        this.closeAdjustModal();
        this.loadSupplies();
      },
      error: () => this.notify.error('Error al registrar el ajuste de inventario.')
    });
  }

  // --- RECIPES LIFE CRUD ---
  selectRecipeProduct(prod: Product): void {
    this.recipeSelectedProduct.set(prod);
    this.loadRecipe(prod.id);
  }

  openAddRecipeItemModal(): void {
    this.recipeForm = { supplyId: null, quantityUsed: 0 };
    this.isAddRecipeItemModalOpen.set(true);
  }

  closeAddRecipeItemModal(): void {
    this.isAddRecipeItemModalOpen.set(false);
  }

  isSupplyAlreadyInRecipe(supplyId: number): boolean {
    return this.recipeItems().some(i => i.supplyId === supplyId);
  }

  getSelectedSupplyUnitLabel(supplyId: number | null): string {
    if (!supplyId) return 'u';
    const sup = this.supplies().find(s => s.id === supplyId);
    return sup ? (sup.unit || 'unidades') : 'u';
  }

  addRecipeItem(): void {
    const prod = this.recipeSelectedProduct();
    const { supplyId, quantityUsed } = this.recipeForm;

    if (!prod || !supplyId || quantityUsed <= 0) {
      this.notify.error('Completa los campos con valores válidos.');
      return;
    }

    this.api.addRecipeItem(prod.id, supplyId, quantityUsed).subscribe({
      next: () => {
        this.notify.success('Insumo añadido a la receta.');
        this.closeAddRecipeItemModal();
        this.loadRecipe(prod.id);
      },
      error: () => this.notify.error('Error al agregar el insumo a la receta.')
    });
  }

  updateRecipeItemQty(item: RecipeItem): void {
    if (item.quantityUsed <= 0) {
      this.notify.error('La cantidad usada debe ser mayor a cero.');
      this.loadRecipe(item.productId); // Revert UI changes
      return;
    }

    this.api.updateRecipeItem(item.productId, item.supplyId, item.quantityUsed).subscribe({
      next: () => {
        this.notify.success('Cantidad actualizada.');
        this.loadRecipe(item.productId);
      },
      error: () => this.notify.error('No se pudo actualizar la cantidad en la receta.')
    });
  }

  removeRecipeItem(item: RecipeItem): void {
    if (!confirm(`¿Deseas quitar ${item.supplyName} de la receta?`)) return;

    this.api.deleteRecipeItem(item.productId, item.supplyId).subscribe({
      next: () => {
        this.notify.success('Insumo retirado.');
        this.loadRecipe(item.productId);
      },
      error: () => this.notify.error('Error al quitar el insumo de la receta.')
    });
  }
}
