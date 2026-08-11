import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { getPagination, paginatedResponse, PaginationParams } from "../../utils/pagination";

async function generateInvoiceNumber(tx: Prisma.TransactionClient) {
  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const countToday = await tx.invoice.count({ where: { invoiceNumber: { startsWith: `INV-${datePart}-` } } });
  return `INV-${datePart}-${String(countToday + 1).padStart(4, "0")}`;
}

export async function createInvoiceFromChallan(challanId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id: challanId }, include: { invoice: true } });
    if (!challan) throw ApiError.notFound("Challan not found");
    if (challan.status !== "CONFIRMED") {
      throw ApiError.conflict("Only confirmed challans can be invoiced");
    }
    if (challan.invoice) {
      throw ApiError.conflict("This challan has already been invoiced", { invoiceId: challan.invoice.id });
    }

    const invoiceNumber = await generateInvoiceNumber(tx);

    return tx.invoice.create({
      data: {
        invoiceNumber,
        challanId: challan.id,
        customerId: challan.customerId,
        totalAmount: challan.totalAmount,
        createdById: userId,
      },
      include: { customer: true, challan: { include: { items: true } } },
    });
  });
}

export async function listInvoices(pagination: PaginationParams, filters: { customerId?: string }) {
  const where: Prisma.InvoiceWhereInput = {};
  if (filters.customerId) where.customerId = filters.customerId;

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, businessName: true } } },
    }),
    prisma.invoice.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      challan: { include: { items: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  return invoice;
}
