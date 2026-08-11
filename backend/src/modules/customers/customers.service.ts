import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { getPagination, paginatedResponse, PaginationParams } from "../../utils/pagination";
import { CreateCustomerInput, UpdateCustomerInput } from "./customers.schema";

export async function listCustomers(
  pagination: PaginationParams,
  filters: { search?: string; status?: string; customerType?: string }
) {
  const where: Prisma.CustomerWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { mobile: { contains: filters.search, mode: "insensitive" } },
      { businessName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.status) where.status = filters.status as any;
  if (filters.customerType) where.customerType = filters.customerType as any;

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      followUps: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
      challans: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!customer) throw ApiError.notFound("Customer not found");
  return customer;
}

export async function createCustomer(input: CreateCustomerInput) {
  return prisma.customer.create({ data: input });
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  await getCustomerById(id);
  return prisma.customer.update({ where: { id }, data: input });
}

export async function addFollowUp(customerId: string, note: string, followUpDate: Date | undefined, userId: string) {
  await getCustomerById(customerId);

  const [followUp] = await prisma.$transaction([
    prisma.followUp.create({
      data: { customerId, note, followUpDate, createdById: userId },
    }),
    ...(followUpDate
      ? [prisma.customer.update({ where: { id: customerId }, data: { followUpDate } })]
      : []),
  ]);

  return followUp;
}
