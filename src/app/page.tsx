import Link from "next/link";
import VideoBackground from "@/components/VideoBackground";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import AdminButton from "@/components/AdminButton";

const pontuacao = [
  { evento: "Presença no Nami (jogo do Brasil)", pts: 51 },
  { evento: "Acertou o ganhador (sem placar exato)", pts: 16 },
  { evento: "Placar exato (todos os jogos)", pts: 30 },
  { evento: "Semifinalista correto (cada, palpite antecipado)", pts: 27 },
  { evento: "Finalista correto (cada, palpite antecipado)", pts: 40 },
  { evento: "Campeão correto (palpite antecipado)", pts: 101, highlight: true },
  { evento: "Placar exato da final (palpite antecipado)", pts: 121, highlight: true },
  { evento: "Presença na final (mesmo sendo jogo do Brasil)", pts: 100, highlight: true },
];

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen bg-[#1A0C04]">
      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 py-20 text-center overflow-hidden nami-hero-grid nami-hero-glow">
        <VideoBackground />

        <div className="relative z-10 flex flex-col items-center gap-5 max-w-2xl mx-auto">
          {/* Logo Nami */}
          <div className="nami-logo nami-logo--on-preto nami-logo--lg anim-in mb-1">
            <img src="/nami/nami-13.png" alt="Nami" className="w-28 h-auto mb-2" />
            <span className="nami-logo__name">Nami</span>
            <span className="nami-logo__sub">Copa 2026</span>
          </div>

          {/* Badge hexagonal Copa 2026 */}
          <div className="anim-in anim-in-1">
            <svg viewBox="0 0 220 180" width="150" height="123" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Copa do Mundo 2026">
              <path d="M110 8 L198 56 L198 124 L110 172 L22 124 L22 56 Z" stroke="rgba(204,87,35,.70)" strokeWidth="1.5" fill="none" />
              <text x="110" y="112" fontFamily="var(--font-cond)" fontSize="54" fontWeight="900" fill="rgba(240,234,221,.92)" textAnchor="middle" letterSpacing="-1">2026</text>
              <text x="42" y="100" fontFamily="var(--font-cond)" fontSize="9" fontWeight="700" fill="rgba(240,234,221,.55)" letterSpacing="1.5" textAnchor="middle">BRA</text>
              <text x="178" y="100" fontFamily="var(--font-cond)" fontSize="9" fontWeight="700" fill="rgba(240,234,221,.55)" letterSpacing="1.5" textAnchor="middle">SIL</text>
              <text x="110" y="150" fontFamily="serif" fontSize="14" fill="rgba(204,87,35,.80)" textAnchor="middle">★</text>
            </svg>
          </div>

          <h1 className="font-[var(--font-cond)] text-5xl md:text-6xl font-black text-[#F0EADD] leading-[0.95] tracking-tight uppercase anim-in anim-in-2">
            Bolão<br />Copa 2026
          </h1>

          <p className="font-[var(--font-script)] text-[#F0EADD]/80 text-2xl md:text-3xl anim-in anim-in-3">
            Vai Brasil!
          </p>

          <p className="text-[#F0EADD]/55 text-base md:text-lg max-w-lg anim-in anim-in-3">
            Faça seus palpites, apareça no Nami durante os jogos e dispute o ranking da Copa do Mundo 2026.
            <span className="text-[#D96D3A] font-semibold"> Pra jogar com a gente, tem que vestir a camisa!</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-1 anim-in anim-in-4">
            <Link href="/cadastro">
              <Button size="lg" variant="gold">
                Participar Agora
              </Button>
            </Link>
            <Link href="/ranking">
              <Button size="lg" variant="outline">
                Ver Ranking
              </Button>
            </Link>
          </div>

          <p className="font-[var(--font-script)] text-[#D96D3A] text-xl mt-1 opacity-80 anim-in anim-in-4">
            Hexa vem!
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10" style={{ animation: "nami-bounce 2.2s ease-in-out infinite" }} aria-hidden="true">
          <div className="w-px h-11 mx-auto mb-2" style={{ background: "linear-gradient(to bottom, rgba(204,87,35,.6), transparent)" }} />
          <div className="w-[5px] h-[5px] rounded-full bg-[#CC5723] opacity-70 mx-auto" />
        </div>
      </section>

      {/* Faixa */}
      <div className="nami-strip" />

      {/* ── COMO FUNCIONA ── */}
      <section className="py-20 px-6 bg-[#F0EADD]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#A84418] text-xs font-bold uppercase tracking-[0.20em] mb-4">Como Funciona</p>
            <h2 className="font-[var(--font-cond)] text-3xl md:text-4xl font-black text-[#1A0C04] uppercase">
              Simples assim
            </h2>
            <div className="mt-6 flex justify-center opacity-85">
              <img src="/nami/nami-13.png" alt="Escudo Nami Copa 2026" className="h-32 w-auto" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Cadastre-se",
                desc: "Crie sua conta com nome, telefone e CPF. É rápido e gratuito.",
              },
              {
                step: "02",
                title: "Faça seus Palpites",
                desc: "Envie seu palpite de placar até 5 minutos antes de cada jogo do Brasil.",
              },
              {
                step: "03",
                title: "Apareça no Nami",
                desc: "Cada presença durante os jogos vale pontos extras no ranking.",
              },
            ].map((item) => (
              <Card key={item.step} variant="cream" className="relative overflow-hidden">
                <span className="font-[var(--font-cond)] text-7xl font-black text-[#CC5723]/12 absolute top-3 right-4 leading-none select-none">
                  {item.step}
                </span>
                <h3 className="font-[var(--font-cond)] text-xl font-black text-[#1A0C04] uppercase tracking-wide mb-2 relative">{item.title}</h3>
                <p className="text-[#1A0C04]/65 text-sm leading-relaxed relative">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Faixa */}
      <div className="nami-strip" />

      {/* ── PONTUAÇÃO ── */}
      <section className="py-20 px-6 bg-[#1A0C04] relative overflow-hidden">
        <div
          className="absolute right-0 bottom-0 w-56 h-56 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(-55deg,rgba(204,87,35,.06) 0px,rgba(204,87,35,.06) 6px,transparent 6px,transparent 18px)" }}
        />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <p className="text-[#CC5723]/70 text-xs font-bold uppercase tracking-[0.20em] mb-4">Pontuação</p>
            <h2 className="font-[var(--font-cond)] text-3xl md:text-4xl font-black text-[#F0EADD] uppercase">
              Como ganhar pontos
            </h2>
          </div>

          <div className="bg-[#0D0600] border border-[#F0EADD]/10 rounded-xl overflow-hidden">
            {pontuacao.map((item) => (
              <div
                key={item.evento}
                className={`flex items-center justify-between gap-4 px-6 py-4 border-b border-[#F0EADD]/[0.07] last:border-b-0 ${item.highlight ? "bg-[#CC5723]/10" : ""}`}
              >
                <span className="text-[#F0EADD]/80 text-sm leading-snug">{item.evento}</span>
                <span className={`font-[var(--font-cond)] font-black text-[#D96D3A] shrink-0 whitespace-nowrap ${item.highlight ? "text-3xl" : "text-2xl"}`}>
                  {item.pts} <span className="text-xs font-bold tracking-wide opacity-70">pts</span>
                </span>
              </div>
            ))}
          </div>

          <p className="text-[#F0EADD]/55 text-sm text-center mt-6">
            A <span className="text-[#D96D3A] font-semibold">final</span> abre para palpite de placar <span className="text-[#D96D3A] font-semibold">no dia do jogo</span> (mesmo sem o Brasil). A <span className="text-[#D96D3A] font-semibold">semifinal</span> abre no dia <span className="text-[#D96D3A] font-semibold">apenas se for jogo do Brasil</span>. Esses palpites do dia (placar exato 30 / ganhador 16) somam com os palpites antecipados do torneio.
          </p>

          <p className="text-[#F0EADD]/35 text-sm text-center mt-4">
            Em caso de empate, o desempate é por número de presenças, placares exatos, acertos de ganhador, e proximidade na % de posse de bola.
          </p>
        </div>
      </section>

      {/* Faixa */}
      <div className="nami-strip" />

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-6 bg-[#F0EADD] relative overflow-hidden">
        <img
          src="/nami/nami-02.png"
          alt=""
          aria-hidden="true"
          className="absolute right-[5%] top-1/2 -translate-y-1/2 opacity-10 pointer-events-none"
          style={{ width: "min(35vw, 280px)" }}
        />
        <div className="max-w-xl mx-auto text-center relative z-10 flex flex-col items-center gap-6">
          <svg viewBox="0 0 160 130" width="100" height="81" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M80 6 L144 40 L144 90 L80 124 L16 90 L16 40 Z" stroke="rgba(13,6,0,.25)" strokeWidth="1.2" fill="none" />
            <text x="80" y="82" fontFamily="var(--font-cond)" fontSize="38" fontWeight="900" fill="rgba(204,87,35,.30)" textAnchor="middle" letterSpacing="-1">2026</text>
            <text x="80" y="107" fontFamily="serif" fontSize="10" fill="rgba(204,87,35,.25)" textAnchor="middle">★</text>
          </svg>
          <h2 className="font-[var(--font-cond)] text-3xl md:text-4xl font-black text-[#1A0C04] uppercase leading-tight">
            A Copa começa aqui
          </h2>
          <p className="text-[#3A1C0C]/80 text-lg max-w-md">
            Cadastre-se agora e não perca nenhum palpite. O time que aparecer mais vai ganhar mais.
          </p>
          <Link href="/cadastro">
            <Button size="lg" variant="gold">
              Criar minha conta
            </Button>
          </Link>
          <p className="font-[var(--font-script)] text-[#CC5723] text-2xl opacity-70 -mt-1">Vai Brasil!</p>
        </div>
      </section>

      {/* Faixa */}
      <div className="nami-strip" />

      {/* ── FOOTER ── */}
      <footer className="bg-[#0D0600] border-t border-[#F0EADD]/10 py-8 px-6 text-center">
        <div className="nami-logo nami-logo--on-preto nami-logo--sm justify-center mb-4 opacity-45">
          <span className="nami-logo__name">Nami</span>
          <span className="nami-logo__sub">Copa 2026</span>
        </div>
        <p className="text-[#F0EADD]/32 text-xs leading-relaxed">
          © 2026 Nami — Bolão Copa do Mundo 2026
          <br />
          Participação gratuita · Sem apostas financeiras · Não afiliado à FIFA
        </p>
        <AdminButton />
      </footer>
    </main>
  );
}
