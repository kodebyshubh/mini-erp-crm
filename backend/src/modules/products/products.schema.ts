import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().optional(),
  unitPrice: z.coerce.number().nonnegative("Unit price must be >= 0"),
  stock: z.coerce.number().int().nonnegative().default(0),
  minStock: z.coerce.number().int().nonnegative().default(0),
  location: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
});

export const stockAdjustSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be a positive number"),
  movementType: z.enum(["IN", "OUT"]),
  reason: z.string().min(1, "Reason is required"),
});

export const idParamSchema = z.object({ id: z.string().uuid("Invalid id") });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
