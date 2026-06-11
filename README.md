# Bolão Copa 2026 — Mercearia Amauri

Site de bolão para a Copa do Mundo FIFA 2026, da campanha **"Copa no Merça — A Casa da Torcida"**. Clientes se cadastram, fazem palpites nos jogos, fazem **check-in por geolocalização** no restaurante para ganhar pontos de presença, e disputam um **ranking em tempo real** (geral e por jogo). Os placares são capturados automaticamente de **múltiplas fontes** e exibidos ao vivo.

🔗 Produção: **https://bolao-amauri.vercel.app**

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Estilização | Tailwind CSS v4 |
| Banco / Auth / Realtime | Supabase (PostgreSQL + Auth + Realtime) |
| Automação | Supabase **Edge Functions** (Deno) + **pg_cron** + **pg_net** |
| Fontes de placar | **TheSportsDB**, **ESPN** (hidden API), **API-Football**, **Sofascore** |
| Deploy | Vercel (frontend) + Supabase Cloud (DB/Functions) |

---

## Funcionalidades

- **Palpites por jogo** — placar + posse de bola, até **5 min antes** do apito.
- **Palpites do torneio (bracket antecipado)** — semifinalistas, finalistas, campeão e placar da final; fecham após os **3 primeiros jogos do Brasil**.
- **Semifinal e final no dia** — a **final** abre como card de palpite no dia **sempre**; a **semifinal**, no dia, **apenas se for jogo do Brasil**. Esses palpites do dia (30/16) **somam** com o bracket.
- **Check-in geolocalizado** — valida a distância até o restaurante (Haversine). Disparado pelo botão **"Fazer check-in"** ou ao **enviar o palpite**; fica disponível **até o início do jogo**.
- **Placar ao vivo** — capturado automaticamente e exibido no `/ranking` (com posse ao vivo informativa); a posse **oficial** é fixada no **FT**.
- **Ranking em tempo real** — geral (top 10) e por jogo, com critérios de desempate por posse de bola e presenças.
- **Admin** — habilitar jogos, override manual de resultado (com lock anti-sobrescrita), recalcular pontuação, configurar geolocalização.

---

## Arquitetura de captura de placar (multi-source)

O `sofascore_id` é o identificador principal do jogo; os IDs das outras fontes (`thesportsdb_event_id`, `espn_event_id`, `api_football_fixture_id`) são vinculados ao mesmo jogo.

```
pg_cron (diário 04:00 UTC)
  └─ refresh_game_crons()  → cria, por jogo do dia, crons na JANELA do jogo:
        gcron-tdb-<id>   (*/10 durante o jogo)  → Edge Fn poll-thesportsdb
        gcron-espn-<id>  (*/20 durante o jogo)  → Edge Fn poll-espn

Durante o jogo:
  poll-thesportsdb / poll-espn  → gravam placar/status ao vivo em games + match_latest
No FT (uma fonte detecta encerrado → consulta a outra):
  compareAndFinalize()  → consenso de placar (TDB × ESPN, API-Football como árbitro),
                          resolve a POSSE oficial, e chama /api/sync-result
  /api/sync-result      → grava resultado final em games + recalcula pontuação
```

- A chave de service role usada pelos crons fica em `private.cron_secrets` (lida em runtime).
- Se nenhuma fonte trouxer posse no FT, o admin exibe **"Falha de API posse de bola — faça o input manual"**.

---

## Sistema de pontuação

| Evento | Pontos | Quando |
|---|---|---|
| Presença no restaurante (jogo do Brasil) | 51 | check-in |
| Presença na final (mesmo sendo Brasil) | 100 | check-in |
| Acertou o ganhador (sem placar exato) | 16 | palpite de jogo |
| Placar exato (todos os jogos) | 30 | palpite de jogo |
| Semifinalista correto (cada) | 27 | bracket antecipado |
| Finalista correto (cada) | 40 | bracket antecipado |
| Campeão correto | 101 | bracket antecipado |
| Placar exato da final | 121 | bracket antecipado |

Os palpites do dia **somam** com os do bracket antecipado.

**Desempate (ranking geral):** pontos → presenças → placares exatos → acertos de ganhador → acertos do time com mais posse.
**Desempate (ranking por jogo):** pontos → acertou o time dominante → proximidade da % de posse → presenças.

---

## Pré-requisitos

- Node.js 18+
- Projeto no [Supabase](https://supabase.com) (com `pg_cron` e `pg_net` habilitados)
- Supabase CLI (`npm i -g supabase`) e/ou Vercel CLI (`npm i -g vercel`) para deploy

---

## Configuração local

```bash
npm install
cp .env.example .env.local          # preencha as credenciais
# aplique as migrations em /supabase/migrations/ no SQL Editor do Supabase
npm run dev                          # http://localhost:3000
```

---

## Variáveis de ambiente

| Variável | Onde | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Chave anon/publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | Service role (escritas server-side) |
| `SYNC_SECRET` | Vercel + Edge | Segredo do endpoint `/api/sync-result` |
| `APP_URL` | Edge Functions | URL pública do app (para o callback de sync) |
| `API_FOOTBALL_KEY` / `API_FOOTBALL_KEY_2` | Edge Functions | Chaves do API-Football (árbitro/posse) |
| `FOOTBALL_API_TOKEN` | Edge/Server | Token football-data.org (agenda) |
| `ADMIN_EMAIL` | Vercel | E-mail com acesso ao `/admin` |

---

## Estrutura do projeto

```
src/
├── app/
│   ├── page.tsx              # Landing (hero, pontuação/regulamento, CTA)
│   ├── palpites/             # Palpites por jogo + torneio + check-in (CheckInButton)
│   ├── ranking/              # Ranking geral + por jogo, placar ao vivo
│   ├── admin/                # CMS — jogos, resultados (override/lock), presenças, geo
│   ├── cadastro/             # Cadastro + login
│   ├── api/                  # sync-result, admin/* (enrich-ids, trigger-polling, ...)
│   └── preview/              # Preview sem Supabase (dev)
├── components/               # ui/, icons/, VideoBackground
└── lib/supabase, lib/football-api, lib/team-names

supabase/
├── migrations/               # 001..014 (colunas multi-source, crons, lock, posse ao vivo)
└── functions/
    ├── _shared/              # multi-source.ts (consenso/FT), apifootball.ts
    ├── poll-thesportsdb/     # placar ao vivo (TheSportsDB v1)
    ├── poll-espn/            # placar + posse + gols (ESPN)
    └── sync-agenda-with-enrichment/  # agenda diária + enriquecimento de IDs
```

---

## Deploy

> ⚠️ O deploy do frontend é **manual via CLI** (o git remote usa um alias SSH que o
> Vercel não auto-conecta). Faça `git push` **e** depois publique:

```bash
# Frontend (Vercel)
npx vercel --prod --yes

# Edge Functions (Supabase) — após alterar qualquer função ou o _shared
supabase functions deploy poll-thesportsdb poll-espn --project-ref <ref>

# Migrations — SQL Editor do Supabase ou Management API
```

Crons (`refresh-game-crons`, `sync-world-cup-agenda`) e a tabela `private.cron_secrets`
são criados pelas migrations; o segredo (`service_role_key`) é inserido manualmente.

---

## Scripts

```bash
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run start    # iniciar build
npm run lint     # ESLint
```

---

## Vídeo de fundo

Salve um MP4 (1920×1080) royalty-free em `public/videos/hero.mp4`. Sem o vídeo, o hero exibe um gradiente verde como fallback.
