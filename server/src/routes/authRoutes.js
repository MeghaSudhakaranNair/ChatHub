import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { ssoSchema } from "../validator/authValidator.js";
import {
  googleAuth,
  getUserDetails,
  handleLogout,
} from "../controller/authController.js";

const router = express.Router();

router.post("/google-auth", validate(ssoSchema), googleAuth);
router.post("/logout", handleLogout);
router.get("/fetchUser", protect, getUserDetails);

export default router;
