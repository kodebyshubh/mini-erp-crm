import { Request, Response } from "express";
import { getPagination } from "../../utils/pagination";
import * as poService from "./purchaseOrders.service";

export async function listHandler(req: Request, res: Response) {
  const pagination = getPagination(req);
  const { status } = req.query as Record<string, string | undefined>;
  const result = await poService.listPOs(pagination, { status });
  res.status(200).json(result);
}

export async function getByIdHandler(req: Request, res: Response) {
  const po = await poService.getPOById(req.params.id);
  res.status(200).json(po);
}

export async function createHandler(req: Request, res: Response) {
  const po = await poService.createPO(req.body, req.user!.id);
  res.status(201).json(po);
}

export async function receiveHandler(req: Request, res: Response) {
  const po = await poService.receivePO(req.params.id, req.user!.id);
  res.status(200).json(po);
}

export async function cancelHandler(req: Request, res: Response) {
  const po = await poService.cancelPO(req.params.id);
  res.status(200).json(po);
}
