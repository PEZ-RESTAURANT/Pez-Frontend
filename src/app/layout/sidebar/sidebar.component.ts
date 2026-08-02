import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HasPermissionDirective } from '../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../core/config/permissions';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HasPermissionDirective],
  template: `
    <aside class="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-foreground flex flex-col h-full shrink-0 transition-colors duration-200">
      <div class="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800 shrink-0">
        <span class="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-wider font-mono">PEZ</span>
      </div>

      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        <a
          routerLink="/app/dashboard"
          routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          <span>Dashboard</span>
        </a>

        <a
          *hasPermission="PERMISSIONS.ORDERS.VIEW_TABLE_MAP"
          routerLink="/app/orders"
          routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Mesas & Pedidos</span>
        </a>

        <a
          *hasPermission="PERMISSIONS.KITCHEN.VIEW_OWN_ZONE"
          routerLink="/app/kitchen"
          routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Cocina</span>
        </a>

        <a
          *hasPermission="PERMISSIONS.INVENTORY.VIEW"
          routerLink="/app/inventory"
          routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Inventario</span>
        </a>

        <a
          *hasPermission="PERMISSIONS.CASHREGISTER.VIEW"
          routerLink="/app/cashregister"
          routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Caja</span>
        </a>

        <a
          *hasPermission="PERMISSIONS.STAFF.VIEW"
          routerLink="/app/staff"
          routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Personal</span>
        </a>

        <a
          *hasPermission="PERMISSIONS.CATALOG.EDIT_PRODUCTS_CATEGORIES"
          routerLink="/app/catalog"
          routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Mantenimiento</span>
        </a>

        <a
          *hasPermission="PERMISSIONS.LOYALTY.VIEW"
          routerLink="/app/loyalty"
          routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>Fidelización</span>
        </a>

        <a
          *hasPermission="PERMISSIONS.ANALYTICS.VIEW"
          routerLink="/app/analytics"
          routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-semibold"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-700 dark:text-gray-300"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Reportes</span>
        </a>
      </nav>
    </aside>
  `
})
export class SidebarComponent {
  public readonly PERMISSIONS = PERMISSIONS;
}
