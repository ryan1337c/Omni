import React from "react";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
}

export const PrimaryButton = ({ 
  className, 
  children, 
  variant = "primary", 
  ...props 
}: PrimaryButtonProps) => {
  
  const baseStyles = "relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ease-in-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    // Primary: Uses your theme color with a slight "lift" and glow on hover
    primary: "bg-[var(--login-bg)] dark:bg-btnDark text-white shadow-sm hover:brightness-110 hover:shadow-lg hover:shadow-violet-500/20",
    
    // Outline: Clean border that darkens slightly on hover
    outline: "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800/50",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};