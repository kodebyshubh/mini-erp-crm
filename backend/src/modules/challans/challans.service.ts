import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { getPagination, paginatedResponse, PaginationParams } from "../../utils/pagination";
import { CreateChallanInput, UpdateChallanInput } from "./challans.schema";

type Tx = Prisma.TransactionClient;

async function generateChallanNumber(tx: Tx) {
  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const countToday = await tx.challan.count({
    where: { challanNumber: { startsWith: `CH-${datePart}-` } },
  });
  const sequence = String(countToday + 1).padStart(4, "0");
  return `CH-${datePart}-${sequence}`;
}

// Builds challan line items with a snapshot of product data at this moment,
// and validates every referenced product exists. Does NOT touch stock -
// stock is only ever deducted when a challan moves to CONFIRMED.
async function buildLineItems(tx: Tx, items: { productId: string; quantity: number }[]) {
  const productIds = items.map((i) => i.productId);
  const products = await tx.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const missing = productIds.filter((id) => !productMap.has(id));
  if (missing.length > 0) {
    throw ApiError.badRequest("One or more products were not found", { missingProductIds: missing });
  }

  let totalQuantity = 0;
  let totalAmount = new Prisma.Decimal(0);

  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const lineTotal = product.unitPrice.mul(item.quantity);
    totalQuantity += item.quantity;
    totalAmount = totalAmount.add(lineTotal);
    return {
      productId: product.id,
      productNameSnapshot: product.name,
      productSkuSnapshot: product.sku,
      unitPriceSnapshot: product.unitPrice,
      quantity: item.quantity,
      lineTotal,
    };
  });

  return { lineItems, totalQuantity, totalAmount };
}

// Deducts stock for every item on a challan inside the given transaction.
// Throws (aborting the whole transaction) if any product doesn't have
// enough stock - this is what guarantees stock never goes negative.
async function deductStockForChallan(
  tx: Tx,
  items: { productId: string; quantity: number; productNameSnapshot: string }[],
  userId: string,
  challanNumber: string
) {
  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product) throw ApiError.notFound(`Product ${item.productNameSnapshot} no longer exists`);

    if (product.stock < item.quantity) {
      throw ApiError.conflict(
        `Insufficient stock for "${product.name}". Available: ${product.stock}, required: ${item.quantity}`,
        { productId: product.id, available: product.stock, required: item.quantity }
      );
    }

    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });

    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        quantity: item.quantity,
        movementType: "OUT",
        reason: "Sales challan confirmed",
        reference: challanNumber,
        createdById: userId,
      },
    });
  }
}

export async function createChallan(input: CreateChallanInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw ApiError.badRequest("Customer not found");

    const { lineItems, totalQuantity, totalAmount } = await buildLineItems(tx, input.items);
    const challanNumber = await generateChallanNumber(tx);

    const challan = await tx.challan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        status: "DRAFT",
        totalQuantity,
        totalAmount,
        createdById: userId,
        items: { create: lineItems },
      },
      include: { items: true, customer: true },
    });

    if (input.status === "CONFIRMED") {
      await deductStockForChallan(tx, lineItems, userId, challanNumber);
      return tx.challan.update({
        where: { id: challan.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
        include: { items: true, customer: true },
      });
    }

    return challan;
  });
}

export async function updateChallan(id: string, input: UpdateChallanInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.challan.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Challan not found");
    if (existing.status !== "DRAFT") {
      throw ApiError.conflict("Only draft challans can be edited");
    }

    if (!input.items) return existing;

    const { lineItems, totalQuantity, totalAmount } = await buildLineItems(tx, input.items);

    await tx.challanItem.deleteMany({ where: { challanId: id } });
    return tx.challan.update({
      where: { id },
      data: { totalQuantity, totalAmount, items: { create: lineItems } },
      include: { items: true, customer: true },
    });
  });
}

export async function confirmChallan(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) throw ApiError.notFound("Challan not found");
    if (challan.status !== "DRAFT") {
      throw ApiError.conflict(`Only draft challans can be confirmed. Current status: ${challan.status}`);
    }

    await deductStockForChallan(tx, challan.items, userId, challan.challanNumber);

    return tx.challan.update({
      where: { id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
      include: { items: true, customer: true },
    });
  });
}

export async function cancelChallan(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) throw ApiError.notFound("Challan not found");
    if (challan.status === "CANCELLED") {
      throw ApiError.conflict("Challan is already cancelled");
    }

    // If stock had already been deducted (challan was confirmed), reverse it.
    if (challan.status === "CONFIRMED") {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: "IN",
            reason: "Sales challan cancelled - stock reversed",
            reference: challan.challanNumber,
            createdById: userId,
          },
        });
      }
    }

    return tx.challan.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { items: true, customer: true },
    });
  });
}

export async function listChallans(
  pagination: PaginationParams,
  filters: { status?: string; customerId?: string; search?: string }
) {
  const where: Prisma.ChallanWhereInput = {};
  if (filters.status) where.status = filters.status as any;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.search) where.challanNumber = { contains: filters.search, mode: "insensitive" };

  const [items, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, businessName: true } }, items: true },
    }),
    prisma.challan.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function getChallanById(id: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true, sku: true } } } },
      createdBy: { select: { name: true } },
      invoice: true,
    },
  });
  if (!challan) throw ApiError.notFound("Challan not found");
  return challan;
}
