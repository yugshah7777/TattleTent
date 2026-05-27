"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppButton from "./components/ui/app-button";
import Logo from "./components/ui/Logo";
import { useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaGithub, FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import axios from "axios";
import { apiUrl } from "./lib/api";
import useBodyScrollLock from "./lib/useBodyScrollLock";

const portals = [
  ["Citizen Services", "Register civic grievances and track official action.", "M12 4v16m8-8H4"],
  ["Department Console", "Assign, monitor, and review public service requests.", "M3 3h18v18H3z"],
  ["Field Operations", "Support timely reporting and resolution on mobile devices.", "M12 6v6l4 2"],
];

const features = [
  ["Real-Time Tracking", "Stay updated on grievance status and department action."],
  ["Administrative Transparency", "Support accountable resolution with clear status records."],
  ["Public Service Impact", "Help departments identify and resolve local service issues."],
];

const categories = [
  ["Road Infrastructure", "Potholes, cracks, and unsafe public roads.", "M4 6h16M4 12h8m-8 6h16"],
  ["Sanitation Services", "Solid waste collection and disposal issues.", "M3 3l18 18M4 6h16"],
  ["Water Supply", "Leakages, shortages, and contamination.", "M12 4v16m8-8H4"],
  ["Street Lighting", "Report outages and faulty public lighting.", "M12 3v18m9-9H3"],
  ["Public Transport", "Public transport service grievances and access issues.", "M5 13l4 4L19 7"],
  ["Other Public Services", "Other civic service concerns requiring department review.", "M4 4h16v16H4z"],
];

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setCPassword] = useState("");

  const [signupOtpOpen, setSignupOtpOpen] = useState(false);
  const [signupOtp, setSignupOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState("request");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const [signupMessage, setSignupMessage] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  useBodyScrollLock(loginOpen || forgotPassword || signupOpen || signupOtpOpen);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    const storedToken = sessionStorage.getItem("token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!location.state) return;
    const state = location.state;
    if (state.openLogin) {
      setLoginOpen(true);
    }
    if (state.loginMessage) {
      setLoginMessage(state.loginMessage);
    }
    if (state.email) {
      setEmail(state.email);
    }
  }, [location.state]);

  // ------------------- SIGNUP -------------------
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (password !== cpassword) return;
    try {
      setIsLoading(true);
      setSignupMessage("");
      const res = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setSignupMessage("An account with this email already exists. Please log in.");
        setSignupOpen(false);
        setLoginOpen(true);
        setLoginMessage("An account with this email already exists. Please log in.");
        return;
      }
      if (!res.ok) throw new Error(data.message);
      setSignupOtpOpen(true);
    } catch (err) {
      setSignupMessage(err.message || "Signup failed. Try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------- VERIFY OTP -------------------
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setSignupMessage("");
      const registerRes = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          otp: signupOtp,
        }),
      });
      const registerData = await registerRes.json();
      if (registerRes.status === 409) {
        setSignupMessage("An account with this email already exists. Please log in.");
        setSignupOtpOpen(false);
        setSignupOpen(false);
        setLoginOpen(true);
        setLoginMessage("An account with this email already exists. Please log in.");
        return;
      }
      if (registerRes.ok) {
        sessionStorage.setItem("token", registerData.token);
        sessionStorage.setItem("user", JSON.stringify(registerData.user));
        setUser(registerData.user);
        setSignupOtpOpen(false);
        setSignupOpen(false);
        setFullName("");
        setEmail("");
        setPassword("");
        setCPassword("");
        setSignupOtp("");
      } else {
        setSignupMessage(registerData.message);
        console.error(registerData.message);
      }
    } catch (err) {
      setSignupMessage("OTP Verify Error: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------- LOGIN -------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setLoginMessage("");
      const loginRes = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        if (loginRes.status === 403 && loginData.must_change_password) {
          setLoginOpen(false);
          setForgotPassword(false);
          navigate("/staff-password-change", {
            state: { email: loginData.email || email, currentPassword: password },
          });
          return;
        }
        if (loginRes.status === 401 && loginData.message.includes("Invalid credentials")) {
          try {
            const emailCheck = await fetch(apiUrl(`/api/auth/check-email?email=${encodeURIComponent(email)}`));
            const emailExists = await emailCheck.json();
            if (!emailCheck.ok || !emailExists.exists) {
              setLoginOpen(false);
              setSignupOpen(true);
              setSignupMessage("No account found with this email. Please sign up.");
            } else {
              setLoginMessage("Incorrect password. Please try again.");
            }
          } catch (emailErr) {
            setLoginMessage("Unable to verify email. Please try again later.");
            console.error(emailErr);
          }
        } else {
          setLoginMessage(loginData.message);
        }
        return;
      }
      sessionStorage.setItem("token", loginData.token);
      sessionStorage.setItem("user", JSON.stringify(loginData.user));
      setUser(loginData.user);
      setLoginOpen(false);
      setEmail("");
      setPassword("");
      if (loginData.user.role === "Ringmaster") navigate("/admin-dashboard");
      else if (loginData.user.role === "Staff") navigate("/staff-dashboard");
      else navigate("/citizen-dashboard");
    } catch (err) {
      setLoginMessage("Login Unsuccessful: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = apiUrl("/api/auth/google");
  };

  const resetForgotState = () => {
    setForgotStep("request");
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotMessage("");
    setForgotLoading(false);
  };

  const openForgotPassword = () => {
    setLoginOpen(false);
    setForgotPassword(true);
    setForgotMessage("");
    setForgotStep("request");
    setForgotEmail(email || "");
  };

  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    try {
      setForgotLoading(true);
      setForgotMessage("");
      const res = await fetch(apiUrl("/api/auth/send-reset-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setForgotStep("otp");
      setForgotMessage("OTP sent successfully. Check your inbox.");
    } catch (err) {
      setForgotMessage(err.message || "Failed to send OTP");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      setForgotLoading(true);
      setForgotMessage("");
      const res = await fetch(apiUrl("/api/auth/verify-reset-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to verify OTP");
      setForgotStep("reset");
      setForgotMessage("OTP verified. Set your new password.");
    } catch (err) {
      setForgotMessage(err.message || "Failed to verify OTP");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotMessage("Passwords do not match.");
      return;
    }
    try {
      setForgotLoading(true);
      setForgotMessage("");
      const res = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, password: forgotNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setForgotPassword(false);
      resetForgotState();
      setLoginOpen(true);
      setEmail(forgotEmail);
      setPassword("");
      setLoginMessage("Password reset successful. Please log in.");
    } catch (err) {
      setForgotMessage(err.message || "Failed to reset password");
    } finally {
      setForgotLoading(false);
    }
  };

  const [avgResolutionTime, setAvgResolutionTime] = useState(0);

  const fetchComplaints = async () => {
    try {
      const queryParams = new URLSearchParams({ status: "Resolved" }).toString();
      const response = await fetch(apiUrl(`/api/complaints/search?${queryParams}`));
      if (!response.ok) throw new Error("Failed to fetch grievances");
      const data = await response.json();
      if (data.length > 0) {
        const totalHours = data.reduce((acc, complaint) => {
          const submitted = new Date(complaint.submitted_at);
          const updated = new Date(complaint.updated_at);
          const diffHours = (updated - submitted) / (1000 * 60 * 60);
          return acc + diffHours;
        }, 0);
        const avgHours = totalHours / data.length;
        setAvgResolutionTime(Math.round(avgHours));
      }
    } catch (err) {
      console.error("Error fetching grievances:", err);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const [counts, setCounts] = useState({ resolved: 0, pending: 0, in_progress: 0 });

  const fetchCounts = async () => {
    try {
      const res = await axios.get(apiUrl("/api/complaints/counts"));
      setCounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const [reviews, setReviews] = useState([]);

  const fetchFeedback = async () => {
    try {
      const res = await axios.get(apiUrl("/api/feedback/"));
      setReviews(res.data.message.map(c => ({
        name: c.name,
        rating: c.rating,
        comment: c.comment
      })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div className="text-gray-900">
      {/* ============ PREMIUM NAVBAR ============ */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="premium-nav"
      >
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`${menuOpen ? "flex" : "hidden"} sm:flex flex-col sm:flex-row gap-2 sm:gap-3 items-center absolute sm:relative top-full left-0 right-0 bg-white sm:bg-transparent p-4 sm:p-0 shadow-lg sm:shadow-none border-b sm:border-0 z-50`}>
            {user ? (
              <>
                <AppButton
                  onClick={() => {
                    if (user.role === "Citizen") navigate("/citizen-dashboard");
                    else if (user.role === "Staff") navigate("/staff-dashboard");
                    else navigate("/admin-dashboard");
                  }}
                  className="btn-primary px-5 py-2.5 w-full sm:w-auto"
                >
                  Dashboard
                </AppButton>
                <AppButton
                  onClick={() => {
                    sessionStorage.removeItem("user");
                    sessionStorage.removeItem("token");
                    setUser(null);
                    navigate("/");
                  }}
                  className="btn-muted px-5 py-2.5 w-full sm:w-auto"
                >
                  Logout
                </AppButton>
              </>
            ) : (
              <>
                <AppButton
                  onClick={() => setLoginOpen(true)}
                  className="btn-secondary px-5 py-2.5 w-full sm:w-auto"
                >
                  Login
                </AppButton>
                <AppButton
                  onClick={() => setSignupOpen(true)}
                  className="btn-primary px-6 py-2.5 w-full sm:w-auto"
                >
                  Sign Up
                </AppButton>
              </>
            )}
          </div>
          <button
            className="sm:hidden p-2.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <FaBars size={20} className="text-gray-800" />
          </button>
        </div>
      </motion.nav>

      {/* ============ HERO SECTION ============ */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[var(--goi-deep)]/3 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[var(--goi-blue)]/3 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-24 md:pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="section-kicker inline-block mb-4 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200/50">
              Government of India &middot; Civic Grievance Platform
            </span>
            
            <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-[var(--goi-ink)] md:text-5xl lg:text-6xl">
              Public Grievance Redressal
              <span className="block text-[var(--goi-deep)] mt-2">for Accountable Civic Services</span>
            </h1>

            <p className="mx-auto mb-8 max-w-3xl text-lg text-[var(--goi-muted)] md:text-xl leading-relaxed">
              A Government of India public service platform for registering civic grievances,
              tracking departmental action, and improving resolution transparency.
            </p>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mx-auto mb-10 max-w-3xl flex flex-wrap items-center justify-center gap-3"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Blockchain-Verified Governance
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Immutable Complaint Audit Trail
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Tamper-Resistant Records
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="flex justify-center gap-4 flex-wrap"
          >
            <AppButton
              className="btn-primary px-7 py-3 btn-lg"
              onClick={() => navigate("/learn-more")}
            >
              View Citizen Services
            </AppButton>
          </motion.div>
        </div>
      </section>

      {/* ============ GRIEVANCE INSIGHTS ============ */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="section-kicker">Platform Metrics</span>
            <h2 className="text-3xl font-bold text-[var(--goi-ink)] mt-2">Grievance Insights</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[
              {
                title: "Total Grievances",
                count:
                  (parseInt(counts.resolved, 10) || 0) +
                  (parseInt(counts.in_progress, 10) || 0) +
                  (parseInt(counts.pending, 10) || 0),
                icon: "M12 6v6l4 2",
              },
              {
                title: "Average Resolution",
                count: `${avgResolutionTime} Hrs`,
                icon: "M12 6v6l4 2",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="metric-card premium-card flex flex-col items-center px-8 py-10"
              >
                <div className="text-5xl font-black text-[var(--goi-deep)] tabular-nums">{item.count}</div>
                <div className="mt-3 font-semibold text-base text-[var(--goi-muted)]">{item.title}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: "Resolved", count: counts.resolved, color: "text-emerald-700" },
              { title: "In Progress", count: counts.in_progress, color: "text-amber-700" },
              { title: "Pending Review", count: counts.pending, color: "text-slate-600" },
            ].map((s) => (
              <div
                key={s.title}
                className="premium-card flex flex-col items-center px-8 py-10"
              >
                <div className={`text-4xl font-black tabular-nums ${s.color}`}>
                  {s.count}
                </div>
                <div className="mt-2 font-semibold text-sm text-[var(--goi-muted)]">{s.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SERVICE ACCESS CHANNELS ============ */}
      <section className="py-16 md:py-20 bg-white/60 border-y border-[var(--goi-line)]">
        <div className="text-center mb-12 px-6">
          <span className="section-kicker">Role-Based Access</span>
          <h2 className="text-3xl font-bold text-[var(--goi-ink)] mt-2">Service Access Channels</h2>
          <p className="text-[var(--goi-muted)] mt-2">Role-based access for citizens, departments, and field teams.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6">
          {portals.map(([title, desc, path], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
              className="premium-card p-8"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--goi-deep)]/10 bg-[var(--goi-deep)]/5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[var(--goi-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--goi-ink)] mb-2">{title}</h3>
              <p className="text-sm text-[var(--goi-muted)] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ KEY CAPABILITIES ============ */}
      <section className="py-16 md:py-20">
        <div className="text-center mb-12 px-6">
          <span className="section-kicker">Platform Capabilities</span>
          <h2 className="text-3xl font-bold text-[var(--goi-ink)] mt-2">Key Capabilities</h2>
          <p className="text-[var(--goi-muted)] mt-2">Structured grievance reporting, tracking, and departmental accountability.</p>
        </div>
        <div className="flex flex-col md:flex-row justify-center gap-6 max-w-5xl mx-auto px-6">
          {features.map(([title, desc], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              viewport={{ once: true }}
              className="premium-card p-8 flex-1"
            >
              <h3 className="text-lg font-bold text-[var(--goi-ink)] mb-3">{title}</h3>
              <p className="text-sm text-[var(--goi-muted)] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ GRIEVANCE CATEGORIES ============ */}
      <section className="py-16 md:py-20 bg-white/60 border-y border-[var(--goi-line)]">
        <div className="text-center mb-12 px-6">
          <span className="section-kicker">Categories</span>
          <h2 className="text-3xl font-bold text-[var(--goi-ink)] mt-2">Common Grievance Categories</h2>
          <p className="text-[var(--goi-muted)] mt-2">Structured categories help departments route cases accurately.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto px-6">
          {categories.map(([title, desc, path], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="premium-card p-7"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--goi-deep)]/10 bg-[var(--goi-deep)]/5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[var(--goi-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[var(--goi-ink)] mb-1.5">{title}</h3>
              <p className="text-sm text-[var(--goi-muted)] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ CITIZEN FEEDBACK ============ */}
      <section className="py-16 md:py-20">
        <div className="text-center mb-12 px-6">
          <span className="section-kicker">Testimonials</span>
          <h2 className="text-3xl font-bold text-[var(--goi-ink)] mt-2">Citizen Feedback</h2>
          <p className="text-[var(--goi-muted)] mt-2">Feedback submitted after departmental resolution.</p>
        </div>

        <motion.div
          className="reviews-scroll mx-auto flex w-full max-w-6xl snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {Array.isArray(reviews) && reviews.length > 0 ? (
            reviews.map((review, idx) => (
              <motion.div
                key={idx}
                className="premium-card min-w-[280px] max-w-[320px] snap-start p-6 flex-shrink-0"
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 120 }}
              >
                <div className="flex items-center mb-3">
                  {[...Array(review.rating || 0)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-lg">★</span>
                  ))}
                  {[...Array(5 - (review.rating || 0))].map((_, i) => (
                    <span key={i} className="text-gray-300 text-lg">★</span>
                  ))}
                </div>
                <p className="text-sm text-[var(--goi-ink)]/80 mb-3 leading-relaxed italic">"{review.comment || ''}"</p>
                <p className="text-xs font-bold text-[var(--goi-ink)]">— {review.name || 'Anonymous'}</p>
              </motion.div>
            ))
          ) : (
            <div className="empty-state w-full">
              <p>No feedback available yet.</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* ============ FOOTER ============ */}
      <motion.footer
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="bg-[var(--goi-ink)] text-white border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <h4 className="text-base font-bold mb-4 text-white/90">About the Portal</h4>
            <p className="text-sm text-white/60 leading-relaxed">
              The Public Grievance Resolution Portal supports citizens in registering civic service issues and tracking official action by departments.
            </p>
            <div className="flex gap-3 mt-5">
              {[FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                  aria-label={`Social link ${idx + 1}`}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-bold mb-4 text-white/90">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              {["Home", "All Grievances", "About", "Contact", "FAQ"].map((item) => (
                <li key={item}>
                  <a
                    href={item === "Home" ? "/" : `/${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-base font-bold mb-4 text-white/90">Resources</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              {["Terms of Use", "Privacy Policy", "Help Desk"].map((item) => (
                <li key={item}>
                  <a
                    href={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Technical Credits */}
          <div>
            <h4 className="text-base font-bold mb-4 text-white/90">Technical Credits</h4>
            <p className="text-sm text-white/60 mb-5">
              Project repository references for the development team.
            </p>
            <div className="flex gap-4">
              {[
                { name: "Yamini Pal", url: "https://github.com/YaminiPal" },
                { name: "Yug Shah", url: "https://github.com/yugshah7777" },
                { name: "Sanyam Jain", url: "https://github.com/Sanyamsj30" },
              ].map((repo, idx) => (
                <a
                  key={idx}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
                >
                  <FaGithub size={22} />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max opacity-0 group-hover:opacity-100 bg-white text-[var(--goi-ink)] px-2.5 py-1 rounded-md text-xs font-semibold shadow-lg transition-all pointer-events-none">
                    {repo.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/10 text-center text-sm text-white/40">
          <div className="max-w-7xl mx-auto px-6">
            © {new Date().getFullYear()} Government of India Public Grievance Resolution Portal.
            <span className="mx-2 opacity-50">|</span>
            <span className="inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Secured by ICP Blockchain
            </span>
          </div>
        </div>
      </motion.footer>

      {/* ============ LOGIN MODAL ============ */}
      {loginOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-[100]"
          onClick={() => setLoginOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-white/70"
          >
            {!forgotPassword && (
              <form onSubmit={handleLoginSubmit}>
                <h2 className="text-2xl font-bold text-[var(--goi-ink)] mb-6 text-center">Welcome Back</h2>

                {loginMessage && (
                  <p className="text-red-500 text-sm mb-4 text-center bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{loginMessage}</p>
                )}

                <div className="mb-4">
                  <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="loginEmail"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all"
                  />
                </div>

                <div className="mb-5">
                  <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="loginPassword"
                    type="password"
                    placeholder="Your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all"
                  />
                </div>

                <AppButton type="submit" disabled={isLoading} className="w-full btn-primary py-3 rounded-lg mb-4">
                  {isLoading ? "Signing in..." : "Login"}
                </AppButton>

                <div className="flex items-center justify-center my-5">
                  <div className="h-px bg-gray-200 flex-grow"></div>
                  <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">or</span>
                  <div className="h-px bg-gray-200 flex-grow"></div>
                </div>

                <AppButton
                  onClick={handleGoogleLogin}
                  className="w-full btn-outline py-3 rounded-lg mb-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mr-2">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Login with Google
                </AppButton>

                <p className="text-sm text-center mt-4 text-gray-500">
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-[var(--goi-deep)] hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </p>

                <p className="text-sm text-center mt-4 text-gray-500">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setLoginOpen(false); setSignupOpen(true); }}
                    className="text-[var(--goi-deep)] hover:underline font-medium"
                  >
                    Sign Up
                  </button>
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* ============ FORGOT PASSWORD MODAL ============ */}
      {forgotPassword && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-[100]"
          onClick={() => { setForgotPassword(false); resetForgotState(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-white/70"
          >
            <h2 className="text-2xl font-bold text-[var(--goi-ink)] mb-6 text-center">Forgot Password</h2>

            {forgotMessage && (
              <p className={`text-sm mb-4 text-center px-4 py-2.5 rounded-lg border ${
                forgotStep === "reset" 
                  ? "text-green-700 bg-green-50 border-green-200" 
                  : "text-red-500 bg-red-50 border-red-200"
              }`}>
                {forgotMessage}
              </p>
            )}

            {forgotStep === "request" && (
              <form onSubmit={handleForgotSendOtp}>
                <div className="mb-5">
                  <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="forgotEmail"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all"
                  />
                </div>
                <AppButton
                  type="submit"
                  disabled={forgotLoading || !forgotEmail}
                  className="w-full btn-primary py-3 rounded-lg"
                >
                  {forgotLoading ? "Sending..." : "Send OTP"}
                </AppButton>
              </form>
            )}

            {forgotStep === "otp" && (
              <form onSubmit={handleForgotVerifyOtp}>
                <div className="mb-4">
                  <label htmlFor="resetOtp" className="block text-sm font-medium text-gray-700 mb-1.5">
                    OTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="resetOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-3 text-center text-lg tracking-[0.3em] rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all"
                  />
                </div>
                <div className="mb-5 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleForgotSendOtp}
                    disabled={forgotLoading}
                    className="text-[var(--goi-deep)] hover:underline font-medium disabled:text-gray-400 disabled:no-underline"
                  >
                    Resend OTP
                  </button>
                  <span className="text-gray-400">Expires in 5 min</span>
                </div>
                <AppButton
                  type="submit"
                  disabled={forgotLoading || forgotOtp.length !== 6}
                  className="w-full btn-primary py-3 rounded-lg"
                >
                  {forgotLoading ? "Verifying..." : "Verify OTP"}
                </AppButton>
              </form>
            )}

            {forgotStep === "reset" && (
              <form onSubmit={handleForgotResetPassword}>
                <div className="mb-4">
                  <label htmlFor="forgotNewPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="forgotNewPassword"
                    type="password"
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all"
                  />
                </div>
                <div className="mb-5">
                  <label htmlFor="forgotConfirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="forgotConfirmPassword"
                    type="password"
                    placeholder="Re-enter new password"
                    required
                    minLength={8}
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all"
                  />
                </div>
                <AppButton
                  type="submit"
                  disabled={forgotLoading || forgotNewPassword.length < 8 || forgotConfirmPassword.length < 8 || forgotNewPassword !== forgotConfirmPassword}
                  className="w-full btn-primary py-3 rounded-lg"
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </AppButton>
              </form>
            )}

            <p className="text-sm text-center mt-5 text-gray-500">
              Remember your password?{" "}
              <button
                onClick={() => { setForgotPassword(false); resetForgotState(); setLoginOpen(true); }}
                className="text-[var(--goi-deep)] hover:underline font-medium"
              >
                Log In
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* ============ SIGNUP MODAL ============ */}
      {signupOpen && !signupOtpOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-[100]"
          onClick={() => setSignupOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-white/70"
          >
            <h2 className="text-2xl font-bold text-[var(--goi-ink)] mb-6 text-center">Create Your Account</h2>
            
            {signupMessage && (
              <p className="text-red-500 text-sm mb-4 text-center bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{signupMessage}</p>
            )}

            <form onSubmit={handleSignupSubmit}>
              <div className="mb-4">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g., Jane Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="signupEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="signupEmail"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="signupPassword"
                  type="password"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all"
                />
              </div>

              <div className="mb-5">
                <label htmlFor="signupCPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="signupCPassword"
                  type="password"
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  value={cpassword}
                  onChange={(e) => setCPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all ${
                    cpassword && password !== cpassword ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)]'
                  }`}
                />
                {cpassword && password !== cpassword && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">Passwords do not match</p>
                )}
              </div>

              <AppButton
                type="submit"
                disabled={!password || password !== cpassword || isLoading}
                className={`w-full py-3 rounded-lg transition-all duration-200 ${
                  !password || password !== cpassword
                    ? 'btn-muted cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </AppButton>

              <div className="flex items-center justify-center my-5">
                <div className="h-px bg-gray-200 flex-grow"></div>
                <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">or</span>
                <div className="h-px bg-gray-200 flex-grow"></div>
              </div>

              <AppButton
                onClick={handleGoogleLogin}
                className="w-full btn-outline py-3 rounded-lg mb-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mr-2">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign Up with Google
              </AppButton>

              <p className="text-sm text-center text-gray-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setSignupOpen(false); setLoginOpen(true); }}
                  className="text-[var(--goi-deep)] hover:underline font-medium"
                >
                  Log In
                </button>
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* ============ OTP MODAL ============ */}
      {signupOtpOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-[100]"
          onClick={() => setSignupOtpOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-white/70 text-center"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--goi-deep)]/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--goi-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--goi-ink)] mb-2">Verify Your Email</h2>
            <p className="text-sm text-[var(--goi-muted)] mb-6">
              Enter the 6-digit code sent to <span className="font-semibold text-[var(--goi-ink)]">{email}</span>
            </p>

            {signupMessage && (
              <p className="text-red-500 text-sm mb-4 text-center bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{signupMessage}</p>
            )}

            <form onSubmit={handleVerifyOtpSubmit}>
              <div className="mb-6">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={signupOtp}
                  onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 text-center text-2xl tracking-[0.3em] rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--goi-deep)]/20 focus:border-[var(--goi-deep)] outline-none transition-all font-bold"
                />
              </div>

              <AppButton
                type="submit"
                disabled={signupOtp.length !== 6 || isLoading}
                className={`w-full py-3 rounded-lg transition-all duration-200 ${
                  signupOtp.length !== 6
                    ? 'btn-muted cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </AppButton>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}