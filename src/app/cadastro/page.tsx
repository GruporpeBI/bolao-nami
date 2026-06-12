import CadastroForm from "./CadastroForm";

export default function CadastroPage() {
  return (
    <main className="min-h-screen bg-[#F0EADD]">
      {/* Hero da página (preto com grid) */}
      <section className="relative bg-[#1A0C04] px-6 pt-12 pb-20 text-center overflow-hidden nami-hero-grid">
        <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center gap-4">
          <div className="nami-logo nami-logo--on-preto nami-logo--md">
            <span className="nami-logo__name">Nami</span>
            <span className="nami-logo__sub">Copa 2026</span>
          </div>
          <svg viewBox="0 0 160 130" width="72" height="58" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M80 6 L144 40 L144 90 L80 124 L16 90 L16 40 Z" stroke="rgba(240,234,221,.45)" strokeWidth="1.2" fill="none" />
            <text x="80" y="82" fontFamily="var(--font-cond)" fontSize="38" fontWeight="900" fill="rgba(240,234,221,.75)" textAnchor="middle" letterSpacing="-1">2026</text>
            <text x="80" y="107" fontFamily="serif" fontSize="10" fill="rgba(204,87,35,.70)" textAnchor="middle">★</text>
          </svg>
          <h1 className="font-[var(--font-cond)] text-3xl md:text-4xl font-black text-[#F0EADD] uppercase tracking-tight">
            Participe do Bolão
          </h1>
          <p className="text-[#F0EADD]/55 text-sm">
            Cadastre-se, faça seus palpites e dispute o ranking no Nami
          </p>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-[0.10em] bg-[#F0EADD]/15 text-[#F0EADD] border border-[#F0EADD]/25">
            Gratuito · Sem apostas financeiras
          </span>
        </div>
      </section>

      {/* Card do formulário */}
      <div className="max-w-lg mx-auto px-4 -mt-10 pb-20 relative z-10">
        <div className="relative bg-white border border-[#DDD4C3] rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#CC5723]" />
          <CadastroForm />
        </div>

        {/* Regras rápidas */}
        <div className="mt-6 border border-[#CC5723]/18 rounded-xl p-5 bg-[#CC5723]/[0.04]">
          <p className="font-[var(--font-cond)] text-[#A84418] text-sm font-black uppercase tracking-[0.10em] mb-4">
            Tabela de pontos
          </p>
          <ul className="flex flex-col gap-0">
            {[
              ["51 pts", "Presença no Nami (jogo do Brasil)"],
              ["16 pts", "Acertou o ganhador (sem placar exato)"],
              ["30 pts", "Placar exato (todos os jogos)"],
              ["27 pts", "Semifinalista correto (cada, palpite antecipado)"],
              ["40 pts", "Finalista correto (cada, palpite antecipado)"],
              ["101 pts", "Campeão correto (palpite antecipado)"],
              ["121 pts", "Placar exato da final (palpite antecipado)"],
              ["100 pts", "Presença na final (mesmo sendo jogo do Brasil)"],
            ].map(([pts, desc]) => (
              <li key={pts} className="flex items-start gap-3 py-2 border-b border-[#CC5723]/[0.08] last:border-b-0">
                <span className="font-[var(--font-cond)] text-[#CC5723] font-black text-base w-14 shrink-0">{pts}</span>
                <span className="text-[#1A0C04]/60 text-xs leading-relaxed pt-0.5">{desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#1A0C04]/55 text-xs leading-relaxed mt-3">
            A final abre para palpite de placar no dia do jogo (mesmo sem o Brasil). A semifinal abre no dia apenas se for jogo do Brasil. Esses palpites do dia (placar exato 30 / ganhador 16) somam com os palpites antecipados do torneio.
          </p>
          <p className="text-[#1A0C04]/55 text-xs leading-relaxed mt-2">
            Em caso de empate, o desempate é por número de presenças, placares exatos, acertos de ganhador, e proximidade na % de posse de bola.
          </p>
        </div>
      </div>

      <div className="nami-strip-local" />
      <footer className="bg-[#0D0600] py-8 px-6 text-center">
        <p className="text-[#F0EADD]/32 text-xs">© 2026 Nami</p>
      </footer>
    </main>
  );
}
