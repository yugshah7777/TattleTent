import React, { useState, useEffect } from "react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { FiShield } from "react-icons/fi";
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
        // Silently fail
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
    <div className="min-h-screen flex flex-col">
      {/* ============ NAVBAR ============ */}
      <nav className="premium-nav">
        <Logo />
        <button
          className="sm:hidden p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
        <div className={`${menuOpen ? "flex" : "hidden"} sm:flex flex-col sm:flex-row items-center gap-3 absolute sm:relative top-full left-0 right-0 bg-white sm:bg-transparent p-4 sm:p-0 shadow-lg sm:shadow-none border-b sm:border-0 z-50`}>
          <div className="flex items-center gap-2 border-r border-[var(--goi-line)] pr-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={icpHealth.enabled ? "#047857" : "#b45309"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <span className={`text-xs font-semibold uppercase tracking-wide ${icpHealth.enabled ? "text-emerald-700" : "text-amber-700"}`}>
              {icpLoading ? "..." : icpHealth.enabled ? "ICP Active" : "ICP Offline"}
            </span>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-[var(--goi-muted)]">Logged in as</p>
            <p className="font-semibold text-[var(--goi-ink)]">Admin</p>
          </div>
          <button className="btn-secondary btn-sm" onClick={() => navigate("/heatmap")}>Heatmap</button>
          <button className="btn-secondary btn-sm" onClick={() => navigate("/all-complaints")}>All Grievances</button>
          <button className="btn-secondary btn-sm" onClick={() => navigate("/invite-staff")}>Invite Staff</button>
          <button className="btn-primary btn-sm" onClick={() => navigate("/icp-diagnostics")}>Governance</button>
          <button className="btn-muted btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 page-surface pt-28 pb-12 space-y-10">
        {/* Welcome Section */}
        <div>
          <span className="section-kicker">Admin Dashboard</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--goi-ink)] mt-2 leading-tight">Welcome, {user.name}</h1>
          <p className="text-lg text-[var(--goi-muted)] mt-2">Manage departmental officers, assign grievances, review citizen feedback, and monitor system integrity.</p>
        </div>

        {/* Governance Metrics */}
        <section>
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--goi-line)]">
            <div className="w-1 h-6 bg-[var(--goi-deep)] rounded-full"></div>
            <div>
              <span className="section-kicker">System Integrity</span>
              <h2 className="text-xl font-bold text-[var(--goi-ink)]">Governance & Audit Metrics</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: "Verification Rate", value: icpLoading ? "..." : `${verificationRate}%`, icon: "shield", color: "emerald", textColor: "text-emerald-800" },
              { label: "Blockchain Writes", value: icpLoading ? "..." : icpHealth.totalQueued, icon: "lock", color: "blue", textColor: "text-blue-800" },
              { label: "Write Failures", value: icpLoading ? "..." : icpHealth.totalFailures, icon: "x-circle", color: "amber", textColor: "text-amber-800" },
              { label: "System Status", value: icpLoading ? "..." : icpHealth.enabled ? "Operational" : "Check Config", icon: "activity", color: icpHealth.enabled ? "emerald" : "red", textColor: icpHealth.enabled ? "text-emerald-800" : "text-red-800" },
            ].map((item) => (
              <div key={item.label} className="premium-card p-5 flex items-center gap-4 min-h-[90px]">
                <div style={{ width: '52px', height: '52px' }} className={`shrink-0 flex items-center justify-center rounded-xl ${
                  item.color === "emerald" ? "bg-emerald-50 border border-emerald-200/50" : 
                  item.color === "blue" ? "bg-blue-50 border border-blue-200/50" : 
                  item.color === "amber" ? "bg-amber-50 border border-amber-200/50" : 
                  "bg-red-50 border border-red-200/50"
                }`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={
                    item.color === "emerald" ? "#047857" : 
                    item.color === "blue" ? "#0369a1" : 
                    item.color === "amber" ? "#b45309" : 
                    "#dc2626"
                  } strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon === "shield" && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>}
                    {item.icon === "lock" && <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>}
                    {item.icon === "x-circle" && <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>}
                    {item.icon === "activity" && <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--goi-muted)]">{item.label}</p>
                  <p className={`text-xl font-black ${item.textColor} tabular-nums leading-tight mt-0.5`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Cards */}
        <section>
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--goi-line)]">
            <div className="w-1 h-6 bg-[var(--goi-saffron)] rounded-full"></div>
            <div>
              <span className="section-kicker">Dashboard Overview</span>
              <h2 className="text-xl font-bold text-[var(--goi-ink)]">Grievance Statistics</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { title: "Total Grievances", count: (parseInt(counts.resolved, 10) || 0) + (parseInt(counts.in_progress, 10) || 0) + (parseInt(counts.pending, 10) || 0), accent: "bg-[var(--goi-deep)]" },
              { title: "In Progress", count: counts.in_progress, accent: "bg-[var(--goi-blue)]" },
              { title: "Pending", count: counts.pending, accent: "bg-[var(--goi-saffron)]" },
            ].map((s) => (
              <div key={s.title} className="premium-card p-6 flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${s.accent} opacity-80`}></div>
                <div className="text-4xl font-black text-[var(--goi-ink)] tabular-nums leading-none">{s.count}</div>
                <div className="mt-2 font-semibold text-sm text-[var(--goi-muted)] text-center">{s.title}</div>
              </div>
            ))}
          </div>
        </section>

        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}

        {/* New Grievances */}
        <section className="surface-panel p-6">
          <h2 className="text-xl font-bold text-[var(--goi-ink)] mb-5">New Grievances</h2>
          <div className="table-shell">
            <table className="w-full">
              <thead>
                <tr>
                  {["ID", "Category", "Location", "Status", "Assigned To", "Actions"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedNewComplaints.length > 0 ? (
                  paginatedNewComplaints.map((c) => (
                    <tr key={c.id}>
                      <td className="font-bold">#{c.id}</td>
                      <td>{c.category}</td>
                      <td>{c.location}</td>
                      <td><span className={statusClassName(c.status)}>{normalizeStatus(c.status)}</span></td>
                      <td>{c.assignedTo || <span className="text-[var(--goi-muted)]">Unassigned</span>}</td>
                      <td>
                        <button className="btn-primary btn-sm" onClick={() => handleAssignClick(c)}>Assign</button>
                      </td>
                    </tr>
                  ))
                ) : isLoadingNew ? (
                  <tr><td colSpan="6" className="text-center py-8 text-[var(--goi-muted)]">Loading new grievances...</td></tr>
                ) : (
                  <tr><td colSpan="6" className="text-center py-8 text-[var(--goi-muted)]">No new grievances.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalNewPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-5">
              <button onClick={() => setCurrentNewPage((p) => Math.max(p - 1, 1))} disabled={currentNewPage === 1} className="btn-muted btn-sm disabled:opacity-50">Prev</button>
              <span className="text-sm font-semibold text-[var(--goi-muted)]">Page {currentNewPage} of {totalNewPages}</span>
              <button onClick={() => setCurrentNewPage((p) => Math.min(p + 1, totalNewPages))} disabled={currentNewPage === totalNewPages} className="btn-muted btn-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </section>

        {/* Assigned Grievances */}
        <section className="surface-panel p-6">
          <h2 className="text-xl font-bold text-[var(--goi-ink)] mb-5">Assigned Grievances</h2>
          <div className="table-shell">
            <table className="w-full">
              <thead>
                <tr>
                  {["ID", "Category", "Location", "Status", "Assigned To"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedAssignedComplaints.length > 0 ? (
                  paginatedAssignedComplaints.map((c) => (
                    <tr key={c.id}>
                      <td className="font-bold">#{c.id}</td>
                      <td>{c.category}</td>
                      <td>{c.location}</td>
                      <td><span className={statusClassName(c.status)}>{normalizeStatus(c.status)}</span></td>
                      <td>{c.assignedTo || <span className="text-[var(--goi-muted)]">Unassigned</span>}</td>
                    </tr>
                  ))
                ) : isLoadingAssigned ? (
                  <tr><td colSpan="5" className="text-center py-8 text-[var(--goi-muted)]">Loading assigned grievances...</td></tr>
                ) : (
                  <tr><td colSpan="5" className="text-center py-8 text-[var(--goi-muted)]">No assigned grievances.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalAssignedPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-5">
              <button onClick={() => setCurrentAssignedPage((p) => Math.max(p - 1, 1))} disabled={currentAssignedPage === 1} className="btn-muted btn-sm disabled:opacity-50">Prev</button>
              <span className="text-sm font-semibold text-[var(--goi-muted)]">Page {currentAssignedPage} of {totalAssignedPages}</span>
              <button onClick={() => setCurrentAssignedPage((p) => Math.min(p + 1, totalAssignedPages))} disabled={currentAssignedPage === totalAssignedPages} className="btn-muted btn-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="text-center py-4 bg-white border-t border-[var(--goi-line)] text-sm text-[var(--goi-muted)]">
        &copy; {new Date().getFullYear()} Government of India Public Grievance Resolution Portal &middot; Secured by ICP Blockchain
      </footer>
    </div>
  );
};

export default AdminDashboard;