import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createChallanSchema,
  updateChallanSchema,
  listChallansQuerySchema,
  idParamSchema,
} from "./challans.schema";
import {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  confirmHandler,
  cancelHandler,
} from "./challans.controller";

const router = Router();

router.use(requireAuth);

router.get("/", validate({ query: listChallansQuerySchema }), asyncHandler(listHandler));
router.get("/:id", validate({ params: idParamSchema }), asyncHandler(getByIdHandler));

router.post(
  "/",
  requireRole("ADMIN", "SALES"),
  validate({ body: createChallanSchema }),
  asyncHandler(createHandler)
);

router.put(
  "/:id",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema, body: updateChallanSchema }),
  asyncHandler(updateHandler)
);

router.post(
  "/:id/confirm",
  requireRole("ADMIN", "SALES", "WAREHOUSE"),
  validate({ params: idParamSchema }),
  asyncHandler(confirmHandler)
);

router.post(
  "/:id/cancel",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema }),
  asyncHandler(cancelHandler)
);

export default router;
