import React from "react";

export function Card({ children, className = "", variant = "default", interactive = false }) {
  const variants = {
    default: "border border-goi-slate-200/80 shadow-elevation-2 hover:shadow-elevation-3 bg-white hover:bg-goi-slate-50/30",
    elevated: "border border-goi-slate-200/60 shadow-elevation-3 hover:shadow-elevation-4 bg-white hover:bg-goi-slate-50/30",
    glass: "glass-effect border border-white/20",
    success: "border border-success-200/60 shadow-elevation-2 bg-gradient-to-br from-success-50 to-white hover:shadow-elevation-3",
    warning: "border border-warning-200/60 shadow-elevation-2 bg-gradient-to-br from-warning-50 to-white hover:shadow-elevation-3",
    error: "border border-error-200/60 shadow-elevation-2 bg-gradient-to-br from-error-50 to-white hover:shadow-elevation-3",
  };

  const interactiveClasses = interactive ? "cursor-pointer hover:translate-y-[-2px] active:translate-y-[0px]" : "";

  return (
    <div className={`premium-card rounded-lg transition-all duration-200 ${variants[variant]} ${interactiveClasses} ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", bordered = true }) {
  return (
    <div className={`px-6 py-4 ${bordered ? 'border-b border-goi-slate-200/80' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", size = "md" }) {
  const sizes = {
    sm: "text-sm font-semibold text-goi-slate-900",
    md: "text-lg font-semibold text-goi-slate-900",
    lg: "text-xl font-semibold text-goi-slate-900",
  };
  return (
    <h3 className={`${sizes[size]} ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }) {
  return (
    <p className={`text-sm text-goi-slate-600 mt-1 ${className}`}>
      {children}
    </p>
  );
}
