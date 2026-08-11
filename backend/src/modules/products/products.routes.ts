import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  stockAdjustSchema,
  idParamSchema,
} from "./products.schema";
import {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  adjustStockHandler,
  listStockMovementsHandler,
} from "./products.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate({ query: listProductsQuerySchema }), asyncHandler(listHandler));
router.get("/stock-movements", asyncHandler(listStockMovementsHandler));
router.get("/:id", validate({ params: idParamSchema }), asyncHandler(getByIdHandler));

router.post(
  "/",
  requireRole("ADMIN", "WAREHOUSE"),
  validate({ body: createProductSchema }),
  asyncHandler(createHandler)
);

router.put(
  "/:id",
  requireRole("ADMIN", "WAREHOUSE"),
  validate({ params: idParamSchema, body: updateProductSchema }),
  asyncHandler(updateHandler)
);

router.post(
  "/:id/stock-movements",
  requireRole("ADMIN", "WAREHOUSE"),
  validate({ params: idParamSchema, body: stockAdjustSchema }),
  asyncHandler(adjustStockHandler)
);

export default router;
