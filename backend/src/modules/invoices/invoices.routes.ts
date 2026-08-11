import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { createInvoiceSchema, listInvoicesQuerySchema, idParamSchema } from "./invoices.schema";
import { listHandler, getByIdHandler, createHandler, downloadPdfHandler } from "./invoices.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate({ query: listInvoicesQuerySchema }), asyncHandler(listHandler));
router.get("/:id", validate({ params: idParamSchema }), asyncHandler(getByIdHandler));
router.get("/:id/pdf", validate({ params: idParamSchema }), asyncHandler(downloadPdfHandler));

router.post(
  "/",
  requireRole("ADMIN", "ACCOUNTS", "SALES"),
  validate({ body: createInvoiceSchema }),
  asyncHandler(createHandler)
);

export default router;
