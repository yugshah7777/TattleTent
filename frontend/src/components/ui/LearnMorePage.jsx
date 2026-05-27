import React from "react";

const LearnMorePage = () => {
  return (
    <div className="app-shell min-h-screen font-sans">
      <header className="px-6 py-20 text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-teal-800">
          Government of India
        </p>
        <h1 className="mb-4 text-5xl font-extrabold text-slate-950 sm:text-6xl">
          Public Grievance Resolution Portal
        </h1>
        <p className="mx-auto max-w-3xl text-xl text-slate-600 sm:text-2xl">
          A formal citizen service platform for registering civic grievances,
          monitoring departmental action, and improving public accountability.
        </p>
        <div className="mt-8">
          <a href="#how-we-work" className="btn-primary px-6 py-3">
            Learn How It Works
          </a>
        </div>
      </header>

      <section className="bg-white px-6 py-20 text-center">
        <h2 className="mb-6 text-4xl font-bold text-teal-900">Purpose</h2>
        <p className="mx-auto max-w-4xl text-lg leading-relaxed text-slate-700">
          The portal connects citizens with responsible public service teams.
          It helps capture structured grievances, assign them to officers,
          track action status, and record citizen feedback after resolution.
        </p>
      </section>

      <section id="how-we-work" className="px-6 py-20">
        <h2 className="mb-12 text-center text-4xl font-bold text-teal-900">Service Workflow</h2>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {[
            ["Register Grievance", "Citizens submit category, location, description, and supporting image where available."],
            ["Department Assignment", "Administrators assign cases to departmental officers with priority and audit visibility."],
            ["Resolution & Feedback", "Officers update resolution status and citizens submit feedback for service quality review."],
          ].map(([title, description]) => (
            <div key={title} className="premium-card p-8 text-center">
              <h3 className="mb-3 text-2xl font-bold text-teal-900">{title}</h3>
              <p className="text-slate-700">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-center">
        <h2 className="mb-12 text-4xl font-bold text-teal-900">Service Categories</h2>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Sanitation Services", "Solid waste collection and civic cleanliness issues."],
            ["Electrical Maintenance", "Street lighting, public wiring, and outage concerns."],
            ["Water Supply", "Leaks, disruptions, contamination, and public supply issues."],
            ["Road Infrastructure", "Road, pathway, and public access infrastructure repairs."],
          ].map(([title, description]) => (
            <div key={title} className="premium-card p-6">
              <h3 className="mb-2 text-xl font-bold text-teal-900">{title}</h3>
              <p className="text-sm text-slate-700">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold text-slate-950">Citizen-Centric Administration</h2>
        <p className="mx-auto mb-6 max-w-2xl text-slate-700">
          Use the portal to submit public service issues and monitor official resolution progress.
        </p>
        <a href="/" className="btn-primary px-6 py-3">Back To Home</a>
      </section>
    </div>
  );
};

export default LearnMorePage;
