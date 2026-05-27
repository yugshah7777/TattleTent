import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { apiUrl, authHeaders, getStoredUser } from "../../lib/api";

const IcpDiagnosticsPage = () => {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [diagnostics, setDiagnostics] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const sessionUser = sessionStorage.getItem("user");

    if (!token || !sessionUser) {
      navigate("/");
      return;
    }

    const parsed = JSON.parse(sessionUser);
    if (parsed.role !== "Ringmaster" && parsed.role !== "Admin") {
      navigate("/");
    }
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
        if (!response.ok) {
          throw new Error(payload?.message || "Unable to fetch diagnostics");
        }
        setDiagnostics(payload?.data || null);
      } catch (error) {
        setErrorMessage(error.message || "Unable to load ICP diagnostics.");
      } finally {
        setLoading(false);
      }
    };

    loadDiagnostics();
  }, []);

  return (
    <div className="app-shell min-h-screen font-sans px-6 pb-10">
      <div className="premium-nav fixed top-0 left-0 w-full h-24 flex items-center justify-between px-8 z-50">
        <Logo />
        <button className="btn-primary" onClick={() => navigate("/admin-dashboard")}>
          Back to Dashboard
        </button>
      </div>

      <div className="mx-auto max-w-6xl pt-32">
        <h1 className="text-4xl font-bold text-teal-900">ICP Diagnostics</h1>
        <p className="mt-2 text-slate-600">Live health and blockchain sync telemetry for audit verification.</p>

        {loading && <div className="mt-6 rounded-lg bg-white p-4 shadow">Loading diagnostics...</div>}
        {errorMessage && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{errorMessage}</div>
        )}

        {!loading && diagnostics && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["ICP Enabled", diagnostics.enabled ? "Yes" : "No"],
                ["Config Ready", diagnostics.configured ? "Yes" : "No"],
                ["Queued Writes", diagnostics.counters?.totalQueuedWrites ?? 0],
                ["Write Failures", diagnostics.counters?.totalWriteFailures ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white p-4 shadow">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-slate-900">Connection</h2>
              <p className="mt-2 text-sm text-slate-700"><strong>Host:</strong> {diagnostics.host}</p>
              <p className="mt-1 text-sm text-slate-700"><strong>Canister ID:</strong> {diagnostics.canisterId || "Not configured"}</p>
              <p className="mt-1 text-sm text-slate-700"><strong>Last Success:</strong> {diagnostics.lastSuccessAt || "N/A"}</p>
              <p className="mt-1 text-sm text-slate-700"><strong>Last Failure:</strong> {diagnostics.lastFailureAt || "N/A"}</p>
              <p className="mt-1 text-sm text-slate-700"><strong>Last Failure Message:</strong> {diagnostics.lastFailureMessage || "N/A"}</p>
            </div>

            <div className="mt-6 rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-slate-900">Recent Sync Failures</h2>
              {Array.isArray(diagnostics.recentFailures) && diagnostics.recentFailures.length > 0 ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead>
                      <tr>
                        {["Time", "Kind", "Complaint", "Action", "Error"].map((label) => (
                          <th key={label} className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {diagnostics.recentFailures.map((entry, index) => (
                        <tr key={`${entry.at}-${index}`}>
                          <td className="px-3 py-2 text-sm text-slate-700">{entry.at}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{entry.kind}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{entry.complaintId || "-"}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{entry.action || "-"}</td>
                          <td className="px-3 py-2 text-sm text-slate-700">{entry.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">No sync failures captured yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IcpDiagnosticsPage;
