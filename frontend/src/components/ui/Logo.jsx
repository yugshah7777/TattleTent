import React from 'react';

const Logo = () => {
    return (
        <a 
            href="/" 
            aria-label="Government of India - Public Grievance Resolution Portal" 
            className="flex items-center gap-3 max-w-full hover:opacity-85 transition-all duration-200 group"
        >
            {/* Government of India Emblem */}
            <div className="flex items-center justify-center rounded-lg border border-[var(--goi-deep)]/25 bg-white shadow-sm w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 flex-shrink-0 group-hover:border-[var(--goi-deep)]/40 group-hover:shadow-md transition-all duration-200">
                <svg viewBox="0 0 48 48" className="w-6 h-6 sm:w-7 sm:h-7" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-[var(--goi-deep)]" />
                    <circle cx="24" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-[var(--goi-deep)]" />
                    <path d="M14 36L24 28L34 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--goi-deep)]" />
                    <path d="M10 44L24 36L38 44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--goi-deep)]" />
                    <path d="M24 28V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--goi-deep)]" />
                </svg>
            </div>

            {/* Text Content */}
            <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-black uppercase tracking-[0.15em] text-[var(--goi-deep)] sm:text-base md:text-lg">
                    Government of India
                </span>
                <span className="truncate text-[0.7rem] font-semibold text-[var(--goi-muted)] sm:text-xs md:text-sm">
                    Public Grievance Resolution Portal
                </span>
            </span>
        </a>
    );
};

export default Logo;
