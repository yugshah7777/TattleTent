import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { apiUrl, authHeaders, formatDate } from "../../lib/api";

// const demoComplaint = {
//   id: 123,
//   title: "Pothole on Main Street",
//   description:
//     "There is a large pothole near the intersection causing traffic issues.",
//   category: "Road Maintenance",
//   date: "2025-10-10T10:30:00Z",
//   photo: "https://via.placeholder.com/400x200.png?text=Complaint+Photo",
// };

const FeedbackPage = () => {
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const location = useLocation();
  const { complaint } = location.state || {}; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaint?.id) {
      setMessage("Grievance details are missing. Please return to your dashboard and try again.");
      return;
    }
    if (rating === 0) {
      setMessage("Please choose a star rating before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const payload = { 
        complaint_id: complaint.id,
        rating,
        comment: review,
      };

      const response = await axios.post(
        apiUrl("/api/feedback"),
        payload,
        {
          headers: authHeaders({ "Content-Type": "application/json" }),
        }
      );

      if (response.status === 201) {
        e.target.reset();
      }

      setSubmitted(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        // window.history.back(); // Go back to wherever the user clicked from
        navigate("/citizen-dashboard", { replace: true });
      }, 2000);

    } catch (error) {
      console.error("Error submitting feedback:", error);
      setMessage(error.response?.data?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }

  };

  if (!complaint) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-6">
        <div className="surface-panel max-w-md rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-teal-900">Grievance not found</h1>
          <p className="mt-3 text-sm text-gray-600">
            Feedback is opened from a resolved grievance in your dashboard.
          </p>
          <button className="btn-primary mt-6 px-5 py-2" onClick={() => navigate("/citizen-dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen flex-col items-center px-4 pt-24 sm:px-6">
      {/* Page Header */}
      <div className="mb-8 w-full max-w-4xl text-center">
        <h1 className="mb-2 text-3xl font-bold text-teal-900 sm:text-4xl">Grievance Feedback</h1>
        <p className="text-gray-700 text-sm sm:text-base">
          Your grievance has been resolved. Please provide feedback on the service response.
        </p>
      </div>

      {/* Complaint Card */}
      <div className="surface-panel mb-8 w-full max-w-4xl rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-teal-900 mb-2">{complaint.title}</h2>
        <p className="text-gray-500 text-sm mb-1">
          <span className="font-medium">Category:</span> {complaint.category}
        </p>
        <p className="text-gray-500 text-sm mb-1">
          <span className="font-medium">Date:</span>{" "}
          {formatDate(complaint.update)}
        </p>
        <p className="text-gray-700 mb-3">{complaint.description}</p>
        {complaint.photo && (
          <img
            src={complaint.photo?.startsWith("http") ? complaint.photo : apiUrl(complaint.photo)}
            alt="Complaint"
            className="w-full max-h-64 object-cover rounded-lg mb-3"
          />
        )}
      </div>

      {/* Feedback Form */}
      {!submitted ? (
        <form
          onSubmit={handleSubmit}
          className="surface-panel w-full max-w-4xl rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-[#A0522D] mb-3">Rate the Resolution</h3>
          {/* Star Rating */}
          <div className="flex mb-6">
            {[...Array(5)].map((star, index) => {
              const ratingValue = index + 1;
              return (
                <label key={index}>
                  <input
                    type="radio"
                    name="rating"
                    value={ratingValue}
                    className="sr-only"
                    onClick={() => setRating(ratingValue)}
                  />
                  <FaStar
                    size={32}
                    className="cursor-pointer transition-colors"
                    color={ratingValue <= (hover || rating) ? "#F59E0B" : "#d1d5db"}
                    onMouseEnter={() => setHover(ratingValue)}
                    onMouseLeave={() => setHover(0)}
                  />
                </label>
              );
            })}
          </div>
          {message && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}

          {/* Written Review */}
          <div className="mb-6">
            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-1">
              Your Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              id="review"
              required
              rows={5}
              name="comment"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Write your feedback here..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A0522D] outline-none resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      ) : (
        <div className="surface-panel w-full max-w-4xl rounded-2xl p-6 text-center">
          <h3 className="text-lg font-semibold text-[#A0522D] mb-3">Thank You!</h3>
          <p className="text-gray-700">
            Your feedback has been submitted successfully.
          </p>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
