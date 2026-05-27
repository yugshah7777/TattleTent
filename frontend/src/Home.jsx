"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppButton from "./components/ui/app-button";
import Logo from "./components/ui/Logo";
import { useLocation, useNavigate } from "react-router-dom";
import {FaBars,FaGithub, FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";
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

  //const [loginWarning, setLoginWarning] = useState(""); // for login modal
//const [signupWarning, setSignupWarning] = useState(""); // for signup modal

  

  // Add these state variables
const [signupMessage, setSignupMessage] = useState(""); // for signup modal messages
const [loginMessage, setLoginMessage] = useState(""); // for login modal messages


const navigate = useNavigate();
const location = useLocation();
const [user, setUser] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  useBodyScrollLock(loginOpen || forgotPassword || signupOpen || signupOtpOpen);

useEffect(() => {
  // Restore session
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
    setSignupMessage(""); // clear previous message
    const res = await fetch(apiUrl("/api/auth/send-otp"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.status === 409) {
      // Email already exists
      setSignupMessage("An account with this email already exists. Please log in.");
      // Optionally switch to login modal
      setSignupOpen(false);
      setLoginOpen(true);
      setLoginMessage("An account with this email already exists. Please log in.");
      return;
    }

    if (!res.ok) throw new Error(data.message);

    // Switch to OTP modal.
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
    setLoginMessage(""); // clear previous message

    const loginRes = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginRes.json();

    // Handle errors before successful login
    if (!loginRes.ok) {
      if (loginRes.status === 403 && loginData.must_change_password) {
        setLoginOpen(false);
        setForgotPassword(false);
        navigate("/staff-password-change", {
          state: {
            email: loginData.email || email,
            currentPassword: password,
          },
        });
        return;
      }

      // If backend says invalid credentials → check if email exists
      if (loginRes.status === 401 && loginData.message.includes("Invalid credentials")) {
        try {
          // Check if the email exists in DB
          const emailCheck = await fetch(apiUrl(`/api/auth/check-email?email=${encodeURIComponent(email)}`));
          const emailExists = await emailCheck.json();

          if (!emailCheck.ok || !emailExists.exists) {
            // Email not registered → redirect to signup
            setLoginOpen(false);
            setSignupOpen(true);
            setSignupMessage("No account found with this email. Please sign up.");
          } else {
            // Email exists → wrong password
            setLoginMessage("Incorrect password. Please try again.");
          }
        } catch (emailErr) {
          setLoginMessage("Unable to verify email. Please try again later.");
          console.error(emailErr);
        }
      } else {
        // Any other message (403, etc.)
        setLoginMessage(loginData.message);
      }
      return;
    }

    // Successful login.
    sessionStorage.setItem("token", loginData.token);
    sessionStorage.setItem("user", JSON.stringify(loginData.user));
    // 💡 ADD THIS LINE: Update the state so the Navbar changes immediately
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
  // Redirect user to backend Google OAuth endpoint
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
          const diffHours = (updated - submitted) / (1000 * 60 * 60); // convert ms → hours
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
      // setReviews(res.data.message);
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
    <div className="app-shell text-gray-900">
      {/* Navbar */}
     <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="premium-nav sticky top-0 z-50 flex flex-col items-center justify-between px-4 py-3 sm:flex-row sm:px-6 lg:px-8"
    >
      
      <div className="w-full flex items-center justify-between">
        <Logo />

        
        <button
          className="sm:hidden p-2.5 rounded-md bg-gray-100 hover:bg-gray-200"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <FaBars size={22} className="text-gray-800" />
        </button>
      </div>

      
      <div
        className={`
          ${menuOpen ? "flex" : "hidden"}
          sm:flex flex-col sm:flex-row gap-3 sm:gap-5 mt-4 sm:mt-0 items-center
        `}
      >
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
              className="btn-secondary px-5 py-2.5 w-full sm:w-auto"
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
              className="btn-primary px-6 py-2.5 min-w-[110px] w-full sm:w-auto"
            >
              Sign Up
            </AppButton>

          </>
        )}
      </div>
    </motion.nav>
    
    


      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-6xl"
          >
            Public Grievance Redressal
            <span className="block text-teal-800">for Accountable Civic Services</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="mx-auto mb-10 max-w-3xl text-lg text-slate-600 md:text-xl"
          >
            A Government of India public service platform for registering civic grievances,
            tracking departmental action, and improving resolution transparency.
          </motion.p>

          {/* Blockchain Trust Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mx-auto mb-10 max-w-2xl flex flex-wrap items-center justify-center gap-3 text-sm"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 font-semibold text-emerald-800">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Blockchain-Verified Governance
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/60 px-3 py-1.5 font-semibold text-slate-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Immutable Complaint Audit Trail
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/60 px-3 py-1.5 font-semibold text-slate-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Tamper-Resistant Records
            </span>
          </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="flex justify-center gap-5"
        >

          <AppButton
            className="btn-primary px-6 py-3"
            onClick={() => navigate("/learn-more")}
          >
            View Citizen Services
          </AppButton>

           {/*<AppButton
            className="border border-[#8B4513] !bg-[#8B4513] hover:!bg-[#A0522D] hover:text-white font-medium py-3 rounded-full transition-all duration-300"
            onClick={() => navigate("/admin-dashboard")}
          >
            Admin
          </AppButton>

         <AppButton
            className="border border-[#8B4513] !bg-[#8B4513] hover:!bg-[#A0522D] hover:text-white font-medium py-3 rounded-full transition-all duration-300"
            onClick={() => navigate("/invite-staff")}
          >
            INvite
          </AppButton>*/}
        </motion.div>
        
      </section>

      {/* Portals, Features, Categories, Footer */}
      {/* ... keep unchanged ... */}

      <hr className="border-gray-200" /> 

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Grievance Insights
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {[
            {
              title: "Total Grievances",
              count:
                (parseInt(counts.resolved, 10) || 0) +
                (parseInt(counts.in_progress, 10) || 0) +
                (parseInt(counts.pending, 10) || 0),
            },
            {
              title: "Average Resolution",
              count: `${avgResolutionTime} Hrs`,
            }
          ].map((item) => (
            <div
              key={item.title}
              className="premium-card flex flex-col items-center px-8 py-12 text-teal-900"
            >
              <div className="text-4xl font-extrabold">{item.count}</div>
              <div className="mt-3 font-semibold text-lg text-center">{item.title}</div>
            </div>
          ))}
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { title: "Resolved", count: counts.resolved },
            { title: "In Progress", count: counts.in_progress },
            { title: "Pending Review", count: counts.pending },
          ].map((s) => (
            <div
              key={s.title}
              className="premium-card flex flex-col items-center px-8 py-12 text-slate-900"
            >
              <div className="text-4xl font-extrabold">{s.count}</div>
              <div className="mt-3 font-semibold text-lg text-center">{s.title}</div>
            </div>
          ))}
        </div>
      </div>




       {/* Portals Section */}
      <section className="py-20 bg-white relative z-10">
        <div className="text-center mb-14">
          <h3 className="text-3xl font-bold mb-4">Service Access Channels</h3>
          <p className="text-slate-600 text-base">Role-based access for citizens, departments, and field teams.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-6">
          {portals.map(([title, desc, path], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="premium-card p-8"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md border border-teal-100 bg-teal-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-[#222] mb-2">{title}</h4>
              <p className="text-[#555] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20">
        <div className="text-center mb-14">
          <h3 className="text-3xl font-bold mb-4">Key Capabilities</h3>
          <p className="text-slate-600 text-base">Structured grievance reporting, tracking, and departmental accountability.</p>
        </div>
        <div className="flex flex-col md:flex-row justify-center gap-10 max-w-5xl mx-auto px-6">
          {features.map(([title, desc], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.7 }}
              viewport={{ once: true }}
              className="premium-card p-8 flex-1"
            >
              <h4 className="text-xl font-semibold text-[#222] mb-3">{title}</h4>
              <p className="text-[#555]">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Grievance Categories */}
      <section className="py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-3">Common Grievance Categories</h3>
          <p className="text-slate-600 text-base">Structured categories help departments route cases accurately.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto px-6">
          {categories.map(([title, desc, path], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
              className="premium-card p-8"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md border border-teal-100 bg-teal-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-[#222] mb-2">{title}</h4>
              <p className="text-[#555] font-medium leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* User Reviews Section */}
<section className="py-20 bg-white relative z-10">
  <div className="text-center mb-12">
    <h3 className="text-3xl font-bold mb-4">Citizen Feedback</h3>
    <p className="text-slate-600 text-base">Feedback submitted after departmental resolution.</p>
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
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <div className="flex items-center mb-3">
          {[...Array(review.rating || 0)].map((_, i) => (
            <span key={i} className="text-yellow-400 text-xl">★</span>
          ))}
          {[...Array(5 - (review.rating || 0))].map((_, i) => (
            <span key={i} className="text-gray-300 text-xl">★</span>
          ))}
        </div>
        <p className="text-gray-700 mb-3 leading-relaxed">"{review.comment || ''}"</p>
        <p className="text-sm font-semibold text-gray-900">- {review.name || 'Anonymous'}</p>
      </motion.div>
    ))
  ) : (
    <p className="px-2 text-gray-500">No feedbacks available yet.</p>
  )}
</motion.div>

</section>


      {/* Footer */}
      <motion.footer
  initial={{ opacity: 0, y: 60 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  viewport={{ once: true }}
  className="bg-slate-950 text-white mt-10 pt-12 border-t border-slate-800"
>
  <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
    {/* About Us */}
    <div>
      <h4 className="text-xl font-semibold mb-4 text-white">About the Portal</h4>
      <p className="text-sm text-slate-300">
        The Public Grievance Resolution Portal supports citizens in registering civic service issues and tracking official action by departments.
      </p>
      <div className="flex gap-3 mt-4">
        {[FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram].map((Icon, idx) => (
          <a
            key={idx}
            href="#"
            className="w-8 h-8 flex items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 transition"
          >
            <Icon size={20} />
          </a>
        ))}
      </div>
    </div>

    {/* Quick Links */}
    <div>
      <h4 className="text-xl font-semibold mb-4 text-white">Quick Links</h4>
      <ul className="space-y-2 text-sm text-slate-300">
        <li><a href="/" className="hover:text-white transition">Home</a></li>
        <li><a href="/all-complaints" className="hover:text-white transition">All Grievances</a></li>
        <li><a href="/about" className="hover:text-white transition">About</a></li>
        <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
        <li><a href="/faq" className="hover:text-white transition">FAQ</a></li>
      </ul>
    </div>

    {/* Support / Resources */}
    <div>
      <h4 className="text-xl font-semibold mb-4 text-white">Resources</h4>
      <ul className="space-y-2 text-sm text-slate-300">
        <li><a href="/terms" className="hover:text-white transition">Terms of Use</a></li>
        <li><a href="/privacy" className="hover:text-white transition">Privacy Policy</a></li>
        <li><a href="/help" className="hover:text-white transition">Help Desk</a></li>
      </ul>
    </div>

    {/* GitHub / CTA */}
{/* GitHub Section with Floating Circles */}
<div>
  <h4 className="text-xl font-semibold mb-4 text-white">Technical Credits</h4>
  <p className="text-sm text-slate-300 mb-6">
    Project repository references for the development team.
  </p>

  <div className="flex justify-start gap-6 relative">
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
        className={`group w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-white shadow-lg hover:bg-white/20 transition relative`}
        style={{ zIndex: 10 - idx }}
      >
        <FaGithub size={28} />
        <span className="absolute -bottom-8 w-max opacity-0 group-hover:opacity-100 bg-white text-slate-900 px-2 py-1 rounded-md text-xs font-medium shadow-lg transition">
          {repo.name}
        </span>
      </a>
    ))}
  </div>
</div>
</div>

  {/* Bottom Bar */}
  <div className="mt-12 py-6 border-t border-slate-800 text-center text-sm text-slate-400">
    © {new Date().getFullYear()} Government of India Public Grievance Resolution Portal.
    <span className="mx-2 opacity-50">|</span>
    <span className="inline-flex items-center gap-1">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      Secured by ICP Blockchain
    </span>
  </div>
</motion.footer>



      {/* Login Modal */}
      {/* Login Modal */}
{loginOpen && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 flex items-center justify-center bg-black/40 z-[100]"
    onClick={() => setLoginOpen(false)}
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 120 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4"
    >
      {!forgotPassword && (
        // --- Login Form ---
        <form onSubmit={handleLoginSubmit}
        >
          <h2 className="text-2xl font-bold text-[#d55d1f] mb-6 text-center">Login</h2>

          {loginMessage && (
  <p className="text-red-500 text-sm mb-4 text-center">{loginMessage}</p>
)}
          
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="loginEmail"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#d55d1f] outline-none"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="loginPassword"
              type="password"
              placeholder="Your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#d55d1f] outline-none"
            />
          </div>

          <AppButton type="submit" className="w-full bg-[#d55d1f] hover:bg-[#b54a16] text-white py-3 rounded-lg mb-4">
            Login
          </AppButton>

          {/* OR Divider */}
          <div className="flex items-center justify-center my-4">
            <div className="h-px bg-gray-300 flex-grow"></div>
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="h-px bg-gray-300 flex-grow"></div>
          </div>

          {/* Google Login */}
          <AppButton
            onClick={handleGoogleLogin}
            className="w-full bg-[#d55d1f] hover:bg-[#b54a16] text-white py-3 rounded-lg mb-4"
          >
            Login with Google
          </AppButton>


          <p className="text-sm text-center mt-4">
            <button
              type="button"
              onClick={openForgotPassword}
              className="text-[#d55d1f] hover:underline"
            >
              Forgot Password?
            </button>
          </p>
        </form>
      
        
      )}
    </motion.div>
  </motion.div>
)}

{/* Forgot Password Modal */}
{forgotPassword && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 flex items-center justify-center bg-black/40 z-[100]"
    onClick={() => {
      setForgotPassword(false);
      resetForgotState();
    }}
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 120 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4"
    >
      <h2 className="text-2xl font-bold text-[#A0522D] mb-6 text-center">
        Forgot Password
      </h2>

      {forgotMessage && (
        <p className={`text-sm mb-4 text-center ${forgotStep === "reset" ? "text-green-700" : "text-red-500"}`}>
          {forgotMessage}
        </p>
      )}

      {forgotStep === "request" && (
        <form onSubmit={handleForgotSendOtp}>
          <div className="mb-6">
            <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="forgotEmail"
              type="email"
              placeholder="you@example.com"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A0522D] outline-none"
            />
          </div>

          <AppButton
            type="submit"
            disabled={forgotLoading || !forgotEmail}
            className="w-full py-3 rounded-lg text-white bg-[#A0522D] hover:bg-[#8B4513] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {forgotLoading ? "Sending..." : "Send OTP"}
          </AppButton>
        </form>
      )}

      {forgotStep === "otp" && (
        <form onSubmit={handleForgotVerifyOtp}>
          <div className="mb-4">
            <label htmlFor="resetOtp" className="block text-sm font-medium text-gray-700 mb-1">
              OTP <span className="text-red-500">*</span>
            </label>
            <input
              id="resetOtp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter OTP"
              value={forgotOtp}
              onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-center text-lg tracking-widest focus:ring-2 focus:ring-[#A0522D] outline-none"
            />
          </div>

          <div className="mb-6 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleForgotSendOtp}
              disabled={forgotLoading}
              className="text-[#A0522D] hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              Resend OTP
            </button>
            <span className="text-gray-500">OTP expires in 5 minutes.</span>
          </div>

          <AppButton
            type="submit"
            disabled={forgotLoading || forgotOtp.length !== 6}
            className="w-full py-3 rounded-lg text-white bg-[#A0522D] hover:bg-[#8B4513] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {forgotLoading ? "Verifying..." : "Verify OTP"}
          </AppButton>
        </form>
      )}

      {forgotStep === "reset" && (
        <form onSubmit={handleForgotResetPassword}>
          <div className="mb-4">
            <label htmlFor="forgotNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A0522D] outline-none"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="forgotConfirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A0522D] outline-none"
            />
          </div>

          <AppButton
            type="submit"
            disabled={
              forgotLoading ||
              forgotNewPassword.length < 8 ||
              forgotConfirmPassword.length < 8 ||
              forgotNewPassword !== forgotConfirmPassword
            }
            className="w-full py-3 rounded-lg text-white bg-[#A0522D] hover:bg-[#8B4513] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {forgotLoading ? "Resetting..." : "Reset Password"}
          </AppButton>
        </form>
      )}

      <p className="text-sm text-center mt-4 text-gray-600">
        Remember your password?{" "}
        <button
          onClick={() => {
            setForgotPassword(false);
            resetForgotState();
            setLoginOpen(true);
          }}
          className="text-[#A0522D] hover:underline font-medium"
        >
          Log In
        </button>
      </p>
    </motion.div>
  </motion.div>
)}



      {/* Signup Modal */}
      {signupOpen && !signupOtpOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-[100]"
          onClick={() => setSignupOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-[#A0522D] mb-6 text-center">Create Your Account</h2>
            {signupMessage && (
  <p className="text-red-500 text-sm mb-4 text-center">{signupMessage}</p>
)}
            <form onSubmit={handleSignupSubmit}>
              <div className="mb-4">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g., Jane Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A0522D] outline-none"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A0522D] outline-none"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A0522D] outline-none"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Password Must be Same"
                  required
                  minLength={8}
                  value={cpassword}
                  onChange={(e) => setCPassword(e.target.value)}
                  className={`w-full border rounded-lg px-4 py-2 outline-none 
                    ${cpassword && password !== cpassword ? 'border-red-500' : 'border-gray-300'}
                    focus:ring-2 focus:ring-[#A0522D]`}
                />

                {cpassword && password !== cpassword && (
                  <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                )}
              </div>


              <AppButton
                type="submit"
                disabled={!password || password !== cpassword} // 🔒 Disable until both passwords match
                className={`w-full py-3 rounded-lg text-white transition-colors duration-200
                  ${!password || password !== cpassword
                    ? 'bg-gray-400 cursor-not-allowed'  // disabled look
                    : 'bg-[#A0522D] hover:bg-[#8B4513]' // active look
                  }`}
              >
                Sign Up
              </AppButton>
            </form>

            <div className="flex items-center justify-center my-4">
            <div className="h-px bg-gray-300 flex-grow"></div>
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="h-px bg-gray-300 flex-grow"></div>
          </div>

            <AppButton
              onClick={handleGoogleLogin}
              className="w-full bg-[#d55d1f] hover:bg-[#b54a16] text-white py-3 rounded-lg mb-4"
            >
              Sign Up with Google
            </AppButton>

            <p className="text-sm text-center mt-4 text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => {
                  setSignupOpen(false);
                  setLoginOpen(true);
                }}
                className="text-[#A0522D] hover:underline font-medium"
              >
                Log In
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* OTP MODAL */}
      {signupOtpOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-[100]"
          onClick={() => setSignupOtpOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-[#A0522D] mb-6 text-center">
              Verify Your Email
            </h2>
            <p className="text-gray-600 text-sm text-center mb-4">
              Enter the 6-digit code sent to <span className="font-semibold">{email}</span>
            </p>
            <form onSubmit={handleVerifyOtpSubmit}>
              <div className="mb-6">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter OTP"
                  value={signupOtp}
                  onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-lg tracking-widest focus:ring-2 focus:ring-[#A0522D] outline-none"
                />
              </div>

              <AppButton
                type="submit"
                disabled={signupOtp.length !== 6 || isLoading}
                className={`w-full py-3 rounded-lg text-white transition-colors duration-200 ${
                  signupOtp.length !== 6
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#A0522D] hover:bg-[#8B4513]"
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
