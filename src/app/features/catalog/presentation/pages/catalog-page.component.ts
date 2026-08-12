import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogApi, Category, Product, Supply, RecipeItem } from '../../infrastructure/api/catalog.api';
import { KitchenApi, KitchenZone } from '../../../kitchen/infrastructure/api/kitchen.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import { PermissionService } from '../../../../core/auth/services/permission.service';
import { PERMISSIONS } from '../../../../core/config/permissions';
import { SelectOnFocusDirective } from '../../../../shared/utils/select-on-focus.directive';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, SelectOnFocusDirective],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm animate-in fade-in duration-300">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Administración de Catálogo</span>
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Mantenimiento de la carta de platos y categorías de productos.
          </p>
        </div>
      </div>

      <!-- ================= CARTA (PRODUCTOS & CATEGORÍAS) ================= -->
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
                  [ngModel]="productSearchQuery()"
                  (ngModelChange)="productSearchQuery.set($event)"
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
                          [ngModel]="productEditName()"
                          (ngModelChange)="productEditName.set($event)"
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
                          [ngModel]="productEditPrice()"
                          (ngModelChange)="productEditPrice.set(toNumber($event))"
                          name="prodPrice"
                          class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Categoría</label>
                        <select 
                          [ngModel]="productEditCategoryId()"
                          (ngModelChange)="productEditCategoryId.set(toNumberOrNull($event))"
                          name="prodCategory"
                          required
                          class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option [ngValue]="null" disabled>Selecciona categoría...</option>
                          @for (cat of categories(); track cat.id) {
                            <option [ngValue]="cat.id">{{ cat.name }}</option>
                          }
                        </select>
                      </div>

                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Estación de Cocina</label>
                        <select 
                          [ngModel]="selectedProductKitchenZoneId()"
                          (ngModelChange)="selectedProductKitchenZoneId.set($event)"
                          name="prodKitchenZone"
                          class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option [ngValue]="null">Cola General (Sin Estación)</option>
                          @for (zone of kitchenZones(); track zone.id) {
                            <option [ngValue]="zone.id">{{ zone.name }}</option>
                          }
                        </select>
                      </div>

                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Tiempo de Prep. (Minutos - Opcional)</label>
                        <input 
                          type="number"
                          min="0"
                          [ngModel]="productEditPrepTime()"
                          (ngModelChange)="productEditPrepTime.set(toNumberOrNull($event))"
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
                            [ngModel]="productEditActive()" 
                            (ngModelChange)="productEditActive.set($event)"
                            name="prodActive"
                            class="sr-only peer"
                          />
                          <div class="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div class="pt-3 border-t border-gray-150 dark:border-gray-800 flex gap-2">
                        <button 
                          type="submit"
                          [disabled]="!productEditName().trim() || productEditPrice() <= 0 || productEditCategoryId() === null"
                          class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer text-center"
                        >
                          Guardar
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

                    <!-- Seccion: Receta de Insumos -->
                    <div class="mt-6 pt-5 border-t border-gray-200 dark:border-gray-850 space-y-4">
                      <h5 class="text-xs font-black uppercase text-gray-900 dark:text-white flex items-center justify-between">
                        <span>Receta / Ingredientes</span>
                        <span class="text-[9px] bg-gray-100 dark:bg-gray-900 text-gray-500 px-2 py-0.5 rounded font-black">
                          {{ selectedProductRecipeItems().length }} insumos
                        </span>
                      </h5>
                      
                      <!-- Lista de Ingredientes en la receta -->
                      <div class="space-y-2">
                        @for (item of selectedProductRecipeItems(); track item.supplyId) {
                          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-800/60 rounded-xl text-xs">
                            <div class="flex flex-col">
                              <span class="font-extrabold text-gray-900 dark:text-white">{{ item.supplyName }}</span>
                              <span class="text-[9px] text-gray-400">Unidad: {{ item.supplyUnit || 'u' }}</span>
                            </div>
                            
                            <div class="flex items-center gap-2">
                              @if (canEditRecipe()) {
                                <input 
                                  type="number"
                                  step="0.0001"
                                  min="0.0001"
                                  [(ngModel)]="item.quantityUsed"
                                  (change)="updateRecipeItemQty(item)"
                                  class="w-20 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg text-right font-black"
                                />
                                <span class="text-gray-500 text-[10px] w-6 text-left">{{ item.supplyUnit || 'u' }}</span>
                                <button 
                                  type="button"
                                  (click)="removeRecipeItem(item)"
                                  class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                                  title="Quitar ingrediente"
                                >
                                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              } @else {
                                <span class="font-black text-gray-900 dark:text-white">{{ item.quantityUsed }}</span>
                                <span class="text-gray-500 text-[10px]">{{ item.supplyUnit || 'u' }}</span>
                              }
                            </div>
                          </div>
                        }
                        @if (selectedProductRecipeItems().length === 0) {
                          <div class="text-center py-4 text-gray-400 dark:text-gray-500 text-xs italic">
                            Sin insumos en la receta (se descuenta directamente el plato).
                          </div>
                        }
                      </div>

                      <!-- Agregar Insumo (Solo si tiene permiso) -->
                      @if (canEditRecipe()) {
                        <div class="p-3 bg-gray-50 dark:bg-gray-900/30 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-3">
                          <span class="block text-[10px] font-black uppercase text-gray-400">Añadir Insumo a Receta</span>
                          <div class="flex flex-col sm:flex-row gap-2">
                            <select 
                              [ngModel]="recipeFormSupplyId()"
                              (ngModelChange)="recipeFormSupplyId.set(toNumberOrNull($event))"
                              name="recipeSupplySelect"
                              class="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none"
                            >
                              <option [ngValue]="null" disabled>Selecciona insumo...</option>
                              @for (sup of supplies(); track sup.id) {
                                @if (!isSupplyAlreadyInRecipe(sup.id)) {
                                  <option [ngValue]="sup.id">{{ sup.name }} ({{ sup.unit || 'u' }})</option>
                                }
                              }
                            </select>
                            <div class="flex gap-1.5 shrink-0">
                              <input 
                                type="number" 
                                step="0.0001" 
                                min="0.0001"
                                [ngModel]="recipeFormQuantityUsed()"
                                (ngModelChange)="recipeFormQuantityUsed.set(toNumber($event))"
                                name="recipeQtyInput"
                                placeholder="Cant."
                                class="w-20 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-xl font-bold text-xs text-right text-gray-900 dark:text-white"
                              />
                              <button 
                                type="button"
                                [disabled]="recipeFormSupplyId() === null || recipeFormQuantityUsed() <= 0"
                                (click)="addRecipeItem()"
                                class="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-all"
                              >
                                Agregar
                              </button>
                            </div>
                          </div>
                        </div>
                      }
                    </div>

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
            [ngModel]="categoryFormName()"
            (ngModelChange)="categoryFormName.set($event)"
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
            [disabled]="!categoryFormName().trim()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
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
            [ngModel]="productCreateName()"
            (ngModelChange)="productCreateName.set($event)"
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
            [ngModel]="productCreatePrice()"
            (ngModelChange)="productCreatePrice.set(toNumber($event))"
            name="pNewPrice"
            placeholder="0.00"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Categoría</label>
          <select 
            [ngModel]="productCreateCategoryId()"
            (ngModelChange)="productCreateCategoryId.set(toNumberOrNull($event))"
            name="pNewCategory"
            required
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option [ngValue]="null" disabled>Selecciona categoría...</option>
            @for (cat of categories(); track cat.id) {
              <option [ngValue]="cat.id">{{ cat.name }}</option>
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
            [disabled]="!productCreateName().trim() || productCreatePrice() <= 0 || productCreateCategoryId() === null"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
          >
            Crear Producto
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL: INSUMO (CREAR / EDITAR) ================= -->
  `
})
export class CatalogPageComponent implements OnInit {
  private api = inject(CatalogApi);
  private kitchenApi = inject(KitchenApi);
  private notify = inject(NotificationService);
  private permissionService = inject(PermissionService);

  public readonly PERMISSIONS = PERMISSIONS;
  public canEditRecipe = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.CATALOG.EDIT_SUPPLIES_RECIPES));

  // Shared Data
  public categories = signal<Category[]>([]);
  public products = signal<Product[]>([]);
  public supplies = signal<Supply[]>([]);
  public kitchenZones = signal<KitchenZone[]>([]);

  // Filter & Search states
  public selectedCategoryFilterId = signal<number | null>(null);
  public productSearchQuery = signal<string>('');

  // Selected details
  public selectedProduct = signal<Product | null>(null);

  // Writeable signal for the selected product's kitchen zone (reactive graph)
  public selectedProductKitchenZoneId = signal<number | null>(null);

  // Writeable signal for the selected product's recipe items (reactive graph)
  public selectedProductRecipeItems = signal<RecipeItem[]>([]);

  // Category Form Signals
  public categoryFormId = signal<number | null>(null);
  public categoryFormName = signal<string>('');

  // Product Create Form Signals
  public productCreateName = signal<string>('');
  public productCreatePrice = signal<number>(0);
  public productCreateCategoryId = signal<number | null>(null);

  // Product Edit Form Signals
  public productEditName = signal<string>('');
  public productEditPrice = signal<number>(0);
  public productEditCategoryId = signal<number | null>(null);
  public productEditPrepTime = signal<number | null>(null);
  public productEditActive = signal<boolean>(true);

  constructor() {
    effect(() => {
      const prod = this.selectedProduct();
      if (prod) {
        // Reset zone ID and recipe items before fetching new values
        this.selectedProductKitchenZoneId.set(null);
        this.selectedProductRecipeItems.set([]);
        
        // Fetch kitchen zone
        this.api.getProductKitchenZone(prod.id).subscribe({
          next: (res) => {
            if (this.selectedProduct()?.id === prod.id) {
              this.selectedProductKitchenZoneId.set(res.zoneId || null);
            }
          }
        });

        // Fetch recipe items
        this.api.getRecipe(prod.id).subscribe({
          next: (items) => {
            if (this.selectedProduct()?.id === prod.id) {
              this.selectedProductRecipeItems.set(items);
            }
          }
        });
      } else {
        this.selectedProductKitchenZoneId.set(null);
        this.selectedProductRecipeItems.set([]);
      }
    });
  }
  public recipeFormSupplyId = signal<number | null>(null);
  public recipeFormQuantityUsed = signal<number>(0);
  // Modals Visibility
  public isCategoryModalOpen = signal<boolean>(false);
  public categoryModalEditMode = signal<boolean>(false);
  
  public isProductCreateModalOpen = signal<boolean>(false);

  // Computed lists
  public filteredProducts = computed(() => {
    const list = this.products();
    const catId = this.selectedCategoryFilterId();
    const query = this.productSearchQuery().trim().toLowerCase();

    return list.filter(p => {
      const matchCat = catId === null || (p.category && p.category.id === catId);
      const matchQuery = !query || (p.name && p.name.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });
  });

  toNumber(value: any): number {
    return Number(value) || 0;
  }

  toNumberOrNull(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loadCategories();
    this.loadProducts();
    this.loadSupplies();
    this.loadKitchenZones();
  }

  // --- LOADER HELPER METHODS ---
  loadKitchenZones(): void {
    this.kitchenApi.getZones().subscribe({
      next: (zs) => this.kitchenZones.set(zs),
      error: () => this.notify.error('Error al cargar las zonas de cocina.')
    });
  }

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

  // --- CATEGORIES LIFE CRUD ---
  openCategoryCreateModal(): void {
    this.categoryModalEditMode.set(false);
    this.categoryFormId.set(null);
    this.categoryFormName.set('');
    this.isCategoryModalOpen.set(true);
  }

  openCategoryEditModal(cat: Category, event: MouseEvent): void {
    event.stopPropagation();
    this.categoryModalEditMode.set(true);
    this.categoryFormId.set(cat.id);
    this.categoryFormName.set(cat.name);
    this.isCategoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen.set(false);
  }

  saveCategory(): void {
    const nameVal = this.categoryFormName().trim();
    if (!nameVal) return;

    if (this.categoryModalEditMode()) {
      const idVal = this.categoryFormId();
      if (idVal === null) return;
      this.api.updateCategory(idVal, nameVal).subscribe({
        next: () => {
          this.notify.success('Categoría renombrada.');
          this.closeCategoryModal();
          this.loadCategories();
          this.loadProducts(); // Refresh categories names inside products
        },
        error: (err) => this.notify.error(err.error?.message || 'Error al actualizar la categoría.')
      });
    } else {
      this.api.createCategory(nameVal).subscribe({
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
    this.productEditName.set(String(prod.name));
    this.productEditPrice.set(prod.price);
    this.productEditCategoryId.set(prod.category ? prod.category.id : null);
    this.productEditPrepTime.set(prod.estimatedPrepTimeMinutes || null);
    this.productEditActive.set(prod.active);
  }

  openProductCreateModal(): void {
    // Default to currently selected category filter if possible
    const catFilter = this.selectedCategoryFilterId();
    this.productCreateName.set('');
    this.productCreatePrice.set(0);
    this.productCreateCategoryId.set(catFilter);
    this.isProductCreateModalOpen.set(true);
  }

  closeProductCreateModal(): void {
    this.isProductCreateModalOpen.set(false);
  }

  createProduct(): void {
    const name = this.productCreateName();
    const price = this.productCreatePrice();
    const categoryId = this.productCreateCategoryId();

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

    const name = this.productEditName().trim();
    const price = this.productEditPrice();
    const categoryId = this.productEditCategoryId();
    const estimatedPrepTimeMinutes = this.productEditPrepTime();
    const active = this.productEditActive();
    const kitchenZoneId = this.selectedProductKitchenZoneId();

    if (!name || price <= 0 || !categoryId) {
      this.notify.error('Completa todos los campos correctamente.');
      return;
    }

    this.api.updateProduct(
      prod.id, 
      name, 
      price, 
      categoryId, 
      estimatedPrepTimeMinutes || undefined, 
      active
    ).subscribe({
      next: () => {
        this.api.assignProductKitchenZone(prod.id, kitchenZoneId).subscribe({
          next: () => {
            this.notify.success('Producto y zona de cocina actualizados.');
            this.loadProducts();
          },
          error: () => {
            this.notify.info('Se actualizó el producto, pero falló la asignación de zona.');
            this.loadProducts();
          }
        });
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



  // --- RECIPES LIFE CRUD ---
  isSupplyAlreadyInRecipe(supplyId: number): boolean {
    return this.selectedProductRecipeItems().some(i => i.supplyId === supplyId);
  }

  getSelectedSupplyUnitLabel(supplyId: number | null): string {
    if (!supplyId) return 'u';
    const sup = this.supplies().find(s => s.id === supplyId);
    return sup ? (sup.unit || 'unidades') : 'u';
  }

  addRecipeItem(): void {
    const prod = this.selectedProduct();
    const supplyId = this.recipeFormSupplyId();
    const quantityUsed = this.recipeFormQuantityUsed();

    if (!prod || !supplyId || quantityUsed <= 0) {
      this.notify.error('Completa los campos con valores válidos.');
      return;
    }

    this.api.addRecipeItem(prod.id, supplyId, quantityUsed).subscribe({
      next: () => {
        this.notify.success('Insumo añadido a la receta.');
        this.recipeFormSupplyId.set(null);
        this.recipeFormQuantityUsed.set(0);
        this.api.getRecipe(prod.id).subscribe({
          next: (items) => this.selectedProductRecipeItems.set(items)
        });
      },
      error: () => this.notify.error('Error al agregar el insumo a la receta.')
    });
  }

  updateRecipeItemQty(item: RecipeItem): void {
    if (item.quantityUsed <= 0) {
      this.notify.error('La cantidad usada debe ser mayor a cero.');
      this.api.getRecipe(item.productId).subscribe({
        next: (items) => this.selectedProductRecipeItems.set(items)
      });
      return;
    }

    this.api.updateRecipeItem(item.productId, item.supplyId, item.quantityUsed).subscribe({
      next: () => {
        this.notify.success('Cantidad de ingrediente actualizada.');
        this.api.getRecipe(item.productId).subscribe({
          next: (items) => this.selectedProductRecipeItems.set(items)
        });
      },
      error: () => this.notify.error('No se pudo actualizar la cantidad en la receta.')
    });
  }

  removeRecipeItem(item: RecipeItem): void {
    if (!confirm(`¿Deseas quitar ${item.supplyName} de la receta?`)) return;

    this.api.deleteRecipeItem(item.productId, item.supplyId).subscribe({
      next: () => {
        this.notify.success('Insumo retirado de la receta.');
        this.api.getRecipe(item.productId).subscribe({
          next: (items) => this.selectedProductRecipeItems.set(items)
        });
      },
      error: () => this.notify.error('Error al quitar el insumo de la receta.')
    });
  }
}
