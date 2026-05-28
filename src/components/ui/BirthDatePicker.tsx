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
      <label className="text-sm font-semibold text-[#F6C900] uppercase tracking-wider">
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
        className={`w-full bg-[#1A1A1A] border ${
          error ? "border-red-500" : "border-[#F6C900]/30"
        } text-[#FAF6EB] rounded-sm px-4 py-3 text-base outline-none focus:border-[#F6C900] transition-colors placeholder:text-[#FAF6EB]/30 disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}
