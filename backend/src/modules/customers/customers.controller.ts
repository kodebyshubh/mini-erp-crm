import { Request, Response } from "express";
import { getPagination } from "../../utils/pagination";
import * as customersService from "./customers.service";

export async function listHandler(req: Request, res: Response) {
  const pagination = getPagination(req);
  const { search, status, customerType } = req.query as Record<string, string | undefined>;
  const result = await customersService.listCustomers(pagination, { search, status, customerType });
  res.status(200).json(result);
}

export async function getByIdHandler(req: Request, res: Response) {
  const customer = await customersService.getCustomerById(req.params.id);
  res.status(200).json(customer);
}

export async function createHandler(req: Request, res: Response) {
  const customer = await customersService.createCustomer(req.body);
  res.status(201).json(customer);
}

export async function updateHandler(req: Request, res: Response) {
  const customer = await customersService.updateCustomer(req.params.id, req.body);
  res.status(200).json(customer);
}

export async function addFollowUpHandler(req: Request, res: Response) {
  const followUp = await customersService.addFollowUp(
    req.params.id,
    req.body.note,
    req.body.followUpDate,
    req.user!.id
  );
  res.status(201).json(followUp);
}
