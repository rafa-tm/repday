# RepDay

Acompanhe, todo dia, os remédios, vitaminas, água e qualquer hábito que você queira manter. Cada item tem um gráfico no estilo das contribuições do GitHub, para ver a constância ao longo do ano.

## Funcionalidades

- **Itens de acompanhamento** com nome, cor, quantidade por dose (comprimidos, cápsulas, mg, ml, gotas ou unidades), doses por dia, horários de cada dose e repetição: todos os dias, dias da semana específicos ou a cada N dias.
- **Marcação do dia:** um toque marca ou desmarca cada dose de hoje, com atualização otimista.
- **Gráfico por item:** últimas 53 semanas, com cinco tons conforme a fração de doses tomadas no dia, mais **sequência** (dias seguidos completos) e **adesão** dos últimos 30 dias.
- **Água:**
  - No cadastro, a pessoa informa altura, peso e sexo, e o app calcula a meta mínima diária.
  - A meta vira um item de acompanhamento contado **por copos**: tamanho do copo e meta são editáveis, e dá para registrar mais copos do que a meta.
- **Perfil:** ao editar os dados do corpo, a meta de água é recalculada.
- **PWA:** instalável no celular e no desktop, com página "sem conexão". No celular, um aviso no topo sugere a instalação: no Android instala direto, no iOS mostra o passo a passo.
- **Conta:** cadastro e login com e-mail e senha (Supabase Auth), confirmação por e-mail e menu de conta com avatar.

### Como a meta de água é calculada

`src/lib/water.ts`:

- **Base:** 35 ml por kg de peso.
- **IMC ≥ 30:** usa o peso ajustado, que é o peso ideal pela fórmula de Devine mais 40% do excedente.
- **Mínimo diário pela referência EFSA:** 2,5 L para homens e 2,0 L para mulheres (2,25 L para "outro").
- **Teto:** 5 L. O resultado é arredondado para 100 ml.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, `proxy.ts`) + React 19 + TypeScript
- [Supabase](https://supabase.com): Postgres e Auth (`@supabase/ssr`)
- [Drizzle ORM](https://orm.drizzle.team): schema, queries e migrations
- [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) + [lucide](https://lucide.dev)
- [zod](https://zod.dev) para validar os formulários

## Rodando localmente

Pré-requisitos: **Node.js 20.9+** (recomendado 24 LTS) e um projeto no Supabase.

```bash
npm install
cp .env.example .env.local   # preencha com os dados do seu projeto Supabase
npm run db:migrate           # cria as tabelas
npm run db:seed              # opcional: cria um usuário de teste com histórico
npm run dev
```

Abra http://localhost:3000.

### Variáveis de ambiente

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API (chave publishable) |
| `DATABASE_URL` | Supabase → Connect → **Transaction pooler** (porta 6543). Caracteres especiais da senha precisam estar codificados para URL. |
| `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` | Opcional. Credenciais do usuário de teste (padrão: `teste@repday.dev` / `repday123`). |

### Configuração no Supabase

- Em **Authentication → URL Configuration**, adicione `http://localhost:3000/auth/callback` (e a URL de produção, depois do deploy) às *Redirect URLs*. É para onde vai o link de confirmação de e-mail.
- Para pular a confirmação de e-mail durante o desenvolvimento, desligue **Confirm email** em Authentication → Providers → Email.

### Usuário de teste

`npm run db:seed` cria do zero o usuário `teste@repday.dev` / `repday123`, com perfil, item de água e mais quatro itens com cerca de 10 meses de histórico. Pode rodar quantas vezes quiser. `npm run db:seed -- --reset` só remove o usuário e os dados dele.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run lint` | ESLint |
| `npm run db:generate` | Gera uma migration a partir de `src/db/schema.ts` |
| `npm run db:migrate` | Aplica as migrations pendentes |
| `npm run db:push` | Envia o schema direto, sem migration (só para protótipos) |
| `npm run db:studio` | Abre o Drizzle Studio |
| `npm run db:seed` | Recria o usuário de teste |
| `npm run icons` | Regenera os ícones PNG do PWA a partir de `src/app/icon.svg` |

## Estrutura

```
src/
  app/
    page.tsx                 # Home: itens do dia + gráficos
    items/                   # Criar/editar itens e as Server Actions (doses, copos)
    login/  onboarding/  profile/
    auth/callback/           # Confirmação de e-mail (PKCE / token_hash)
    auth/signout/            # Limpa sessões inválidas
    manifest.ts  icon.svg  apple-icon.png
  components/
    trackers/                # Card, gráfico, botões de dose, copos de água, formulários
    profile/                 # Campos de altura/peso/sexo
    ui/                      # Componentes shadcn
  db/schema.ts               # Tabelas: trackers, dose_logs, profiles
  lib/                       # Datas, regras dos itens, cálculo de água, auth, Supabase
  proxy.ts                   # Renova a sessão e protege as rotas
drizzle/                     # Migrations SQL
scripts/                     # seed.ts, generate-icons.ts
public/                      # sw.js, offline.html, ícones do PWA
```

## Decisões importantes

- **Acesso ao banco:**
  - O Drizzle conecta como `postgres`, que **ignora RLS**, então o isolamento entre usuários é feito no código: toda query e action filtra por `user_id`. Para ler os dados de quem está logado, use `requireUser()` (`src/lib/auth.ts`).
  - Todas as tabelas têm **RLS ligado sem policies**, o que bloqueia o acesso pela Data API pública do Supabase (a chave publishable).
- **"Hoje" segue o fuso do navegador:** o componente `TimeZoneSync` grava o fuso num cookie `tz`, e o servidor usa esse cookie para saber qual dia é hoje. O padrão é `America/Sao_Paulo`.
- **Água conta copos, não ml:** cada copo é um registro em `dose_logs`. Trocar o tamanho do copo reinterpreta o histórico com o tamanho novo.
- **Service worker sem cache de páginas:** ele só mostra a página offline, para nunca exibir doses desatualizadas. Só é registrado no build de produção.

## Desenvolvimento no WSL

O `next.config.ts` libera o IP `10.255.255.254` em `allowedDevOrigins` para abrir o dev server pelo navegador do Windows. Instalação do PWA e service worker exigem HTTPS ou `localhost`, então para testá-los use `npm run build && npm start` em `http://localhost:3000` ou faça o deploy.

## Deploy

Funciona em qualquer host de Next.js (ex.: Vercel):

1. Configure as variáveis de ambiente acima.
2. Rode `npm run db:migrate` apontando para o banco de produção.
3. Adicione `https://<seu-domínio>/auth/callback` às Redirect URLs do Supabase.

## Próximos passos

- **Lembretes por notificação:** a preferência já é salva em cada item, mas o envio ainda não existe. Falta Web Push no service worker e um agendador (ex.: `pg_cron` no Supabase ou Vercel Cron).
- Marcar doses de dias anteriores pelo gráfico.
