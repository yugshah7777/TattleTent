import React from "react";

export function Select({ value, onValueChange, children, className = "", placeholder = "Select an option", error = false, label = "", disabled = false }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-goi-slate-700 mb-2">{label}</label>}
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-lg border px-4 py-2.5 bg-white text-goi-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer disabled:bg-goi-slate-50 disabled:text-goi-slate-500 disabled:cursor-not-allowed appearance-none ${
          error 
            ? 'border-error-300 focus:border-error-500 focus:ring-error-500/20' 
            : 'border-goi-slate-200 focus:border-goi-navy-500 focus:ring-goi-navy-500/20 hover:border-goi-slate-300'
        } ${className}`}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      {error && typeof error === 'string' && (
        <p className="text-error-600 text-xs font-medium mt-1">{error}</p>
      )}
    </div>
  );
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
