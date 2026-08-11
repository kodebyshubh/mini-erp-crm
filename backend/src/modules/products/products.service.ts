import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { getPagination, paginatedResponse, PaginationParams } from "../../utils/pagination";
import { CreateProductInput, UpdateProductInput } from "./products.schema";

export async function listProducts(
  pagination: PaginationParams,
  filters: { search?: string; category?: string; lowStock?: boolean }
) {
  const where: Prisma.ProductWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.category) where.category = filters.category;

  let items = await prisma.product.findMany({
    where,
    skip: pagination.skip,
    take: pagination.take,
    orderBy: { createdAt: "desc" },
  });
  let total = await prisma.product.count({ where });

  if (filters.lowStock) {
    // low-stock filtering needs a field comparison Prisma can't express
    // directly (stock <= minStock), so filter in application code.
    const all = await prisma.product.findMany({ where });
    const low = all.filter((p) => p.stock <= p.minStock);
    total = low.length;
    items = low.slice(pagination.skip, pagination.skip + pagination.take);
  }

  return paginatedResponse(items, total, pagination);
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({ data: input });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await getProductById(id);
  // Direct stock edits here don't create a movement log entry - use the
  // /stock-movements endpoint for tracked IN/OUT adjustments.
  return prisma.product.update({ where: { id }, data: input });
}

export async function adjustStock(
  productId: string,
  quantity: number,
  movementType: "IN" | "OUT",
  reason: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");

    const newStock = movementType === "IN" ? product.stock + quantity : product.stock - quantity;
    if (newStock < 0) {
      throw ApiError.conflict(`Insufficient stock for ${product.name}. Available: ${product.stock}, requested OUT: ${quantity}`);
    }

    const updated = await tx.product.update({ where: { id: productId }, data: { stock: newStock } });
    const movement = await tx.stockMovement.create({
      data: { productId, quantity, movementType, reason, createdById: userId },
    });

    return { product: updated, movement };
  });
}

export async function listStockMovements(
  pagination: PaginationParams,
  filters: { productId?: string }
) {
  const where: Prisma.StockMovementWhereInput = {};
  if (filters.productId) where.productId = filters.productId;

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true, sku: true } }, createdBy: { select: { name: true } } },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}
