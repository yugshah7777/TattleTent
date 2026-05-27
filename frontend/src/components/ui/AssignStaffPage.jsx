import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import Logo from "./Logo"
import axios from "axios";
import { apiUrl, authHeaders, getStoredUser } from "../../lib/api";
import useBodyScrollLock from "../../lib/useBodyScrollLock";

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

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

const getHoursBetween = (start, end) => {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  return Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
};

const buildStaffAudit = (records) => {
  const assigned = Array.isArray(records) ? records : [];
  const resolved = assigned.filter((record) => record.status === "Resolved");
  const active = assigned.filter((record) => record.status === "IN_PROGRESS");
  const resolvedWithTime = resolved
    .map((record) => ({
      ...record,
      resolutionHours: getHoursBetween(record.submitted_at, record.updated_at),
    }))
    .filter((record) => record.resolutionHours !== null);

  const total = assigned.length;
  const assignedWeight = assigned.reduce((sum, record) => sum + getPriorityWeight(record.priority), 0);
  const resolvedWeight = resolved.reduce((sum, record) => sum + getPriorityWeight(record.priority), 0);
  const completionRate = assignedWeight ? (resolvedWeight / assignedWeight) * 100 : 0;
  const timelyWeight = resolvedWithTime.reduce((sum, record) => {
    const slaHours = getSlaHours(record.priority);
    return sum + Math.min(1, slaHours / Math.max(1, record.resolutionHours)) * getPriorityWeight(record.priority);
  }, 0);
  const timeWeight = resolvedWithTime.reduce((sum, record) => sum + getPriorityWeight(record.priority), 0);
  const timelinessRate = timeWeight ? (timelyWeight / timeWeight) * 100 : 0;
  const documentationScore = total
    ? assigned.reduce((sum, record) => {
        const fields = [record.title, record.description, record.category, record.location, record.priority];
        return sum + (fields.filter(Boolean).length / fields.length) * 100;
      }, 0) / total
    : 0;
  const consistencyScore = total
    ? 100 - Math.min(45, (Math.abs(resolved.length - active.length) / Math.max(1, total)) * 70)
    : 0;
  const averageResolutionHours = resolvedWithTime.length
    ? resolvedWithTime.reduce((sum, record) => sum + record.resolutionHours, 0) / resolvedWithTime.length
    : 0;
  const efficiencyScore = resolvedWithTime.length
    ? resolvedWithTime.reduce((sum, record) => {
        const slaHours = getSlaHours(record.priority);
        const ratio = Math.min(1.15, slaHours / Math.max(1, record.resolutionHours));
        return sum + (ratio / 1.15) * 100;
      }, 0) / resolvedWithTime.length
    : 0;

  const metrics = [
    { name: "Completion", score: clampScore(completionRate), weight: 30 },
    { name: "SLA Timeliness", score: clampScore(timelinessRate), weight: 25 },
    { name: "Documentation", score: clampScore(documentationScore), weight: 20 },
    { name: "Efficiency", score: clampScore(efficiencyScore), weight: 15 },
    { name: "Consistency", score: clampScore(consistencyScore), weight: 10 },
  ];
  const rawWeightedScore = metrics.reduce((sum, metric) => sum + metric.score * (metric.weight / 100), 0);
  const confidence = Math.min(1, total / 5);

  return {
    metrics,
    score: total ? clampScore(rawWeightedScore * confidence + 70 * (1 - confidence)) : 0,
    confidence: clampScore(confidence * 100),
    assigned: total,
    resolved: resolved.length,
    active: active.length,
    averageResolutionHours: Math.round(averageResolutionHours),
  };
};

const AssignStaffPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());

  const { complaint } = location.state || {};
  const [staffList, setstaffList] = useState([]);

  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("Low");
  const [staffToAssign, setStaffToAssign] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useBodyScrollLock(Boolean(selectedStaff) || priorityModalOpen);


  const fetchStaff = async () => {
    try {
      if (!user?.user_id) return;

      const queryParams = new URLSearchParams({ role: "Staff" }).toString();
      setIsLoadingStaff(true);
      setErrorMessage("");
      const response = await fetch(apiUrl(`/api/users/search?${queryParams}`), {
        headers: authHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch staff");

      const data = await response.json();
      setstaffList(data.map(c => ({
        id: c.user_id,
        name: c.name,
        email: c.email,
        role: c.role,
      })));

    } catch (err) {
      console.error("Error fetching staff:", err);
      setstaffList([]); // fallback to empty array
      setErrorMessage("Unable to load staff members. Please try again.");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      fetchStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!complaint) {
      navigate("/admin-dashboard");
    }
  }, [complaint, navigate]);

  const fetchStaffPerformance = async (staff) => {
  try {
    // Axios automatically parses JSON, so just send staff_id as query param.
    const response = await axios.get(apiUrl(`/api/complaints/search?staff_id=${staff.id}`));

    const data = response.data;

    if (!Array.isArray(data)) {
      console.error("Unexpected data format:", data);
      return;
    }

    setSelectedStaff({
      ...staff,
      performance: buildStaffAudit(data),
    });
  } catch (err) {
    console.error("Error fetching performance:", err);
    setErrorMessage("Unable to load staff performance right now.");
  }
};



 {/*} const handleAssign = (staffName) => {
    navigate("/admin-dashboard", { state: { assigned: { complaintId: complaint.id, staffName } } });
  };*/}

  return (
    <div className="app-shell min-h-screen p-6">
      <div className="premium-nav fixed top-0 left-0 w-full h-24 flex items-center justify-between px-8 z-50">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Logged in as</p>
            <p className="font-semibold text-gray-800">Admin</p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/admin-dashboard")}>
            Back
          </button>
        </div>
      </div>
      <h2 className="pt-28 text-4xl font-bold mb-6 text-center">Assign Grievance #{complaint?.id}</h2>
      {errorMessage && (
        <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800 shadow-sm">
          {errorMessage}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingStaff ? (
          <div className="empty-state sm:col-span-2 lg:col-span-3">Loading staff members...</div>
        ) : staffList.length > 0 ? (
          staffList.map((s) => (
            <div key={s.id} className="premium-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-teal-900">{s.name}</h3>
                <p className="text-gray-600 mb-3">{s.email}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
  className="btn-primary px-3 py-1.5 text-sm flex-1 justify-center"
  onClick={() => {
    setStaffToAssign(s);
    setPriorityModalOpen(true);
  }}
>
  Assign
</button>

                <button
                  className="btn-secondary px-3 py-1.5 text-sm flex-1 justify-center"
                  onClick={() => fetchStaffPerformance(s)}
                >
                  Audit Metrics
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state sm:col-span-2 lg:col-span-3">No staff members found.</div>
        )}
      </div>

      {/* Performance Modal */}
      {selectedStaff && (
        <Modal
          title={`${selectedStaff.name} - Performance Audit`}
          onClose={() => setSelectedStaff(null)}
        >
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              ["Score", `${selectedStaff.performance.score}/100`],
              ["Confidence", `${selectedStaff.performance.confidence}%`],
              ["Assigned", selectedStaff.performance.assigned],
              ["Resolved", selectedStaff.performance.resolved],
              ["Avg Time", `${selectedStaff.performance.averageResolutionHours} hr`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[var(--goi-line)] bg-gradient-to-b from-[var(--goi-deep)]/5 to-white p-5 text-center flex flex-col items-center justify-center min-h-[110px]">
                <div className="text-2xl font-black text-[var(--goi-deep)] tabular-nums leading-none">{value}</div>
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--goi-muted)] mt-1.5">{label}</div>
              </div>
            ))}
          </div>
          <div className="mb-6 rounded-xl border border-[var(--goi-line)] bg-white/80 px-5 py-4">
            <p className="text-sm text-[var(--goi-muted)] flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Assignment audit is weighted by priority, SLA adherence, documentation completeness, efficiency, and consistency.
            </p>
          </div>
          <div style={{ width: "100%", height: 300 }} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={selectedStaff.performance.metrics}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#5f6b7a' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#0b1220' }} axisLine={false} tickLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                <Bar dataKey="score" name="KPI Score" fill="var(--goi-deep)" radius={[0, 6, 6, 0]} barSize={24} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Modal>
      )}

      {priorityModalOpen && staffToAssign && (
  <Modal
    title={`Assign Grievance #${complaint?.id} to ${staffToAssign.name}`}
    onClose={() => setPriorityModalOpen(false)}
    showFooterClose={false}
  >
    <div className="space-y-4">
      <label className="block font-semibold">Select Priority:</label>
      <select
        className="w-full p-3 border rounded-xl"
        value={selectedPriority}
        onChange={(e) => setSelectedPriority(e.target.value)}
      >
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      <div className="flex justify-end gap-3 mt-4">
        <button
          className="btn-muted px-5 py-2.5"
          onClick={() => setPriorityModalOpen(false)}
          disabled={isAssigning}
        >
          Cancel
        </button>
        <button
          className="btn-primary px-5 py-2.5"
          disabled={isAssigning}
          onClick={async () => {
            try {
              setIsAssigning(true);
              setErrorMessage("");
              await axios.put(apiUrl(`/api/complaints/status/${complaint.id}`), {
              status: "IN_PROGRESS",
              staffId: staffToAssign.id,
              priority: selectedPriority
            }, {
              headers: authHeaders(),
            });
              setPriorityModalOpen(false);
              navigate("/admin-dashboard");
            } catch (err) {
              console.error(err);
              setErrorMessage(err.response?.data?.message || "Unable to assign this complaint. Please try again.");
            } finally {
              setIsAssigning(false);
            }
          }}
        >
          {isAssigning ? "Assigning..." : "Assign"}
        </button>
      </div>
    </div>
  </Modal>
)}

    </div>
  );
};



// Modal component
const Modal = ({ title, children, onClose, showFooterClose = true }) => (
  <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="assign-modal-title">
    <div className="modal-shell max-h-[88vh] w-full max-w-2xl overflow-y-auto overscroll-contain p-6" onClick={(e) => e.stopPropagation()}>
      <h3 id="assign-modal-title" className="text-2xl font-bold text-teal-900 mb-4">{title}</h3>
      {children}
      {showFooterClose && (
        <div className="flex justify-end mt-4">
          <button className="btn-muted px-5 py-2.5" onClick={onClose}>Close</button>
        </div>
      )}
    </div>
  </div>

  
);

export default AssignStaffPage;
