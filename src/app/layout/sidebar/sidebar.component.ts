import { Component, signal, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HasPermissionDirective } from '../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../core/config/permissions';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HasPermissionDirective],
  template: `
    <aside 
      [class.w-64]="!isCollapsed()" 
      [class.w-16]="isCollapsed()" 
      class="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-foreground flex flex-col h-full shrink-0 transition-all duration-200"
    >
      <!-- BRAND LOGO -->
      <div class="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800 shrink-0">
        <span *ngIf="!isCollapsed()" class="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-wider font-mono">Al Toque</span>
        <span *ngIf="isCollapsed()" class="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">AT</span>
      </div>

      <!-- MAIN NAVIGATION -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-4">
        
        <!-- DASHBOARD (Siempre visible) -->
        <div class="space-y-1">
          <a
            routerLink="/app/dashboard"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [routerLinkActiveOptions]="{ exact: true }"
            [title]="isCollapsed() ? 'Dashboard' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            <span *ngIf="!isCollapsed()">Dashboard</span>
          </a>
        </div>

        <!-- SECCIÓN: OPERACIÓN -->
        <div class="space-y-1">
          <div *ngIf="!isCollapsed()" class="px-3 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Operación
          </div>
          <div *ngIf="isCollapsed()" class="border-b border-gray-155 dark:border-gray-800/80 my-2 mx-1"></div>
          
          <!-- Mesas & Pedidos -->
          <a
            *hasPermission="PERMISSIONS.ORDERS.VIEW_TABLE_MAP"
            routerLink="/app/orders"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Mapa de Mesas' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span *ngIf="!isCollapsed()">Mapa de Mesas</span>
          </a>

          <!-- Cocina -->
          <a
            *hasPermission="PERMISSIONS.KITCHEN.VIEW_OWN_ZONE"
            routerLink="/app/kitchen"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Cocina' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span *ngIf="!isCollapsed()">Cocina</span>
          </a>

          <!-- Caja -->
          <a
            *hasPermission="PERMISSIONS.CASHREGISTER.VIEW"
            routerLink="/app/cashregister"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Caja' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span *ngIf="!isCollapsed()">Caja</span>
          </a>

          <!-- Historial de Ventas -->
          <a
            *hasPermission="PERMISSIONS.CASHREGISTER.VIEW"
            routerLink="/app/orders/history"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Historial de Ventas' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span *ngIf="!isCollapsed()">Historial Ventas</span>
          </a>

          <!-- Reservas -->
          <a
            *hasPermission="PERMISSIONS.RESERVATIONS.VIEW"
            routerLink="/app/reservations"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Reservas' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span *ngIf="!isCollapsed()">Reservas</span>
          </a>

          <!-- Inventario (Stock) -->
          <a
            *hasPermission="PERMISSIONS.INVENTORY.VIEW"
            routerLink="/app/inventory"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Inventario (Stock)' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span *ngIf="!isCollapsed()">Inventario (Stock)</span>
          </a>
        </div>

        <!-- SECCIÓN: ADMINISTRACIÓN -->
        <div class="space-y-1">
          <div *ngIf="!isCollapsed()" class="px-3 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Administración
          </div>
          <div *ngIf="isCollapsed()" class="border-b border-gray-155 dark:border-gray-800/80 my-2 mx-1"></div>

          <!-- Catálogo -->
          <a
            *hasPermission="PERMISSIONS.CATALOG.EDIT_PRODUCTS_CATEGORIES"
            routerLink="/app/catalog"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Catálogo' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span *ngIf="!isCollapsed()">Catálogo</span>
          </a>

          <!-- Layout de Mesas -->
          <a
            *hasPermission="PERMISSIONS.ORDERS.EDIT_LAYOUT"
            routerLink="/app/admin/layout"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Layout Mesas' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span *ngIf="!isCollapsed()">Layout Mesas</span>
          </a>

          <!-- Zonas de Cocina -->
          <a
            *hasPermission="PERMISSIONS.CATALOG.EDIT_KITCHEN_ZONES"
            routerLink="/app/admin/kitchen-zones"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Zonas de Cocina' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span *ngIf="!isCollapsed()">Zonas de Cocina</span>
          </a>

          <!-- Cuentas de Personal -->
          <a
            *hasPermission="PERMISSIONS.IAM.MANAGE_ACCOUNTS"
            routerLink="/app/admin/staff-accounts"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Cuentas de Personal' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span *ngIf="!isCollapsed()">Cuentas de Personal</span>
          </a>

          <!-- Personal (Contratos) -->
          <a
            *hasPermission="PERMISSIONS.STAFF.VIEW"
            routerLink="/app/staff"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Personal' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span *ngIf="!isCollapsed()">Personal</span>
          </a>

          <!-- Fidelización (Puntos) -->
          <a
            *hasPermission="PERMISSIONS.LOYALTY.VIEW"
            routerLink="/app/loyalty"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Fidelización' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span *ngIf="!isCollapsed()">Fidelización</span>
          </a>

          <!-- Configuración Operativa -->
          <a
            *hasPermission="PERMISSIONS.CATALOG.EDIT_SCHEDULES_THRESHOLDS"
            routerLink="/app/admin/settings"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Configuración' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span *ngIf="!isCollapsed()">Configuración</span>
          </a>
        </div>

        <!-- SECCIÓN: REPORTES -->
        <div class="space-y-1">
          <div *ngIf="!isCollapsed()" class="px-3 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Reportes
          </div>
          <div *ngIf="isCollapsed()" class="border-b border-gray-155 dark:border-gray-800/80 my-2 mx-1"></div>

          <!-- Reportes (Métricas) -->
          <a
            *hasPermission="PERMISSIONS.ANALYTICS.VIEW"
            routerLink="/app/analytics"
            routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
            [title]="isCollapsed() ? 'Reportes (Métricas)' : ''"
            (click)="linkClicked.emit()"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span *ngIf="!isCollapsed()">Reportes</span>
          </a>
        </div>

      </nav>

      <!-- COLLAPSE TOGGLE BUTTON -->
      <div *ngIf="!isMobileDrawer" class="p-3 border-t border-gray-200 dark:border-gray-800 flex justify-center shrink-0">
        <button 
          (click)="toggleCollapse()"
          class="flex items-center justify-center p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-full cursor-pointer"
          [title]="isCollapsed() ? 'Expandir menú' : 'Colapsar menú'"
        >
          <svg 
            [class.rotate-180]="isCollapsed()"
            class="w-5 h-5 transition-transform duration-200" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          <span *ngIf="!isCollapsed()" class="ml-3 text-xs font-bold uppercase tracking-wider">Colapsar</span>
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  public readonly PERMISSIONS = PERMISSIONS;
  
  @Input() isMobileDrawer = false;
  @Output() linkClicked = new EventEmitter<void>();

  private _collapsed = signal<boolean>(false);
  public isCollapsed = computed(() => this._collapsed() && !this.isMobileDrawer);

  toggleCollapse(): void {
    this._collapsed.update(c => !c);
  }
}
