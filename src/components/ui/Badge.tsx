import { HTMLAttributes } from "react";

type Variant = "gold" | "green" | "dark" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  gold:    "bg-[#F6C900] text-[#1A1A1A]",
  green:   "bg-[#004600] text-[#F6C900]",
  dark:    "bg-[#1A1A1A] text-[#F6C900] border border-[#F6C900]/40",
  outline: "border border-[#F6C900] text-[#F6C900]",
};

export default function Badge({ variant = "gold", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
