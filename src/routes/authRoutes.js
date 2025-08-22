// routes/authRoutes.js
import express from "express";
import {
  signup,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
} from "../controllers/auth/authController.js"; // import new functions

import authMiddleware from "../middleware/auth.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public Routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);

// Forgot Password / Reset Password
router.post("/forgot-password", forgotPassword);  // Request reset
router.post("/reset-password/:token", resetPassword);  // Reset password with token

// Protected Routes
router.get("/profile", protect);
router.post("/logout", authMiddleware, logout);

export default router;
