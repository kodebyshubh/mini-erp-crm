import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { getPagination, paginatedResponse, PaginationParams } from "../../utils/pagination";
import { CreatePOInput } from "./purchaseOrders.schema";

type Tx = Prisma.TransactionClient;

async function generatePONumber(tx: Tx) {
  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const countToday = await tx.purchaseOrder.count({ where: { poNumber: { startsWith: `PO-${datePart}-` } } });
  return `PO-${datePart}-${String(countToday + 1).padStart(4, "0")}`;
}

export async function createPO(input: CreatePOInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const productIds = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const missing = productIds.filter((id) => !productMap.has(id));
    if (missing.length > 0) {
      throw ApiError.badRequest("One or more products were not found", { missingProductIds: missing });
    }

    let totalQuantity = 0;
    let totalAmount = new Prisma.Decimal(0);

    const lineItems = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitCost = item.unitCost !== undefined ? new Prisma.Decimal(item.unitCost) : product.unitPrice;
      const lineTotal = unitCost.mul(item.quantity);
      totalQuantity += item.quantity;
      totalAmount = totalAmount.add(lineTotal);
      return {
        productId: product.id,
        productNameSnapshot: product.name,
        productSkuSnapshot: product.sku,
        unitCostSnapshot: unitCost,
        quantity: item.quantity,
        lineTotal,
      };
    });

    const poNumber = await generatePONumber(tx);

    return tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierName: input.supplierName,
        status: "ORDERED",
        totalQuantity,
        totalAmount,
        createdById: userId,
        items: { create: lineItems },
      },
      include: { items: true },
    });
  });
}

export async function receivePO(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
    if (!po) throw ApiError.notFound("Purchase order not found");
    if (po.status === "RECEIVED") throw ApiError.conflict("Purchase order already received");
    if (po.status === "CANCELLED") throw ApiError.conflict("Cannot receive a cancelled purchase order");

    for (const item of po.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: "IN",
          reason: "Purchase order received",
          reference: po.poNumber,
          createdById: userId,
        },
      });
    }

    return tx.purchaseOrder.update({
      where: { id },
      data: { status: "RECEIVED", receivedAt: new Date() },
      include: { items: true },
    });
  });
}

export async function cancelPO(id: string) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw ApiError.notFound("Purchase order not found");
  if (po.status === "RECEIVED") throw ApiError.conflict("Cannot cancel a purchase order that has already been received");
  return prisma.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED" } });
}

export async function listPOs(pagination: PaginationParams, filters: { status?: string }) {
  const where: Prisma.PurchaseOrderWhereInput = {};
  if (filters.status) where.status = filters.status as any;

  const [items, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function getPOById(id: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { name: true, sku: true } } } }, createdBy: { select: { name: true } } },
  });
  if (!po) throw ApiError.notFound("Purchase order not found");
  return po;
}
