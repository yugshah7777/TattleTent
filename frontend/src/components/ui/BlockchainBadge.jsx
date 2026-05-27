import { motion } from "framer-motion";

const BlockchainBadge = ({ verified = false, size = "md", showLabel = true, className = "" }) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-2xs gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2",
  };

  const iconSize = { sm: 10, md: 14, lg: 18 };

  if (verified) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 font-semibold text-emerald-800 ${sizeClasses[size]} ${className}`}
      >
        <svg width={iconSize[size]} height={iconSize[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        {showLabel && "VERIFIED ON ICP"}
      </motion.span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full border border-amber-200 bg-amber-50 font-semibold text-amber-700 ${sizeClasses[size]} ${className}`}>
      <svg width={iconSize[size]} height={iconSize[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
      {showLabel && "NOT VERIFIED"}
    </span>
  );
};

export const AuditShield = ({ className = "" }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 ${className}`}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
    Immutable Audit Trail
  </span>
);

export const TrustIndicator = ({ label = "Blockchain-Verified", description = "All records are immutably stored on ICP" }) => (
  <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/80 p-3">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-bold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  </div>
);

export const TransparencyScore = ({ score = 100, label = "System Health" }) => {
  const color = score >= 90 ? "text-emerald-600" : score >= 70 ? "text-amber-600" : "text-red-600";
  const bgColor = score >= 90 ? "bg-emerald-100" : score >= 70 ? "bg-amber-100" : "bg-red-100";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 p-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bgColor}`}>
        <span className={`text-sm font-extrabold ${color}`}>{score}%</span>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">
          {score >= 90 ? "All systems operational" : score >= 70 ? "Minor degradation" : "Issues detected"}
        </p>
      </div>
    </div>
  );
};

export const AuditTimeline = ({ events = [], loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200 skeleton" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-slate-200 skeleton" />
              <div className="h-3 w-1/2 rounded bg-slate-100 skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <p className="text-sm text-slate-400">No audit events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 before:absolute before:left-3 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-gradient-to-b before:from-emerald-300 before:to-slate-200">
      {events.map((entry, idx) => (
        <motion.div
          key={entry.eventId || idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="relative mb-4 last:mb-0"
        >
          <div className="absolute -left-5 mt-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-emerald-400 bg-white">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">{entry.action}</p>
              {entry.verified && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              by <span className="font-medium text-slate-700">{entry.actor}</span>
              {entry.timestamp && (
                <> &middot; {new Date(entry.timestamp).toLocaleString()}</>
              )}
            </p>
            {entry.details && (
              <p className="mt-1 text-xs text-slate-400">{entry.details}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default BlockchainBadge;