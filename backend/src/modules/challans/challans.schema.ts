import { z } from "zod";

export const challanItemSchema = z.object({
  productId: z.string().uuid("Invalid product id"),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number"),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid("Invalid customer id"),
  items: z.array(challanItemSchema).min(1, "At least one product is required"),
  status: z.enum(["DRAFT", "CONFIRMED"]).default("DRAFT"),
});

export const updateChallanSchema = z.object({
  items: z.array(challanItemSchema).min(1, "At least one product is required").optional(),
});

export const listChallansQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
  customerId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid("Invalid id") });

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
