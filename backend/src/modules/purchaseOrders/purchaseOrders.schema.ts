import { z } from "zod";

export const poItemSchema = z.object({
  productId: z.string().uuid("Invalid product id"),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number"),
  unitCost: z.coerce.number().nonnegative().optional(),
});

export const createPOSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  items: z.array(poItemSchema).min(1, "At least one product is required"),
});

export const listPOQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"]).optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid("Invalid id") });

export type CreatePOInput = z.infer<typeof createPOSchema>;
