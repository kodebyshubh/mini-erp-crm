import { Request, Response } from "express";
import { getPagination } from "../../utils/pagination";
import * as invoicesService from "./invoices.service";
import { renderInvoicePdf } from "./invoices.pdf";

export async function listHandler(req: Request, res: Response) {
  const pagination = getPagination(req);
  const { customerId } = req.query as Record<string, string | undefined>;
  const result = await invoicesService.listInvoices(pagination, { customerId });
  res.status(200).json(result);
}

export async function getByIdHandler(req: Request, res: Response) {
  const invoice = await invoicesService.getInvoiceById(req.params.id);
  res.status(200).json(invoice);
}

export async function createHandler(req: Request, res: Response) {
  const invoice = await invoicesService.createInvoiceFromChallan(req.body.challanId, req.user!.id);
  res.status(201).json(invoice);
}

export async function downloadPdfHandler(req: Request, res: Response) {
  const invoice = await invoicesService.getInvoiceById(req.params.id);
  renderInvoicePdf(res, invoice as any);
}
