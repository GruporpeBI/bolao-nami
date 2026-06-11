"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import BirthDatePicker from "@/components/ui/BirthDatePicker";
import { registerUser } from "./actions";

interface RegisterModalProps {
  cpf: string;
  onClose: () => void;
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function calcAge(date: Date) {
  const t = new Date();
  let age = t.getFullYear() - date.getFullYear();
  const m = t.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < date.getDate())) age--;
  return age;
}

export default function RegisterModal({ cpf, onClose }: RegisterModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().split(" ").length < 2) errs.name = "Informe nome e sobrenome.";
    const pd = phone.replace(/\D/g, "");
    if (pd.length < 10 || pd.length > 11) errs.phone = "Telefone inválido.";
    if (!birthDate) {
      errs.birthDate = "Informe sua data de nascimento.";
    } else if (calcAge(birthDate) < 18) {
      errs.birthDate = "Você precisa ter 18 anos ou mais para participar.";
    }
    if (!acceptedTerms) errs.terms = "Você precisa aceitar os termos para continuar.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStatus("loading");

    const result = await registerUser({
      name,
      phone,
      cpf,
      birth_date: birthDate!.toISOString().split("T")[0],
      accepted_terms: acceptedTerms,
    });

    if (result.success) {
      setStatus("success");
      setMessage("Cadastro realizado! Redirecionando...");
      setTimeout(() => router.push("/palpites"), 1200);
    } else {
      setStatus("error");
      setMessage(result.error ?? "Erro ao realizar cadastro.");
    }
  }

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative bg-white border border-[#DDD4C3] rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#CC5723]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#DDD4C3]">
          <div>
            <p className="text-[#A84418]/80 text-xs uppercase tracking-widest font-bold">CPF não cadastrado</p>
            <h2 className="font-[var(--font-cond)] text-[#A84418] font-black text-lg leading-tight uppercase">Criar cadastro</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#1A0C04]/40 hover:text-[#1A0C04] transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">

          {/* CPF (desabilitado — já preenchido) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#A84418] uppercase tracking-[0.12em]">CPF</label>
            <input
              type="text"
              value={cpf}
              disabled
              className="w-full bg-[#F0EADD] border-[1.5px] border-[#DDD4C3] text-[#1A0C04]/55 rounded-md px-4 py-3 text-base outline-none cursor-not-allowed"
            />
            <span className="text-[#1A0C04]/35 text-xs">CPF verificado — não pode ser alterado.</span>
          </div>

          <Input
            label="Nome completo"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-ZÀ-Ú\s]/g, ""))}
            error={errors.name}
            placeholder="JOÃO DA SILVA"
            autoComplete="name"
            disabled={isLoading || isSuccess}
            autoFocus
          />

          <Input
            label="Telefone / WhatsApp"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            error={errors.phone}
            placeholder="(11) 99999-9999"
            autoComplete="tel"
            disabled={isLoading || isSuccess}
          />

          <BirthDatePicker
            value={birthDate}
            onChange={(date) => {
              setBirthDate(date);
              if (date && calcAge(date) < 18) {
                setErrors((p) => ({ ...p, birthDate: "Você precisa ter 18 anos ou mais para participar." }));
              } else {
                setErrors((p) => { const { birthDate: _, ...rest } = p; return rest; });
              }
            }}
            error={errors.birthDate}
            disabled={isLoading || isSuccess}
          />

          <div className="flex flex-col gap-1.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                disabled={isLoading || isSuccess}
                className="mt-0.5 w-4 h-4 accent-[#CC5723] cursor-pointer shrink-0"
              />
              <span className="text-sm text-[#1A0C04]/65 leading-relaxed">
                Li e aceito os{" "}
                <a href="/termos" target="_blank" className="text-[#CC5723] underline underline-offset-2 hover:text-[#A84418]">
                  termos e condições
                </a>{" "}
                do Bolão Copa 2026 — Nami.
              </span>
            </label>
            {errors.terms && <span className="text-red-500 text-xs ml-7">{errors.terms}</span>}
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            disabled={isLoading || isSuccess}
          >
            {isLoading ? "Cadastrando..." : isSuccess ? "Cadastrado! ✓" : "Participar do Bolão"}
          </Button>

          {status === "success" && <p className="text-green-700 text-sm text-center">{message}</p>}
          {status === "error" && <p className="text-red-500 text-sm text-center">{message}</p>}
        </form>
      </div>
    </div>
  );
}
