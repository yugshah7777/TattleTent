import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../../lib/api";

const StaffPasswordChange = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const currentPassword = location.state?.currentPassword || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email || !currentPassword) {
      navigate("/", { replace: true });
    }
  }, [currentPassword, email, navigate]);

  const isSubmitDisabled = useMemo(
    () =>
      isLoading ||
      newPassword.length < 8 ||
      confirmPassword.length < 8 ||
      newPassword !== confirmPassword,
    [confirmPassword, isLoading, newPassword]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");
      const response = await fetch(apiUrl("/api/auth/complete-required-password-change"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to update password.");
      }

      navigate("/", {
        replace: true,
        state: {
          openLogin: true,
          email,
          loginMessage: "Password updated successfully. Please log in.",
        },
      });
    } catch (err) {
      setMessage(err.message || "Unable to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-8">
      <div className="surface-panel w-full max-w-md p-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-teal-900">Set New Password</h1>
        <p className="mb-6 text-center text-sm text-gray-600">A password update is required before continuing.</p>

        {message && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="requiredNewPassword" className="mb-1 block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="requiredNewPassword"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#A0522D]"
            />
          </div>

          <div>
            <label htmlFor="requiredConfirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="requiredConfirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#A0522D]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="btn-primary w-full px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffPasswordChange;
