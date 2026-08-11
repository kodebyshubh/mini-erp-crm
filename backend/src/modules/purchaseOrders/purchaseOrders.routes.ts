import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { createPOSchema, listPOQuerySchema, idParamSchema } from "./purchaseOrders.schema";
import { listHandler, getByIdHandler, createHandler, receiveHandler, cancelHandler } from "./purchaseOrders.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate({ query: listPOQuerySchema }), asyncHandler(listHandler));
router.get("/:id", validate({ params: idParamSchema }), asyncHandler(getByIdHandler));

router.post(
  "/",
  requireRole("ADMIN", "WAREHOUSE"),
  validate({ body: createPOSchema }),
  asyncHandler(createHandler)
);

router.post(
  "/:id/receive",
  requireRole("ADMIN", "WAREHOUSE"),
  validate({ params: idParamSchema }),
  asyncHandler(receiveHandler)
);

router.post(
  "/:id/cancel",
  requireRole("ADMIN", "WAREHOUSE"),
  validate({ params: idParamSchema }),
  asyncHandler(cancelHandler)
);

export default router;
