import { apiUrl } from "./api";

const readApiPayload = (response) => {
  if (!response || typeof response !== "object") return null;
  if (response.message && typeof response.message === "object") return response.message;
  if (response.data && typeof response.data === "object") return response.data;
  return null;
};

export const fetchVerificationBatch = async (complaintIds = []) => {
  const ids = complaintIds
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value));

  if (ids.length === 0) return {};

  const response = await fetch(apiUrl(`/api/complaints/verification-batch?ids=${ids.join(",")}`));
  if (!response.ok) {
    throw new Error("Unable to fetch blockchain verification records");
  }

  const json = await response.json();
  return readApiPayload(json) || {};
};

export const fetchComplaintAuditTrail = async (complaintId) => {
  const id = Number.parseInt(complaintId, 10);
  if (!Number.isInteger(id)) return [];

  const response = await fetch(apiUrl(`/api/complaints/${id}/audit-trail`));
  if (!response.ok) {
    throw new Error("Unable to fetch complaint audit trail");
  }

  const json = await response.json();
  const payload = readApiPayload(json);
  return Array.isArray(payload) ? payload : [];
};

export const fetchComplaintVerification = async (complaintId) => {
  const id = Number.parseInt(complaintId, 10);
  if (!Number.isInteger(id)) return null;

  const response = await fetch(apiUrl(`/api/complaints/${id}/verification`));
  if (!response.ok) {
    throw new Error("Unable to fetch complaint verification");
  }

  const json = await response.json();
  return readApiPayload(json);
};
