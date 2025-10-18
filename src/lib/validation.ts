import { z } from 'zod';

// Auth schemas
export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Restaurant schemas
export const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Restaurant name must be at least 2 characters').max(100),
  address: z.string().max(200).optional(),
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  primaryEmail: z.string().email('Invalid email address').optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  pincode: z.string().max(20).optional(),
  tableNumber: z.number().int().min(1, 'Must have at least 1 table'),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  logoUrl: z.string().url().optional(),
  settings: z
    .object({
      currency: z
        .string()
        .min(3)
        .max(5)
        .optional(),
      timezone: z.string().optional(),
      enableNotifications: z.boolean().optional(),
    })
    .optional(),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().or(z.literal('')),
  contactName: z.string().max(100).optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  primaryEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  pincode: z.string().max(20).optional().or(z.literal('')),
  tableNumber: z.number().int().min(1).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  settings: z.object({
    currency: z.string().optional(),
    timezone: z.string().optional(),
    openingHours: z.string().optional().or(z.literal('')),
    enableNotifications: z.boolean().optional(),
  }).optional(),
  lastScanned: z.date().optional(),
}).passthrough();

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  order: z.number().int().min(0).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
});

// Menu item schemas
export const modifierSchema = z.object({
  name: z.string().min(1),
  priceDelta: z.number().int(),
});

export const createMenuItemSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1, 'Item name is required').max(100),
  description: z.string().max(500).optional(),
  priceCents: z.number().int().min(0, 'Price cannot be negative'),
  images: z.array(z.string().url()).optional(),
  orderable: z.boolean().optional(),
  soldOut: z.boolean().optional(),
  modifiers: z.array(modifierSchema).optional(),
  order: z.number().int().min(0).optional(),
});

export const updateMenuItemSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  priceCents: z.number().int().min(0).optional(),
  images: z.array(z.string().url()).optional(),
  orderable: z.boolean().optional(),
  soldOut: z.boolean().optional(),
  modifiers: z.array(modifierSchema).optional(),
  order: z.number().int().min(0).optional(),
});

// Order schemas
export const orderItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  priceCents: z.number().int().min(0),
  quantity: z.number().int().min(1),
  modifiers: z.array(z.string()).optional(),
  specialRequest: z.string().max(200).optional(),
});

export const createOrderSchema = z.object({
  restaurantId: z.string(),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  customerName: z.string().min(1, 'Customer name is required').max(100),
  tableNumber: z.number().int().min(1, 'Invalid table number'),
  customerEmail: z.string().email('Invalid email address').optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'completed', 'cancelled']),
});

// Type exports
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
