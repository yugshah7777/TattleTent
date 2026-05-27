import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const appButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goi-navy-500/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-goi-primary text-white shadow-medium shadow-goi-navy/20 hover:shadow-strong hover:shadow-goi-navy/30 active:shadow-elevation-1",
        secondary:
          "border border-goi-navy/25 bg-white text-goi-navy shadow-elevation-1 hover:bg-goi-slate-50 hover:shadow-elevation-2",
        outline: "border border-goi-navy/30 bg-white/50 text-goi-navy hover:bg-goi-slate-50 hover:border-goi-navy/50",
        ghost: "text-goi-slate-700 hover:bg-goi-slate-100",
        success: "bg-gradient-success text-white shadow-medium hover:shadow-strong",
        error: "bg-gradient-error text-white shadow-medium hover:shadow-strong",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 py-1.5 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6",
        xl: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const AppButton = React.forwardRef(
  ({ className, variant, size, asChild = false, loading = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(appButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <span className="animate-spin h-4 w-4">⟳</span>}
        {props.children}
      </Comp>
    );
  }
);

AppButton.displayName = "AppButton";

export default AppButton;
