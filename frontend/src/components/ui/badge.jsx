import React from "react";

export function Badge({ children, variant = "default", className = "", size = "md" }) {
  const variants = {
    default: "bg-goi-slate-100 text-goi-slate-700 border border-goi-slate-200",
    primary: "bg-goi-navy-100 text-goi-navy-900 border border-goi-navy-200",
    success: "bg-success-100 text-success-700 border border-success-200",
    warning: "bg-warning-100 text-warning-700 border border-warning-200",
    error: "bg-error-100 text-error-700 border border-error-200",
    info: "bg-goi-blue-100 text-goi-blue-900 border border-goi-blue-200",
    outline: "bg-transparent text-goi-slate-600 border border-goi-slate-300",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
