"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    document.cookie = "admin_access=; max-age=0; path=/; samesite=strict";
    router.push("/");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-[#FAF6EB]/40 hover:text-red-400 transition-colors border border-[#FAF6EB]/10 hover:border-red-400/30 rounded-sm px-3 py-1.5 uppercase tracking-wider font-semibold"
    >
      Sair
    </button>
  );
}
