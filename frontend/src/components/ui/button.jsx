import React from "react";

export function Button({ children, onClick, size = "md", variant = "primary", className = "", disabled = false, loading = false, ...props }) {
  const base =
    "rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2";
  
  const sizes = {
    sm: "text-sm px-3 py-1.5 h-8",
    md: "text-sm px-4 py-2 h-9",
    lg: "text-base px-6 py-3 h-10",
    xl: "text-lg px-8 py-4 h-12",
  };
  
  const variants = {
    primary: "bg-gradient-goi-primary text-white shadow-medium hover:shadow-strong focus:ring-goi-navy-500 hover:shadow-lg",
    secondary: "bg-white text-goi-navy border border-goi-navy/20 shadow-elevation-2 hover:bg-goi-slate-50 hover:shadow-elevation-3 focus:ring-goi-navy-400",
    accent: "bg-gradient-accent text-white shadow-medium hover:shadow-strong focus:ring-blue-500",
    success: "bg-gradient-success text-white shadow-medium hover:shadow-strong focus:ring-success-500",
    warning: "bg-gradient-warning text-white shadow-medium hover:shadow-strong focus:ring-warning-500",
    danger: "bg-gradient-error text-white shadow-medium hover:shadow-strong focus:ring-error-500",
    ghost: "bg-transparent text-goi-navy hover:bg-goi-navy/5 focus:ring-goi-navy-400",
    outline: "bg-transparent border border-goi-navy/30 text-goi-navy hover:bg-goi-navy/5 focus:ring-goi-navy-400",
    muted: "bg-goi-slate-100 text-goi-slate-700 hover:bg-goi-slate-200 focus:ring-goi-slate-400",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <span className="animate-spin h-4 w-4">⟳</span>}
      {children}
    </button>
  );
}
