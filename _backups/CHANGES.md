# Registro de Alterações — 2026-05-28

## Para desfazer qualquer mudança, copie o .bak de volta para o local original.

| Arquivo modificado | Backup em |
|---|---|
| src/app/cadastro/actions.ts | _backups/cadastro_actions.ts.bak |
| src/app/cadastro/CadastroForm.tsx | _backups/CadastroForm.tsx.bak |
| src/app/palpites/actions.ts | _backups/palpites_actions.ts.bak |
| src/app/palpites/page.tsx | _backups/palpites_page.tsx.bak |
| api/api/src/poller.js | _backups/poller.js.bak |
| src/app/admin/page.tsx | _backups/admin_page.tsx.bak |
| .env.local | _backups/.env.local.bak |

## Arquivos novos criados (para desfazer: apagar)
- src/app/api/sync-result/route.ts
- src/components/AdminButton.tsx

## Resumo das mudanças

### P0 — Games seedados no banco
- 3 jogos do Brasil (grupo), 2 semifinais, 1 final via football-data.org

### P1 — Auth corrigida
- registerUser: agora cria conta Supabase Auth (email: cpf@bolao.internal, senha: bolao_CPF_2026)
- Nova action loginByCpf: faz signIn ou cria conta para usuários existentes
- CadastroForm: chama loginByCpf antes de redirecionar para /palpites
- users_table_id armazenado no metadata do auth user para bridging correto
- palpites/actions.ts e palpites/page.tsx: usam users_table_id do metadata

### P2 — Bridge Sofascore → Games
- Novo arquivo: src/app/api/sync-result/route.ts
- Recebe POST do poller com event_id, atualiza games e recalcula scores
- poller.js: detecta mudança de status para "finished" e chama a rota

### P3 — Token football-data.org
- FOOTBALL_API_TOKEN adicionado ao .env.local

### Nota importante
- Supabase Auth: desabilitar "Email Confirmations" em Auth > Settings no dashboard
- URL: https://supabase.com/dashboard/project/yzbsahubleskqbfmvmei/auth/settings
