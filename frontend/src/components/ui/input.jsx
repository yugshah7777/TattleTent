import React from "react";

export function Input({ value, onChange, placeholder, type = "text", className = "", error = false, label = "", disabled = false, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-goi-slate-700 mb-2">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-lg border px-4 py-2.5 bg-white text-goi-slate-900 transition-all duration-200 placeholder:text-goi-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-goi-slate-50 disabled:text-goi-slate-500 disabled:cursor-not-allowed ${
          error 
            ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' 
            : 'border-goi-slate-200 focus:border-goi-navy-500 focus:ring-goi-navy-500/20 hover:border-goi-slate-300'
        } ${className}`}
        {...props}
      />
      {error && typeof error === 'string' && (
        <p className="text-error-600 text-xs font-medium mt-1">{error}</p>
      )}
    </div>
  );
}

export function TextArea({ value, onChange, placeholder, className = "", error = false, label = "", rows = 4, disabled = false, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-goi-slate-700 mb-2">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-lg border px-4 py-2.5 bg-white text-goi-slate-900 transition-all duration-200 placeholder:text-goi-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 resize-none disabled:bg-goi-slate-50 disabled:text-goi-slate-500 disabled:cursor-not-allowed ${
          error 
            ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' 
            : 'border-goi-slate-200 focus:border-goi-navy-500 focus:ring-goi-navy-500/20 hover:border-goi-slate-300'
        } ${className}`}
        {...props}
      />
      {error && typeof error === 'string' && (
        <p className="text-error-600 text-xs font-medium mt-1">{error}</p>
      )}
    </div>
  );
}
