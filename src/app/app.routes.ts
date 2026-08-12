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
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/presentation/pages/forgot-password-page.component').then(m => m.ForgotPasswordPageComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/presentation/pages/reset-password-page.component').then(m => m.ResetPasswordPageComponent)
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
        path: 'orders/:tableId',
        loadComponent: () => import('./features/orders/presentation/pages/order-detail-page.component').then(m => m.OrderDetailPageComponent),
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
        path: 'admin/layout',
        loadComponent: () => import('./features/orders/presentation/pages/layout-editor-page.component').then(m => m.LayoutEditorPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.ORDERS.EDIT_LAYOUT }
      },
      {
        path: 'admin/kitchen-zones',
        loadComponent: () => import('./features/kitchen/presentation/pages/kitchen-zones-page.component').then(m => m.KitchenZonesPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.CATALOG.EDIT_KITCHEN_ZONES }
      },
      {
        path: 'admin/staff-accounts',
        loadComponent: () => import('./features/staff/presentation/pages/staff-accounts-page.component').then(m => m.StaffAccountsPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.IAM.MANAGE_ACCOUNTS }
      },
      {
        path: 'admin/permissions',
        loadComponent: () => import('./features/staff/presentation/pages/user-permissions-page.component').then(m => m.UserPermissionsPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.PERMISSIONS.MANAGE }
      },
      {
        path: 'admin/settings',
        loadComponent: () => import('./features/orders/presentation/pages/operational-settings-page.component').then(m => m.OperationalSettingsPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.CATALOG.EDIT_SCHEDULES_THRESHOLDS }
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
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/orders/presentation/pages/reservations-page.component').then(m => m.ReservationsPageComponent),
        canActivate: [permissionGuard],
        data: { permission: PERMISSIONS.RESERVATIONS.VIEW }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'app'
  }
];
