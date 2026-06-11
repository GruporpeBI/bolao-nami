import { HTMLAttributes } from "react";

type Variant = "dark" | "cream" | "gold";

// NAMI palette. "dark" = preto-md card sobre preto; "cream" = step-card creme; "gold" = destaque terracotta.
const variantClasses: Record<Variant, string> = {
  dark:  "bg-[#251008] border border-[#F0EADD]/10 text-[#F0EADD]",
  cream: "bg-[#F8F4EC] border border-[#DDD4C3] text-[#1A0C04]",
  gold:  "bg-[#CC5723] border border-[#A84418] text-white",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export default function Card({ variant = "dark", className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl p-6 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
