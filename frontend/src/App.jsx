import { Routes, Route } from "react-router-dom";
import LandingPage from "./Home";
import CitizenDashboard from "./components/ui/CitizenDashboard";
import StaffDashboard from "./components/ui/StaffDashboard";
import AdminDashboard from "./components/ui/AdminDashboard";
import { ToastProvider } from "./components/ui/Toast";
import AuthSuccess from "./components/ui/AuthSuccess";
import "./App.css";

function App() {
  return (
    <ToastProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
        </Routes>
      </div>
    </ToastProvider>
  );
}

export default App;