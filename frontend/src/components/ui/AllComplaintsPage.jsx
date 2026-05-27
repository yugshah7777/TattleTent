import React, { useState, useEffect } from "react";
import Logo from './Logo'
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { FiDownload, FiFilter, FiSearch, FiX } from "react-icons/fi";
import { apiUrl, formatDate, getStoredUser, normalizeStatus, statusClassName } from "../../lib/api";
import { fetchComplaintAuditTrail, fetchVerificationBatch } from "../../lib/blockchain";
import BlockchainBadge, { AuditTimeline } from "./BlockchainBadge";

const AllComplaintsPage = () => {

  const navigate=useNavigate();
  const [user] = useState(() => getStoredUser());

  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationMap, setVerificationMap] = useState({});
  const [auditTrail, setAuditTrail] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

    const fetchComplaintsByUser = async () => {
    try {
  
      setIsLoading(true);
      setErrorMessage("");
      const response = await fetch(apiUrl("/api/complaints/search"));
  
      if (!response.ok) throw new Error("Failed to fetch complaints");
  
      const data = await response.json();
      setComplaints(data.map(c => ({
        id: c.complaint_id,
        category: c.category,
        status: c.status,
        location: c.location,
        priority: c.priority,
        description: c.description,
        assignedTo: c.assigned_to,
        photo: c.photo,
        citizen: c.citizen_name,
        date: formatDate(c.submitted_at)
      })));
  
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setComplaints([]);
      setErrorMessage("Unable to load complaints. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
      fetchComplaintsByUser();
  }, []);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const complaintsPerPage = 5;
  const dashboardRoute = user?.role === "Citizen"
    ? "/citizen-dashboard"
    : user?.role === "Staff"
      ? "/staff-dashboard"
      : "/admin-dashboard";

  const filteredComplaints = complaints.filter(c => {
    const normalizedStatus = normalizeStatus(c.status).toLowerCase();
    const matchesStatus = filterStatus === "all" || normalizedStatus === filterStatus.toLowerCase();
    const matchesCategory = filterCategory === "all" || (c.category || "").toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch = searchTerm === "" || (c.category || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.location || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const indexOfLast = currentPage * complaintsPerPage;
  const indexOfFirst = indexOfLast - complaintsPerPage;
  const currentComplaints = filteredComplaints.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / complaintsPerPage));

  useEffect(() => {
    const loadVerification = async () => {
      try {
        const ids = currentComplaints.map((entry) => entry.id);
        const records = await fetchVerificationBatch(ids);
        setVerificationMap((prev) => ({ ...prev, ...records }));
      } catch (error) {
        console.error("Unable to load verification batch:", error);
      }
    };

    if (!isLoading && currentComplaints.length > 0) {
      loadVerification();
    }
  }, [currentComplaints, isLoading]);

  const handleView = (complaint) => {
    setSelectedComplaint(complaint);
    setIsViewOpen(true);
  };

  useEffect(() => {
    const loadAuditTrail = async () => {
      if (!selectedComplaint?.id || !isViewOpen) return;
      try {
        setLoadingAudit(true);
        const rows = await fetchComplaintAuditTrail(selectedComplaint.id);
        setAuditTrail(rows);
      } catch (error) {
        console.error("Unable to load audit trail:", error);
        setAuditTrail([]);
      } finally {
        setLoadingAudit(false);
      }
    };
    loadAuditTrail();
  }, [isViewOpen, selectedComplaint]);

  const exportComplaintPDF = (complaint) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`Grievance #${complaint.id}`, 14, 22);
  doc.setFontSize(12);
  doc.text(`Category: ${complaint.category}`, 14, 40);
  doc.text(`Location: ${complaint.location}`, 14, 50);
  doc.text(`Status: ${complaint.status}`, 14, 60);
  doc.text(`Priority: ${complaint.priority || "Not Set"}`, 14, 70);
  doc.text(`Reported by: ${complaint.citizen || "Unknown"}`, 14, 80);
  doc.text(`Date: ${complaint.date}`, 14, 90);
  doc.text(`Description: ${complaint.description}`, 14, 100, { maxWidth: 180 });
  if (complaint.solution) doc.text(`Solution: ${complaint.solution}`, 14, 120, { maxWidth: 180 });
  doc.save(`Grievance_${complaint.id}.pdf`);
};

  const exportCSV = () => {
    const csvContent = [
      ["ID", "Category", "Location", "Status", "Date", "Priority", "Assigned To", "Description"],
      ...complaints.map(c => [c.id, c.category, c.location, normalizeStatus(c.status), c.date, c.priority || "", c.assignedTo || "", c.description])
    ].map(row => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "all_grievances.csv";
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ============ NAVBAR ============ */}
      <nav className="premium-nav">
        <Logo />
        <div className="flex items-center gap-3">
          <button className="btn-secondary btn-sm" onClick={() => navigate("/")}>Home</button>
          <button className="btn-primary btn-sm" onClick={() => navigate(dashboardRoute)}>My Dashboard</button>
        </div>
      </nav>

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 page-surface pt-28 pb-12 space-y-8">
        {/* Header */}
        <div>
          <span className="section-kicker">Public Records</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--goi-ink)] mt-2">All Grievances</h1>
          <p className="text-lg text-[var(--goi-muted)] mt-1">View, filter, and export public grievance records.</p>
        </div>

        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}

        {/* Search & Filters */}
        <div className="surface-panel flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--goi-muted)] w-4 h-4" />
            <input
              type="text"
              placeholder="Search by keyword..."
              className="pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              className="px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all text-sm bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              className="px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all text-sm bg-white"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="pathway damage">Pathway Damage</option>
              <option value="water leak">Water Leak</option>
              <option value="garbage">Garbage</option>
              <option value="electrical">Electrical</option>
            </select>

            <button onClick={exportCSV} className="btn-secondary btn-sm flex items-center gap-2">
              <FiDownload className="w-4 h-4" /> Export CSV
            </button>

            <button onClick={() => { setSearchTerm(""); setFilterCategory("all"); setFilterStatus("all"); setCurrentPage(1); }} className="btn-muted btn-sm flex items-center gap-2">
              <FiX className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="table-shell">
          <table className="w-full">
            <thead>
              <tr>
                {["ID", "Category", "Location", "Status", "Date", "Priority", "Assigned To", "Blockchain", "Actions"].map(h=>(
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-[var(--goi-muted)]">
                    <div className="flex items-center justify-center gap-3">
                      <div className="app-loader spinner-sm inline-grid"></div>
                      Loading grievances...
                    </div>
                  </td>
                </tr>
              ) : currentComplaints.length > 0 ? currentComplaints.map(c=>(
                <tr key={c.id}>
                  <td className="font-bold">#{c.id}</td>
                  <td>{c.category}</td>
                  <td>{c.location}</td>
                  <td><span className={statusClassName(c.status)}>{normalizeStatus(c.status)}</span></td>
                  <td className="text-sm">{c.date}</td>
                  <td>{c.priority || <span className="text-[var(--goi-muted)]">—</span>}</td>
                  <td>{c.assignedTo || <span className="text-[var(--goi-muted)]">Unassigned</span>}</td>
                  <td>
                    {!verificationMap[c.id] ? (
                      <span className="badge-icp checking">Checking...</span>
                    ) : verificationMap[c.id]?.verified ? (
                      <span className="badge-icp verified">✓ Verified</span>
                    ) : (
                      <span className="badge-icp unverified">! Failed</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-primary btn-sm" onClick={() => handleView(c)}>Open</button>
                      <button className="btn-secondary btn-sm flex items-center gap-1.5" onClick={() => exportComplaintPDF(c)}>
                        <FiDownload className="w-3.5 h-3.5" /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-[var(--goi-muted)]">
                    No grievances match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button className="btn-muted btn-sm disabled:opacity-50" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  currentPage === i + 1 
                    ? "bg-[var(--goi-deep)] text-white" 
                    : "bg-gray-100 text-[var(--goi-muted)] hover:bg-gray-200"
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button className="btn-muted btn-sm disabled:opacity-50" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
          </div>
        )}
      </main>

      {/* ============ VIEW DETAILS MODAL ============ */}
      {isViewOpen && selectedComplaint && (
        <div className="modal-backdrop" onClick={() => setIsViewOpen(false)} role="dialog" aria-modal="true" aria-labelledby="all-complaint-details-title">
          <div className="modal-shell max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 id="all-complaint-details-title" className="text-xl font-bold text-[var(--goi-ink)]">
                Grievance #{selectedComplaint.id}: {selectedComplaint.category}
              </h2>
              <div className="flex items-center gap-3">
                <BlockchainBadge verified={verificationMap[selectedComplaint.id]?.verified} size="lg" />
                <button onClick={() => setIsViewOpen(false)} className="text-[var(--goi-muted)] hover:text-[var(--goi-ink)] transition-colors" aria-label="Close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="details-grid mb-6">
              <p><strong>Description:</strong> {selectedComplaint.description}</p>
              <p><strong>Location:</strong> {selectedComplaint.location}</p>
              <p><strong>Status:</strong> {normalizeStatus(selectedComplaint.status)}</p>
              <p><strong>Priority:</strong> {selectedComplaint.priority}</p>
              <p><strong>Reported by:</strong> {selectedComplaint.citizen}</p>
              <p><strong>Date:</strong> {selectedComplaint.date}</p>
              {selectedComplaint.solution && <p className="col-span-2"><strong>Solution:</strong> {selectedComplaint.solution}</p>}
            </div>

            <div className="rounded-lg border border-[var(--goi-line)] bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[var(--goi-ink)]">Immutable Audit Trail</h3>
                {verificationMap[selectedComplaint.id]?.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    ICP CONFIRMED
                  </span>
                )}
              </div>
              <AuditTimeline events={auditTrail} loading={loadingAudit} />
              {verificationMap[selectedComplaint.id]?.verified && (
                <div className="mt-4 pt-4 border-t border-[var(--goi-line)] grid grid-cols-2 gap-3 text-xs text-[var(--goi-muted)]">
                  {verificationMap[selectedComplaint.id]?.blockId && <p><strong>Block ID:</strong> {verificationMap[selectedComplaint.id].blockId}</p>}
                  {verificationMap[selectedComplaint.id]?.timestamp && <p><strong>Verified At:</strong> {new Date(verificationMap[selectedComplaint.id].timestamp).toLocaleString()}</p>}
                  {verificationMap[selectedComplaint.id]?.canisterId && <p><strong>Canister:</strong> {verificationMap[selectedComplaint.id].canisterId}</p>}
                  {verificationMap[selectedComplaint.id]?.txRef && <p><strong>Tx Ref:</strong> {verificationMap[selectedComplaint.id].txRef}</p>}
                </div>
              )}
            </div>

            {selectedComplaint.photo && (
              <div className="mt-6 flex justify-center">
                <img src={apiUrl(selectedComplaint.photo)} alt={selectedComplaint.category} className="max-w-full max-h-[350px] rounded-lg shadow-md object-contain" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllComplaintsPage;