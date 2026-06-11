"use client";

import { useState } from "react";

interface BirthDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: string;
  disabled?: boolean;
}

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function parseDate(masked: string): Date | null {
  const parts = masked.split("/");
  if (parts.length !== 3 || parts[2].length !== 4) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) return null;
  const date = new Date(y, m - 1, d);
  // Valida que a data é real (ex: 31/02 não existe)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function dateToMasked(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export default function BirthDatePicker({ value, onChange, error, disabled }: BirthDatePickerProps) {
  const [inputValue, setInputValue] = useState(value ? dateToMasked(value) : "");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyMask(e.target.value);
    setInputValue(masked);
    const date = parseDate(masked);
    onChange(date);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-[#A84418] uppercase tracking-[0.12em]">
        Data de nascimento
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleChange}
        placeholder="DD/MM/AAAA"
        disabled={disabled}
        maxLength={10}
        autoComplete="bday"
        className={`w-full bg-[#F8F4EC] border-[1.5px] ${
          error ? "border-red-500" : "border-[#DDD4C3]"
        } text-[#0D0600] rounded-md px-4 py-3 text-base outline-none focus:border-[#CC5723] focus:shadow-[0_0_0_3px_rgba(204,87,35,0.18)] transition-all placeholder:text-[#3A1C0C]/35 disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
