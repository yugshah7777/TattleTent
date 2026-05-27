import React, { useState, useEffect } from "react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  apiUrl,
  clearSession,
  getStoredUser,
  normalizeStatus,
  statusClassName,
} from "../../lib/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser() || { name: "Admin" });
  const [counts, setCounts] = useState({ resolved: 0, pending: 0, in_progress: 0 });
  const [isLoadingNew, setIsLoadingNew] = useState(true);
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);

  const [complaints, setComplaints] = useState([]);
  const [assignedComplaints, setAssignedComplaints] = useState([]);

  const [currentNewPage, setCurrentNewPage] = useState(1);
  const [currentAssignedPage, setCurrentAssignedPage] = useState(1);
  const complaintsPerPage = 5;

  // ICP Diagnostics integration
  const [icpHealth, setIcpHealth] = useState({ enabled: false, configured: false, totalQueued: 0, totalFailures: 0 });
  const [icpLoading, setIcpLoading] = useState(true);

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const user = sessionStorage.getItem("user");
    if (!token || !user) { navigate("/"); }
    if (user && JSON.parse(user).role !== "Ringmaster") { navigate("/"); }
  }, [navigate]);

  const fetchCounts = async () => {
    try {
      const res = await axios.get(apiUrl("/api/complaints/counts"));
      setCounts(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // Fetch ICP diagnostics for governance dashboard
  useEffect(() => {
    const loadDiagnostics = async () => {
      try {
        setIcpLoading(true);
        const response = await fetch(apiUrl("/api/complaints/icp/diagnostics"), {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        });
        const payload = await response.json();
        const data = payload?.data || null;
        if (data) {
          setIcpHealth({
            enabled: data.enabled,
            configured: data.configured,
            totalQueued: data.counters?.totalQueuedWrites ?? 0,
            totalFailures: data.counters?.totalWriteFailures ?? 0,
          });
        }
      } catch {
        // Silently fail - diagnostics may not be available
      } finally {
        setIcpLoading(false);
      }
    };
    loadDiagnostics();
  }, []);

  const fetchComplaintsByUser = async () => {
    try {
      if (!user?.user_id) return;
      const queryParams = new URLSearchParams({ status: "New" }).toString();
      setIsLoadingNew(true);
      setErrorMessage("");
      const response = await fetch(apiUrl(`/api/complaints/search?${queryParams}`));
      if (!response.ok) throw new Error("Failed to fetch complaints");
      const data = await response.json();
      setComplaints(data.map(c => ({
        id: c.complaint_id,
        category: c.category,
        location: c.location,
        status: c.status,
        assignedTo: c.assigned_to,
        staff_id: c.staff_id,
      })));
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setComplaints([]);
      setErrorMessage("Unable to load new complaints. Please try again.");
    } finally {
      setIsLoadingNew(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) fetchComplaintsByUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAssignedComplaints = async () => {
    try {
      if (!user?.user_id) return;
      const queryParams = new URLSearchParams({ status: "IN_PROGRESS" }).toString();
      setIsLoadingAssigned(true);
      setErrorMessage("");
      const response = await fetch(apiUrl(`/api/complaints/search?${queryParams}`));
      if (!response.ok) throw new Error("Failed to fetch complaints");
      const data = await response.json();
      setAssignedComplaints(data.map(c => ({
        id: c.complaint_id,
        category: c.category,
        location: c.location,
        status: c.status,
        assignedTo: c.assigned_to,
        staff_id: c.staff_id,
      })));
    } catch (err) {
      console.error("Error fetching assigned complaints:", err);
      setAssignedComplaints([]);
      setErrorMessage("Unable to load assigned complaints. Please try again.");
    } finally {
      setIsLoadingAssigned(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) fetchAssignedComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const totalNewPages = Math.max(1, Math.ceil(complaints.length / complaintsPerPage));
  const paginatedNewComplaints = complaints.slice(
    (currentNewPage - 1) * complaintsPerPage,
    currentNewPage * complaintsPerPage
  );

  const totalAssignedPages = Math.max(1, Math.ceil(assignedComplaints.length / complaintsPerPage));
  const paginatedAssignedComplaints = assignedComplaints.slice(
    (currentAssignedPage - 1) * complaintsPerPage,
    currentAssignedPage * complaintsPerPage
  );

  const handleAssignClick = (complaint) => {
    navigate("/assign-staff", { state: { complaint } });
  };

  const verificationRate = icpHealth.totalQueued + icpHealth.totalFailures > 0
    ? Math.round((icpHealth.totalQueued / (icpHealth.totalQueued + icpHealth.totalFailures)) * 100)
    : 100;

  return (
    <div className="app-shell min-h-screen font-sans flex flex-col justify-between">
      <div className="premium-nav fixed top-0 left-0 w-full min-h-24 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 z-50">
        <div className="w-full sm:w-auto flex items-center justify-between">
          <Logo />
          <div className="sm:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200" aria-label="Toggle navigation menu" aria-expanded={menuOpen}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className={`w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4 mt-4 sm:mt-0 ${menuOpen ? "block" : "hidden sm:flex"}`}>
          <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={icpHealth.enabled ? "#047857" : "#b45309"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <span className={`text-xs font-semibold uppercase tracking-wide ${icpHealth.enabled ? "text-emerald-700" : "text-amber-700"}`}>
              {icpHealth.enabled ? "ICP Active" : "ICP Offline"}
            </span>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm text-gray-600">Logged in as</p>
            <p className="font-semibold text-gray-800">Admin</p>
          </div>
          <button className="btn-secondary" onClick={() => navigate("/heatmap")}>Heatmap</button>
          <button className="btn-secondary" onClick={() => navigate("/all-complaints")}>All Grievances</button>
          <button className="btn-secondary" onClick={() => navigate("/invite-staff")}>Invite Staff</button>
          <button className="btn-primary" onClick={() => navigate("/icp-diagnostics")}>Governance Integrity</button>
          <button className="btn-muted" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <main className="container mx-auto px-6 py-12 max-w-7xl pt-32 space-y-12 flex-grow">
        <div className="text-center">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-950 leading-tight tracking-tight">Welcome, {user.name}</h2>
          <p className="text-gray-700 text-lg italic">Manage departmental officers, assign grievances, review citizen feedback, and monitor system integrity.</p>
        </div>

        {/* Governance Integrity Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="premium-card p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification Rate</p>
              <p className="text-2xl font-extrabold text-slate-950">{icpLoading ? "..." : `${verificationRate}%`}</p>
            </div>
          </div>
          <div className="premium-card p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blockchain Writes</p>
              <p className="text-2xl font-extrabold text-slate-950">{icpLoading ? "..." : icpHealth.totalQueued}</p>
            </div>
          </div>
          <div className="premium-card p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Write Failures</p>
              <p className="text-2xl font-extrabold text-slate-950">{icpLoading ? "..." : icpHealth.totalFailures}</p>
            </div>
          </div>
          <div className="premium-card p-5 flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${icpHealth.enabled ? "bg-emerald-100" : "bg-red-100"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={icpHealth.enabled ? "#047857" : "#dc2626"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">System Status</p>
              <p className="text-lg font-extrabold text-slate-950">{icpLoading ? "..." : icpHealth.enabled ? "Operational" : "Check Config"}</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { title: "Total Grievances", count: (parseInt(counts.resolved, 10) || 0) + (parseInt(counts.in_progress, 10) || 0) + (parseInt(counts.pending, 10) || 0) },
            { title: "In Progress", count: counts.in_progress },
            { title: "Pending", count: counts.pending },
          ].map((s) => (
            <div key={s.title} className="premium-card metric-card px-3 py-8 flex flex-col items-center text-slate-900">
              <div className="text-4xl font-extrabold">{s.count}</div>
              <div className="mt-2 font-semibold text-lg text-center">{s.title}</div>
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800 shadow-sm">{errorMessage}</div>
        )}

        <div className="surface-panel p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-3xl font-bold text-gray-900">New Grievances</h3>
          </div>
          <div className="table-shell overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-200">
              <thead className="bg-white">
                <tr>
                  {["ID", "Category", "Location", "Status", "Assigned To", "Actions"].map((h) => (
                    <th key={h} className="p-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200 bg-white">
                {paginatedNewComplaints.length > 0 ? (
                  paginatedNewComplaints.map((c) => (
                    <tr key={c.id} className="transition">
                      <td className="p-4 font-bold">{c.id}</td>
                      <td className="p-4">{c.category}</td>
                      <td className="p-4">{c.location}</td>
                      <td className="p-4"><span className={statusClassName(c.status)}>{normalizeStatus(c.status)}</span></td>
                      <td className="p-4">{c.assignedTo || "Unassigned"}</td>
                      <td className="p-4">
                        <button className="btn-primary px-3 py-1.5 text-sm" onClick={() => handleAssignClick(c)}>Assign</button>
                      </td>
                    </tr>
                  ))
                ) : isLoadingNew ? (
                  <tr><td colSpan="6" className="text-center p-6 text-gray-500">Loading new grievances...</td></tr>
                ) : (
                  <tr><td colSpan="6" className="text-center p-4 text-gray-500">No grievances found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center items-center gap-4 mt-6">
            <button onClick={() => setCurrentNewPage((p) => Math.max(p - 1, 1))} disabled={currentNewPage === 1} className="btn-muted px-4 py-2 disabled:opacity-50">Prev</button>
            <span className="text-lg font-semibold">Page {currentNewPage} of {totalNewPages}</span>
            <button onClick={() => setCurrentNewPage((p) => Math.min(p + 1, totalNewPages))} disabled={currentNewPage === totalNewPages} className="btn-muted px-4 py-2 disabled:opacity-50">Next</button>
          </div>
        </div>

        <div className="surface-panel p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-3xl font-bold text-gray-900">Assigned Grievances</h3>
          </div>
          <div className="table-shell overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-200">
              <thead className="bg-white">
                <tr>
                  {["ID", "Category", "Location", "Status", "Assigned To"].map((h) => (
                    <th key={h} className="p-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200 bg-white">
                {paginatedAssignedComplaints.length > 0 ? (
                  paginatedAssignedComplaints.map((c) => (
                    <tr key={c.id} className="transition">
                      <td className="p-4 font-bold">{c.id}</td>
                      <td className="p-4">{c.category}</td>
                      <td className="p-4">{c.location}</td>
                      <td className="p-4"><span className={statusClassName(c.status)}>{normalizeStatus(c.status)}</span></td>
                      <td className="p-4">{c.assignedTo}</td>
                    </tr>
                  ))
                ) : isLoadingAssigned ? (
                  <tr><td colSpan="5" className="text-center p-6 text-gray-500">Loading assigned grievances...</td></tr>
                ) : (
                  <tr><td colSpan="6" className="text-center p-4 text-gray-500">No grievances found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center items-center gap-4 mt-6">
            <button onClick={() => setCurrentAssignedPage((p) => Math.max(p - 1, 1))} disabled={currentAssignedPage === 1} className="btn-muted px-4 py-2 disabled:opacity-50">Prev</button>
            <span className="text-lg font-semibold">Page {currentAssignedPage} of {totalAssignedPages}</span>
            <button onClick={() => setCurrentAssignedPage((p) => Math.min(p + 1, totalAssignedPages))} disabled={currentAssignedPage === totalAssignedPages} className="btn-muted px-4 py-2 disabled:opacity-50">Next</button>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 bg-white shadow-inner text-gray-600 text-sm">
        © {new Date().getFullYear()} Government of India Public Grievance Resolution Portal. &middot; Secured by ICP Blockchain
      </footer>
    </div>
  );
};

export default AdminDashboard;