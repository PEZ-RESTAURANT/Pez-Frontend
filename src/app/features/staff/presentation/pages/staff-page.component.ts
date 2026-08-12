import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  StaffApi, 
  StaffProfile, 
  UserResource, 
  AttendanceRecord, 
  PayrollAdjustment, 
  Sanction, 
  OvertimeRecord, 
  PaymentSummary 
} from '../../infrastructure/api/staff.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { PermissionService } from '../../../../core/auth/services/permission.service';
import { PERMISSIONS } from '../../../../core/config/permissions';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';
import { SelectOnFocusDirective } from '../../../../shared/utils/select-on-focus.directive';

@Component({
  selector: 'app-staff-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent, SelectOnFocusDirective],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Administración de Personal</span>
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Gestión de perfiles de empleados, registro de asistencia, adelantos, sanciones y horas extra.
          </p>
        </div>

        @if (canManageProfiles()) {
          <button 
            (click)="openCreateProfileModal()"
            class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-all self-start md:self-auto uppercase tracking-wider"
          >
            + Nuevo Perfil de Personal
          </button>
        }
      </div>

      <!-- ================= MAIN LAYOUT ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- STAFF PROFILES LIST (5 COLUMNS) -->
        <div class="lg:col-span-5 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-black uppercase text-gray-400 tracking-wider">Perfiles de Colaboradores</h3>
            <span class="text-[10px] font-black uppercase bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">
              {{ profiles().length }} Empleados
            </span>
          </div>

          <div class="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            @for (prof of profiles(); track prof.id) {
              @let u = getProfileUser(prof);
              <div 
                (click)="selectProfile(prof)"
                class="p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 text-xs"
                [class.bg-blue-50/40]="selectedProfile()?.id === prof.id"
                [class.border-blue-200]="selectedProfile()?.id === prof.id"
                [class.dark:bg-blue-950/10]="selectedProfile()?.id === prof.id"
                [class.dark:border-blue-900]="selectedProfile()?.id === prof.id"
                [class.bg-white]="selectedProfile()?.id !== prof.id"
                [class.border-gray-150]="selectedProfile()?.id !== prof.id"
                [class.dark:bg-gray-800]="selectedProfile()?.id !== prof.id"
                [class.dark:border-gray-800]="selectedProfile()?.id !== prof.id"
                [class.hover:bg-gray-50/50]="selectedProfile()?.id !== prof.id"
              >
                <div class="space-y-1">
                  <div class="font-extrabold text-sm text-gray-900 dark:text-white">
                    {{ u ? (u.firstName + ' ' + u.lastName) : 'Cargando...' }}
                  </div>
                  <div class="text-gray-400 font-bold font-mono text-[10px]">{{ u?.email }}</div>
                  
                  <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    @for (role of u?.roles || []; track role) {
                      <span class="px-2 py-0.5 rounded-md bg-blue-100/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-black text-[9px] uppercase">
                        {{ role }}
                      </span>
                    }
                    <span class="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 font-black text-[9px]">
                      {{ translatePaymentType(prof.paymentType) }}
                    </span>
                  </div>
                </div>

                <div class="text-right space-y-1.5 shrink-0 flex flex-col items-end">
                  <span class="font-black text-sm text-gray-900 dark:text-white">
                    S/ {{ prof.agreedAmount | number:'1.2-2' }}
                  </span>

                  <!-- Fingerprint Toggle / Badge -->
                  <div (click)="$event.stopPropagation()" class="flex items-center gap-1">
                    <label class="relative inline-flex items-center" [class.cursor-pointer]="canManageProfiles()">
                      <input 
                        type="checkbox"
                        [checked]="prof.fingerprintConsent"
                        [disabled]="!canManageProfiles()"
                        (change)="toggleFingerprintConsent(prof, $event)"
                        class="sr-only peer"
                      >
                      <div class="w-7 h-4 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                    </label>
                    <span 
                      [class.text-emerald-600]="prof.fingerprintConsent"
                      [class.text-gray-400]="!prof.fingerprintConsent"
                      class="text-[9px] font-black uppercase tracking-wider pl-1"
                    >
                      Huella
                    </span>
                  </div>
                </div>
              </div>
            }
            @if (profiles().length === 0) {
              <div class="py-12 text-center text-gray-400 italic">
                No hay perfiles de empleados registrados.
              </div>
            }
          </div>
        </div>

        <!-- PROFILE DETAILS & TABS (7 COLUMNS) -->
        <div class="lg:col-span-7 space-y-6">
          @if (selectedProfile(); as prof) {
            @let u = getProfileUser(prof);
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-6">
              
              <!-- Selected Employee Overview Header -->
              <div class="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 class="text-xl font-extrabold text-gray-900 dark:text-white">
                    {{ u ? (u.firstName + ' ' + u.lastName) : 'Cargando...' }}
                  </h3>
                  <div class="text-xs font-bold text-gray-400 mt-0.5">
                    {{ u?.email }} • Contrato de pago {{ translatePaymentType(prof.paymentType) }} (S/ {{ prof.agreedAmount | number:'1.2-2' }})
                  </div>
                </div>

                @if (canManageProfiles()) {
                  <button 
                    (click)="openEditProfileModal(prof)"
                    class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-250 dark:border-gray-800 text-gray-500 rounded-xl cursor-pointer"
                    title="Editar Contrato"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                }
              </div>

              <!-- Tab Navigation -->
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

              <!-- ================= TAB CONTENT 1: ASISTENCIA ================= -->
              @if (activeTab() === 'attendance') {
                <div class="space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 class="text-xs font-black uppercase text-gray-400 tracking-wider">Historial de Asistencias</h4>
                    
                    @if (canRegisterAttendance()) {
                      <div class="flex gap-2">
                        <button 
                          (click)="openAttendanceModal('IN')"
                          class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Marcar Entrada
                        </button>
                        <button 
                          (click)="openAttendanceModal('OUT')"
                          class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Marcar Salida
                        </button>
                      </div>
                    }
                  </div>

                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-bold border-collapse">
                      <thead>
                        <tr class="border-b border-gray-100 dark:border-gray-800 text-[9px] uppercase text-gray-400 tracking-wider">
                          <th class="py-2.5 px-3">Fecha</th>
                          <th class="py-2.5 px-3">Entrada</th>
                          <th class="py-2.5 px-3">Salida</th>
                          <th class="py-2.5 px-3">Método</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                        @for (att of attendance(); track att.id) {
                          <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                            <td class="py-3 px-3 font-extrabold text-gray-900 dark:text-white">
                              {{ (att.checkInAt || att.checkOutAt) | date:'dd/MM/yyyy' }}
                            </td>
                            <td class="py-3 px-3">
                              {{ att.checkInAt ? (att.checkInAt | date:'HH:mm:ss') : '-' }}
                            </td>
                            <td class="py-3 px-3">
                              {{ att.checkOutAt ? (att.checkOutAt | date:'HH:mm:ss') : '-' }}
                            </td>
                            <td class="py-3 px-3">
                              <span 
                                [class.bg-emerald-100/50]="att.method === 'FINGERPRINT_HASH'"
                                [class.text-emerald-700]="att.method === 'FINGERPRINT_HASH'"
                                [class.bg-blue-100/50]="att.method === 'MANUAL_BY_ADMIN'"
                                [class.text-blue-700]="att.method === 'MANUAL_BY_ADMIN'"
                                class="px-2 py-0.5 rounded text-[9px] font-black uppercase"
                              >
                                {{ att.method === 'FINGERPRINT_HASH' ? 'Huella' : 'Manual' }}
                              </span>
                            </td>
                          </tr>
                        }
                        @if (attendance().length === 0) {
                          <tr>
                            <td colspan="4" class="py-8 text-center text-gray-400 italic">
                              No hay registros de asistencia para este empleado.
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              <!-- ================= TAB CONTENT 2: ADELANTOS / DESCUENTOS ================= -->
              @if (activeTab() === 'adjustments') {
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs font-black uppercase text-gray-400 tracking-wider">Adelantos y Descuentos</h4>
                    @if (canRegisterAdvance()) {
                      <button 
                        (click)="openAdjustmentModal()"
                        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                      >
                        + Registrar Ajuste
                      </button>
                    }
                  </div>

                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-bold border-collapse">
                      <thead>
                        <tr class="border-b border-gray-100 dark:border-gray-800 text-[9px] uppercase text-gray-400 tracking-wider">
                          <th class="py-2.5 px-3">Fecha</th>
                          <th class="py-2.5 px-3">Tipo</th>
                          <th class="py-2.5 px-3">Registrado Por</th>
                          <th class="py-2.5 px-3 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                        @for (adj of adjustments(); track adj.id) {
                          <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                            <td class="py-3 px-3 font-extrabold text-gray-900 dark:text-white">
                              {{ adj.date | date:'dd/MM/yyyy' }}
                            </td>
                            <td class="py-3 px-3">
                              <span 
                                [class.bg-amber-100]="adj.type === 'ADVANCE'"
                                [class.text-amber-700]="adj.type === 'ADVANCE'"
                                [class.bg-rose-100]="adj.type === 'CONSUMPTION_DEDUCTION'"
                                [class.text-rose-700]="adj.type === 'CONSUMPTION_DEDUCTION'"
                                class="px-2 py-0.5 rounded text-[9px] font-black uppercase border"
                                [class.border-amber-250]="adj.type === 'ADVANCE'"
                                [class.border-rose-250]="adj.type === 'CONSUMPTION_DEDUCTION'"
                              >
                                {{ adj.type === 'ADVANCE' ? 'Adelanto' : 'Consumo' }}
                              </span>
                            </td>
                            <td class="py-3 px-3 text-gray-400">{{ adj.registeredBy }}</td>
                            <td class="py-3 px-3 text-right font-black text-gray-900 dark:text-white">
                              S/ {{ adj.amount | number:'1.2-2' }}
                            </td>
                          </tr>
                        }
                        @if (adjustments().length === 0) {
                          <tr>
                            <td colspan="4" class="py-8 text-center text-gray-400 italic">
                              No hay ajustes de nómina registrados.
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              <!-- ================= TAB CONTENT 3: SANCIONES ================= -->
              @if (activeTab() === 'sanctions') {
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs font-black uppercase text-gray-400 tracking-wider">Sanciones Registradas</h4>
                    @if (canRegisterSanction()) {
                      <button 
                        (click)="openSanctionModal()"
                        class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                      >
                        + Registrar Sanción
                      </button>
                    }
                  </div>

                  <div class="space-y-2.5">
                    @for (sanc of sanctions(); track sanc.id) {
                      <div class="p-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-150 dark:border-gray-800 text-xs space-y-2">
                        <div class="flex items-center justify-between gap-3">
                          <span 
                            [class.bg-rose-100]="sanc.type !== 'OTHER'"
                            [class.text-rose-700]="sanc.type !== 'OTHER'"
                            [class.bg-gray-200]="sanc.type === 'OTHER'"
                            [class.text-gray-700]="sanc.type === 'OTHER'"
                            class="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase border border-rose-200/50"
                          >
                            {{ translateSanctionType(sanc.type) }}
                          </span>
                          <span class="text-[10px] text-gray-400 font-extrabold">{{ sanc.date | date:'dd/MM/yyyy' }}</span>
                        </div>
                        <p class="font-extrabold text-gray-900 dark:text-white leading-relaxed">
                          {{ sanc.reason }}
                        </p>
                        <div class="text-[9px] text-gray-400">
                          Registrado por <span class="font-bold">{{ sanc.registeredBy }}</span>
                        </div>
                      </div>
                    }
                    @if (sanctions().length === 0) {
                      <div class="py-8 text-center text-gray-400 italic">
                        No hay sanciones registradas para este empleado.
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- ================= TAB CONTENT 4: HORAS EXTRA ================= -->
              @if (activeTab() === 'overtime') {
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs font-black uppercase text-gray-400 tracking-wider">Historial de Horas Extras</h4>
                    @if (canRegisterOvertime()) {
                      <button 
                        (click)="openOvertimeModal()"
                        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                      >
                        + Registrar Horas Extra
                      </button>
                    }
                  </div>

                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-bold border-collapse">
                      <thead>
                        <tr class="border-b border-gray-100 dark:border-gray-800 text-[9px] uppercase text-gray-400 tracking-wider">
                          <th class="py-2.5 px-3">Fecha</th>
                          <th class="py-2.5 px-3">Horas Registradas</th>
                          <th class="py-2.5 px-3">Registrado Por</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                        @for (ot of overtime(); track ot.id) {
                          <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                            <td class="py-3 px-3 font-extrabold text-gray-900 dark:text-white">
                              {{ ot.date | date:'dd/MM/yyyy' }}
                            </td>
                            <td class="py-3 px-3 font-black text-sm text-blue-600 dark:text-blue-400">
                              {{ ot.hours | number:'1.1-2' }} hrs
                            </td>
                            <td class="py-3 px-3 text-gray-400">{{ ot.registeredBy }}</td>
                          </tr>
                        }
                        @if (overtime().length === 0) {
                          <tr>
                            <td colspan="3" class="py-8 text-center text-gray-400 italic">
                              No hay horas extras registradas.
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              <!-- ================= TAB CONTENT 5: RESUMEN DE PAGO ================= -->
              @if (activeTab() === 'summary') {
                <div class="space-y-4">
                  <h4 class="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Resumen de Liquidación Pendiente</h4>

                  @if (summary(); as summ) {
                    <div class="grid grid-cols-2 gap-4">
                      <!-- Agreed Amount -->
                      <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 flex flex-col justify-between">
                        <span class="text-[10px] uppercase font-black tracking-wider text-gray-400">Monto Base Acordado</span>
                        <span class="text-lg font-black text-gray-900 dark:text-white mt-1">S/ {{ summ.agreedAmount | number:'1.2-2' }}</span>
                      </div>

                      <!-- Overtime Hours -->
                      <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 flex flex-col justify-between">
                        <span class="text-[10px] uppercase font-black tracking-wider text-gray-400">Horas Extra Acumuladas</span>
                        <span class="text-lg font-black text-blue-600 mt-1">{{ summ.totalOvertimeHours | number:'1.1-2' }} hrs</span>
                      </div>

                      <!-- Advances -->
                      <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 flex flex-col justify-between">
                        <span class="text-[10px] uppercase font-black tracking-wider text-gray-400">Total Adelantos</span>
                        <span class="text-lg font-black text-rose-600 mt-1">- S/ {{ summ.totalAdvances | number:'1.2-2' }}</span>
                      </div>

                      <!-- Deductions -->
                      <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 flex flex-col justify-between">
                        <span class="text-[10px] uppercase font-black tracking-wider text-gray-400">Descuentos por Consumo</span>
                        <span class="text-lg font-black text-rose-600 mt-1">- S/ {{ summ.totalDeductions | number:'1.2-2' }}</span>
                      </div>
                    </div>

                    <!-- Net Pending Card -->
                    <div class="p-5 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-between mt-6">
                      <div>
                        <span class="text-[10px] uppercase font-black tracking-wider text-blue-600 dark:text-blue-400">Neto Pendiente de Pago</span>
                        <p class="text-xs text-gray-400 mt-0.5">Calculado automáticamente por el servidor con horas extra y descuentos aplicados.</p>
                      </div>
                      <span class="text-2xl font-black text-blue-600 dark:text-blue-400">
                        S/ {{ summ.netPending | number:'1.2-2' }}
                      </span>
                    </div>
                  } @else {
                    <div class="py-8 text-center text-gray-400 italic">
                      Cargando resumen de nómina...
                    </div>
                  }
                </div>
              }

            </div>
          } @else {
            <div class="py-24 text-center text-gray-400 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <svg class="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Selecciona un colaborador de la lista para gestionar su contrato, asistencias, adelantos y resumen de pago.
            </div>
          }
        </div>
      </div>

    </div>

    <!-- ================= MODAL: PERFIL DE PERSONAL (CREAR / EDITAR) ================= -->
    <app-modal-shell
      [open]="isProfileModalOpen()"
      [title]="profileModalEditMode() ? 'Editar Contrato' : 'Nuevo Perfil de Personal'"
      description="Vincula una cuenta de usuario a un contrato de pago y asocia sus detalles de liquidación."
      (close)="closeProfileModal()"
    >
      <form (submit)="saveProfile()" class="space-y-4">
        
        <!-- Account Selector (Only on creation) -->
        @if (!profileModalEditMode()) {
          <div>
            <label class="block text-xs font-black uppercase text-gray-400 mb-1">Cuenta del Colaborador</label>
            <select 
              [(ngModel)]="profileForm.accountId"
              name="profAccount"
              required
              class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option [ngValue]="null" disabled selected>Selecciona una cuenta...</option>
              @for (acc of availableAccounts(); track acc.id) {
                <option [ngValue]="acc.id">
                  {{ acc.firstName }} {{ acc.lastName }} ({{ acc.email }})
                </option>
              }
            </select>
          </div>
        }

        <!-- Payment Type -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Tipo de Liquidación / Pago</label>
          <select 
            [(ngModel)]="profileForm.paymentType"
            name="profPaymentType"
            required
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DAILY">Diario</option>
            <option value="BIWEEKLY">Quincenal</option>
            <option value="MONTHLY">Mensual</option>
          </select>
        </div>

        <!-- Agreed Amount -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Sueldo / Monto Acordado (S/)</label>
          <input 
            type="number" 
            step="0.01" 
            min="0.01"
            required
            [(ngModel)]="profileForm.agreedAmount"
            name="profAmount"
            placeholder="0.00"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeProfileModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            [disabled]="!profileModalEditMode() && !profileForm.accountId"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Guardar Contrato
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL: MARCAR ASISTENCIA (ENTRADA / SALIDA) ================= -->
    <app-modal-shell
      [open]="isAttendanceModalOpen()"
      [title]="attendanceMode() === 'IN' ? 'Registrar Entrada' : 'Registrar Salida'"
      description="Registra la asistencia del colaborador de manera manual en el sistema."
      (close)="closeAttendanceModal()"
    >
      <form (submit)="saveAttendance()" class="space-y-4">
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Fecha y Hora de Marcación</label>
          <input 
            type="datetime-local" 
            required
            [(ngModel)]="attendanceDateTimeInput"
            name="attDateTime"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider leading-relaxed">
          Esta marcación administrativa quedará registrada como manual (MANUAL_BY_ADMIN) con tu firma de usuario auditor.
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeAttendanceModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Confirmar Registro
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL: ADELANTOS / DESCUENTOS ================= -->
    <app-modal-shell
      [open]="isAdjustmentModalOpen()"
      title="Registrar Adelanto / Descuento"
      description="Agrega un vale de adelanto o un cobro por consumos al estado de nómina del empleado."
      (close)="closeAdjustmentModal()"
    >
      <form (submit)="saveAdjustment()" class="space-y-4">
        <!-- Adjustment Type -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Tipo de Ajuste</label>
          <select 
            [(ngModel)]="adjustmentForm.type"
            name="adjType"
            required
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ADVANCE">Adelanto (Vale de Caja)</option>
            <option value="CONSUMPTION_DEDUCTION">Descuento por Consumo Interno</option>
          </select>
        </div>

        <!-- Amount -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Monto (S/)</label>
          <input 
            type="number" 
            step="0.01" 
            min="0.01"
            required
            [(ngModel)]="adjustmentForm.amount"
            name="adjAmount"
            placeholder="0.00"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Date -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Fecha</label>
          <input 
            type="date" 
            required
            [(ngModel)]="adjustmentForm.date"
            name="adjDate"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeAdjustmentModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Registrar Ajuste
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL: SANCIONES ================= -->
    <app-modal-shell
      [open]="isSanctionModalOpen()"
      title="Registrar Sanción Administrativa"
      description="Registra faltas o incidentes de conducta para control disciplinario."
      (close)="closeSanctionModal()"
    >
      <form (submit)="saveSanction()" class="space-y-4">
        <!-- Sanction Type -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Gravedad / Tipo de Falta</label>
          <select 
            [(ngModel)]="sanctionForm.type"
            name="sancType"
            required
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UNJUSTIFIED_ABSENCE">Inasistencia Injustificada</option>
            <option value="LATE_ARRIVAL">Tardanza Excesiva</option>
            <option value="MISCONDUCT">Problemas de Conducta / Indisciplina</option>
            <option value="BROKEN_ITEMS">Dañar Materiales / Vajilla Rota</option>
            <option value="OTHER">Otro (Detalle requerido abajo)</option>
          </select>
        </div>

        <!-- Reason / Description -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Detalle o Explicación (Obligatorio)</label>
          <textarea 
            required
            [(ngModel)]="sanctionForm.reason"
            name="sancReason"
            rows="3"
            placeholder="Describe las circunstancias, daños o justificación..."
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <!-- Date -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Fecha de la Falta</label>
          <input 
            type="date" 
            required
            [(ngModel)]="sanctionForm.date"
            name="sancDate"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeSanctionModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            [disabled]="!sanctionForm.reason.trim()"
            class="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Registrar Sanción
          </button>
        </div>
      </form>
    </app-modal-shell>

    <!-- ================= MODAL: HORAS EXTRA ================= -->
    <app-modal-shell
      [open]="isOvertimeModalOpen()"
      title="Registrar Horas Extra"
      description="Registra las horas adicionales trabajadas por el empleado autorizadas por administración."
      (close)="closeOvertimeModal()"
    >
      <form (submit)="saveOvertime()" class="space-y-4">
        <!-- Hours -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Cantidad de Horas</label>
          <input 
            type="number" 
            step="0.5" 
            min="0.5"
            required
            [(ngModel)]="overtimeForm.hours"
            name="otHours"
            placeholder="0"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Date -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-400 mb-1">Fecha</label>
          <input 
            type="date" 
            required
            [(ngModel)]="overtimeForm.date"
            name="otDate"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="closeOvertimeModal()"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
          >
            Registrar Horas Extra
          </button>
        </div>
      </form>
    </app-modal-shell>
  `
})
export class StaffPageComponent implements OnInit {
  private api = inject(StaffApi);
  private notify = inject(NotificationService);
  private permissionService = inject(PermissionService);

  private getLocalDateString(d: Date = new Date()): string {
    const tzoffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzoffset).toISOString().split('T')[0];
  }

  public readonly PERMISSIONS = PERMISSIONS;

  // Granular Permissions
  public canManageProfiles = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.STAFF.MANAGE_EMPLOYEES));
  public canRegisterAttendance = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.STAFF.REGISTER_ATTENDANCE));
  public canRegisterAdvance = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.STAFF.REGISTER_ADVANCE));
  public canRegisterSanction = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.STAFF.REGISTER_SANCTION));
  public canRegisterOvertime = computed(() => this.permissionService.hasPermission(this.PERMISSIONS.STAFF.REGISTER_OVERTIME));

  // State Signals
  public users = signal<UserResource[]>([]);
  public profiles = signal<StaffProfile[]>([]);
  public selectedProfile = signal<StaffProfile | null>(null);

  // Sub-records for current selected profile
  public attendance = signal<AttendanceRecord[]>([]);
  public adjustments = signal<PayrollAdjustment[]>([]);
  public sanctions = signal<Sanction[]>([]);
  public overtime = signal<OvertimeRecord[]>([]);
  public summary = signal<PaymentSummary | null>(null);

  // Selector for accounts without profile
  public availableAccounts = computed(() => {
    const allUsers = this.users();
    const activeProfiles = this.profiles();
    return allUsers.filter(u => !activeProfiles.some(p => p.accountId === u.id));
  });

  // Tab State
  public activeTab = signal<string>('attendance');
  public readonly tabs = [
    { id: 'attendance', label: 'Asistencia' },
    { id: 'adjustments', label: 'Adelantos / Descuentos' },
    { id: 'sanctions', label: 'Sanciones' },
    { id: 'overtime', label: 'Horas Extra' },
    { id: 'summary', label: 'Resumen de Pago' }
  ];

  // Modals Visibility
  public isProfileModalOpen = signal<boolean>(false);
  public profileModalEditMode = signal<boolean>(false);

  public isAttendanceModalOpen = signal<boolean>(false);
  public attendanceMode = signal<'IN' | 'OUT'>('IN');

  public isAdjustmentModalOpen = signal<boolean>(false);
  public isSanctionModalOpen = signal<boolean>(false);
  public isOvertimeModalOpen = signal<boolean>(false);

  // Forms Inputs
  public profileForm = { id: 0, accountId: null as number | null, paymentType: 'MONTHLY' as 'DAILY' | 'BIWEEKLY' | 'MONTHLY', agreedAmount: 0 };
  public attendanceDateTimeInput = '';
  public adjustmentForm = { type: 'ADVANCE', amount: 0, date: '' };
  public sanctionForm = { type: 'UNJUSTIFIED_ABSENCE', reason: '', date: '' };
  public overtimeForm = { hours: 0, date: '' };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    // Load accounts
    this.api.getUsers().subscribe({
      next: (data) => this.users.set(data),
      error: () => this.notify.error('No se pudo cargar la lista de cuentas de usuario.')
    });

    // Load staff profiles
    this.api.getProfiles().subscribe({
      next: (data) => {
        this.profiles.set(data);
        // Refresh selected profile if any
        const selected = this.selectedProfile();
        if (selected) {
          const updated = data.find(p => p.id === selected.id);
          if (updated) {
            this.selectedProfile.set(updated);
          }
        }
      },
      error: () => this.notify.error('No se pudo cargar la lista de perfiles de personal.')
    });
  }

  getProfileUser(profile: StaffProfile): UserResource | undefined {
    return this.users().find(u => u.id === profile.accountId);
  }

  translatePaymentType(type: string): string {
    switch (type) {
      case 'DAILY': return 'Diario';
      case 'BIWEEKLY': return 'Quincenal';
      case 'MONTHLY': return 'Mensual';
      default: return type;
    }
  }

  translateSanctionType(type: string): string {
    switch (type) {
      case 'UNJUSTIFIED_ABSENCE': return 'Falta Injustificada';
      case 'LATE_ARRIVAL': return 'Tardanza';
      case 'MISCONDUCT': return 'Falta Disciplinaria';
      case 'BROKEN_ITEMS': return 'Materiales Dañados';
      case 'OTHER': return 'Otro';
      default: return type;
    }
  }

  selectProfile(prof: StaffProfile): void {
    this.selectedProfile.set(prof);
    this.activeTab.set('attendance');
    this.loadProfileDetails(prof.id);
  }

  loadProfileDetails(profileId: number): void {
    // 1. Fetch attendance
    this.api.getAttendance(profileId).subscribe({
      next: (data) => this.attendance.set(data),
      error: () => this.notify.error('Error al cargar asistencia del empleado.')
    });

    // 2. Fetch adjustments
    this.api.getPayrollAdjustments(profileId).subscribe({
      next: (data) => this.adjustments.set(data),
      error: () => this.notify.error('Error al cargar adelantos y descuentos.')
    });

    // 3. Fetch sanctions
    this.api.getSanctions(profileId).subscribe({
      next: (data) => this.sanctions.set(data),
      error: () => this.notify.error('Error al cargar sanciones.')
    });

    // 4. Fetch overtime
    this.api.getOvertime(profileId).subscribe({
      next: (data) => this.overtime.set(data),
      error: () => this.notify.error('Error al cargar horas extras.')
    });

    // 5. Fetch payment summary
    this.api.getPaymentSummary(profileId).subscribe({
      next: (data) => this.summary.set(data),
      error: () => this.notify.error('Error al cargar el resumen de pagos.')
    });
  }

  // --- STAFF PROFILE CRUD ---
  openCreateProfileModal(): void {
    this.profileModalEditMode.set(false);
    this.profileForm = { id: 0, accountId: null, paymentType: 'MONTHLY', agreedAmount: 0 };
    this.isProfileModalOpen.set(true);
  }

  openEditProfileModal(prof: StaffProfile): void {
    this.profileModalEditMode.set(true);
    this.profileForm = { id: prof.id, accountId: prof.accountId, paymentType: prof.paymentType, agreedAmount: prof.agreedAmount };
    this.isProfileModalOpen.set(true);
  }

  closeProfileModal(): void {
    this.isProfileModalOpen.set(false);
  }

  saveProfile(): void {
    const { id, accountId, paymentType, agreedAmount } = this.profileForm;
    if (agreedAmount <= 0) {
      this.notify.error('Ingresa un sueldo acordado válido mayor a cero.');
      return;
    }

    if (this.profileModalEditMode()) {
      this.api.updateProfile(id, { accountId: accountId!, paymentType, agreedAmount }).subscribe({
        next: (res) => {
          this.notify.success('Contrato de pago actualizado.');
          this.closeProfileModal();
          this.loadAll();
          // Update selected profile details if it's the one edited
          if (this.selectedProfile()?.id === id) {
            this.selectedProfile.set(res);
            this.loadProfileDetails(id);
          }
        },
        error: () => this.notify.error('No se pudo actualizar el perfil de personal.')
      });
    } else {
      if (!accountId) {
        this.notify.error('Selecciona una cuenta de usuario.');
        return;
      }
      this.api.createProfile({ accountId, paymentType, agreedAmount }).subscribe({
        next: (res) => {
          this.notify.success('Perfil de personal creado con éxito.');
          this.closeProfileModal();
          this.loadAll();
          this.selectProfile(res);
        },
        error: () => this.notify.error('Error al registrar el perfil del colaborador.')
      });
    }
  }

  toggleFingerprintConsent(prof: StaffProfile, event: Event): void {
    const input = event.target as HTMLInputElement;
    const originalConsent = prof.fingerprintConsent;
    const newConsent = input.checked;

    this.api.recordFingerprintConsent(prof.id, newConsent).subscribe({
      next: (updated) => {
        this.notify.success(newConsent ? 'Consentimiento de huella registrado.' : 'Consentimiento de huella revocado.');
        this.loadAll();
      },
      error: () => {
        this.notify.error('No se pudo guardar el consentimiento de huella.');
        input.checked = originalConsent;
      }
    });
  }

  // --- ATTENDANCE ACTIONS ---
  openAttendanceModal(mode: 'IN' | 'OUT'): void {
    this.attendanceMode.set(mode);
    // Prefill local date-time string in ISO format for datetime-local
    const now = new Date();
    // Offset local timezone
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
    this.attendanceDateTimeInput = localISOTime;
    this.isAttendanceModalOpen.set(true);
  }

  closeAttendanceModal(): void {
    this.isAttendanceModalOpen.set(false);
  }

  saveAttendance(): void {
    const prof = this.selectedProfile();
    const mode = this.attendanceMode();
    if (!prof) return;

    if (!this.attendanceDateTimeInput) {
      this.notify.error('Selecciona una fecha y hora.');
      return;
    }

    // Send local date-time directly to avoid timezone shift bugs
    const formattedDateTime = this.attendanceDateTimeInput;

    if (mode === 'IN') {
      this.api.checkIn({ 
        staffProfileId: prof.id, 
        method: 'MANUAL_BY_ADMIN', 
        checkInAt: formattedDateTime 
      }).subscribe({
        next: () => {
          this.notify.success('Marcación de Entrada registrada.');
          this.closeAttendanceModal();
          this.loadProfileDetails(prof.id);
        },
        error: (err) => this.notify.error(err.error?.message || 'Error al registrar entrada.')
      });
    } else {
      this.api.checkOut({ 
        staffProfileId: prof.id, 
        checkOutAt: formattedDateTime 
      }).subscribe({
        next: () => {
          this.notify.success('Marcación de Salida registrada.');
          this.closeAttendanceModal();
          this.loadProfileDetails(prof.id);
        },
        error: (err) => this.notify.error(err.error?.message || 'Error al registrar salida.')
      });
    }
  }

  // --- PAYROLL ADJUSTMENTS ---
  openAdjustmentModal(): void {
    this.adjustmentForm = {
      type: 'ADVANCE',
      amount: 0,
      date: this.getLocalDateString()
    };
    this.isAdjustmentModalOpen.set(true);
  }

  closeAdjustmentModal(): void {
    this.isAdjustmentModalOpen.set(false);
  }

  saveAdjustment(): void {
    const prof = this.selectedProfile();
    if (!prof) return;

    const { type, amount, date } = this.adjustmentForm;
    if (amount <= 0) {
      this.notify.error('Ingresa un monto válido.');
      return;
    }
    if (!date) {
      this.notify.error('Selecciona una fecha.');
      return;
    }

    this.api.createPayrollAdjustment(prof.id, { type, amount, date }).subscribe({
      next: () => {
        this.notify.success('Ajuste de nómina registrado.');
        this.closeAdjustmentModal();
        this.loadProfileDetails(prof.id);
      },
      error: (err) => this.notify.error(err.error?.message || 'Error al registrar ajuste.')
    });
  }

  // --- SANCTIONS ---
  openSanctionModal(): void {
    this.sanctionForm = {
      type: 'UNJUSTIFIED_ABSENCE',
      reason: '',
      date: this.getLocalDateString()
    };
    this.isSanctionModalOpen.set(true);
  }

  closeSanctionModal(): void {
    this.isSanctionModalOpen.set(false);
  }

  saveSanction(): void {
    const prof = this.selectedProfile();
    if (!prof) return;

    const { type, reason, date } = this.sanctionForm;
    if (!reason.trim()) {
      this.notify.error('Detalla la explicación o motivo de la sanción.');
      return;
    }
    if (!date) {
      this.notify.error('Selecciona la fecha del incidente.');
      return;
    }

    this.api.createSanction(prof.id, { type, reason: reason.trim(), date }).subscribe({
      next: () => {
        this.notify.success('Sanción administrativa registrada.');
        this.closeSanctionModal();
        this.loadProfileDetails(prof.id);
      },
      error: (err) => this.notify.error(err.error?.message || 'Error al registrar sanción.')
    });
  }

  // --- OVERTIME ---
  openOvertimeModal(): void {
    this.overtimeForm = {
      hours: 0,
      date: this.getLocalDateString()
    };
    this.isOvertimeModalOpen.set(true);
  }

  closeOvertimeModal(): void {
    this.isOvertimeModalOpen.set(false);
  }

  saveOvertime(): void {
    const prof = this.selectedProfile();
    if (!prof) return;

    const { hours, date } = this.overtimeForm;
    if (hours <= 0) {
      this.notify.error('Las horas extras deben ser mayores a cero.');
      return;
    }
    if (!date) {
      this.notify.error('Selecciona la fecha.');
      return;
    }

    this.api.createOvertime(prof.id, { hours, date }).subscribe({
      next: () => {
        this.notify.success('Horas extras registradas con éxito.');
        this.closeOvertimeModal();
        this.loadProfileDetails(prof.id);
      },
      error: (err) => this.notify.error(err.error?.message || 'Error al registrar horas extras.')
    });
  }
}
