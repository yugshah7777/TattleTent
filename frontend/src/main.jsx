import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

const Home = lazy(() => import("./Home"));
const AuthSuccess = lazy(() => import("./components/ui/AuthSuccess"));
const CitizenDashboard = lazy(() => import("./components/ui/CitizenDashboard"));
const StaffDashboard = lazy(() => import("./components/ui/StaffDashboard"));
const AdminDashboard = lazy(() => import("./components/ui/AdminDashboard"));
const LearnMorePage = lazy(() => import("./components/ui/LearnMorePage"));
const AllComplaintsPage = lazy(() => import("./components/ui/AllComplaintsPage"));
const AssignStaffPage = lazy(() => import("./components/ui/AssignStaffPage"));
const Heatmap = lazy(() => import("./components/ui/Heatmap"));
const FeedbackPage = lazy(() => import("./components/ui/FeedbackPage"));
const AdminInviteStaff = lazy(() => import("./components/ui/AdminInviteStaff"));
const StaffPasswordChange = lazy(() => import("./components/ui/StaffPasswordChange"));
const IcpDiagnosticsPage = lazy(() => import("./components/ui/IcpDiagnosticsPage"));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="app-loader" aria-label="Loading page" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/learn-more" element={<LearnMorePage />} />
          <Route path="/all-complaints" element={<AllComplaintsPage />} />
          <Route path="/assign-staff" element={<AssignStaffPage />} />
          <Route path="/heatmap" element={<Heatmap />} />
          <Route path="/feedback-page" element={<FeedbackPage />} />
          <Route path="/invite-staff" element={<AdminInviteStaff />} />
          <Route path="/staff-password-change" element={<StaffPasswordChange />} />
          <Route path="/icp-diagnostics" element={<IcpDiagnosticsPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>
);
