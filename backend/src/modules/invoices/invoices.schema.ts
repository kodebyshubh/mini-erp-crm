import { z } from "zod";

export const createInvoiceSchema = z.object({
  challanId: z.string().uuid("Invalid challan id"),
});

export const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  customerId: z.string().uuid().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid("Invalid id") });
