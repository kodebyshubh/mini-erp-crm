import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { loginSchema } from "./auth.schema";
import { loginHandler, meHandler } from "./auth.controller";

const router = Router();

router.post("/login", validate({ body: loginSchema }), asyncHandler(loginHandler));
router.get("/me", requireAuth, asyncHandler(meHandler));

export default router;
