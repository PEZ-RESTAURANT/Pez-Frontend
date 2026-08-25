import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperationalConfigApi, OperationalConfig } from '../../infrastructure/api/operational-config.api';
import { NotificationService } from '../../../../core/services/notification.service';

import { SelectDirective } from '../../../../shared/ui/select/select.directive';

@Component({
  selector: 'app-operational-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectDirective],
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <!-- HEADER -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Configuración Operativa
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Ajustes generales del local, límites de tiempo para alertas en el salón y corte de arqueo de caja.
        </p>
      </div>

      <!-- FORM -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-6">
        
        <!-- SECCIÓN: CAJA Y TURNOS -->
        <div class="space-y-4">
          <div class="border-b border-gray-100 dark:border-gray-700/60 pb-2">
            <h3 class="text-sm font-black uppercase text-gray-900 dark:text-white tracking-wider flex items-center gap-2">
              <svg class="h-4.5 w-4.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Corte y Cierre de Caja
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Hora de Cierre Forzado *</label>
              <input 
                type="time" 
                required
                [(ngModel)]="cutoffTimeInput"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p class="text-[10px] text-gray-400 mt-1.5 font-medium">
                Hora programada en la que el sistema cerrará automáticamente cualquier turno de caja que haya quedado abierto desde el día anterior (corte diario).
              </p>
            </div>
          </div>
        </div>

        <!-- SECCIÓN: SALÓN Y MONITOREO DE MESAS -->
        <div class="space-y-4 pt-4">
          <div class="border-b border-gray-100 dark:border-gray-700/60 pb-2">
            <h3 class="text-sm font-black uppercase text-gray-900 dark:text-white tracking-wider flex items-center gap-2">
              <svg class="h-4.5 w-4.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Monitoreo y Tolerancias de Mesas
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Mesa sin atender (Minutos) *</label>
              <input 
                type="number" 
                min="1"
                required
                [(ngModel)]="config.unattendedThresholdMinutes"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p class="text-[10px] text-gray-400 mt-1.5 font-medium">
                Tolerancia de espera desde que un cliente solicita atención (Mesa en Cola) antes de disparar alerta visual de demora en el mapa.
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Esperando pedido en Cocina (Minutos) *</label>
              <input 
                type="number" 
                min="1"
                required
                [(ngModel)]="config.waitingDishesThresholdMinutes"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p class="text-[10px] text-gray-400 mt-1.5 font-medium">
                Tolerancia máxima para la preparación de los platos solicitados en cocina antes de disparar la alerta de retraso en la entrega.
              </p>
            </div>
          </div>
        </div>

        <!-- SECCIÓN: NOTIFICACIONES Y RESUMEN DIARIO -->
        <div class="space-y-4 pt-4">
          <div class="border-b border-gray-100 dark:border-gray-700/60 pb-2">
            <h3 class="text-sm font-black uppercase text-gray-900 dark:text-white tracking-wider flex items-center gap-2">
              <svg class="h-4.5 w-4.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notificaciones y Reportes por Correo
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Notificación de Anulaciones *</label>
              <select appSelect
                required
                [(ngModel)]="config.annulmentNotificationPref"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INSTANT">Instantánea (Correo en el momento)</option>
                <option value="SUMMARY">Resumen Diario (Consolidado al cierre)</option>
                <option value="NONE">Ninguna</option>
              </select>
              <p class="text-[10px] text-gray-400 mt-1.5 font-medium">
                Indica cuándo y cómo deben notificarse las cancelaciones de platos/ítems por parte del personal de caja o salón.
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Hora del Reporte Diario Consolidado *</label>
              <input 
                type="time" 
                required
                [(ngModel)]="config.dailySummaryTime"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p class="text-[10px] text-gray-400 mt-1.5 font-medium">
                Hora a la que se compilará y enviará el correo consolidado con el stock bajo, asistencias, anulaciones y estado de cajas.
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Alerta de Asistencias sin Salida *</label>
              <select appSelect
                required
                [(ngModel)]="config.unresolvedAttendanceNotificationPref"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BOTH">Administrador y Cajero (Ambos)</option>
                <option value="ADMIN">Solo Administrador</option>
                <option value="CASHIER">Solo Cajero</option>
              </select>
              <p class="text-[10px] text-gray-400 mt-1.5 font-medium">
                Define a qué roles del sistema se les mostrará la notificación visual toast al cierre de un turno cuando queden entradas sin salida.
              </p>
            </div>
          </div>
        </div>

        <!-- ACCIONES -->
        <div class="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700/60">
          <button 
            (click)="saveConfig()"
            [disabled]="loading()"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md uppercase tracking-wider transition-all"
          >
            Guardar Configuración
          </button>
        </div>

      </div>

    </div>
  `
})
export class OperationalSettingsPageComponent implements OnInit {
  private api = inject(OperationalConfigApi);
  private notify = inject(NotificationService);

  public loading = signal<boolean>(false);
  public config: OperationalConfig = {
    cutoffHour: 3,
    cutoffMinute: 0,
    unattendedThresholdMinutes: 15,
    waitingDishesThresholdMinutes: 30,
    annulmentNotificationPref: 'INSTANT',
    dailySummaryTime: '22:00'
  };

  public cutoffTimeInput = '03:00';

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading.set(true);
    this.api.getConfig().subscribe({
      next: (cfg) => {
        this.config = cfg;
        const hStr = String(cfg.cutoffHour).padStart(2, '0');
        const mStr = String(cfg.cutoffMinute).padStart(2, '0');
        this.cutoffTimeInput = `${hStr}:${mStr}`;
        if (!cfg.dailySummaryTime) {
          this.config.dailySummaryTime = '22:00';
        }
        if (!cfg.annulmentNotificationPref) {
          this.config.annulmentNotificationPref = 'INSTANT';
        }
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('No se pudo cargar la configuración operativa.');
        this.loading.set(false);
      }
    });
  }

  saveConfig(): void {
    const parts = this.cutoffTimeInput.split(':');
    if (parts.length === 2) {
      this.config.cutoffHour = parseInt(parts[0], 10);
      this.config.cutoffMinute = parseInt(parts[1], 10);
    }

    if (this.config.unattendedThresholdMinutes <= 0 || this.config.waitingDishesThresholdMinutes <= 0) {
      this.notify.error('Los umbrales deben ser mayores a cero.');
      return;
    }

    this.loading.set(true);
    this.api.updateConfig(this.config).subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.notify.success('Configuración operativa actualizada correctamente.');
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Error al guardar la configuración.');
        this.loading.set(false);
      }
    });
  }
}
