export const PERMISSIONS = {
  ORDERS: {
    CREATE: 'orders.create',
    VIEW_TABLE_MAP: 'orders.view_table_map',
    CHANGE_TABLE_STATUS: 'orders.change_table_status',
    MODIFY_ITEM: 'orders.modify_item',
    CANCEL_ITEM: 'orders.cancel_item',
    DELETE_ITEM: 'orders.delete_item',
    ADJUST_PRICE: 'orders.adjust_price',
    ISSUE_RECEIPT: 'orders.issue_receipt',
    EDIT_LAYOUT: 'orders.edit_layout'
  },
  CATALOG: {
    EDIT_PRODUCTS_CATEGORIES: 'catalog.edit_products_categories',
    EDIT_SUPPLIES_RECIPES: 'catalog.edit_supplies_recipes',
    EDIT_KITCHEN_ZONES: 'catalog.edit_kitchen_zones',
    EDIT_LAYOUT: 'catalog.edit_layout',
    EDIT_PAYMENT_METHODS: 'catalog.edit_payment_methods',
    EDIT_REASONS: 'catalog.edit_reasons',
    EDIT_FIXED_EXPENSES: 'catalog.edit_fixed_expenses',
    EDIT_SANCTIONS: 'catalog.edit_sanctions',
    EDIT_SCHEDULES_THRESHOLDS: 'catalog.edit_schedules_thresholds',
    EDIT_SURVEY: 'catalog.edit_survey'
  },
  CASHREGISTER: {
    VIEW: 'cashregister.view',
    OPEN_CLOSE_SHIFT: 'cashregister.open_close_shift',
    REGISTER_MOVEMENT: 'cashregister.register_movement',
    REGISTER_PAYMENT: 'cashregister.register_payment',
    VIEW_MISMATCH: 'cashregister.view_mismatch'
  },
  INVENTORY: {
    VIEW: 'inventory.view',
    ADJUST_MANUAL: 'inventory.adjust_manual',
    RESTOCK: 'inventory.restock'
  },
  KITCHEN: {
    VIEW_OWN_ZONE: 'kitchen.view_own_zone',
    CHANGE_ITEM_STATUS: 'kitchen.change_item_status'
  },
  STAFF: {
    VIEW: 'staff.view',
    REGISTER_MANUAL_ATTENDANCE: 'staff.register_manual_attendance',
    REGISTER_ADVANCE: 'staff.register_advance',
    REGISTER_SANCTION: 'staff.register_sanction',
    REGISTER_OVERTIME: 'staff.register_overtime',
    EDIT_PROFILE: 'staff.edit_profile',
    MANAGE_EMPLOYEES: 'staff.manage_employees',
    REGISTER_ATTENDANCE: 'staff.register_attendance'
  },
  LOYALTY: {
    REGISTER_CUSTOMER: 'loyalty.register_customer',
    VIEW_ANALYTICS: 'loyalty.view_analytics',
    VIEW: 'loyalty.view',
    REDEEM_POINTS: 'loyalty.redeem_points',
    MANAGE_CONFIG: 'loyalty.manage_config'
  },
  ANALYTICS: {
    VIEW: 'analytics.view',
    EXPORT: 'analytics.export',
    MANAGE_CONFIG: 'analytics.manage_config'
  },
  AUDIT: {
    VIEW: 'audit.view'
  },
  PERMISSIONS: {
    MANAGE: 'permissions.manage'
  },
  IAM: {
    MANAGE_ACCOUNTS: 'iam.manage_accounts'
  },
  RESERVATIONS: {
    VIEW: 'reservations.view',
    MANAGE: 'reservations.manage'
  }
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];
