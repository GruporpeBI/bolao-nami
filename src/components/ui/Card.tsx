import { HTMLAttributes } from "react";

type Variant = "dark" | "cream" | "gold";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  dark:  "bg-[#1A1A1A] border border-[#F6C900]/20 text-[#FAF6EB]",
  cream: "bg-[#FAF6EB] border border-[#1A1A1A]/10 text-[#1A1A1A]",
  gold:  "bg-[#F6C900] border border-[#D4A800] text-[#1A1A1A]",
};

export default function Card({ variant = "dark", className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-sm p-6 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
