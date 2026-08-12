import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LoyaltyApi, 
  CustomerResource, 
  PointsTransactionResource, 
  LoyaltyConfigResource,
  SubmitSurveyPayload
} from '../../infrastructure/api/loyalty.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { PermissionService } from '../../../../core/auth/services/permission.service';
import { PERMISSIONS } from '../../../../core/config/permissions';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';

@Component({
  selector: 'app-loyalty-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Programa de Fidelización de Clientes</span>
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Búsqueda, registro, canjes de puntos y encuestas de satisfacción.
          </p>
        </div>

        <!-- Configuration Shortcut if admin -->
        @if (canManageConfig()) {
          <button 
            (click)="openConfigModal()"
            class="px-4 py-2.5 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-750 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all self-start md:self-auto uppercase tracking-wider"
          >
            Configurar Programa
          </button>
        }
      </div>

      <!-- ================= MAIN LAYOUT ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- SEARCH & REGISTRATION PANEL (5 COLUMNS) -->
        <div class="lg:col-span-5 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-5">
          <div class="space-y-2">
            <h3 class="text-xs font-black uppercase text-gray-400 tracking-wider">Buscar / Vincular Cliente</h3>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <input 
                  type="text" 
                  [(ngModel)]="searchPhoneInput"
                  (keyup.enter)="searchCustomer()"
                  placeholder="Ej. 999999999"
                  class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                (click)="searchCustomer()"
                class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Buscar
              </button>
            </div>
          </div>

          <!-- Customer Registration Form (If not found after search) -->
          @if (isRegisteringFormVisible()) {
            <div class="pt-4 border-t border-gray-100 dark:border-gray-750 space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div class="flex items-center gap-1.5 p-3 bg-amber-500/10 text-amber-600 rounded-xl text-[10px] font-black uppercase">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Teléfono no afiliado. Registrar Cliente Nuevo:</span>
              </div>

              <!-- Full Name -->
              <div>
                <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  required
                  [(ngModel)]="registerForm.fullName"
                  placeholder="Ej. Juan Pérez Ramos"
                  class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none"
                />
              </div>

              <!-- Birthday -->
              <div>
                <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Fecha de Cumpleaños (Opcional)</label>
                <input 
                  type="date" 
                  [(ngModel)]="registerForm.birthday"
                  class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none"
                />
              </div>

              <!-- Address (Optional for delivery) -->
              <div>
                <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Dirección (Opcional - Delivery)</label>
                <input 
                  type="text" 
                  [(ngModel)]="registerForm.address"
                  placeholder="Ej. Av. Larco 123, Dpto 4"
                  class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none"
                />
              </div>

              <!-- Required Data Consent Checkbox -->
              <div class="flex items-start gap-2 pt-1.5">
                <input 
                  type="checkbox" 
                  id="dataConsentCheck"
                  [(ngModel)]="registerForm.dataConsentAccepted"
                  class="mt-0.5 rounded border-gray-300 dark:border-gray-800"
                />
                <label for="dataConsentCheck" class="text-[10px] text-gray-500 font-bold leading-normal cursor-pointer select-none">
                  Acepto el almacenamiento y uso de datos personales para el programa de fidelización conforme a políticas internas. *
                </label>
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  (click)="isRegisteringFormVisible.set(false)"
                  class="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  [disabled]="!registerForm.fullName.trim() || !registerForm.dataConsentAccepted"
                  (click)="submitRegisterCustomer()"
                  class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer uppercase tracking-wider"
                >
                  Registrar
                </button>
              </div>
            </div>
          }
        </div>

        <!-- CUSTOMER DETAILS & TABS (7 COLUMNS) -->
        <div class="lg:col-span-7 space-y-6">
          @if (customer(); as cust) {
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-6">
              
              <!-- Customer Title Header & Points Balance badge -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 class="text-xl font-extrabold text-gray-900 dark:text-white">{{ cust.fullName }}</h3>
                  <div class="text-xs font-bold text-gray-400 mt-0.5">
                    Teléfono: {{ cust.phone }} • Consentimiento: {{ cust.dataConsentDate | date:'dd/MM/yyyy' }}
                    @if (cust.birthday) {
                      • Cumpleaños: {{ cust.birthday | date:'dd/MM' }}
                    }
                  </div>
                </div>

                <div class="p-3 bg-blue-600 text-white rounded-xl text-center min-w-[120px] shadow-xs">
                  <span class="text-[9px] uppercase font-black tracking-wider block opacity-75">Saldo de Puntos</span>
                  <span class="text-xl font-black">{{ cust.pointsBalance }} pts</span>
                </div>
              </div>

              <!-- Action Tabs -->
              <div class="flex border-b border-gray-100 dark:border-gray-750 gap-2 overflow-x-auto pb-1 text-xs">
                @for (tab of tabs; track tab.id) {
                  <button
                    (click)="activeTab.set(tab.id)"
                    [class.border-blue-600]="activeTab() === tab.id"
                    [class.text-blue-600]="activeTab() === tab.id"
                    [class.dark:text-blue-400]="activeTab() === tab.id"
                    [class.border-transparent]="activeTab() !== tab.id"
                    [class.text-gray-500]="activeTab() !== tab.id"
                    class="px-4 py-2 border-b-2 font-black uppercase tracking-wider hover:text-gray-900 dark:hover:text-white cursor-pointer transition-all shrink-0"
                  >
                    {{ tab.label }}
                  </button>
                }
              </div>

              <!-- ================= TAB CONTENT 1: CANJEAR PUNTOS ================= -->
              @if (activeTab() === 'redeem') {
                <div class="space-y-4">
                  <h4 class="text-xs font-black uppercase text-gray-400 tracking-wider">Canjear Puntos de Fidelización</h4>
                  
                  @if (canRedeemPoints()) {
                    <form (submit)="redeemPoints()" class="max-w-md space-y-4">
                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Puntos a Canjear (Máximo: {{ cust.pointsBalance }} pts)</label>
                        <input 
                          type="number" 
                          min="1"
                          [max]="cust.pointsBalance"
                          required
                          [(ngModel)]="pointsToRedeem"
                          name="ptsRedeem"
                          class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div class="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-xl text-[10px] font-black leading-relaxed">
                        IMPORTANTE: El canje de puntos no aplica descuentos automáticos a comandas en el backend. Registra el canje aquí para descontar sus puntos, y luego aplica el ajuste de precio manualmente en la Caja.
                      </div>

                      <button 
                        type="submit"
                        [disabled]="pointsToRedeem <= 0 || pointsToRedeem > cust.pointsBalance"
                        class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs"
                      >
                        Confirmar Canje de Puntos
                      </button>
                    </form>
                  } @else {
                    <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center text-xs text-gray-500 font-bold italic">
                      No tienes permisos suficientes para realizar canjes de puntos.
                    </div>
                  }
                </div>
              }

              <!-- ================= TAB CONTENT 2: ENCUESTA DE SATISFACCIÓN ================= -->
              @if (activeTab() === 'survey') {
                <div class="space-y-4">
                  <h4 class="text-xs font-black uppercase text-gray-400 tracking-wider">Encuesta de Satisfacción Asistida</h4>
                  
                  <form (submit)="saveSurvey()" class="space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Dish -->
                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Plato Favorito</label>
                        <input 
                          type="text" 
                          required
                          [(ngModel)]="surveyForm.favoriteDish"
                          name="surDish"
                          placeholder="Ej. Ceviche Carretillero"
                          class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none"
                        />
                      </div>

                      <!-- Drink -->
                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Bebida Favorita</label>
                        <input 
                          type="text" 
                          required
                          [(ngModel)]="surveyForm.favoriteDrink"
                          name="surDrink"
                          placeholder="Ej. Chicha Morada"
                          class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none"
                        />
                      </div>

                      <!-- Service Score -->
                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Satisfacción del Servicio (1-5)</label>
                        <select 
                          [(ngModel)]="surveyForm.serviceSatisfaction"
                          name="surService"
                          required
                          class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none"
                        >
                          <option [value]="5">5 - Excelente servicio</option>
                          <option [value]="4">4 - Muy bueno</option>
                          <option [value]="3">3 - Aceptable</option>
                          <option [value]="2">2 - Malo</option>
                          <option [value]="1">1 - Deficiente</option>
                        </select>
                      </div>

                      <!-- Food Score -->
                      <div>
                        <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Satisfacción de la Comida (1-5)</label>
                        <select 
                          [(ngModel)]="surveyForm.foodSatisfaction"
                          name="surFood"
                          required
                          class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none"
                        >
                          <option [value]="5">5 - Delicioso</option>
                          <option [value]="4">4 - Muy rico</option>
                          <option [value]="3">3 - Aceptable</option>
                          <option [value]="2">2 - Regular</option>
                          <option [value]="1">1 - Malo</option>
                        </select>
                      </div>
                    </div>

                    <!-- Suggestions -->
                    <div>
                      <label class="block text-[10px] font-black uppercase text-gray-400 mb-1">Sugerencias o Comentarios (Opcional)</label>
                      <textarea 
                        [(ngModel)]="surveyForm.suggestion"
                        name="surSuggestion"
                        rows="2"
                        placeholder="Recomendaciones para el local, etc..."
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs"
                    >
                      Enviar Encuesta
                    </button>
                  </form>

                  <!-- Google Maps Review Prompt -->
                  @if (showGooglePrompt()) {
                    <div class="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3 animate-in fade-in duration-300">
                      <div class="flex items-center gap-2">
                        <span class="text-lg">⭐</span>
                        <h5 class="text-sm font-black text-emerald-800 dark:text-emerald-400">¡Nos encanta tu experiencia!</h5>
                      </div>
                      <p class="text-xs text-emerald-700 dark:text-emerald-450 leading-relaxed font-bold">
                        Tu nivel de satisfacción califica para dejarnos una reseña. Por favor, dedícanos un momento para dejarnos una reseña de 5 estrellas en Google Maps para ayudarnos a crecer.
                      </p>
                      <a 
                        [href]="googleReviewLink()"
                        target="_blank"
                        class="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
                      >
                        Dejar Reseña en Google
                      </a>
                    </div>
                  }
                </div>
              }

              <!-- ================= TAB CONTENT 3: HISTORIAL DE PUNTOS ================= -->
              @if (activeTab() === 'history') {
                <div class="space-y-4">
                  <h4 class="text-xs font-black uppercase text-gray-400 tracking-wider">Historial de Transacciones de Puntos</h4>

                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-bold border-collapse">
                      <thead>
                        <tr class="border-b border-gray-100 dark:border-gray-800 text-[9px] uppercase text-gray-400 tracking-wider">
                          <th class="py-2.5 px-3">Fecha</th>
                          <th class="py-2.5 px-3">Concepto / Tipo</th>
                          <th class="py-2.5 px-3 text-right">Puntos</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                        @for (tx of transactions(); track tx.id) {
                          <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                            <td class="py-3 px-3 font-extrabold text-gray-900 dark:text-white">
                              {{ tx.date | date:'dd/MM/yyyy HH:mm' }}
                            </td>
                            <td class="py-3 px-3">
                              <span 
                                [class.bg-emerald-100]="tx.type === 'EARNED' || tx.type === 'REFUNDED' || tx.type === 'MANUAL'"
                                [class.text-emerald-700]="tx.type === 'EARNED' || tx.type === 'REFUNDED' || tx.type === 'MANUAL'"
                                [class.bg-rose-100]="tx.type === 'REDEEMED'"
                                [class.text-rose-700]="tx.type === 'REDEEMED'"
                                class="px-2 py-0.5 rounded text-[9px] font-black uppercase border"
                                [class.border-emerald-200/50]="tx.type !== 'REDEEMED'"
                                [class.border-rose-250]="tx.type === 'REDEEMED'"
                              >
                                {{ translateTxType(tx.type) }}
                              </span>
                            </td>
                            <td class="py-3 px-3 text-right font-black text-sm"
                                [class.text-emerald-600]="tx.type !== 'REDEEMED'"
                                [class.text-rose-600]="tx.type === 'REDEEMED'"
                            >
                              {{ tx.type === 'REDEEMED' ? '-' : '+' }}{{ tx.amount }} pts
                            </td>
                          </tr>
                        }
                        @if (transactions().length === 0) {
                          <tr>
                            <td colspan="3" class="py-8 text-center text-gray-400 italic">
                              No hay transacciones registradas.
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              <!-- ================= TAB CONTENT 4: SEGURIDAD (BORRAR) ================= -->
              @if (activeTab() === 'security') {
                <div class="space-y-4">
                  <h4 class="text-xs font-black uppercase text-gray-400 tracking-wider">Derecho de Borrado de Datos</h4>
                  
                  <div class="p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-red-700 text-xs font-bold leading-relaxed space-y-2">
                    <h5 class="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Advertencia de Borrado Permanente
                    </h5>
                    Esta acción es destructiva e irreversible. De acuerdo con el Reglamento de Protección de Datos Personales, eliminar esta cuenta eliminará físicamente todos los datos de contacto, nombres y saldo de puntos acumulados en la base de datos de manera definitiva.
                  </div>

                  @if (canRegisterCustomer()) {
                    <button 
                      (click)="promptDeleteCustomer()"
                      class="px-5 py-2.5 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs"
                    >
                      Eliminar Cuenta Definitivamente
                    </button>
                  } @else {
                    <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center text-xs text-gray-500 font-bold italic">
                      No posees permisos de registro para eliminar cuentas.
                    </div>
                  }
                </div>
              }

            </div>
          } @else {
            <div class="py-24 text-center text-gray-400 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <svg class="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              Ingresa el teléfono del cliente para consultar su saldo, canjear puntos o responder encuestas de satisfacción.
            </div>
          }
        </div>
      </div>

    </div>

    <!-- ================= MODAL: CONFIGURACIÓN DEL PROGRAMA (SÓLO ADMIN) ================= -->
    <app-modal-shell
      [open]="isConfigModalOpen()"
      title="Configuración del Programa de Fidelización"
      description="Establece los parámetros de conversión de puntos y el umbral para solicitudes de reseñas."
      (close)="closeConfigModal()"
    >
      <form (submit)="saveConfig()" class="space-y-4">
        
        <!-- Min purchase amount -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Monto Mínimo de Compra para Generar Puntos (S/)</label>
          <input 
            type="number" 
            step="0.01" 
            min="0"
            required
            [(ngModel)]="configForm.minPurchaseAmountForPoints"
            name="cfgMin"
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none"
          />
        </div>

        <!-- Points per currency unit -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Puntos Otorgados por Unidad de Moneda (Sol)</label>
          <input 
            type="number" 
            step="0.01" 
            min="0.01"
            required
            [(ngModel)]="configForm.pointsPerCurrencyUnit"
            name="cfgPer"
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none"
          />
        </div>

        <!-- Satisfacton Threshold -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Umbral de Satisfacción para Reseñas (1-5)</label>
          <input 
            type="number" 
            min="1" 
            max="5"
            required
            [(ngModel)]="configForm.reviewSatisfactionThreshold"
            name="cfgThreshold"
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none"
          />
        </div>

        <!-- Google Review Url -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">URL de Reseña de Google Maps</label>
          <input 
            type="url" 
            required
            [(ngModel)]="configForm.googleReviewUrl"
            name="cfgUrl"
            placeholder="https://g.page/r/..."
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-950 dark:text-white focus:outline-none"
          />
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
            Guardar Configuración
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL: CONFIRMAR DERECHO DE BORRADO ================= -->
    <app-modal-shell
      [open]="isDeleteConfirmModalOpen()"
      title="¿Eliminar Cuenta Definitivamente?"
      description="Esta acción eliminará todos los datos personales del cliente físicamente de la base de datos."
      (close)="closeDeleteConfirmModal()"
    >
      <div class="space-y-4">
        <div class="p-3 bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl text-xs font-bold leading-relaxed">
          Los puntos acumulados del cliente se perderán y no podrán recuperarse bajo ningún concepto.
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
            (click)="confirmDeleteCustomer()"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Eliminar Definitivamente
          </button>
        </div>
      </div>
    </app-modal-shell>
  `
})
export class LoyaltyPageComponent implements OnInit {
  private api = inject(LoyaltyApi);
  private notify = inject(NotificationService);
  private permissionService = inject(PermissionService);

  public readonly PERMISSIONS = PERMISSIONS;

  // Granular Permissions
  public canRegisterCustomer = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.LOYALTY.REGISTER_CUSTOMER));
  public canRedeemPoints = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.LOYALTY.REDEEM_POINTS));
  public canManageConfig = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.LOYALTY.MANAGE_CONFIG));

  // State Signals
  public searchPhoneInput = '';
  public customer = signal<CustomerResource | null>(null);
  public transactions = signal<PointsTransactionResource[]>([]);
  public isRegisteringFormVisible = signal<boolean>(false);

  // Tab State
  public activeTab = signal<string>('redeem');
  public readonly tabs = [
    { id: 'redeem', label: 'Canjear Puntos' },
    { id: 'survey', label: 'Encuesta' },
    { id: 'history', label: 'Historial' },
    { id: 'security', label: 'Seguridad' }
  ];

  // Survey Redirection State
  public showGooglePrompt = signal<boolean>(false);
  public googleReviewLink = signal<string>('');

  // Modals Visibility
  public isConfigModalOpen = signal<boolean>(false);
  public isDeleteConfirmModalOpen = signal<boolean>(false);

  // Forms Inputs
  public registerForm = { fullName: '', birthday: '', address: '', dataConsentAccepted: false };
  public pointsToRedeem: number = 0;
  public surveyForm = { favoriteDish: '', favoriteDrink: '', serviceSatisfaction: 5, foodSatisfaction: 5, suggestion: '' };
  public configForm: LoyaltyConfigResource = { minPurchaseAmountForPoints: 0, pointsPerCurrencyUnit: 0, reviewSatisfactionThreshold: 5, googleReviewUrl: '' };

  ngOnInit(): void {
    // Check url search query if redirected from tables
  }

  // --- SEARCH CUSTOMER ---
  searchCustomer(): void {
    const phone = this.searchPhoneInput.trim();
    if (!phone) {
      this.notify.error('Ingresa un número de teléfono válido.');
      return;
    }

    this.isRegisteringFormVisible.set(false);
    this.customer.set(null);
    this.showGooglePrompt.set(false);

    this.api.getCustomerByPhone(phone).subscribe({
      next: (cust) => {
        this.customer.set(cust);
        this.notify.success(`Cliente ${cust.fullName} vinculado.`);
        this.loadCustomerDetails(cust.id);
      },
      error: (err) => {
        // If 404, show registration form
        if (err.status === 404) {
          if (this.canRegisterCustomer()) {
            this.registerForm = { fullName: '', birthday: '', address: '', dataConsentAccepted: false };
            this.isRegisteringFormVisible.set(true);
          } else {
            this.notify.error('Cliente no encontrado y no posees permisos para registrar.');
          }
        } else {
          this.notify.error('Ocurrió un error al buscar al cliente.');
        }
      }
    });
  }

  loadCustomerDetails(customerId: number): void {
    // Load points history
    this.api.getPointsHistory(customerId).subscribe({
      next: (txs) => this.transactions.set(txs),
      error: () => console.error('No se pudo cargar el historial de transacciones.')
    });
  }

  // --- REGISTRATION ---
  submitRegisterCustomer(): void {
    const { fullName, birthday, address, dataConsentAccepted } = this.registerForm;
    const phone = this.searchPhoneInput.trim();

    if (!fullName.trim() || !dataConsentAccepted) {
      this.notify.error('Completa los campos obligatorios y acepta el consentimiento.');
      return;
    }

    this.api.registerCustomer({
      phone,
      fullName: fullName.trim(),
      birthday: birthday ? birthday : undefined,
      address: address ? address : undefined,
      dataConsentAccepted
    }).subscribe({
      next: (cust) => {
        this.notify.success('Cliente registrado correctamente.');
        this.isRegisteringFormVisible.set(false);
        this.customer.set(cust);
        this.loadCustomerDetails(cust.id);
      },
      error: (err) => this.notify.error(err.error?.message || 'No se pudo afiliar al cliente.')
    });
  }

  // --- POINTS REDEMPTION ---
  redeemPoints(): void {
    const cust = this.customer();
    if (!cust) return;

    if (this.pointsToRedeem <= 0 || this.pointsToRedeem > cust.pointsBalance) {
      this.notify.error('Cantidad de puntos no válida.');
      return;
    }

    this.api.redeemPoints(cust.id, this.pointsToRedeem).subscribe({
      next: (tx) => {
        this.notify.success(`Canje registrado: -${tx.amount} puntos.`);
        this.pointsToRedeem = 0;
        
        // Refresh customer profile
        this.api.getCustomerById(cust.id).subscribe({
          next: (fresh) => this.customer.set(fresh)
        });
        this.loadCustomerDetails(cust.id);
      },
      error: (err) => this.notify.error(err.error?.message || 'Error al procesar el canje de puntos.')
    });
  }

  // --- SURVEY SUBMISSION ---
  saveSurvey(): void {
    const cust = this.customer();
    if (!cust) return;

    const { favoriteDish, favoriteDrink, serviceSatisfaction, foodSatisfaction, suggestion } = this.surveyForm;
    if (!favoriteDish.trim() || !favoriteDrink.trim()) {
      this.notify.error('Plato y bebida favoritos son obligatorios.');
      return;
    }

    const payload: SubmitSurveyPayload = {
      favoriteDish: favoriteDish.trim(),
      favoriteDrink: favoriteDrink.trim(),
      serviceSatisfaction: Number(serviceSatisfaction),
      foodSatisfaction: Number(foodSatisfaction),
      suggestion: suggestion.trim() ? suggestion.trim() : undefined
    };

    this.api.submitSurvey(cust.id, payload).subscribe({
      next: (res) => {
        this.notify.success('Encuesta de satisfacción enviada con éxito.');
        this.surveyForm = { favoriteDish: '', favoriteDrink: '', serviceSatisfaction: 5, foodSatisfaction: 5, suggestion: '' };
        
        // Show review redirect if showReviewPrompt is true
        if (res.showReviewPrompt && res.reviewUrl) {
          this.googleReviewLink.set(res.reviewUrl);
          this.showGooglePrompt.set(true);
        } else {
          this.showGooglePrompt.set(false);
        }
      },
      error: (err) => this.notify.error(err.error?.message || 'Error al guardar la encuesta.')
    });
  }

  // --- DERECHO DE BORRADO ---
  promptDeleteCustomer(): void {
    this.isDeleteConfirmModalOpen.set(true);
  }

  closeDeleteConfirmModal(): void {
    this.isDeleteConfirmModalOpen.set(false);
  }

  confirmDeleteCustomer(): void {
    const cust = this.customer();
    if (!cust) return;

    this.api.deleteCustomer(cust.id).subscribe({
      next: () => {
        this.notify.success('Información del cliente borrada físicamente.');
        this.closeDeleteConfirmModal();
        this.customer.set(null);
        this.searchPhoneInput = '';
      },
      error: () => this.notify.error('No se pudo borrar la cuenta del cliente.')
    });
  }

  // --- ADMIN CONFIG ---
  openConfigModal(): void {
    this.api.getConfig().subscribe({
      next: (cfg) => {
        this.configForm = cfg;
        this.isConfigModalOpen.set(true);
      },
      error: () => this.notify.error('Error al cargar la configuración de fidelización.')
    });
  }

  closeConfigModal(): void {
    this.isConfigModalOpen.set(false);
  }

  saveConfig(): void {
    const { minPurchaseAmountForPoints, pointsPerCurrencyUnit, reviewSatisfactionThreshold, googleReviewUrl } = this.configForm;
    if (minPurchaseAmountForPoints < 0 || pointsPerCurrencyUnit <= 0) {
      this.notify.error('Valores de configuración de fidelización no válidos.');
      return;
    }

    this.api.updateConfig(this.configForm).subscribe({
      next: () => {
        this.notify.success('Configuración de fidelización actualizada.');
        this.closeConfigModal();
      },
      error: () => this.notify.error('No se pudo guardar la configuración.')
    });
  }

  translateTxType(type: string): string {
    switch (type) {
      case 'EARNED': return 'Ganados';
      case 'REDEEMED': return 'Canjeados';
      case 'REFUNDED': return 'Devueltos';
      case 'MANUAL': return 'Manual';
      default: return type;
    }
  }
}
