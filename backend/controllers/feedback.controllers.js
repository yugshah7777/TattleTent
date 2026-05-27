import  asynchandler  from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/api-response.js";
import {
  saveFeedbackToDB,
  getFeedbacksFromDB,
  getFeedbacksForComplaintFromDB,
} from "../services/feedback.service.js";


// ✅ Create Feedback
const createFeedback = asynchandler(async (req, res) => {
  const { complaint_id, rating, comment } = req.body;
  const numericRating = Number(rating);

  if (!complaint_id || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Complaint ID and a 1-5 rating are required"));
  }

  if (!comment || !comment.trim()) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Feedback comment is required"));
  }

  const feedback = await saveFeedbackToDB({ complaint_id, rating: numericRating, comment: comment.trim() });

  return res
    .status(201)
    .json(new ApiResponse(201, "Feedback submitted successfully", feedback));
});


// ✅ Get all Feedbacks
const getAllFeedbacks = asynchandler(async (req, res) => {
  const feedbacks = await getFeedbacksFromDB();

  if (feedbacks.length === 0) {
    return res.status(404).json(new ApiResponse(404, "No feedback found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Feedbacks fetched successfully", feedbacks));
});


// ✅ Get Feedback by Complaint ID
const getFeedbackForComplaint = asynchandler(async (req, res) => {
  const { id } = req.params; // complaint ID

  const feedback = await getFeedbacksForComplaintFromDB(id);

  if (feedback.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, "No feedback for this complaint"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Feedback fetched successfully", feedback));
});

export { createFeedback, getAllFeedbacks, getFeedbackForComplaint };
