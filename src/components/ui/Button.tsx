"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "gold" | "outline" | "ghost" | "green";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// NAMI: as chaves de variante permanecem ("gold"/"green"/"outline"/"ghost"),
// mas o visual é remapeado para a paleta Terracotta/Creme/Preto.
const variantClasses: Record<Variant, string> = {
  gold:    "bg-[#CC5723] text-white hover:bg-[#D96D3A] active:scale-95",
  green:   "bg-[#F0EADD] text-[#1A0C04] hover:bg-[#DDD4C3] active:scale-95",
  outline: "border-[1.5px] border-[#F0EADD]/50 text-[#F0EADD] hover:bg-[#F0EADD]/10 hover:border-[#F0EADD] active:scale-95",
  ghost:   "text-[#D96D3A] hover:bg-[#CC5723]/10 active:scale-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "gold", size = "md", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-md font-[var(--font-cond)] font-bold uppercase tracking-[0.08em] transition-all duration-150 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
