import { z } from "zod";

export const customerTypeEnum = z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]);
export const customerStatusEnum = z.enum(["LEAD", "ACTIVE", "INACTIVE"]);

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  mobile: z.string().min(6, "Valid mobile number is required"),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: customerTypeEnum.default("RETAIL"),
  address: z.string().optional(),
  status: customerStatusEnum.default("LEAD"),
  followUpDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  status: customerStatusEnum.optional(),
  customerType: customerTypeEnum.optional(),
});

export const addFollowUpSchema = z.object({
  note: z.string().min(1, "Note is required"),
  followUpDate: z.coerce.date().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
