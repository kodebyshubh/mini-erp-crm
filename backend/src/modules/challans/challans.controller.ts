import { Request, Response } from "express";
import { getPagination } from "../../utils/pagination";
import * as challansService from "./challans.service";

export async function listHandler(req: Request, res: Response) {
  const pagination = getPagination(req);
  const { status, customerId, search } = req.query as Record<string, string | undefined>;
  const result = await challansService.listChallans(pagination, { status, customerId, search });
  res.status(200).json(result);
}

export async function getByIdHandler(req: Request, res: Response) {
  const challan = await challansService.getChallanById(req.params.id);
  res.status(200).json(challan);
}

export async function createHandler(req: Request, res: Response) {
  const challan = await challansService.createChallan(req.body, req.user!.id);
  res.status(201).json(challan);
}

export async function updateHandler(req: Request, res: Response) {
  const challan = await challansService.updateChallan(req.params.id, req.body);
  res.status(200).json(challan);
}

export async function confirmHandler(req: Request, res: Response) {
  const challan = await challansService.confirmChallan(req.params.id, req.user!.id);
  res.status(200).json(challan);
}

export async function cancelHandler(req: Request, res: Response) {
  const challan = await challansService.cancelChallan(req.params.id, req.user!.id);
  res.status(200).json(challan);
}
