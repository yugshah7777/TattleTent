// src/components/ui/Logo.jsx
import React from 'react';

const Logo = () => {
    return (
        <a href="/" aria-label="Government of India - Public Grievance Resolution Portal" className="flex items-center gap-3 max-w-full hover:opacity-90 transition-opacity duration-200">
            {/* Government of India Emblem */}
            <div 
                className="flex items-center justify-center rounded-md border border-goi-navy/30 bg-white shadow-elevation-1
                           w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 flex-shrink-0"
            >
                <span className="font-extrabold leading-none text-goi-navy text-sm sm:text-base md:text-lg">
                    IND
                </span>
            </div>

            {/* Text Content */}
            <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-extrabold uppercase tracking-widest text-goi-navy-900 sm:text-base md:text-lg">
                    Government of India
                </span>
                <span className="truncate text-xs font-semibold text-goi-navy-600 sm:text-sm">
                    Public Grievance Resolution Portal
                </span>
            </span>
        </a>
    );
};

export default Logo;
