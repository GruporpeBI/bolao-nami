"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminButton() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === "123") {
      document.cookie = "admin_access=1; path=/; max-age=86400; samesite=strict";
      router.push("/admin");
    } else {
      setError("Senha incorreta.");
      setPw("");
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-[#F0EADD]/15 hover:text-[#F0EADD]/40 text-xs transition-colors mt-2 select-none"
        aria-label="Acesso admin"
      >
        ⚙
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 justify-center mt-3">
      <input
        type="password"
        value={pw}
        onChange={(e) => { setPw(e.target.value); setError(""); }}
        placeholder="Senha"
        autoFocus
        className="bg-[#251008] border border-[#F0EADD]/20 text-[#F0EADD] rounded-md px-3 py-1 text-xs w-20 outline-none focus:border-[#CC5723]/50 placeholder:text-[#F0EADD]/20"
      />
      <button type="submit" className="text-[#D96D3A] text-xs font-bold hover:text-[#CC5723] transition-colors">
        →
      </button>
      <button
        type="button"
        onClick={() => { setShow(false); setPw(""); setError(""); }}
        className="text-[#F0EADD]/30 text-xs hover:text-[#F0EADD]/60 transition-colors"
      >
        ✕
      </button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </form>
  );
}
