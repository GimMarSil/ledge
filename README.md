# BuildFlow Despesas

> Gestão de despesas e fiscalidade para empresas portuguesas.
> Parte da plataforma [BuildFlow](https://buildflow.pt).

App standalone que gere despesas, faturas, fornecedores e exportação fiscal conforme legislação portuguesa. Integra-se com o [ControlHub](../ControlHub) via SSO + API server-to-server, mas pode também correr de forma autónoma para clientes self-hosted.

## Funcionalidades

### Conformidade fiscal portuguesa
- **SAF-T (PT)** — exportação XML conforme Portaria 321-A/2007
- **ATCUD** — geração de Código Único do Documento por série
- **QR Code fiscal** — Portaria 195/2020 (em todas as faturas/recibos)
- **Hash chain** — cadeia de assinaturas para integridade dos documentos
- **NIF** — validação módulo 11 (continental, Madeira, Açores)
- **Dedutibilidade** — regras de IRS/IRC por categoria de despesa
- **Calendário fiscal** — datas-limite de declarações (IVA, IRS, IES, Modelo 22)
- **Tipos de documento AT** — taxonomia oficial (FT, FR, NC, ND, RG, ...)

### Captura e processamento
- **OCR automático** — OpenAI / Google Gemini / Mistral (configurável)
- **Multi-currency** — 170+ moedas + 14 cripto, com taxas históricas
- **PDF/imagem** — receitas, faturas, recibos verdes, qualquer formato
- **Custom fields & prompts** — extração configurável por cliente

### Integração BuildFlow
- **SSO** via JWT (`BUILDFLOW_PLATFORM_SECRET`)
- **API server-to-server** em `/api/buildflow/*`:
  - `POST /tenants/provision` — criar workspace de tenant
  - `POST /users/sync` — eventos de lifecycle de utilizador
  - `GET /saft?year=YYYY` — exportar SAF-T
  - `GET /iva-report` — relatório IVA periódico
  - `GET /widgets` — KPIs para dashboard ControlHub
  - `GET /stats`, `GET /transactions`, `GET /health`
- **iframe embed** mode para incorporação no portal ControlHub
- **Manifest** declarado em `buildflow/manifest.ts`

## Modos de deployment

### Modo BuildFlow (cliente PaaS)
Provisionado automaticamente pelo ControlHub via `runProvisioningPipeline`. Cada cliente tem o seu próprio container Docker + DB Postgres dedicada em `{slug}.buildflow.pt`.

```bash
# Variáveis obrigatórias
BUILDFLOW_MODULE=true
BUILDFLOW_PLATFORM_SECRET=<64-char shared with ControlHub>
BUILDFLOW_API_KEY=<per-instance random>
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<random>

# Optional (pelo menos um LLM)
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
MISTRAL_API_KEY=...
```

### Modo Self-hosted (sem ControlHub)
Para clientes que querem correr no próprio servidor sem licenciamento BuildFlow.

```bash
SELF_HOSTED_MODE=true
DISABLE_SIGNUP=false  # ou true para single-user
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<random>
```

## Stack técnico

- **Next.js 15** + React 19 (App Router)
- **Prisma 6** + PostgreSQL 17
- **better-auth** para sessões
- **LangChain** com OpenAI/Google/Mistral para OCR
- **@react-pdf/renderer** para geração de faturas
- **sharp + pdf2pic + Ghostscript** para processamento de PDFs
- **Stripe** para checkout (modo self-hosted)

## Desenvolvimento local

```bash
# 1. Postgres local (via docker-compose)
docker compose -f docker-compose.dev.yml up -d postgres

# 2. Variáveis de ambiente
cp .env.example .env
# Editar DATABASE_URL e secrets

# 3. Instalar + migrar
npm install
npx prisma generate
npx prisma migrate dev

# 4. Arrancar
npm run dev
# → http://localhost:7331
```

Para integração BuildFlow local (SSO ControlHub → Despesas):
- ControlHub local em `:3000`
- Despesas local em `:7331`
- `BUILDFLOW_PLATFORM_SECRET` igual em ambos os `.env.local`
- `AppInstance.apiBaseUrl` no ControlHub aponta para `http://localhost:7331`

Ver `docs/E2E_SMOKE.md` (próximo) para o fluxo completo.

## Repositório e licença

- **Repo:** `GimMarSil/Invoices_Expenses` (a renomear para `GimMarSil/buildflow-despesas`)
- **Deploy:** GitHub Actions → SSH para `77.42.26.248` → Docker compose
- **Licença:** MIT (ver [LICENSE](./LICENSE))

## Origem

Este projeto começou como fork do [TaxHacker](https://github.com/vas3k/TaxHacker) de Vasily Zubarev (MIT). Desde então divergiu substancialmente para servir o mercado português e a integração BuildFlow.

Ver [MIGRATION_FROM_TAXHACKER.md](./MIGRATION_FROM_TAXHACKER.md) para a história completa do fork e o que mudou.
