import express from "express";
import {
  createFeedback,
  getAllFeedbacks,
  getFeedbackForComplaint,
} from "../controllers/feedback.controllers.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Routes
router.post("/", protect, createFeedback); // POST /api/feedback
router.get("/", getAllFeedbacks); // GET /api/feedback
router.get("/:id", getFeedbackForComplaint); // GET /api/feedback/:id (complaint ID)

export default router;
