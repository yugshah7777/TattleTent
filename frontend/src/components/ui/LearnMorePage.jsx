import React from "react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";

const LearnMorePage = () => {
  const navigate = useNavigate();

  return (
    <div className="app-shell min-h-screen font-sans">
      {/* Navbar */}
      <nav className="premium-nav fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 sm:px-8 lg:px-12 h-20 sm:h-24">
        <Logo />
        <div className="flex items-center gap-3">
          <button className="btn-secondary px-5 py-2.5" onClick={() => navigate("/")}>Back to Home</button>
        </div>
      </nav>

      {/* Hero */}
      <header className="px-6 pt-32 pb-16 text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-emerald-800">
          Government of India &middot; Civic Grievance Platform
        </p>
        <h1 className="mb-6 text-5xl font-extrabold text-slate-950 sm:text-6xl lg:text-7xl leading-tight tracking-tight">
          Public Grievance<br />
          <span className="text-emerald-800">Resolution Portal</span>
        </h1>
        <p className="mx-auto max-w-3xl text-xl text-slate-600 sm:text-2xl">
          A formal citizen service platform for registering civic grievances,
          monitoring departmental action, and ensuring verifiable public accountability.
        </p>
      </header>

      {/* Blockchain Trust Section */}
      <section className="bg-white px-6 py-20 border-y border-slate-200">
        <div className="mx-auto max-w-6xl">
          <p className="section-kicker text-center mb-3">Verifiable Transparency</p>
          <h2 className="text-4xl font-bold text-slate-950 text-center mb-16">
            How Transparency Works
          </h2>

          {/* Workflow Diagram */}
          <div className="workflow-flow mb-16">
            {[
              { step: "Grievance Event", desc: "Status change, assignment, resolution" },
              { step: "Backend Validation", desc: "Cryptographic signature & integrity check" },
              { step: "ICP Immutable Ledger", desc: "Event recorded on Internet Computer Protocol" },
              { step: "Public Verification", desc: "Anyone can verify the audit trail" },
            ].map((item, idx) => (
              <React.Fragment key={item.step}>
                <div className="workflow-step">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-200">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f4c45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {idx === 0 && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>}
                      {idx === 1 && <><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>}
                      {idx === 2 && <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>}
                      {idx === 3 && <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-900 text-center">{item.step}</p>
                  <p className="text-xs text-slate-500 text-center">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="workflow-arrow">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Trust pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Blockchain Verification", desc: "Each grievance event is cryptographically verified and recorded on the Internet Computer Protocol (ICP) blockchain, ensuring data integrity." },
              { title: "Immutable Timeline", desc: "Once recorded, no event in the grievance lifecycle can be altered, deleted, or backdated. The complete history is permanently preserved." },
              { title: "Audit Integrity", desc: "Every status change, assignment, and resolution is timestamped with verifiable blockchain metadata for independent audit." },
              { title: "Tamper-Resistant Records", desc: "The ICP ledger provides tamper-resistant storage. Any unauthorized modification attempt is immediately detectable." },
            ].map((item) => (
              <div key={item.title} className="premium-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f4c45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Verification status */}
          <div className="mt-12 trust-banner flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <div>
                <p className="text-sm font-bold text-slate-900">All grievance records are blockchain-verified</p>
                <p className="text-xs text-slate-500">Powered by ICP verifiable infrastructure</p>
              </div>
            </div>
            <span className="blockchain-shield whitespace-nowrap">✓ Immutable Audit Trail Active</span>
          </div>
        </div>
      </section>

      {/* Purpose */}
      <section className="px-6 py-20 text-center">
        <h2 className="mb-6 text-4xl font-bold text-slate-950">Purpose</h2>
        <p className="mx-auto max-w-4xl text-lg leading-relaxed text-slate-600">
          The portal connects citizens with responsible public service teams.
          It helps capture structured grievances, assign them to officers,
          track action status, and record citizen feedback after resolution — all
          protected by an immutable, verifiable audit trail.
        </p>
      </section>

      {/* Service Workflow */}
      <section id="how-we-work" className="bg-white px-6 py-20 border-y border-slate-200">
        <h2 className="mb-12 text-center text-4xl font-bold text-slate-950">Service Workflow</h2>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {[
            ["Register Grievance", "Citizens submit category, location, description, and supporting image where available. The submission is immutably recorded."],
            ["Department Assignment", "Administrators assign cases to departmental officers with priority and audit visibility. Each assignment is blockchain-verified."],
            ["Resolution & Feedback", "Officers update resolution status and citizens submit feedback for service quality review. All actions are transparently logged."],
          ].map(([title, description]) => (
            <div key={title} className="premium-card p-8 text-center">
              <h3 className="mb-3 text-2xl font-bold text-slate-900">{title}</h3>
              <p className="text-slate-600 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Service Categories */}
      <section className="px-6 py-20">
        <h2 className="mb-12 text-center text-4xl font-bold text-slate-950">Service Categories</h2>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Sanitation Services", "Solid waste collection and civic cleanliness issues."],
            ["Electrical Maintenance", "Street lighting, public wiring, and outage concerns."],
            ["Water Supply", "Leaks, disruptions, contamination, and public supply issues."],
            ["Road Infrastructure", "Road, pathway, and public access infrastructure repairs."],
          ].map(([title, description]) => (
            <div key={title} className="premium-card p-6">
              <h3 className="mb-2 text-xl font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ICP Tech Note Footer */}
      <section className="px-6 py-12 bg-slate-900 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xs font-semibold text-emerald-400 tracking-wide">SECURED BY INTERNET COMPUTER PROTOCOL</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            This platform uses ICP blockchain technology to provide immutable audit logging, 
            tamper-resistant governance records, and verifiable transparency for all grievance lifecycle events.
            Every action — from submission to resolution — is cryptographically secured and publicly verifiable.
          </p>
        </div>
        <button className="btn-primary mt-8 px-6 py-3" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </section>
    </div>
  );
};

export default LearnMorePage;