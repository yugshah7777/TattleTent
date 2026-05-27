import asynchandler from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/api-response.js";
import {
  saveComplaintToDB,
  updateComplaintStatusInDB,
  updateComplaintPriorityInDB,
  deleteComplaintFromDB,
  getComplaintCounts,
  searchComplaints,
  escalateComplaintsByCategory,
  fetchHeatmapData,
  getComplaintLifecycleContext,
} from "../services/complaint.service.js";

import { notifyStatusChange } from "../services/notification.service.js";
import {
  queueAuditEvent,
  getComplaintAuditTrailFromIcp,
  getIcpDiagnostics,
} from "../services/icp.service.js";
import {
  queueComplaintVerificationSync,
  verifyComplaintAgainstBlockchain,
} from "../services/complaintProof.service.js";

const VALID_STATUSES = new Set(["New", "IN_PROGRESS", "In Progress", "Resolved", "Closed"]);
const VALID_PRIORITIES = new Set(["Low", "Medium", "High"]);

// Canonical mapping that works bidirectionally
const CANONICAL_STATUS_MAP = {
  "In Progress": "IN_PROGRESS",
  "IN_PROGRESS": "IN_PROGRESS",
};

const normalizeLifecycleStatus = (status) => {
  if (!status) return status;
  return CANONICAL_STATUS_MAP[status] || status;
};

// ✅ Create a new complaint
const createComplaint = asynchandler(async (req, res) => {
  const { title, description, category, location, latitude, longitude,priority } = Object.assign({}, req.body);
  const user_id = req.user?.user_id || req.body.user_id;
  if (!user_id || !title || !description || !category || !location) {
    return res
      .status(400)
      .json(new ApiResponse(400, "All fields are required"));
  }

  const finalPriority = priority || "Low";

  // Create object
  const newComplaint = {
    user_id,
    title,
    description,
    category,
    location,
    priority: finalPriority,
    photo: req.file ? `/temp/${req.file.filename}` : null,
    status: "New",
    latitude,
    longitude,
  };

  // Save complaint 
  const savedComplaint = await saveComplaintToDB(newComplaint);

  // Fire-and-forget ICP audit — must NEVER block the response
  try {
    queueAuditEvent({
      complaintId: savedComplaint.complaint_id,
      action: "COMPLAINT_CREATED",
      actor: `USER_${user_id}`,
      oldValue: null,
      newValue: savedComplaint.status,
      department: category,
      metadataHash: `${savedComplaint.complaint_id}:CREATED`,
      timestamp: new Date(),
    });
  } catch (e) {
    console.error("ICP queueAuditEvent failed (non-blocking):", e.message);
  }

  try {
    queueComplaintVerificationSync(savedComplaint.complaint_id).catch((error) => {
      console.error("ICP verification sync failed after create:", error.message);
    });
  } catch (e) {
    console.error("ICP queueComplaintVerificationSync failed (non-blocking):", e.message);
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, "Complaint submitted successfully", savedComplaint)
    );
});




// ✅ Update Complaint Status
const updateComplaintStatus = asynchandler(async (req, res) => {
  const { id } = req.params;
  // Expects { "status": "new status value" } in req.body
  const { status, staffId, priority } = req.body; 
  const complaintId = parseInt(id, 10);

  if (!Number.isInteger(complaintId)) {
      return res.status(400).json(new ApiResponse(400, "Valid complaint ID is required."));
  }

  if (!status) {
      return res.status(400).json(new ApiResponse(400, "Status is required for this update."));
  }

  if (!VALID_STATUSES.has(status)) {
      return res.status(400).json(new ApiResponse(400, "Invalid complaint status."));
  }

  if (priority && !VALID_PRIORITIES.has(priority)) {
      return res.status(400).json(new ApiResponse(400, "Invalid complaint priority."));
  }

  const beforeUpdate = await getComplaintLifecycleContext(complaintId);
  const updatedComplaint = await updateComplaintStatusInDB(complaintId, status, staffId, priority);

  if (!updatedComplaint)
    return res
      .status(404)
      .json(new ApiResponse(404, "Complaint not found"));

  notifyStatusChange(complaintId);
  const oldStatus = normalizeLifecycleStatus(beforeUpdate?.status || null);
  const newStatus = normalizeLifecycleStatus(updatedComplaint.status || status);
  const actorId = req.user?.user_id ? `USER_${req.user.user_id}` : "SYSTEM";

  queueAuditEvent({
    complaintId,
    action: "STATUS_UPDATED",
    actor: actorId,
    oldValue: oldStatus,
    newValue: newStatus,
    department: beforeUpdate?.department || null,
    metadataHash: `${complaintId}:${oldStatus || "NA"}->${newStatus || "NA"}`,
    timestamp: new Date(),
  });

  if (staffId) {
    queueAuditEvent({
      complaintId,
      action: "DEPARTMENT_ASSIGNED",
      actor: actorId,
      oldValue: beforeUpdate?.assigned_to || null,
      newValue: String(staffId),
      department: beforeUpdate?.department || null,
      metadataHash: `${complaintId}:ASSIGNED:${staffId}`,
      timestamp: new Date(),
    });
  }

  if (newStatus === "Resolved") {
    queueAuditEvent({
      complaintId,
      action: "RESOLUTION_SUBMITTED",
      actor: actorId,
      oldValue: oldStatus,
      newValue: newStatus,
      department: beforeUpdate?.department || null,
      metadataHash: `${complaintId}:RESOLUTION`,
      timestamp: new Date(),
    });
  }

  if (newStatus === "Closed") {
    queueAuditEvent({
      complaintId,
      action: "COMPLAINT_CLOSED",
      actor: actorId,
      oldValue: oldStatus,
      newValue: newStatus,
      department: beforeUpdate?.department || null,
      metadataHash: `${complaintId}:CLOSED`,
      timestamp: new Date(),
    });
  }

  if ((oldStatus === "Resolved" || oldStatus === "Closed") && (newStatus === "New" || newStatus === "IN_PROGRESS")) {
    queueAuditEvent({
      complaintId,
      action: "COMPLAINT_REOPENED",
      actor: actorId,
      oldValue: oldStatus,
      newValue: newStatus,
      department: beforeUpdate?.department || null,
      metadataHash: `${complaintId}:REOPENED`,
      timestamp: new Date(),
    });
  }

  queueComplaintVerificationSync(complaintId).catch((error) => {
    console.error("ICP verification sync failed after status update:", error.message);
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Complaint status updated successfully", updatedComplaint));
});

// ✅ Update Complaint Priority (and recalculate SLA)
const updateComplaintPriority = asynchandler(async (req, res) => {
  const { id } = req.params;
  // Expects { "priority": "new priority value" } in req.body
  const { priority } = req.body;
  const complaintId = parseInt(id, 10);

  if (!Number.isInteger(complaintId)) {
      return res.status(400).json(new ApiResponse(400, "Valid complaint ID is required."));
  }

  if (!priority) {
      return res.status(400).json(new ApiResponse(400, "Priority is required for this update."));
  }

  if (!VALID_PRIORITIES.has(priority)) {
      return res.status(400).json(new ApiResponse(400, "Invalid complaint priority."));
  }

  const updatedComplaint = await updateComplaintPriorityInDB(complaintId, priority);

  if (!updatedComplaint)
    return res
      .status(404)
      .json(new ApiResponse(404, "Complaint not found"));

  return res
    .status(200)
    .json(new ApiResponse(200, "Complaint priority updated successfully", updatedComplaint));
});


// ✅ Delete Complaint
const deleteComplaint = asynchandler(async (req, res) => {
  const { id } = req.params;
  const complaintId = parseInt(id, 10);

  if (!Number.isInteger(complaintId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Valid complaint ID is required."));
  }

  const deleted = await deleteComplaintFromDB(complaintId);

  if (!deleted)
    return res
      .status(404)
      .json(new ApiResponse(404, "Complaint not found"));

  return res
    .status(200)
    .json(new ApiResponse(200, "Complaint deleted successfully"));
});

// total count
const fetchComplaintCounts = async (req, res) => {
  try {
    const counts = await getComplaintCounts();
    res.status(200).json(counts);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// search and filter
const getComplaints = async (req, res) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      searchText: req.query.q,
      category: req.query.category,
      status: req.query.status,
      location: req.query.location,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      order: req.query.order,
      staff_id: req.query.staff_id,
    };

    const complaints = await searchComplaints(filters);
    res.status(200).json(complaints);
  } catch (err) {
    console.error('Error in getComplaints:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};


/**
 * 🧭 Manual Escalation Trigger
 * Route: POST /api/complaints/escalate
 * Description: Runs escalation logic manually (for testing or admin use)
 */
const escalateComplaints = asynchandler(async (req, res) => {
  const escalated = await escalateComplaintsByCategory();

  if (escalated.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, "✅ No complaints needed escalation today"));
  }

  return res.status(200).json(
    new ApiResponse(200, "⚡ Complaints escalated successfully", {
      count: escalated.length,
      escalated,
    })
  );
});

const getHeatmapData = async (req, res) => {
  try {
    const complaints = await fetchHeatmapData();
    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    res.status(500).json({ error: "Failed to fetch heatmap data" });
  }
};

const getComplaintAuditTrail = asynchandler(async (req, res) => {
  const complaintId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(complaintId)) {
    return res.status(400).json(new ApiResponse(400, "Valid complaint ID is required."));
  }

  const trail = await getComplaintAuditTrailFromIcp(complaintId);
  return res.status(200).json(new ApiResponse(200, "Audit trail fetched successfully", trail));
});

const getComplaintVerification = asynchandler(async (req, res) => {
  const complaintId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(complaintId)) {
    return res.status(400).json(new ApiResponse(400, "Valid complaint ID is required."));
  }

  const verification = await verifyComplaintAgainstBlockchain(complaintId);
  return res.status(200).json(new ApiResponse(200, "Complaint verification fetched successfully", verification));
});

const getComplaintVerificationBatch = asynchandler(async (req, res) => {
  const ids = String(req.query.ids || "")
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isInteger(value));

  if (ids.length === 0) {
    return res.status(400).json(new ApiResponse(400, "At least one complaint ID is required."));
  }

  const uniqueIds = Array.from(new Set(ids));
  const records = await Promise.all(uniqueIds.map((id) => verifyComplaintAgainstBlockchain(id)));
  const map = records.reduce((acc, entry) => {
    acc[entry.complaintId] = entry;
    return acc;
  }, {});

  return res.status(200).json(new ApiResponse(200, "Verification records fetched successfully", map));
});

const getIcpDiagnosticsController = asynchandler(async (req, res) => {
  const diagnostics = getIcpDiagnostics();
  return res.status(200).json({
    success: true,
    message: "ICP diagnostics fetched successfully",
    data: diagnostics,
  });
});

export {
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
};
