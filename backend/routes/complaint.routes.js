import express from "express"
import upload from "../middlewares/upload.middleware.js";
import {
  createComplaint,
  updateComplaintStatus,
  updateComplaintPriority,
  deleteComplaint,
  fetchComplaintCounts,
  getComplaints,
  escalateComplaints,
  getHeatmapData,
  getComplaintAuditTrail,
  getComplaintVerification,
  getComplaintVerificationBatch,
  getIcpDiagnosticsController,
} from "../controllers/complaint.controllers.js";
import { protect, adminOnly, staffOrAdmin } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.post("/", protect, upload.single("photo"), createComplaint);
router.put("/status/:id", protect, staffOrAdmin, updateComplaintStatus);
router.put("/priority/:id", protect, staffOrAdmin, updateComplaintPriority);
router.delete("/:id", protect, adminOnly, deleteComplaint);
router.get('/counts', fetchComplaintCounts);
router.get('/search', getComplaints);
router.get("/icp/diagnostics", protect, adminOnly, getIcpDiagnosticsController);
router.get("/verification-batch", getComplaintVerificationBatch);
router.get("/:id/audit-trail", getComplaintAuditTrail);
router.get("/:id/verification", getComplaintVerification);
router.post("/escalate", protect, adminOnly, escalateComplaints); // manual trigger route
router.get("/heatmap", getHeatmapData);

export default router;
