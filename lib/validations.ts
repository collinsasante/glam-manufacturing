import { z } from 'zod';

// Supplier validation
export const supplierSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  supplierType: z.enum(['Factory', 'Trading Company']).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
});

// Raw Material validation
export const rawMaterialSchema = z.object({
  materialName: z.string().min(1, 'Material name is required'),
  specification: z.enum(['Clear', 'Translucent', 'Color']).optional(),
  unitOfMeasurement: z.string().optional(),
  unitCost: z.number().min(0, 'Unit cost must be positive').optional(),
  currentStock: z.number().min(0, 'Stock cannot be negative').optional(),
});

// Finished Good validation
export const finishedGoodSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  packSize: z.string().optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  availableQuantity: z.number().min(0, 'Quantity cannot be negative').optional(),
  status: z.enum(['Available', 'Out of Stock', 'Reserved', 'Pending']).optional(),
});

// Stock Movement validation
export const stockMovementSchema = z.object({
  material: z.string().min(1, 'Material is required'),
  transactionType: z.enum(['In', 'Out']),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitCost: z.number().min(0, 'Unit cost must be positive').optional(),
  reason: z.enum(['New Stock', 'Stock Adjustment', 'Manufacturing Order']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(),
});

// Stock Transfer validation
export const stockTransferSchema = z.object({
  material: z.string().min(1, 'Material is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  fromWarehouse: z.string().min(1, 'Source warehouse is required'),
  toWarehouse: z.string().min(1, 'Destination warehouse is required'),
  date: z.string().optional(),
  remarks: z.string().optional(),
  status: z.enum(['Pending', 'In Transit', 'Completed', 'Cancelled']).optional(),
}).refine((data) => data.fromWarehouse !== data.toWarehouse, {
  message: 'Source and destination warehouses must be different',
  path: ['toWarehouse'],
});

// Delivery validation
export const deliverySchema = z.object({
  customer: z.string().min(1, 'Customer name is required'),
  customerContact: z.string().optional(),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  totalItems: z.number().min(1, 'At least one item is required').optional(),
  totalAmount: z.number().min(0, 'Amount must be positive').optional(),
  rider: z.string().optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
});

// Manufacturing Order validation
export const manufacturingOrderSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled']).optional(),
  notes: z.string().optional(),
});

// User validation
export const userProfileSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'staff', 'viewer']),
});

// Auth validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SupplierInput = z.infer<typeof supplierSchema>;
export type RawMaterialInput = z.infer<typeof rawMaterialSchema>;
export type FinishedGoodInput = z.infer<typeof finishedGoodSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type StockTransferInput = z.infer<typeof stockTransferSchema>;
export type DeliveryInput = z.infer<typeof deliverySchema>;
export type ManufacturingOrderInput = z.infer<typeof manufacturingOrderSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
