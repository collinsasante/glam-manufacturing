import { UserRole } from '@/types/user';

export enum Permission {
  // Suppliers
  VIEW_SUPPLIERS = 'view_suppliers',
  CREATE_SUPPLIER = 'create_supplier',
  UPDATE_SUPPLIER = 'update_supplier',
  DELETE_SUPPLIER = 'delete_supplier',

  // Raw Materials
  VIEW_RAW_MATERIALS = 'view_raw_materials',
  CREATE_RAW_MATERIAL = 'create_raw_material',
  UPDATE_RAW_MATERIAL = 'update_raw_material',
  DELETE_RAW_MATERIAL = 'delete_raw_material',

  // Finished Goods
  VIEW_FINISHED_GOODS = 'view_finished_goods',
  CREATE_FINISHED_GOOD = 'create_finished_good',
  UPDATE_FINISHED_GOOD = 'update_finished_good',
  DELETE_FINISHED_GOOD = 'delete_finished_good',

  // Stock Movement
  VIEW_STOCK_MOVEMENT = 'view_stock_movement',
  CREATE_STOCK_MOVEMENT = 'create_stock_movement',
  UPDATE_STOCK_MOVEMENT = 'update_stock_movement',
  DELETE_STOCK_MOVEMENT = 'delete_stock_movement',

  // Stock Transfer
  VIEW_STOCK_TRANSFER = 'view_stock_transfer',
  CREATE_STOCK_TRANSFER = 'create_stock_transfer',
  UPDATE_STOCK_TRANSFER = 'update_stock_transfer',
  DELETE_STOCK_TRANSFER = 'delete_stock_transfer',

  // Deliveries
  VIEW_DELIVERIES = 'view_deliveries',
  CREATE_DELIVERY = 'create_delivery',
  UPDATE_DELIVERY = 'update_delivery',
  DELETE_DELIVERY = 'delete_delivery',

  // Manufacturing
  VIEW_MANUFACTURING = 'view_manufacturing',
  CREATE_MANUFACTURING_ORDER = 'create_manufacturing_order',
  UPDATE_MANUFACTURING_ORDER = 'update_manufacturing_order',
  DELETE_MANUFACTURING_ORDER = 'delete_manufacturing_order',

  // Warehouses
  VIEW_WAREHOUSES = 'view_warehouses',
  UPDATE_WAREHOUSE = 'update_warehouse',

  // Reports
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data',

  // Settings
  VIEW_SETTINGS = 'view_settings',
  UPDATE_SETTINGS = 'update_settings',

  // User Management
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  UPDATE_USER_ROLE = 'update_user_role',
  DELETE_USER = 'delete_user',
}

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin has all permissions
    Permission.VIEW_SUPPLIERS,
    Permission.CREATE_SUPPLIER,
    Permission.UPDATE_SUPPLIER,
    Permission.DELETE_SUPPLIER,
    Permission.VIEW_RAW_MATERIALS,
    Permission.CREATE_RAW_MATERIAL,
    Permission.UPDATE_RAW_MATERIAL,
    Permission.DELETE_RAW_MATERIAL,
    Permission.VIEW_FINISHED_GOODS,
    Permission.CREATE_FINISHED_GOOD,
    Permission.UPDATE_FINISHED_GOOD,
    Permission.DELETE_FINISHED_GOOD,
    Permission.VIEW_STOCK_MOVEMENT,
    Permission.CREATE_STOCK_MOVEMENT,
    Permission.UPDATE_STOCK_MOVEMENT,
    Permission.DELETE_STOCK_MOVEMENT,
    Permission.VIEW_STOCK_TRANSFER,
    Permission.CREATE_STOCK_TRANSFER,
    Permission.UPDATE_STOCK_TRANSFER,
    Permission.DELETE_STOCK_TRANSFER,
    Permission.VIEW_DELIVERIES,
    Permission.CREATE_DELIVERY,
    Permission.UPDATE_DELIVERY,
    Permission.DELETE_DELIVERY,
    Permission.VIEW_MANUFACTURING,
    Permission.CREATE_MANUFACTURING_ORDER,
    Permission.UPDATE_MANUFACTURING_ORDER,
    Permission.DELETE_MANUFACTURING_ORDER,
    Permission.VIEW_WAREHOUSES,
    Permission.UPDATE_WAREHOUSE,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
    Permission.VIEW_SETTINGS,
    Permission.UPDATE_SETTINGS,
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.UPDATE_USER_ROLE,
    Permission.DELETE_USER,
  ],
  [UserRole.MANAGER]: [
    // Manager can do most operations except user management
    Permission.VIEW_SUPPLIERS,
    Permission.CREATE_SUPPLIER,
    Permission.UPDATE_SUPPLIER,
    Permission.DELETE_SUPPLIER,
    Permission.VIEW_RAW_MATERIALS,
    Permission.CREATE_RAW_MATERIAL,
    Permission.UPDATE_RAW_MATERIAL,
    Permission.DELETE_RAW_MATERIAL,
    Permission.VIEW_FINISHED_GOODS,
    Permission.CREATE_FINISHED_GOOD,
    Permission.UPDATE_FINISHED_GOOD,
    Permission.DELETE_FINISHED_GOOD,
    Permission.VIEW_STOCK_MOVEMENT,
    Permission.CREATE_STOCK_MOVEMENT,
    Permission.UPDATE_STOCK_MOVEMENT,
    Permission.DELETE_STOCK_MOVEMENT,
    Permission.VIEW_STOCK_TRANSFER,
    Permission.CREATE_STOCK_TRANSFER,
    Permission.UPDATE_STOCK_TRANSFER,
    Permission.DELETE_STOCK_TRANSFER,
    Permission.VIEW_DELIVERIES,
    Permission.CREATE_DELIVERY,
    Permission.UPDATE_DELIVERY,
    Permission.DELETE_DELIVERY,
    Permission.VIEW_MANUFACTURING,
    Permission.CREATE_MANUFACTURING_ORDER,
    Permission.UPDATE_MANUFACTURING_ORDER,
    Permission.DELETE_MANUFACTURING_ORDER,
    Permission.VIEW_WAREHOUSES,
    Permission.UPDATE_WAREHOUSE,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
    Permission.VIEW_SETTINGS,
  ],
  [UserRole.STAFF]: [
    // Staff can view and create, but limited delete
    Permission.VIEW_SUPPLIERS,
    Permission.VIEW_RAW_MATERIALS,
    Permission.VIEW_FINISHED_GOODS,
    Permission.VIEW_STOCK_MOVEMENT,
    Permission.CREATE_STOCK_MOVEMENT,
    Permission.UPDATE_STOCK_MOVEMENT,
    Permission.VIEW_STOCK_TRANSFER,
    Permission.CREATE_STOCK_TRANSFER,
    Permission.UPDATE_STOCK_TRANSFER,
    Permission.VIEW_DELIVERIES,
    Permission.CREATE_DELIVERY,
    Permission.UPDATE_DELIVERY,
    Permission.VIEW_MANUFACTURING,
    Permission.VIEW_WAREHOUSES,
    Permission.VIEW_REPORTS,
  ],
  [UserRole.VIEWER]: [
    // Viewer can only view, no modifications
    Permission.VIEW_SUPPLIERS,
    Permission.VIEW_RAW_MATERIALS,
    Permission.VIEW_FINISHED_GOODS,
    Permission.VIEW_STOCK_MOVEMENT,
    Permission.VIEW_STOCK_TRANSFER,
    Permission.VIEW_DELIVERIES,
    Permission.VIEW_MANUFACTURING,
    Permission.VIEW_WAREHOUSES,
    Permission.VIEW_REPORTS,
  ],
};

export function hasPermission(
  role: UserRole | undefined,
  permission: Permission,
  customPermissions?: string[]
): boolean {
  // Check custom permissions first (overrides)
  if (customPermissions?.includes(permission)) {
    return true;
  }

  // Default to viewer if no role
  if (!role) {
    return rolePermissions[UserRole.VIEWER].includes(permission);
  }

  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: UserRole | undefined,
  permissions: Permission[],
  customPermissions?: string[]
): boolean {
  return permissions.some((permission) =>
    hasPermission(role, permission, customPermissions)
  );
}

export function hasAllPermissions(
  role: UserRole | undefined,
  permissions: Permission[],
  customPermissions?: string[]
): boolean {
  return permissions.every((permission) =>
    hasPermission(role, permission, customPermissions)
  );
}

export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

export function canAccessResource(
  role: UserRole | undefined,
  resource: 'suppliers' | 'raw-materials' | 'finished-goods' | 'stock-movement' | 'stock-transfer' | 'deliveries' | 'manufacturing' | 'warehouses' | 'reports' | 'settings'
): boolean {
  const permissionMap: Record<string, Permission> = {
    'suppliers': Permission.VIEW_SUPPLIERS,
    'raw-materials': Permission.VIEW_RAW_MATERIALS,
    'finished-goods': Permission.VIEW_FINISHED_GOODS,
    'stock-movement': Permission.VIEW_STOCK_MOVEMENT,
    'stock-transfer': Permission.VIEW_STOCK_TRANSFER,
    'deliveries': Permission.VIEW_DELIVERIES,
    'manufacturing': Permission.VIEW_MANUFACTURING,
    'warehouses': Permission.VIEW_WAREHOUSES,
    'reports': Permission.VIEW_REPORTS,
    'settings': Permission.VIEW_SETTINGS,
  };

  const permission = permissionMap[resource];
  return permission ? hasPermission(role, permission) : false;
}
