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
  fetchHeatmapData 
} from "../services/complaint.service.js";

import { notifyStatusChange } from "../services/notification.service.js";

const VALID_STATUSES = new Set(["New", "IN_PROGRESS", "In Progress", "Resolved"]);
const VALID_PRIORITIES = new Set(["Low", "Medium", "High"]);

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

  const updatedComplaint = await updateComplaintStatusInDB(complaintId, status, staffId, priority);

  if (!updatedComplaint)
    return res
      .status(404)
      .json(new ApiResponse(404, "Complaint not found"));

  notifyStatusChange(complaintId);

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

export { createComplaint, updateComplaintStatus,updateComplaintPriority, deleteComplaint, fetchComplaintCounts ,getComplaints,escalateComplaints, getHeatmapData};
