import { Request, Response } from "express";
import { getPagination } from "../../utils/pagination";
import * as productsService from "./products.service";

export async function listHandler(req: Request, res: Response) {
  const pagination = getPagination(req);
  const { search, category, lowStock } = req.query as Record<string, string | undefined>;
  const result = await productsService.listProducts(pagination, {
    search,
    category,
    lowStock: lowStock === "true",
  });
  res.status(200).json(result);
}

export async function getByIdHandler(req: Request, res: Response) {
  const product = await productsService.getProductById(req.params.id);
  res.status(200).json(product);
}

export async function createHandler(req: Request, res: Response) {
  const product = await productsService.createProduct(req.body);
  res.status(201).json(product);
}

export async function updateHandler(req: Request, res: Response) {
  const product = await productsService.updateProduct(req.params.id, req.body);
  res.status(200).json(product);
}

export async function adjustStockHandler(req: Request, res: Response) {
  const { quantity, movementType, reason } = req.body;
  const result = await productsService.adjustStock(
    req.params.id,
    quantity,
    movementType,
    reason,
    req.user!.id
  );
  res.status(200).json(result);
}

export async function listStockMovementsHandler(req: Request, res: Response) {
  const pagination = getPagination(req);
  const { productId } = req.query as Record<string, string | undefined>;
  const result = await productsService.listStockMovements(pagination, { productId });
  res.status(200).json(result);
}
