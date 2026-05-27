export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

export const getToken = () => sessionStorage.getItem("token");

export const getStoredUser = () => {
  try {
    const user = sessionStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    sessionStorage.removeItem("user");
    return null;
  }
};

export const authHeaders = (extra = {}) => {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
};

export const clearSession = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
};

export const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString();
};

export const normalizeStatus = (status) => {
  if (status === "IN_PROGRESS") return "In Progress";
  return status || "Unknown";
};

export const statusClassName = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === "Resolved") return "status-pill status-success";
  if (normalized === "In Progress") return "status-pill status-warning";
  if (normalized === "New") return "status-pill status-danger";
  return "status-pill status-muted";
};
