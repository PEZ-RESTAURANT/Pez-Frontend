import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KitchenApi, KitchenZone } from '../../infrastructure/api/kitchen.api';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalShellComponent } from '../../../../shared/ui/modal/modal-shell.component';

@Component({
  selector: 'app-kitchen-zones-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-6">

      <!-- ================= HEADER CARD ================= -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm animate-in fade-in duration-300">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Zonas de Cocina</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Administra las diferentes estaciones de preparación para el despacho de comandas.
          </p>
        </div>

        <button 
          (click)="openCreateModal()"
          class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors uppercase tracking-wider"
        >
          + Nueva Zona
        </button>
      </div>

      <!-- ================= LISTADO DE ZONAS ================= -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-gray-100 dark:border-gray-850">
          <h3 class="text-sm font-black text-gray-400 uppercase tracking-wider">Catálogo de Estaciones</h3>
        </div>

        <div class="divide-y divide-gray-100 dark:divide-gray-850">
          @for (zone of zones(); track zone.id) {
            <div class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors">
              <div class="flex items-center gap-3">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ zone.name }}</span>
              </div>

              <div class="flex items-center gap-2">
                <button 
                  (click)="openEditModal(zone)"
                  class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors cursor-pointer"
                  title="Renombrar"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  (click)="deleteZone(zone)"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          }
          @if (zones().length === 0) {
            <div class="p-8 text-center text-gray-400">
              No hay zonas de cocina configuradas en este momento.
            </div>
          }
        </div>
      </div>

    </div>

    <!-- MODAL DE CREACIÓN / EDICIÓN -->
    <app-modal-shell
      [open]="isModalOpen()"
      [title]="editMode() ? 'Renombrar Zona' : 'Nueva Zona de Cocina'"
      [description]="editMode() ? 'Escribe el nuevo nombre para actualizar la zona de cocina.' : 'Registra una nueva zona para agrupar y filtrar la preparación de tus productos.'"
      [hasFooter]="true"
      (close)="closeModal()"
    >
      <form (submit)="saveZone()" class="space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
        <div>
          <label class="block text-[10px] font-black uppercase text-gray-400 mb-1.5">Nombre de la Zona</label>
          <input 
            type="text"
            required
            [(ngModel)]="zoneForm.name"
            name="zName"
            placeholder="Ej. Parrilla, Barra, Calientes"
            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button"
            (click)="closeModal()"
            class="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-850 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            [disabled]="!zoneForm.name.trim()"
            class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
          >
            {{ editMode() ? 'Actualizar' : 'Guardar Zona' }}
          </button>
        </div>
      </form>
    </app-modal-shell>
  `
})
export class KitchenZonesPageComponent implements OnInit {
  private api = inject(KitchenApi);
  private notify = inject(NotificationService);

  public zones = signal<KitchenZone[]>([]);
  public isModalOpen = signal<boolean>(false);
  public editMode = signal<boolean>(false);

  public zoneForm = { id: 0, name: '' };

  ngOnInit(): void {
    this.loadZones();
  }

  loadZones(): void {
    this.api.getZones().subscribe({
      next: (data) => this.zones.set(data),
      error: () => this.notify.error('Error al cargar las zonas de cocina.')
    });
  }

  openCreateModal(): void {
    this.editMode.set(false);
    this.zoneForm = { id: 0, name: '' };
    this.isModalOpen.set(true);
  }

  openEditModal(zone: KitchenZone): void {
    this.editMode.set(true);
    this.zoneForm = { id: zone.id, name: zone.name };
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveZone(): void {
    const name = this.zoneForm.name.trim();
    if (!name) return;

    if (this.editMode()) {
      this.api.updateZone(this.zoneForm.id, name).subscribe({
        next: () => {
          this.notify.success('Zona renombrada.');
          this.closeModal();
          this.loadZones();
        },
        error: (err) => this.notify.error(err.error?.message || 'Error al renombrar la zona.')
      });
    } else {
      this.api.createZone(name).subscribe({
        next: () => {
          this.notify.success('Zona de cocina creada.');
          this.closeModal();
          this.loadZones();
        },
        error: (err) => this.notify.error(err.error?.message || 'Error al crear la zona de cocina.')
      });
    }
  }

  deleteZone(zone: KitchenZone): void {
    const msg = `¿Estás seguro de eliminar permanentemente la zona de cocina "${zone.name}"?\n\n` +
                `IMPORTANTE: Todos los productos asociados perderán su asignación y pasarán a procesarse en la cola general de cocina.`;
    
    if (!confirm(msg)) return;

    this.api.deleteZone(zone.id).subscribe({
      next: () => {
        this.notify.success(`Zona "${zone.name}"  eliminada.`);
        this.loadZones();
      },
      error: (err) => this.notify.error(err.error?.message || 'No se pudo eliminar la zona.')
    });
  }
}
