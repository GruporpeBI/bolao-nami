"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  // Não mostra na home nem no admin (admin tem header próprio)
  if (pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/preview")) return null;

  return (
    <nav className="sticky top-0 z-50 bg-[#0D0600]/85 backdrop-blur-md border-b border-[#F0EADD]/10">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#F0EADD]/55 hover:text-[#F0EADD] transition-colors text-xs font-bold uppercase tracking-[0.12em] group"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <path
              d="M10 3L5 8L10 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Início
        </Link>

        <div className="flex-1 h-px bg-[#F0EADD]/10" />

        <Link href="/" className="nami-logo nami-logo--on-preto nami-logo--sm">
          <span className="nami-logo__name">Nami</span>
          <span className="nami-logo__sub">Copa 2026</span>
        </Link>
      </div>
    </nav>
  );
}
