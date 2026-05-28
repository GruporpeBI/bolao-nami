"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "gold" | "outline" | "ghost" | "green";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  gold:    "bg-[#F6C900] text-[#1A1A1A] font-bold hover:bg-[#D4A800] active:scale-95",
  green:   "bg-[#004600] text-[#F6C900] font-bold hover:bg-[#006837] active:scale-95",
  outline: "border-2 border-[#F6C900] text-[#F6C900] hover:bg-[#F6C900] hover:text-[#1A1A1A] active:scale-95",
  ghost:   "text-[#F6C900] hover:bg-[#F6C900]/10 active:scale-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "gold", size = "md", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
