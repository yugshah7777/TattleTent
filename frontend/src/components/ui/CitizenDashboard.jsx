import { useState, useEffect } from "react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { FiCheckCircle, FiClock, FiDroplet, FiFileText, FiTrash2, FiTool, FiZap } from "react-icons/fi";
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

   const handleDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setIsViewOpen(true);
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
// refetch if user changes


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

      // Create a FormData object to handle text + image together
      const formData = new FormData(e.target);

      // Add logged-in user ID automatically
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
    // 1. Clear session data (must match what you used in LandingPage!)
    clearSession();
    
    // 2. Redirect to the home page, which will now show Login/Sign Up buttons
    navigate("/"); 
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const user = sessionStorage.getItem("user");
    
    // Check if authenticated
    if (!token || !user) {
      // Redirect to login/home page if no session is found
      navigate("/"); 
    } 
    
    // 💡 Add Role Check (Crucial for security and correct routing!)
    if (user && getStoredUser()?.role !== "Citizen") {
        navigate("/"); // Or a specific Unauthorized page
    }
    
  }, [navigate]);

  const activeComplaints = complaints.filter((c) => c.status === "New" || c.status === "IN_PROGRESS");
  const resolvedComplaints = complaints.filter((c) => c.status === "Resolved");
  const displayName = user?.name || "there";



  return (
    <div className="app-shell min-h-screen font-sans">
      {/* Premium Sticky Navbar */}
      <nav className="premium-nav fixed top-0 left-0 w-full z-50">
        <div className="flex items-center justify-between h-20 px-6 sm:px-8 lg:px-12">
          <Logo />

          {/* Hamburger (mobile only) */}
          <button
            className="sm:hidden p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <FaBars size={24} />
          </button>

          {/* Desktop Menu (visible on medium screens and up) */}
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Logged in as</p>
              <p className="font-semibold text-slate-900">{user?.name || "Citizen"}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/all-complaints")}
                className="btn-secondary"
              >
                All Grievances
              </button>

              <button
                onClick={handleLogout}
                className="btn-primary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur animate-fade-in">
            <div className="flex flex-col items-center gap-4 py-6 px-4">
              <div className="text-center">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Logged in as</p>
                <p className="font-semibold text-slate-900">{user?.name || "Citizen"}</p>
              </div>

              <button
                onClick={() => {
                  navigate("/all-complaints");
                  setMenuOpen(false);
                }}
                className="btn-secondary w-full justify-center"
              >
                All Grievances
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="btn-primary w-full justify-center"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 max-w-7xl pt-32">
        {/* Hero Section */}
        <section className="space-y-6 py-8 sm:py-12">
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 leading-tight tracking-tight">
              Welcome back, {displayName}!
            </h1>
            <p className="text-xl sm:text-2xl text-slate-700 font-medium italic">
              Your official portal for transparent public service grievance redressal
            </p>
          </div>
          
          <div className="space-y-3">
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
              Submit civic grievances, track departmental action, and provide feedback after resolution.
            </p>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
              Your submissions help public authorities improve service delivery and accountability.
            </p>
          </div>
        </section>

        {/* Alert Messages */}
        {notice && (
          <div className="success-message border-2 border-emerald-300 bg-emerald-50/80 px-6 py-4 rounded-12 shadow-sm animate-fade-in">
            <p className="text-sm sm:text-base font-semibold text-emerald-900">{notice}</p>
          </div>
        )}

        {errorMessage && (
          <div className="error-message border-2 border-red-300 bg-red-50/80 px-6 py-4 rounded-12 shadow-sm animate-fade-in">
            <p className="text-sm sm:text-base font-semibold text-red-900">{errorMessage}</p>
          </div>
        )}

        {/* Stats Section with Premium Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
            {[
              { title: "Total Grievances", count: (parseInt(counts.resolved, 10) || 0) + (parseInt(counts.in_progress, 10) || 0) + (parseInt(counts.pending, 10) || 0), icon: FiFileText },
              { title: "Resolved", count: counts.resolved, icon: FiCheckCircle },
              { title: "In Progress", count: counts.in_progress, icon: FiClock },
            ].map((s) => {
              const StatIcon = s.icon;
              return (
              <div
                key={s.title}
                className="premium-card metric-card p-8 hover-lift group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-5xl font-extrabold text-slate-950 mb-2">{s.count}</div>
                    <div className="font-semibold text-slate-600">{s.title}</div>
                  </div>
                  <StatIcon className="h-10 w-10 text-teal-900 opacity-25 transition-opacity group-hover:opacity-45" aria-hidden="true" />
                </div>
              </div>
            )})}
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="surface-panel p-8 lg:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Quick Actions</h2>
              <p className="text-slate-600">Common public service categories</p>
            </div>
            <button
              onClick={() => setIsSubmitOpen(true)}
              className="btn-primary whitespace-nowrap px-6 py-2.5"
            >
              + New Grievance
            </button>
          </div>

          {/* Category Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: FiTool, label: "Pathway Damage" },
              { icon: FiDroplet, label: "Water Leak" },
              { icon: FiTrash2, label: "Garbage" },
              { icon: FiZap, label: "Electrical" },
            ].map((cat) => {
              const ActionIcon = cat.icon;
              return (
              <button
                key={cat.label}
                onClick={() => setIsSubmitOpen(true)}
                className="h-32 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 group"
              >
                <ActionIcon className="h-9 w-9 text-teal-900 transition-transform group-hover:scale-110" aria-hidden="true" />
                <span className="text-sm font-semibold text-slate-700 text-center">{cat.label}</span>
              </button>
            )})}
          </div>
        </section>

        {/* Active Grievances */}
        <section className="surface-panel p-8">
          <div className="mb-6 pb-4 border-b-2 border-slate-200">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Active Grievances</h2>
            <p className="text-slate-600 mt-2">Pending and in-progress complaints</p>
          </div>
          
          <div className="table-shell rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wide">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wide">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wide">Submitted</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingComplaints ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-3">
                          <div className="app-loader spinner-sm"></div>
                          Loading grievances...
                        </div>
                      </td>
                    </tr>
                  ) : activeComplaints.length > 0 ? (
                    activeComplaints.map(c => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-900 font-medium">{c.category}</td>
                        <td className="px-6 py-4">
                          <span className={statusClassName(c.status)}>
                            {normalizeStatus(c.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-900 font-medium truncate max-w-xs">{c.title}</td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{c.subdate}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            className="btn-secondary btn-sm"
                            onClick={() => handleDetails(c)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                        No active grievances. Submit a new one to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

{/* 4a. Resolved Complaints Section with Feedback */}
{resolvedComplaints.length > 0 && (
  <div className="surface-panel p-8 border-l-4 border-l-green-400">
    <h2 className="text-2xl font-bold mb-6 text-green-800">Resolved Grievances</h2>
    <div className="overflow-hidden rounded-lg border border-gray-300">
      <div className="max-h-[300px] overflow-y-auto">
        <table className="min-w-full divide-y divide-blue-200">
          <thead className="bg-white sticky top-0 z-10">
            <tr>
              <th className="p-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider font-mono">Category</th>
              <th className="p-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider font-mono">Title</th>
              <th className="p-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider font-mono">Date</th>
              <th className="p-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider font-mono">Details</th>
              <th className="p-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider font-mono">Feedback</th>
              
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-200 bg-white">
            {resolvedComplaints.map(c => (
              <tr key={c.id} className="hover:bg-blue-50 transition">
                <td className="p-4 text-gray-900 font-medium font-mono">{c.category}</td>
                <td className="p-4 text-gray-900 font-medium font-mono">{c.title}</td>
                <td className="p-4 text-gray-900 font-medium font-mono">{c.subdate}</td>
                <td className="p-4 text-gray-600 text-sm font-mono ">
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium font-mono"
                    onClick={() => handleDetails(c)}
                  >
                    View Details
                  </button>
                   </td>
                   <td>
                  <button
                    className="btn-secondary px-3 py-1 text-sm"
                    onClick={() => navigate("/feedback-page", { state: { complaint: c } })}
                  >
                    Give Feedback
                  </button>
               </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

</main>

      {/* Modal (unchanged) */}
      {isSubmitOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsSubmitOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-complaint-title"
        >
          <div className="overflow-hidden">
          <div
            className="modal-shell max-h-[80vh] overflow-y-auto w-full max-w-lg p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="new-complaint-title" className="text-2xl font-bold text-teal-900 mb-6 border-b pb-2">Submit New Grievance</h3>
            <form 
              onSubmit={handleNewComplaint}
              className="space-y-5 bg-white p-6 rounded-2xl shadow-lg"
            >
  {/* Category */}
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      Grievance Category <span className="text-red-500">*</span>
    </label>
    <select
      name="category"
      required
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-teal-100 focus:border-teal-700 transition shadow-inner appearance-none bg-white"
    >
      <option value="">Select Category</option>
      <option>Electrical</option>
      <option>Water Leak</option>
      <option>Pathway Damage</option>
      <option>Garbage</option>
    </select>
  </div>

  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      Title <span className="text-red-500">*</span>
    </label>
    <input
      name="title"
      type="text"
      required
      placeholder="e.g., Tent #12, Sector C"
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-teal-100 focus:border-teal-700 transition shadow-inner"
    />
  </div>

  {/* Location */}
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      Location / Address <span className="text-red-500">*</span>
    </label>
    <input
      name="location"
      type="text"
      required
      placeholder="e.g., Tent #12, Sector C"
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-teal-100 focus:border-teal-700 transition shadow-inner"
    />
  </div>

  {/* Description */}
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      Detailed Description <span className="text-red-500">*</span>
    </label>
    <textarea
      name="description"
      required
      placeholder="What is the issue?"
      rows={4}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-teal-100 focus:border-teal-700 transition shadow-inner resize-none"
    ></textarea>
  </div>

  {/* Photo Upload */}
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      Upload Photo (optional but recommended)
    </label>
    <input
      name="photo"
      type="file"
      accept="image/*"
      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-4 focus:ring-teal-100 focus:border-teal-700 transition file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-900 hover:file:bg-teal-100"
    />
  </div>

  {/* Buttons */}
  <div className="flex justify-end gap-3 pt-4">
    <button
      type="button"
      className="btn-muted"
      onClick={() => setIsSubmitOpen(false)}
      disabled={isSubmittingComplaint}
    >
      Cancel
    </button>
    <button
      type="submit"
      className="btn-primary"
      disabled={isSubmittingComplaint}
    >
      {isSubmittingComplaint ? "Submitting..." : "Submit"}
    </button>
  </div>
</form>
 
          </div>
          </div>

        </div>
      )}

      {isViewOpen && selectedComplaint && (
  <div
    className="modal-backdrop"
    onClick={() => setIsViewOpen(false)}
    role="dialog"
    aria-modal="true"
    aria-labelledby="complaint-details-title"
  >
    <div
      className="modal-shell w-full max-w-4xl h-[85vh] relative overflow-y-auto p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        onClick={() => setIsViewOpen(false)}
        aria-label="Close complaint details"
      >
        ✕
      </button>

      <h2 id="complaint-details-title" className="text-3xl font-bold text-teal-900 mb-4">
        Grievance #{selectedComplaint.id}: {selectedComplaint.category}
      </h2>

      <div className="space-y-3">
        <p><strong>Title:</strong> {selectedComplaint.title}</p>
        <p><strong>Description:</strong> {selectedComplaint.description}</p>
        <p><strong>Location:</strong> {selectedComplaint.location}</p>
        <p><strong>Status:</strong> {normalizeStatus(selectedComplaint.status)}</p>
        <p><strong>Priority:</strong> {selectedComplaint.priority}</p>
        <p><strong>Assigned To:</strong> {selectedComplaint.assignedTo}</p>
        <p><strong>Submit Date:</strong> {selectedComplaint.subdate}</p>
        <p><strong>Last Update:</strong> {selectedComplaint.update}</p>
      </div>

      {/* Image below text */}
      {selectedComplaint.photo && (
        <div className="mt-6 flex justify-center">
          <img
            src={apiUrl(selectedComplaint.photo)}
            alt="Complaint"
            className="max-w-full max-h-[400px] rounded-lg shadow-md"
          />
        </div>
      )}
    </div>
  </div>
)}

<footer className="text-center py-4 bg-white shadow-inner text-gray-600 text-sm">
        © {new Date().getFullYear()} Government of India Public Grievance Resolution Portal.
      </footer>

    </div>
  );
};

export default CitizenDashboard;
