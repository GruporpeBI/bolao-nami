# Bolão Copa 2026 — Mercearia Amauri

Site de bolão para a Copa do Mundo FIFA 2026, desenvolvido para a campanha **"Copa no Merça — A Casa da Torcida"**. Clientes se cadastram, fazem palpites nos jogos do Brasil e da final, acumulam pontos por presença no restaurante e disputam um ranking com prêmios.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Estilização | Tailwind CSS v4 |
| Banco de dados | Supabase (PostgreSQL + Auth + Realtime) |
| API de jogos | football-data.org (gratuita, Copa do Mundo) |
| Deploy | Vercel (frontend) + Supabase Cloud (DB) |

---

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)
- Token da [football-data.org](https://www.football-data.org) (gratuita, 10 req/min)

---

## Configuração local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais reais

# 3. Rodar as migrations no Supabase
# Acesse o SQL Editor no dashboard do Supabase e execute os scripts em /supabase/migrations/

# 4. Iniciar em modo desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anon pública do Supabase |
| `FOOTBALL_API_TOKEN` | Sim | Token da football-data.org |
| `ADMIN_EMAIL` | Sim | E-mail do administrador (acesso a `/admin`) |

Veja `.env.example` para o template completo.

---

## Estrutura do projeto

```
src/
├── app/
│   ├── page.tsx              # Landing page (hero, pontuação, CTA)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Design tokens + Tailwind
│   ├── admin/                # CMS — gerenciar jogos, resultados, presenças
│   ├── cadastro/             # Cadastro + login por CPF
│   ├── palpites/             # Palpites por jogo + palpites do torneio
│   ├── ranking/              # Leaderboard em tempo real
│   ├── termos/               # Termos e condições
│   └── preview/              # Páginas de preview (dev only, sem Supabase)
│
├── components/
│   ├── ui/                   # Button, Card, Badge, Input, BirthDatePicker
│   ├── icons/                # SVGs da marca Mercearia Amauri
│   └── VideoBackground.tsx   # Hero com vídeo + fallback gradiente
│
└── lib/
    ├── supabase/             # client.ts, server.ts, types.ts
    └── football-api.ts       # Wrapper football-data.org com cache

public/
├── icons/                    # SVGs da identidade visual da campanha
└── videos/                   # hero.mp4 (não commitado — ver .gitkeep)
```

---

## Rotas

| Rota | Descrição | Auth |
|---|---|---|
| `/` | Landing page | Pública |
| `/cadastro` | Cadastro + login por CPF | Pública |
| `/palpites` | Fazer palpites | Autenticado |
| `/ranking` | Leaderboard | Pública |
| `/termos` | Termos e condições | Pública |
| `/admin` | CMS administrativo | Admin only |
| `/preview/palpites` | Preview sem Supabase | Dev only |

---

## Sistema de pontuação

| Evento | Pontos |
|---|---|
| Presença no restaurante (jogo do Brasil) | 51 pts |
| Resultado correto (vitória/empate/derrota) | 16 pts |
| Placar exato | 30 pts |
| Semifinalista correto (cada um) | 27 pts |
| Finalista correto (cada um) | 40 pts |
| Campeão correto | 101 pts |
| Placar exato da final | 121 pts |
| Presença na final | 100 pts |

**Desempate:** presenças → placares exatos → resultados → posse de bola → hora do envio → sorteio.

---

## Scripts

```bash
npm run dev      # Desenvolvimento (http://localhost:3000)
npm run build    # Build de produção
npm run start    # Iniciar build de produção
npm run lint     # ESLint
```

---

## Deploy

1. Push para um repositório no GitHub
2. Importar no [Vercel](https://vercel.com) e configurar as variáveis de ambiente
3. Supabase deve estar em produção com RLS habilitado nas tabelas

---

## Vídeo de fundo

Baixe um vídeo de futebol royalty-free (MP4, 1920×1080) em [Pexels](https://www.pexels.com/videos/) e salve como `public/videos/hero.mp4`. O site funciona sem o vídeo — exibe gradiente verde como fallback.
