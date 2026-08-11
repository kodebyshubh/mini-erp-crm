import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  addFollowUpSchema,
  idParamSchema,
} from "./customers.schema";
import {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  addFollowUpHandler,
} from "./customers.controller";

const router = Router();

// All customer routes require auth. Admin + Sales manage CRM data;
// other roles can still view.
router.use(requireAuth);

router.get("/", validate({ query: listCustomersQuerySchema }), asyncHandler(listHandler));
router.get("/:id", validate({ params: idParamSchema }), asyncHandler(getByIdHandler));

router.post(
  "/",
  requireRole("ADMIN", "SALES"),
  validate({ body: createCustomerSchema }),
  asyncHandler(createHandler)
);

router.put(
  "/:id",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema, body: updateCustomerSchema }),
  asyncHandler(updateHandler)
);

router.post(
  "/:id/follow-ups",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema, body: addFollowUpSchema }),
  asyncHandler(addFollowUpHandler)
);

export default router;
