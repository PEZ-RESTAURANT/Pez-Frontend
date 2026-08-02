import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { guestGuard } from './core/auth/guards/guest.guard';
import { permissionGuard } from './core/auth/guards/permission.guard';
import { PERMISSIONS } from './core/config/permissions';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'app',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/presentation/pages/login-page.component').then(m => m.LoginPageComponent)
      }
    ]
  },
  {
    path: 'app',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/presentation/pages/dashboard-page.component').then(m => m.DashboardPageComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/presentation/pages/orders-page.component').then(m => m.OrdersPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.ORDERS.VIEW_TABLE_MAP }
      },
      {
        path: 'kitchen',
        loadComponent: () => import('./features/kitchen/presentation/pages/kitchen-page.component').then(m => m.KitchenPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.KITCHEN.VIEW_OWN_ZONE }
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/presentation/pages/inventory-page.component').then(m => m.InventoryPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.INVENTORY.VIEW }
      },
      {
        path: 'cashregister',
        loadComponent: () => import('./features/cashregister/presentation/pages/cashregister-page.component').then(m => m.CashRegisterPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.CASHREGISTER.VIEW }
      },
      {
        path: 'staff',
        loadComponent: () => import('./features/staff/presentation/pages/staff-page.component').then(m => m.StaffPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.STAFF.VIEW }
      },
      {
        path: 'catalog',
        loadComponent: () => import('./features/catalog/presentation/pages/catalog-page.component').then(m => m.CatalogPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.CATALOG.EDIT_PRODUCTS_CATEGORIES }
      },
      {
        path: 'loyalty',
        loadComponent: () => import('./features/loyalty/presentation/pages/loyalty-page.component').then(m => m.LoyaltyPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.LOYALTY.VIEW }
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/presentation/pages/analytics-page.component').then(m => m.AnalyticsPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.ANALYTICS.VIEW }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'app'
  }
];
