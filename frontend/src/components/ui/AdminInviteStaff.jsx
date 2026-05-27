"use client";
import React, { useState } from "react";
import AppButton from "./app-button";
import { useNavigate } from "react-router-dom";
import { apiUrl, authHeaders } from "../../lib/api";

export default function AdminInviteStaff() {
  const token = sessionStorage.getItem("token");
  const [staffName, setStaffName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const res = await fetch(apiUrl("/api/auth/admin/create-staff"), {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: staffName, email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to send invitation");

      setSuccess(true);
      setMessage("Officer invitation sent successfully.");
      setStaffName("");
      setEmail("");
    } catch (err) {
      setMessage(err.message);
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell min-h-screen text-gray-900 flex flex-col items-center p-6 md:p-12">
      
      {/* Back Button */}
      <div className="self-start mb-6">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="btn-muted"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {/* Page Header */}
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-teal-900 mb-4">
          Invite Department Officer
        </h1>
        <p className="text-lg md:text-xl text-slate-600">
          Add an authorised officer by sending account instructions to their official email address.
        </p>
      </div>

      {/* Invitation Form */}
      <form
        onSubmit={handleSendInvite}
        className="surface-panel p-8 md:p-12 w-full max-w-md"
      >
        {/* Success / Error Message */}
        {message && (
          <p
            className={`text-center mb-4 text-sm font-medium ${
              success ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        {/* Officer Name */}
        <div className="mb-4">
          <label htmlFor="staffName" className="block text-sm font-medium text-gray-700 mb-1">
            Officer Name <span className="text-red-500">*</span>
          </label>
          <input
            id="staffName"
            type="text"
            placeholder="e.g., John Doe"
            required
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#d55d1f] outline-none"
          />
        </div>

        {/* Officer Email */}
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="staff@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#d55d1f] outline-none"
          />
        </div>

        {/* Send Invite Button */}
        <AppButton
          type="submit"
          disabled={isLoading || !staffName || !email || !token}
          className={`w-full py-3 rounded-lg text-white transition-colors duration-200 ${
            !staffName || !email
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-900 hover:bg-teal-950"
          }`}
        >
          {isLoading ? "Sending..." : "Send Officer Invitation"}
        </AppButton>
      </form>
    </div>
  );
}
