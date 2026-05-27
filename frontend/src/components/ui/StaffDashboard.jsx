import React, { useState, useEffect } from "react";
import Logo from "./Logo.jsx";
import { FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  apiUrl,
  authHeaders,
  clearSession,
  formatDate,
  getStoredUser,
  normalizeStatus,
  statusClassName,
} from "../../lib/api";
import useBodyScrollLock from "../../lib/useBodyScrollLock";
import { fetchComplaintAuditTrail, fetchComplaintVerification } from "../../lib/blockchain";
import BlockchainBadge, { AuditTimeline } from "./BlockchainBadge";

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const calculateResolutionHours = (complaint) => {
  const submitted = complaint.submittedAt ? new Date(complaint.submittedAt) : null;
  const updated = complaint.updatedAt ? new Date(complaint.updatedAt) : null;
  if (!submitted || !updated || Number.isNaN(submitted.getTime()) || Number.isNaN(updated.getTime())) return null;
  return Math.max(0, (updated.getTime() - submitted.getTime()) / (1000 * 60 * 60));
};

const calculateAgeHours = (complaint) => {
  const submitted = complaint.submittedAt ? new Date(complaint.submittedAt) : null;
  if (!submitted || Number.isNaN(submitted.getTime())) return null;
  return Math.max(0, (Date.now() - submitted.getTime()) / (1000 * 60 * 60));
};

const getSlaHours = (priority) => {
  if (priority === "High") return 24;
  if (priority === "Medium") return 48;
  return 72;
};

const getPriorityWeight = (priority) => {
  if (priority === "High") return 1.35;
  if (priority === "Medium") return 1.1;
  return 0.85;
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser() || { name: "Guest" });
  const [counts, setCounts] = useState({ resolved: 0, pending: 0, in_progress: 0 });

  const [showPerformance, setShowPerformance] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [verificationRecord, setVerificationRecord] = useState(null);
  const [isLoadingAuditTrail, setIsLoadingAuditTrail] = useState(false);

  useBodyScrollLock(showPerformance || isViewOpen);

  const fetchCounts = async () => {
    try {
      const res = await axios.get(apiUrl("/api/complaints/counts"));
      setCounts(res.data);
    } catch {
      setErrorMessage("Unable to load dashboard counts.");
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const user = sessionStorage.getItem("user");
    if (!token || !user) { navigate("/"); }
    if (user && JSON.parse(user).role !== "Staff") { navigate("/"); }
  }, [navigate]);

  useEffect(() => {
    fetchCounts();
  }, []);

  const [complaints, setComplaints] = useState([]);
  const [newComplaints, setNewComplaints] = useState([]);
  const [resolvedComplaints, setResolvedComplaints] = useState([]);

  const fetchComplaintsByUser = async () => {
    try {
      if (!user?.user_id) return;
      const queryParams = new URLSearchParams({ staff_id: user.user_id }).toString();
      setIsLoadingComplaints(true);
      setErrorMessage("");
      const response = await fetch(apiUrl(`/api/complaints/search?${queryParams}`));
      if (!response.ok) throw new Error("Failed to fetch complaints");
      const data = await response.json();
      setComplaints(data.map(c => ({
        id: c.complaint_id,
        category: c.category,
        status: c.status,
        description: c.description,
        location: c.location,
        priority: c.priority,
        title: c.title,
        assignedTo: c.assigned_to,
        staff_id: c.staff_id,
        photo: c.photo,
        submittedAt: c.submitted_at,
        updatedAt: c.updated_at,
        subdate: formatDate(c.submitted_at),
        update: formatDate(c.updated_at)
      })));
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setComplaints([]);
      setErrorMessage("Unable to load assigned complaints. Please try again.");
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchComplaintsByUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setNewComplaints(complaints.filter((c) => c.status === "IN_PROGRESS"));
    setResolvedComplaints(complaints.filter((c) => c.status === "Resolved"));
  }, [complaints]);

  const handleResolvedComplaints = async (complaint) => {
    try {
      setResolvingId(complaint.id);
      setErrorMessage("");
      await axios.put(apiUrl(`/api/complaints/status/${complaint.id}`), {
        status: "Resolved",
      }, { headers: authHeaders() });
      setComplaints(prevComplaints =>
        prevComplaints.map(c =>
          c.id === complaint.id ? { ...c, status: "Resolved", update: formatDate(new Date()) } : c
        )
      );
      fetchCounts();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Unable to resolve this complaint. Please try again.");
    } finally {
      setResolvingId(null);
    }
  };

  const complaintsPerPage = 3;

  const [currentNewPage, setCurrentNewPage] = useState(1);
  const totalNewPages = Math.max(1, Math.ceil(newComplaints.length / complaintsPerPage));
  const paginatedNewComplaints = newComplaints.slice(
    (currentNewPage - 1) * complaintsPerPage,
    currentNewPage * complaintsPerPage
  );

  const [currentResolvedPage, setCurrentResolvedPage] = useState(1);
  const totalResolvedPages = Math.max(1, Math.ceil(resolvedComplaints.length / complaintsPerPage));
  const paginatedResolvedComplaints = resolvedComplaints.slice(
    (currentResolvedPage - 1) * complaintsPerPage,
    currentResolvedPage * complaintsPerPage
  );

  const handleViewClick = async (complaint) => {
    setSelectedComplaint(complaint);
    setIsViewOpen(true);
    setIsLoadingAuditTrail(true);
    try {
      const [trail, verification] = await Promise.all([
        fetchComplaintAuditTrail(complaint.id),
        fetchComplaintVerification(complaint.id),
      ]);
      setAuditTrail(trail);
      setVerificationRecord(verification);
    } catch (error) {
      console.error("Unable to load blockchain details:", error);
      setAuditTrail([]);
      setVerificationRecord(null);
    } finally {
      setIsLoadingAuditTrail(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High": return "bg-red-50 text-red-700 border border-red-300";
      case "Medium": return "bg-yellow-50 text-yellow-700 border border-yellow-300";
      case "Low": return "bg-blue-50 text-blue-700 border border-blue-300";
      default: return "bg-gray-50 text-gray-700 border border-gray-300";
    }
  };

  const performanceMetrics = React.useMemo(() => {
    const assigned = complaints.filter((c) => c.staff_id === user.user_id);
    const resolved = assigned.filter((c) => c.status === "Resolved");
    const active = assigned.filter((c) => c.status === "IN_PROGRESS");
    const resolvedWithTime = resolved
      .map((complaint) => ({ ...complaint, resolutionHours: calculateResolutionHours(complaint) }))
      .filter((complaint) => complaint.resolutionHours !== null);

    const total = assigned.length || 0;
    const assignedWeight = assigned.reduce((sum, complaint) => sum + getPriorityWeight(complaint.priority), 0);
    const resolvedWeight = resolved.reduce((sum, complaint) => sum + getPriorityWeight(complaint.priority), 0);
    const completionRate = assignedWeight ? (resolvedWeight / assignedWeight) * 100 : 0;

    const timelyWeight = resolvedWithTime.reduce((sum, complaint) => {
      const slaHours = getSlaHours(complaint.priority);
      const onTimeRatio = Math.min(1, slaHours / Math.max(1, complaint.resolutionHours));
      return sum + onTimeRatio * getPriorityWeight(complaint.priority);
    }, 0);
    const resolvedTimeWeight = resolvedWithTime.reduce((sum, complaint) => sum + getPriorityWeight(complaint.priority), 0);
    const timelinessRate = resolvedTimeWeight ? (timelyWeight / resolvedTimeWeight) * 100 : 0;

    const averageResolutionHours = resolvedWithTime.length
      ? resolvedWithTime.reduce((sum, complaint) => sum + complaint.resolutionHours, 0) / resolvedWithTime.length : 0;

    const efficiencyScore = resolvedWithTime.length
      ? resolvedWithTime.reduce((sum, complaint) => {
          const slaHours = getSlaHours(complaint.priority);
          const efficiencyRatio = Math.min(1.15, slaHours / Math.max(1, complaint.resolutionHours));
          return sum + (efficiencyRatio / 1.15) * 100;
        }, 0) / resolvedWithTime.length : 0;

    const documentationScore = total
      ? assigned.reduce((sum, complaint) => {
          const fields = [complaint.title, complaint.description, complaint.category, complaint.location, complaint.priority];
          const completeness = fields.filter(Boolean).length / fields.length;
          return sum + completeness * 100;
        }, 0) / total : 0;

    const activeAgingScore = active.length
      ? active.reduce((sum, complaint) => {
          const ageHours = calculateAgeHours(complaint);
          if (ageHours === null) return sum + 60;
          const slaHours = getSlaHours(complaint.priority);
          return sum + Math.max(0, 100 - Math.max(0, (ageHours / slaHours) - 0.65) * 180);
        }, 0) / active.length
      : total ? 100 : 0;

    const consistencyScore = total
      ? 100 - Math.min(45, (Math.abs(resolved.length - active.length) / Math.max(1, total)) * 70) : 0;

    const metrics = [
      { name: "Weighted Completion", score: clampScore(completionRate), weight: 25, detail: `${resolved.length}/${total} assigned resolved, priority-adjusted` },
      { name: "SLA Timeliness", score: clampScore(timelinessRate), weight: 25, detail: `${resolvedWithTime.length || 0} resolved cases measured against priority SLA` },
      { name: "Active Workload Health", score: clampScore(activeAgingScore), weight: 18, detail: active.length ? `${active.length} active case(s) checked for SLA aging` : "No active backlog aging risk" },
      { name: "Documentation Compliance", score: clampScore(documentationScore), weight: 14, detail: "Title, category, location, priority, and description completeness" },
      { name: "Cycle Efficiency", score: clampScore(efficiencyScore), weight: 10, detail: resolvedWithTime.length ? `${Math.round(averageResolutionHours)} hr average resolution` : "No resolved cycle time yet" },
      { name: "Operational Consistency", score: clampScore(consistencyScore), weight: 8, detail: "Balanced completed and active workload pattern" },
    ];

    const rawWeightedScore = metrics.reduce((sum, metric) => sum + metric.score * (metric.weight / 100), 0);
    const confidence = Math.min(1, total / 5);
    const weightedScore = total ? rawWeightedScore * confidence + 70 * (1 - confidence) : 0;

    return {
      metrics,
      weightedScore: clampScore(weightedScore),
      confidence: clampScore(confidence * 100),
      assigned: total,
      resolved: resolved.length,
      active: active.length,
      averageResolutionHours: Math.round(averageResolutionHours),
    };
  }, [complaints, user.user_id]);

  return (
    <div className="app-shell min-h-screen font-sans flex flex-col justify-between">
      {/* Navbar with ICP indicator */}
      <nav className="premium-nav fixed top-0 left-0 w-full z-50">
        <div className="flex items-center justify-between h-24 px-6 sm:px-8">
          <Logo />
          <button
            className="sm:hidden p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <FaBars size={22} className="text-gray-800" />
          </button>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">ICP Audited</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-semibold text-gray-800">Department Officer</p>
            </div>
            <button onClick={() => setShowPerformance(true)} className="btn-secondary px-5 py-2.5">Performance Audit</button>
            <button onClick={handleLogout} className="btn-primary px-5 py-2.5">Logout</button>
          </div>
        </div>
        {menuOpen && (
          <div className="flex flex-col items-center gap-3 pb-4 sm:hidden bg-white shadow-md border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-semibold text-gray-800">Department Officer</p>
            </div>
            <button onClick={() => { setShowPerformance(true); setMenuOpen(false); }} className="btn-secondary w-11/12 px-5 py-2.5">Performance Audit</button>
            <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="btn-primary w-11/12 px-5 py-2.5">Logout</button>
          </div>
        )}
      </nav>

      <div className="flex flex-col items-center justify-center text-center pt-36 px-6 mb-12 space-y-6">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-950">Welcome, {user.name}</h1>
        <p className="text-2xl text-gray-700 mt-4 italic">Review assigned grievances, update action status, and maintain accountable service delivery.</p>
      </div>

      {/* Accountability Banner */}
      <div className="mx-6 sm:mx-10 trust-banner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f4c45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p className="text-sm font-semibold text-slate-900">All lifecycle actions are transparently recorded on the ICP immutable ledger</p>
        </div>
        <span className="blockchain-shield text-xs whitespace-nowrap">✓ Tamper-Resistant Audit Trail</span>
      </div>

      <hr className="border-gray-200" />

      {errorMessage && (
        <div className="mx-6 sm:mx-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800 shadow-sm">{errorMessage}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 p-6 sm:p-10">
        {[
          { title: "Total Grievances", count: (parseInt(counts.resolved, 10) || 0) + (parseInt(counts.in_progress, 10) || 0) + (parseInt(counts.pending, 10) || 0) },
          { title: "In Progress", count: counts.in_progress },
          { title: "Pending", count: counts.pending },
        ].map((s) => (
          <div key={s.title} className="premium-card metric-card flex flex-col items-center px-3 py-8 text-slate-900">
            <div className="text-4xl font-extrabold">{s.count}</div>
            <div className="mt-2 font-semibold text-lg text-center">{s.title}</div>
          </div>
        ))}
      </div>

      <main className="px-4 sm:px-12 space-y-16">
        <section>
          <div className="flex justify-between items-center mb-6 border-l-4 border-red-400 pl-3">
            <h3 className="text-2xl font-bold text-gray-900">Assigned Grievances</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingComplaints ? (
              <div className="empty-state sm:col-span-2 lg:col-span-3">Loading assigned grievances...</div>
            ) : paginatedNewComplaints.length > 0 ? paginatedNewComplaints.map((c) => (
              <div key={c.id} className="premium-card p-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xl font-semibold text-gray-800">{c.category}</h4>
                  <span className={statusClassName(c.status)}>{normalizeStatus(c.status)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(c.priority)}`}>{c.priority}</span>
                </div>
                <p className="text-gray-600 mt-2">{c.location}</p>
                <p className="text-gray-500 text-sm mt-1">{c.subdate}</p>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => handleViewClick(c)} className="btn-muted flex-1 justify-center">Open</button>
                  <button onClick={() => handleResolvedComplaints(c)} disabled={resolvingId === c.id} className="btn-primary flex-1 justify-center">
                    {resolvingId === c.id ? "Resolving..." : "Resolve"}
                  </button>
                </div>
              </div>
            )) : (
              <div className="empty-state sm:col-span-2 lg:col-span-3">No assigned grievances are currently in progress.</div>
            )}
          </div>
          <div className="flex justify-center items-center gap-4 mt-6">
            <button onClick={() => setCurrentNewPage((prev) => Math.max(prev - 1, 1))} disabled={currentNewPage === 1} className="btn-muted px-4 py-2 disabled:opacity-50">Prev</button>
            <span className="text-lg font-semibold">Page {currentNewPage} of {totalNewPages}</span>
            <button onClick={() => setCurrentNewPage((prev) => (prev < totalNewPages ? prev + 1 : prev))} disabled={currentNewPage === totalNewPages} className="btn-muted px-4 py-2 disabled:opacity-50">Next</button>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-6 border-l-4 border-green-400 pl-3">
            <h3 className="text-2xl font-bold text-gray-900">Resolved Grievances</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedResolvedComplaints.length > 0 ? paginatedResolvedComplaints.map((c) => (
              <div key={c.id} className="premium-card p-6">
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-semibold text-gray-800">{c.category}</h4>
                  <span className={statusClassName(c.status)}>{normalizeStatus(c.status)}</span>
                </div>
                <p className="text-gray-600 mt-2">{c.location}</p>
                <p className="text-gray-500 text-sm mt-1">{c.update}</p>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => handleViewClick(c)} className="btn-secondary flex-1 justify-center">Open</button>
                </div>
              </div>
            )) : (
              <div className="empty-state sm:col-span-2 lg:col-span-3">No resolved grievances yet.</div>
            )}
          </div>
          <div className="flex justify-center items-center gap-4 mt-6">
            <button onClick={() => setCurrentResolvedPage((prev) => Math.max(prev - 1, 1))} disabled={currentResolvedPage === 1} className="btn-muted px-4 py-2 disabled:opacity-50">Prev</button>
            <span className="text-lg font-semibold">Page {currentResolvedPage} of {totalResolvedPages}</span>
            <button onClick={() => setCurrentResolvedPage((prev) => prev < totalResolvedPages ? prev + 1 : prev)} disabled={currentResolvedPage === totalResolvedPages} className="btn-muted px-4 py-2 disabled:opacity-50">Next</button>
          </div>
        </section>
      </main>

      <footer className="text-center py-6 mt-16 text-gray-600 text-sm border-t border-gray-300">
        © {new Date().getFullYear()} Government of India Public Grievance Resolution Portal. &middot; Secured by ICP Blockchain
      </footer>

      {/* Complaint Details Modal with Blockchain Audit Trail */}
      {isViewOpen && selectedComplaint && (
        <div className="modal-backdrop" onClick={() => setIsViewOpen(false)} role="dialog" aria-modal="true" aria-labelledby="staff-complaint-details-title">
          <div className="modal-shell w-full max-w-4xl h-[85vh] relative overflow-y-auto overscroll-contain p-6" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl" onClick={() => setIsViewOpen(false)} aria-label="Close complaint details">✕</button>

            <div className="flex items-center justify-between mb-6">
              <h2 id="staff-complaint-details-title" className="text-3xl font-bold text-slate-900">
                Grievance #{selectedComplaint.id}: {selectedComplaint.category}
              </h2>
              <BlockchainBadge verified={verificationRecord?.verified} size="lg" />
            </div>

            <div className="details-grid mb-6">
              <p><strong>Title:</strong> {selectedComplaint.title}</p>
              <p><strong>Status:</strong> {normalizeStatus(selectedComplaint.status)}</p>
              <p><strong>Priority:</strong> {selectedComplaint.priority}</p>
              <p><strong>Assigned To:</strong> {selectedComplaint.assignedTo}</p>
              <p><strong>Submit Date:</strong> {selectedComplaint.subdate}</p>
              <p><strong>Last Update:</strong> {selectedComplaint.update}</p>
            </div>

            <div className="mb-6">
              <p className="mb-2"><strong>Location:</strong> {selectedComplaint.location}</p>
              <p className="mb-2"><strong>Description:</strong> {selectedComplaint.description}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Immutable Audit Trail</h3>
                {verificationRecord?.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    ICP CONFIRMED
                  </span>
                )}
              </div>
              <AuditTimeline events={auditTrail} loading={isLoadingAuditTrail} />
              {verificationRecord?.verified && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-500">
                  {verificationRecord.blockId && <p><strong>Block ID:</strong> {verificationRecord.blockId}</p>}
                  {verificationRecord.timestamp && <p><strong>Verified At:</strong> {new Date(verificationRecord.timestamp).toLocaleString()}</p>}
                  {verificationRecord.canisterId && <p><strong>Canister:</strong> {verificationRecord.canisterId}</p>}
                  {verificationRecord.txRef && <p><strong>Tx Ref:</strong> {verificationRecord.txRef}</p>}
                </div>
              )}
            </div>

            {selectedComplaint.photo && (
              <div className="mt-6 flex justify-center">
                <img src={apiUrl(selectedComplaint.photo)} alt={selectedComplaint.category} className="max-w-full max-h-[400px] rounded-lg shadow-md object-contain" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {showPerformance && (
        <div className="modal-backdrop" onClick={() => setShowPerformance(false)} role="dialog" aria-modal="true" aria-labelledby="performance-title">
          <div className="modal-shell max-h-[88vh] w-full max-w-3xl overflow-y-auto overscroll-contain p-8" onClick={(e) => e.stopPropagation()}>
            <h2 id="performance-title" className="text-3xl font-bold text-teal-900 mb-6 text-center">Officer Performance Audit</h2>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
              {[
                ["Weighted Score", `${performanceMetrics.weightedScore}/100`],
                ["Confidence", `${performanceMetrics.confidence}%`],
                ["Assigned", performanceMetrics.assigned],
                ["Resolved", performanceMetrics.resolved],
                ["Avg Resolution", `${performanceMetrics.averageResolutionHours} hr`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-2xl font-extrabold text-teal-900">{value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                </div>
              ))}
            </div>
            <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Score is confidence-adjusted for small sample sizes and uses only auditable grievance records from the ICP ledger.
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={performanceMetrics.metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" name="KPI Score" fill="#134e4a" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 space-y-3">
              {performanceMetrics.metrics.map((metric) => (
                <div key={metric.name} className="flex flex-col gap-1 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{metric.name}</p>
                    <p className="text-sm text-slate-500">{metric.detail}</p>
                  </div>
                  <p className="text-sm font-bold text-teal-900">{metric.score}/100 - weight {metric.weight}%</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-6">
              <button className="btn-primary" onClick={() => setShowPerformance(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;