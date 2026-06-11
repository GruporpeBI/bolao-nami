import { HTMLAttributes } from "react";

type Variant = "gold" | "green" | "dark" | "outline";

// NAMI tags — pill shaped. Chaves mantidas; visual remapeado para Terracotta/Creme.
const variantClasses: Record<Variant, string> = {
  gold:    "bg-[#CC5723]/22 text-[#D96D3A] border border-[#CC5723]/35",
  green:   "bg-[#F0EADD]/15 text-[#F0EADD] border border-[#F0EADD]/25",
  dark:    "bg-[#F0EADD]/10 text-[#F0EADD] border border-[#F0EADD]/25",
  outline: "border border-[#CC5723]/50 text-[#D96D3A]",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export default function Badge({ variant = "gold", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-[0.10em] ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
