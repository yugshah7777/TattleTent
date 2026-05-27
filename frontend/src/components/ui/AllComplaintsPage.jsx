import React, { useState, useEffect } from "react";
import Logo from './Logo'
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { apiUrl, formatDate, getStoredUser, normalizeStatus, statusClassName } from "../../lib/api";


const AllComplaintsPage = () => {

  const navigate=useNavigate();
  const [user] = useState(() => getStoredUser());

  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
 /*  const [complaints, setComplaints] = useState([
    { id: 1, category: "Water Leak", location: "Tent #5", status: "Pending", citizen: "John Doe", priority: null, description: "Leak near Tent #5, pipe burst", assignedTo: null },
    { id: 2, category: "Garbage", location: "Central Park", status: "In Progress", citizen: "Mike Johnson", priority: "Low", description: "Overflowing bin near park", assignedTo: "John Doe" },
    { id: 3, category: "Electrical", location: "Sector B", status: "Pending", citizen: "Sarah Lee", priority: null, description: "Street light not working", assignedTo: null },
    { id: 4, category: "Pathway Damage", location: "Sector C", status: "Resolved", citizen: "Jane Smith", priority: "Medium", description: "Broken tiles in Sector C repaired", assignedTo: "Mike Johnson", solution: "Tiles replaced" },
    // Add more complaints for testing pagination  
    { id: 5, category: "Garbage", location: "Sector D", status: "Pending", citizen: "Anna Lee", priority: null, description: "Trash not collected", assignedTo: null },
    { id: 6, category: "Water Leak", location: "Sector E", status: "Pending", citizen: "Bob Smith", priority: null, description: "Pipe leak near road", assignedTo: null },
    { id: 7, category: "Electrical", location: "Sector F", status: "Resolved", citizen: "Carol White", priority: "High", description: "Power outage fixed", assignedTo: "Jane Smith", solution: "Replaced transformer" },
    { id: 8, category: "Pathway Damage", location: "Sector G", status: "In Progress", citizen: "David Green", priority: "Medium", description: "Uneven pavement", assignedTo: "Mike Johnson" },
  ]);
 */
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
      setComplaints([]); // fallback to empty array
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
  const complaintsPerPage = 5; // number of complaints per page
  const dashboardRoute = user?.role === "Citizen"
    ? "/citizen-dashboard"
    : user?.role === "Staff"
      ? "/staff-dashboard"
      : "/admin-dashboard";

  //const staffList = ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Lee"];

  const filteredComplaints = complaints.filter(c => {
    const normalizedStatus = normalizeStatus(c.status).toLowerCase();
    const matchesStatus = filterStatus === "all" || normalizedStatus === filterStatus.toLowerCase();
    const matchesCategory = filterCategory === "all" || (c.category || "").toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch = searchTerm === "" || (c.category || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.location || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Pagination calculations
  const indexOfLast = currentPage * complaintsPerPage;
  const indexOfFirst = indexOfLast - complaintsPerPage;
  const currentComplaints = filteredComplaints.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / complaintsPerPage));

 /* const handleAssign = (complaint) => setAssignStaff(complaint);
  const confirmAssign = (staffName) => {
    setComplaints(prev => prev.map(c => c.id === assignStaff.id ? { ...c, assignedTo: staffName, status: "In Progress" } : c));
    setAssignStaff(null);
  };

  const handleUpdate = (complaint) => setSelectedComplaint({ ...complaint });
  const saveUpdate = () => {
    setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? selectedComplaint : c));
    setSelectedComplaint(null);
  };*/

  const handleView = (complaint) => {
    setSelectedComplaint(complaint);
    setIsViewOpen(true);
  };

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
    <div className="app-shell min-h-screen font-sans px-6 pb-6">
    <div className="premium-nav fixed top-0 left-0 w-full h-24 flex items-center justify-between px-8 z-50">
    <Logo/>
    <div className="flex items-center gap-4">
      <button className="btn-secondary px-5 py-2.5" onClick={() => navigate("/")}>
        Home
      </button>
      <button className="btn-primary px-5 py-2.5" onClick={() => navigate(dashboardRoute)}>
        My Dashboard
      </button>
    </div>
  </div>

 
  <div className="text-center mb-8">
    <h2 className="text-5xl font-bold text-teal-900 mb-2">All Grievances</h2>
    <p className="text-gray-700 text-lg">View, filter, and export public grievance records.</p>
  </div>

      {/* Search & Filters */}
      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800 shadow-sm">
          {errorMessage}
        </div>
      )}

      <div className="surface-panel flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 p-4">
        <input
          type="text"
          placeholder="Search by keyword..."
          className="px-4 py-2 border rounded-lg w-full lg:w-1/3 focus:ring-2 focus:ring-teal-100"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            className="px-4 py-2 border rounded-lg w-full sm:w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            className="px-4 py-2 border rounded-lg w-full sm:w-auto"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="pathway damage">Pathway Damage</option>
            <option value="water leak">Water Leak</option>
            <option value="garbage">Garbage</option>
            <option value="electrical">Electrical</option>
          </select>

          <button
            onClick={exportCSV}
            className="btn-secondary"
          >
            Export CSV
          </button>

          <button
            onClick={() => {
              setSearchTerm("");
              setFilterCategory("all");
              setFilterStatus("all");
              setCurrentPage(1);
            }}
            className="btn-muted"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="table-shell overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-200">
          <thead className="bg-white">
            <tr>
              {["ID","Category","Location","Status","Date","Priority","Assigned To","View"].map(h=>(
                <th key={h} className="p-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="text-center p-8 text-gray-500">
                  Loading grievances...
                </td>
              </tr>
            ) : currentComplaints.length > 0 ? currentComplaints.map(c=>(
              <tr key={c.id} className="hover:bg-blue-50 transition">
                <td className="p-4 font-bold">{c.id}</td>
                <td className="p-4">{c.category}</td>
                <td className="p-4">{c.location}</td>
                <td className="p-4">
                  <span className={statusClassName(c.status)}>
                    {normalizeStatus(c.status)}
                  </span>
                </td>
                <td className="p-4">{c.date}</td>
                <td className="p-4">{c.priority || "Not Set"}</td>
                <td className="p-4">{c.assignedTo || "Unassigned"}</td>
                <td className="p-4 flex gap-2">
  <button
    className="btn-primary px-3 py-1.5 text-sm"
    onClick={() => handleView(c)}
  >
    OPEN
  </button>
  <button
    className="btn-secondary px-3 py-1.5 text-sm"
    onClick={() => exportComplaintPDF(c)}
  >
    PDF
  </button>
</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className="text-center p-8 text-gray-500">
                  No grievances match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded-lg ${currentPage === i+1 ? "bg-teal-900 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
              onClick={() => setCurrentPage(i+1)}
            >
              {i+1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Assign Modal */}
      {/*{assignStaff && (
        <Modal title={`Assign Complaint #${assignStaff.id}`} onClose={()=>setAssignStaff(null)}>
          <div className="space-y-3">
            {staffList.map(staff=>(
              <button key={staff} className="w-full px-4 py-2 bg-teal-50 rounded-lg hover:bg-teal-100 transition" onClick={()=>confirmAssign(staff)}>
                {staff}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Update Modal */}
      {/*{selectedComplaint && (
        <Modal title={`Update Complaint #${selectedComplaint.id}`} onClose={()=>setSelectedComplaint(null)}>
          <div className="space-y-4">
            <label className="block text-sm font-semibold">Status</label>
            <select className="w-full p-3 border rounded-xl" value={selectedComplaint.status} onChange={e=>setSelectedComplaint({...selectedComplaint,status:e.target.value})}>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <label className="block text-sm font-semibold">Priority</label>
            <select className="w-full p-3 border rounded-xl" value={selectedComplaint.priority || ""} onChange={e=>setSelectedComplaint({...selectedComplaint,priority:e.target.value})}>
              <option value="">Not Set</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <label className="block text-sm font-semibold">Description</label>
            <textarea className="w-full p-3 border rounded-xl" rows={4} value={selectedComplaint.description} readOnly />

            <label className="block text-sm font-semibold">Solution / Notes</label>
            <textarea className="w-full p-3 border rounded-xl" rows={3} value={selectedComplaint.solution || ""} onChange={e=>setSelectedComplaint({...selectedComplaint,solution:e.target.value})} />

            <div className="flex justify-end gap-3">
              <button className="px-6 py-3 bg-gray-200 rounded-xl" onClick={()=>setSelectedComplaint(null)}>Cancel</button>
              <button className="px-6 py-3 bg-teal-900 text-white rounded-xl" onClick={saveUpdate}>Save</button>
            </div>
          </div>
        </Modal>
      )}*/}

      {isViewOpen && selectedComplaint && (
  <div
    className="modal-backdrop"
    onClick={() => setIsViewOpen(false)}
    role="dialog"
    aria-modal="true"
    aria-labelledby="all-complaint-details-title"
  >
    <div
      className="modal-shell w-full max-w-4xl h-[85vh] relative overflow-y-auto p-6"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        onClick={() => setIsViewOpen(false)}
        aria-label="Close complaint details"
      >
        ✕
      </button>

      {/* Complaint Details */}
      <h2 id="all-complaint-details-title" className="text-3xl font-bold text-teal-900 mb-4">
        Grievance #{selectedComplaint.id}: {selectedComplaint.category}
      </h2>

      <div className="space-y-3">
        <p><strong>Description:</strong> {selectedComplaint.description}</p>
        <p><strong>Location:</strong> {selectedComplaint.location}</p>
        <p><strong>Status:</strong> {normalizeStatus(selectedComplaint.status)}</p>
        <p><strong>Priority:</strong> {selectedComplaint.priority}</p>
        <p><strong>Reported by:</strong> {selectedComplaint.citizen}</p>
        <p><strong>Date:</strong> {selectedComplaint.date}</p>
        {selectedComplaint.solution && (
          <p><strong>Solution:</strong> {selectedComplaint.solution}</p>
        )}
      </div>

      {/* Image below text */}
      {selectedComplaint.photo && (
        <div className="mt-6 flex justify-center">
          <img
            src={apiUrl(selectedComplaint.photo)}
            alt={selectedComplaint.category}
            className="max-w-full max-h-[400px] rounded-lg shadow-md object-contain"
          />
        </div>
      )}
    </div>
  </div>
)}



    </div>
  );
};

export default AllComplaintsPage;
