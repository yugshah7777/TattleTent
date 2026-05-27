import { useState, useEffect } from "react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { FiCheckCircle, FiClock, FiDroplet, FiFileText, FiTrash2, FiTool, FiZap, FiShield } from "react-icons/fi";
import axios from "axios";
import {
  apiUrl,
  authHeaders,
  clearSession,
  formatDate,
  getStoredUser,
  normalizeStatus,
  statusClassName,
} from "../../lib/api";
import { fetchComplaintAuditTrail, fetchComplaintVerification } from "../../lib/blockchain";
import BlockchainBadge, { AuditTimeline } from "./BlockchainBadge";

const CitizenDashboard = () => {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const navigate = useNavigate(); 
  const [user] = useState(() => getStoredUser());
  const [selectedComplaint, setSelectedComplaint] = useState(null);
const [isViewOpen, setIsViewOpen] = useState(false);

const [menuOpen, setMenuOpen] = useState(false);

  const [counts, setCounts] = useState({ resolved: 0, pending: 0, in_progress: 0 });
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [auditTrail, setAuditTrail] = useState([]);
  const [verificationRecord, setVerificationRecord] = useState(null);
  const [isLoadingAuditTrail, setIsLoadingAuditTrail] = useState(false);

   const handleDetails = async (complaint) => {
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

  const fetchComplaintsByUser = async () => {
  try {
    if (!user?.user_id) return;
    setIsLoadingComplaints(true);
    setErrorMessage("");

    const queryParams = new URLSearchParams({ user_id: user.user_id }).toString();
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
      photo: c.photo,
      assignedTo: c.assigned_to,
      subdate: formatDate(c.submitted_at),
      update: formatDate(c.updated_at)
    })));

  } catch (err) {
    console.error("Error fetching complaints:", err);
    setComplaints([]);
    setErrorMessage("We could not load your complaints. Please refresh or try again shortly.");
  } finally {
    setIsLoadingComplaints(false);
  }
};

useEffect(() => {
  if (user?.user_id) {
    fetchComplaintsByUser();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user]);


  const fetchCounts = async () => {
    try {
      const res = await axios.get(apiUrl('/api/complaints/counts'));
      setCounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);
  

  const handleNewComplaint = async (e) => {
    e.preventDefault();

    try {
      const token = sessionStorage.getItem("token");
      if (!token || !user) {
        setErrorMessage("You must be logged in to submit a complaint.");
        return;
      }
      setIsSubmittingComplaint(true);
      setNotice("");
      setErrorMessage("");

      const formData = new FormData(e.target);
      formData.append("user_id", user.user_id);

      let lat = null, lon = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          lat = parseFloat(position.coords.latitude);
          lon = parseFloat(position.coords.longitude);

          formData.append("latitude", lat);
          formData.append("longitude", lon);
        } catch {
          setNotice("Location permission was skipped. Your complaint will still be submitted without map coordinates.");
        }
      }

      const response = await axios.post(
        apiUrl("/api/complaints"),
        formData,
        {
          headers: authHeaders({ "Content-Type": "multipart/form-data" }),
        }
      );

      if (response.status === 201) {
        e.target.reset();
        setIsSubmitOpen(false);
        setNotice("Complaint submitted successfully. Your dashboard has been updated.");
        fetchComplaintsByUser();
        fetchCounts();
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      setErrorMessage(error.response?.data?.message || "Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/"); 
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const user = sessionStorage.getItem("user");
    
    if (!token || !user) {
      navigate("/"); 
    } 
    
    if (user && getStoredUser()?.role !== "Citizen") {
        navigate("/");
    }
    
  }, [navigate]);

  const activeComplaints = complaints.filter((c) => c.status === "New" || c.status === "IN_PROGRESS");
  const resolvedComplaints = complaints.filter((c) => c.status === "Resolved");
  const displayName = user?.name || "there";

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
        <div className="hidden sm:flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-medium text-[var(--goi-muted)] uppercase tracking-wide">Logged in as</p>
            <p className="font-semibold text-[var(--goi-ink)]">{user?.name || "Citizen"}</p>
          </div>
          <button onClick={() => navigate("/all-complaints")} className="btn-secondary">All Grievances</button>
          <button onClick={handleLogout} className="btn-primary">Logout</button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden fixed top-[80px] left-0 right-0 bg-white border-b border-[var(--goi-line)] shadow-lg z-40 animate-fade-in">
          <div className="flex flex-col items-center gap-4 py-6 px-4">
            <div className="text-center">
              <p className="text-xs font-medium text-[var(--goi-muted)] uppercase tracking-wide">Logged in as</p>
              <p className="font-semibold text-[var(--goi-ink)]">{user?.name || "Citizen"}</p>
            </div>
            <button onClick={() => { navigate("/all-complaints"); setMenuOpen(false); }} className="btn-secondary w-full justify-center">All Grievances</button>
            <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="btn-primary w-full justify-center">Logout</button>
          </div>
        </div>
      )}

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 page-surface pt-28 pb-12 space-y-10">
        {/* Welcome Section */}
        <section>
          <div className="mb-6">
            <span className="section-kicker">Citizen Dashboard</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--goi-ink)] mt-2 leading-tight">
              Welcome back, {displayName}
            </h1>
            <p className="text-lg text-[var(--goi-muted)] mt-2">Your official portal for transparent public service grievance redressal</p>
          </div>
          <div className="trust-banner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FiShield className="w-5 h-5 text-[var(--goi-deep)] flex-shrink-0" />
              <p className="text-sm font-semibold text-[var(--goi-ink)]">Your complaint history is protected by immutable audit tracking on ICP blockchain</p>
            </div>
            <span className="blockchain-shield text-xs whitespace-nowrap">✓ Verifiable Audit Trail</span>
          </div>
        </section>

        {/* Notifications */}
        {notice && (
          <div className="success-message flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            {notice}
          </div>
        )}
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}

        {/* Statistics */}
        <section>
          <h2 className="text-xl font-bold text-[var(--goi-ink)] mb-5">Your Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { title: "Total Grievances", count: (parseInt(counts.resolved, 10) || 0) + (parseInt(counts.in_progress, 10) || 0) + (parseInt(counts.pending, 10) || 0), icon: FiFileText },
              { title: "Resolved", count: counts.resolved, icon: FiCheckCircle },
              { title: "In Progress", count: counts.in_progress, icon: FiClock },
            ].map((s) => {
              const StatIcon = s.icon;
              return (
              <div key={s.title} className="premium-card p-6 metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-black text-[var(--goi-ink)] tabular-nums">{s.count}</div>
                    <div className="mt-1 font-semibold text-sm text-[var(--goi-muted)]">{s.title}</div>
                  </div>
                  <StatIcon className="w-9 h-9 text-[var(--goi-deep)]/25" aria-hidden="true" />
                </div>
              </div>
            )})}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="surface-panel p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--goi-ink)]">Quick Actions</h2>
              <p className="text-sm text-[var(--goi-muted)]">Common public service categories</p>
            </div>
            <button onClick={() => setIsSubmitOpen(true)} className="btn-primary whitespace-nowrap">+ New Grievance</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: FiTool, label: "Pathway Damage" },
              { icon: FiDroplet, label: "Water Leak" },
              { icon: FiTrash2, label: "Garbage" },
              { icon: FiZap, label: "Electrical" },
            ].map((cat) => {
              const ActionIcon = cat.icon;
              return (
              <button key={cat.label} onClick={() => setIsSubmitOpen(true)}
                className="h-28 flex flex-col items-center justify-center gap-2.5 rounded-lg border-2 border-[var(--goi-line)] hover:border-[var(--goi-deep)]/30 hover:bg-[var(--goi-deep)]/5 transition-all duration-200 group">
                <ActionIcon className="w-8 h-8 text-[var(--goi-deep)] transition-transform group-hover:scale-110" aria-hidden="true" />
                <span className="text-sm font-semibold text-[var(--goi-muted)] group-hover:text-[var(--goi-ink)]">{cat.label}</span>
              </button>
            )})}
          </div>
        </section>

        {/* Active Grievances Table */}
        <section className="surface-panel p-6">
          <div className="mb-5 pb-4 border-b border-[var(--goi-line)]">
            <h2 className="text-xl font-bold text-[var(--goi-ink)]">Your Active Grievances</h2>
            <p className="text-sm text-[var(--goi-muted)] mt-1">Pending and in-progress complaints</p>
          </div>
          <div className="table-shell">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Title</th>
                  <th>Submitted</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingComplaints ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-[var(--goi-muted)]">
                      <div className="flex items-center justify-center gap-3">
                        <div className="app-loader spinner-sm inline-grid"></div>
                        Loading grievances...
                      </div>
                    </td>
                  </tr>
                ) : activeComplaints.length > 0 ? (
                  activeComplaints.map(c => (
                    <tr key={c.id}>
                      <td className="font-medium text-[var(--goi-ink)]">{c.category}</td>
                      <td><span className={statusClassName(c.status)}>{normalizeStatus(c.status)}</span></td>
                      <td className="font-medium text-[var(--goi-ink)] truncate max-w-xs">{c.title}</td>
                      <td className="text-sm text-[var(--goi-muted)]">{c.subdate}</td>
                      <td className="text-right">
                        <button className="btn-secondary btn-sm" onClick={() => handleDetails(c)}>Details</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-[var(--goi-muted)]">No active grievances. Submit a new one to get started!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Resolved Grievances */}
        {resolvedComplaints.length > 0 && (
          <section className="surface-panel p-6 border-l-4 border-l-emerald-500">
            <h2 className="text-xl font-bold text-emerald-800 mb-5">Resolved Grievances</h2>
            <div className="table-shell">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Details</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedComplaints.map(c => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.category}</td>
                      <td className="font-medium">{c.title}</td>
                      <td>{c.subdate}</td>
                      <td>
                        <button className="text-[var(--goi-deep)] hover:underline text-sm font-medium" onClick={() => handleDetails(c)}>View Details</button>
                      </td>
                      <td>
                        <button className="btn-secondary btn-sm" onClick={() => navigate("/feedback-page", { state: { complaint: c } })}>Give Feedback</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="text-center py-4 bg-white border-t border-[var(--goi-line)] text-sm text-[var(--goi-muted)]">
        &copy; {new Date().getFullYear()} Government of India Public Grievance Resolution Portal &middot; Secured by ICP Blockchain
      </footer>

      {/* ============ SUBMIT COMPLAINT MODAL ============ */}
      {isSubmitOpen && (
        <div className="modal-backdrop" onClick={() => setIsSubmitOpen(false)} role="dialog" aria-modal="true" aria-labelledby="new-complaint-title">
          <div className="modal-shell" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 id="new-complaint-title" className="text-xl font-bold text-[var(--goi-ink)]">Submit New Grievance</h3>
              <button onClick={() => setIsSubmitOpen(false)} className="text-[var(--goi-muted)] hover:text-[var(--goi-ink)] transition-colors" aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleNewComplaint} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Grievance Category <span className="text-red-500">*</span></label>
                <select name="category" required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all bg-white">
                  <option value="">Select Category</option>
                  <option>Electrical</option><option>Water Leak</option><option>Pathway Damage</option><option>Garbage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                <input name="title" type="text" required placeholder="e.g., Tent #12, Sector C" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location / Address <span className="text-red-500">*</span></label>
                <input name="location" type="text" required placeholder="e.g., Tent #12, Sector C" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Detailed Description <span className="text-red-500">*</span></label>
                <textarea name="description" required placeholder="What is the issue?" rows={4} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Photo (optional but recommended)</label>
                <input name="photo" type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--goi-deep)]/10 file:text-[var(--goi-deep)] hover:file:bg-[var(--goi-deep)]/20 transition-all" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-muted" onClick={() => setIsSubmitOpen(false)} disabled={isSubmittingComplaint}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmittingComplaint}>{isSubmittingComplaint ? "Submitting..." : "Submit Grievance"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ VIEW DETAILS MODAL ============ */}
      {isViewOpen && selectedComplaint && (
        <div className="modal-backdrop" onClick={() => setIsViewOpen(false)} role="dialog" aria-modal="true" aria-labelledby="complaint-details-title">
          <div className="modal-shell max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 id="complaint-details-title" className="text-xl font-bold text-[var(--goi-ink)]">
                Grievance #{selectedComplaint.id}: {selectedComplaint.category}
              </h2>
              <div className="flex items-center gap-3">
                <BlockchainBadge verified={verificationRecord?.verified} size="lg" />
                <button onClick={() => setIsViewOpen(false)} className="text-[var(--goi-muted)] hover:text-[var(--goi-ink)] transition-colors" aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="details-grid mb-6">
              <p><strong>Title:</strong> {selectedComplaint.title}</p>
              <p><strong>Status:</strong> {normalizeStatus(selectedComplaint.status)}</p>
              <p><strong>Priority:</strong> {selectedComplaint.priority}</p>
              <p><strong>Assigned To:</strong> {selectedComplaint.assignedTo || "Not assigned"}</p>
              <p><strong>Submit Date:</strong> {selectedComplaint.subdate}</p>
              <p><strong>Last Update:</strong> {selectedComplaint.update}</p>
            </div>

            <div className="mb-6 space-y-2">
              <p><strong>Location:</strong> {selectedComplaint.location}</p>
              <p><strong>Description:</strong> {selectedComplaint.description}</p>
            </div>

            <div className="rounded-lg border border-[var(--goi-line)] bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[var(--goi-ink)]">Immutable Audit Trail</h3>
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
                <div className="mt-4 pt-4 border-t border-[var(--goi-line)] grid grid-cols-2 gap-3 text-xs text-[var(--goi-muted)]">
                  {verificationRecord.blockId && <p><strong>Block ID:</strong> {verificationRecord.blockId}</p>}
                  {verificationRecord.timestamp && <p><strong>Verified At:</strong> {new Date(verificationRecord.timestamp).toLocaleString()}</p>}
                  {verificationRecord.canisterId && <p><strong>Canister:</strong> {verificationRecord.canisterId}</p>}
                  {verificationRecord.txRef && <p><strong>Tx Ref:</strong> {verificationRecord.txRef}</p>}
                </div>
              )}
            </div>

            {selectedComplaint.photo && (
              <div className="mt-6 flex justify-center">
                <img src={apiUrl(selectedComplaint.photo)} alt="Complaint" className="max-w-full max-h-[350px] rounded-lg shadow-md object-contain" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;