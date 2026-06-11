"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// NAMI: inputs sobre superfície creme (form-card branco). Label terracotta-uppercase.
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold text-[#A84418] uppercase tracking-[0.12em]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`bg-[#F8F4EC] border-[1.5px] ${error ? "border-red-500" : "border-[#DDD4C3]"} text-[#0D0600] rounded-md px-4 py-3 text-base outline-none focus:border-[#CC5723] focus:shadow-[0_0_0_3px_rgba(204,87,35,0.18)] transition-all placeholder:text-[#3A1C0C]/35 ${className}`}
          {...props}
        />
        {error && <span className="text-red-500 text-xs">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
