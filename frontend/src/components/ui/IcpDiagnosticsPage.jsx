import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { apiUrl, authHeaders, getStoredUser } from "../../lib/api";
import { TransparencyScore } from "./BlockchainBadge";

const IcpDiagnosticsPage = () => {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [diagnostics, setDiagnostics] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const sessionUser = sessionStorage.getItem("user");
    if (!token || !sessionUser) { navigate("/"); return; }
    const parsed = JSON.parse(sessionUser);
    if (parsed.role !== "Ringmaster" && parsed.role !== "Admin") { navigate("/"); }
  }, [navigate]);

  useEffect(() => {
    const loadDiagnostics = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const response = await fetch(apiUrl("/api/complaints/icp/diagnostics"), {
          headers: authHeaders(),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.message || "Unable to fetch diagnostics");
        setDiagnostics(payload?.data || null);
      } catch (error) {
        setErrorMessage(error.message || "Unable to load ICP diagnostics.");
      } finally {
        setLoading(false);
      }
    };
    loadDiagnostics();
  }, []);

  const getHealthScore = () => {
    if (!diagnostics) return 0;
    let score = 100;
    if (!diagnostics.enabled) score -= 40;
    if (!diagnostics.configured) score -= 20;
    if (diagnostics.counters?.totalWriteFailures > 0) score -= Math.min(30, diagnostics.counters.totalWriteFailures * 5);
    if (diagnostics.lastFailureAt) score -= 10;
    return Math.max(0, score);
  };

  const healthScore = getHealthScore();

  return (
    <div className="app-shell min-h-screen font-sans px-6 pb-10">
      <div className="premium-nav fixed top-0 left-0 w-full h-24 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f4c45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Governance Integrity Dashboard</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => navigate("/admin-dashboard")}>Back to Dashboard</button>
      </div>

      <div className="mx-auto max-w-6xl pt-32">
        <div className="mb-8">
          <p className="section-kicker mb-2">System Integrity & Blockchain Telemetry</p>
          <h1 className="text-4xl font-bold text-slate-950">Governance Integrity Dashboard</h1>
          <p className="mt-2 text-slate-600">Live health monitoring for ICP blockchain sync, audit verification, and transparency infrastructure.</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 rounded-full border-3 border-slate-200 border-t-emerald-700 animate-spin" />
              <p className="text-sm text-slate-500">Loading diagnostics...</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800">{errorMessage}</div>
        )}

        {!loading && diagnostics && (
          <>
            {/* Health Score & Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="md:col-span-1">
                <TransparencyScore score={healthScore} label="Transparency Health" />
              </div>
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Connection Status", value: diagnostics.enabled ? "Connected" : "Disconnected", color: diagnostics.enabled ? "text-emerald-600" : "text-red-600", icon: diagnostics.enabled ? "check-circle" : "x-circle" },
                  { label: "Configuration", value: diagnostics.configured ? "Ready" : "Not Configured", color: diagnostics.configured ? "text-emerald-600" : "text-amber-600", icon: diagnostics.configured ? "check-circle" : "alert" },
                  { label: "Last Sync", value: diagnostics.lastSuccessAt ? new Date(diagnostics.lastSuccessAt).toLocaleDateString() : "Never", color: diagnostics.lastSuccessAt ? "text-slate-900" : "text-slate-400", icon: "clock" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                    <p className={`mt-1 text-lg font-extrabold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Infrastructure Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f4c45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Connection Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Host</span>
                    <span className="text-sm font-semibold text-slate-900 font-mono">{diagnostics.host}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Canister ID</span>
                    <span className="text-sm font-semibold text-slate-900 font-mono">{diagnostics.canisterId || "Not configured"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">ICP Enabled</span>
                    <span className={`text-sm font-bold ${diagnostics.enabled ? "text-emerald-600" : "text-red-600"}`}>{diagnostics.enabled ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Config Ready</span>
                    <span className={`text-sm font-bold ${diagnostics.configured ? "text-emerald-600" : "text-amber-600"}`}>{diagnostics.configured ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f4c45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Ledger Activity
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Total Queued Writes</span>
                    <span className="text-sm font-extrabold text-slate-900">{diagnostics.counters?.totalQueuedWrites ?? 0}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Total Write Failures</span>
                    <span className={`text-sm font-extrabold ${(diagnostics.counters?.totalWriteFailures ?? 0) > 0 ? "text-red-600" : "text-emerald-600"}`}>{diagnostics.counters?.totalWriteFailures ?? 0}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Last Success</span>
                    <span className="text-sm font-semibold text-slate-900">{diagnostics.lastSuccessAt || "N/A"}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-sm text-slate-500">Last Failure</span>
                    <span className="text-sm font-semibold text-slate-900">{diagnostics.lastFailureAt || "N/A"}</span>
                  </div>
                  {diagnostics.lastFailureMessage && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <p className="text-xs font-semibold text-red-700">Last Failure Message:</p>
                      <p className="text-xs text-red-600 mt-1">{diagnostics.lastFailureMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Sync Failures */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Recent Sync Failures
              </h2>
              {Array.isArray(diagnostics.recentFailures) && diagnostics.recentFailures.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead>
                      <tr>
                        {["Time", "Kind", "Complaint", "Action", "Error"].map((label) => (
                          <th key={label} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {diagnostics.recentFailures.map((entry, index) => (
                        <tr key={`${entry.at}-${index}`} className="hover:bg-red-50">
                          <td className="px-3 py-2 text-sm text-slate-700">{entry.at}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{entry.kind}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{entry.complaintId || "-"}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{entry.action || "-"}</td>
                          <td className="px-3 py-2 text-sm text-red-600 font-medium">{entry.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <p className="text-sm font-semibold text-emerald-800">No sync failures captured. All blockchain writes are succeeding.</p>
                </div>
              )}
            </div>

            {/* ICP Technical Details Footer */}
            <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">About This Dashboard</p>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    This dashboard provides live telemetry for the Internet Computer Protocol (ICP) blockchain integration. 
                    All grievance lifecycle events — submission, assignment, status changes, and resolution — are 
                    cryptographically recorded on the ICP ledger for immutable auditability and transparent governance.
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Secured using Internet Computer Protocol (ICP) verifiable infrastructure.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IcpDiagnosticsPage;