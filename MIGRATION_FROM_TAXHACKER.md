# Migration From TaxHacker — Fork History

Este documento existe para preservar contexto: o que foi herdado, o que mudou, o que foi adicionado de raiz.

## Origem

- **Upstream:** [vas3k/TaxHacker](https://github.com/vas3k/TaxHacker) por Vasily Zubarev
- **Licença upstream:** MIT
- **Fork iniciado:** março 2026 (versão 0.3.x do upstream)
- **Última sincronização com upstream:** abril 2026 (até v0.5.5)
- **Situação atual:** **fork descontinuado da sincronização upstream** — o produto BuildFlow Despesas é agora mantido independentemente.

## Por que fizemos fork

O TaxHacker é uma excelente base de gestão de despesas + OCR multi-AI multi-moeda, mas:

1. **Não tem conformidade fiscal portuguesa** — sem SAF-T PT, ATCUD, QR Code, validação NIF, regras de dedutibilidade IRS/IRC, calendário fiscal AT
2. **Foi desenhado para utilizador único self-hosted** — não para multi-tenant via plataforma
3. **Não tem API para integração externa** (SSO, provisionamento, widgets)
4. **Não tem suporte para regras de IVA portuguesas** (taxas 6/13/23%, regimes, isenções)

Em vez de reescrever, fizemos fork — herdando o motor de OCR, o data model base, o UI do dashboard e o sistema de upload — e construímos por cima a camada portuguesa + a integração com a plataforma BuildFlow.

## O que foi mantido do upstream

- Estrutura Next.js 15 + Prisma + better-auth
- Sistema de OCR via LangChain (OpenAI/Google/Mistral)
- Modelo de dados base: `Transaction`, `User`, `Category`, custom fields
- UI do dashboard, settings, upload, listing
- Self-hosted mode (`SELF_HOSTED_MODE=true`) — preservado para clientes que prefiram correr no seu próprio servidor
- Stripe integration para self-hosted billing
- Resend para emails
- Docker + docker-compose para deployment

## O que foi adicionado de raiz pelo BuildFlow

### Camada fiscal portuguesa (`lib/fiscal/`, `lib/nif.ts`)
- `saft/` — exportação SAF-T PT conforme Portaria 321-A/2007
- `atcud.ts` — geração de Código Único do Documento
- `qrcode.ts`, `qrcode-extract.ts`, `qrcode-reader.ts` — QR Code fiscal Portaria 195/2020
- `hash-chain.ts` — cadeia de hashes para integridade fiscal
- `at-portal.ts` — integração com portal Autoridade Tributária
- `deductibility.ts` — lógica de dedutibilidade IRS/IRC por categoria
- `calendar.ts` — calendário de obrigações fiscais
- `document-types.ts` — taxonomia oficial AT (FT, FR, NC, ND, RG, ...)
- `nif.ts` — validação NIF módulo 11

### Integração BuildFlow (`app/api/buildflow/`, `buildflow/manifest.ts`)
- `auth/exchange/route.ts` — SSO token exchange (JWT 30s TTL)
- `tenants/provision/route.ts` — provisionamento de novo workspace
- `users/sync/route.ts` — sincronização de eventos de utilizador
- `widgets/route.ts` — dados para dashboard ControlHub
- `stats/route.ts`, `transactions/route.ts`, `iva-report/route.ts`, `saft/route.ts`, `health/route.ts`
- `middleware.ts` — auth dual (API key server-to-server + sessão para iframe)
- `manifest.ts` — declaração de capacidades do módulo

### Schema (`prisma/schema.prisma`)
- `User.externalId` — mapeia user ID do ControlHub para SSO
- `User.externalTenantId` + `User.tenantId` — multi-tenant ready
- `User.membershipPlan` — plano BuildFlow do user
- `Transaction.atcud`, `Transaction.qrCode`, `Transaction.hashChain` — campos fiscais
- `FiscalEntity` — entidades fiscais (empresa do utilizador, fornecedores)
- `TaxTable` — tabelas de IVA aplicáveis

### Config & Deploy
- `docker-compose.buildflow.yml` — deploy em modo BuildFlow (per-tenant container)
- `BUILDFLOW_MODULE=true` env var para distinguir modo
- `BUILDFLOW_PLATFORM_SECRET` para SSO
- `BUILDFLOW_API_KEY` para chamadas server-to-server

## O que foi modificado vs upstream

- **Locale default:** `pt-PT` (era `en-US`)
- **Cookie session prefix:** `ledge` (legado do nome upstream — manter por compatibilidade até próxima migration)
- **Cores e branding:** identidade BuildFlow
- **Categorias default:** seed inclui categorias fiscais PT (Viagens, Refeições, Software, ...)
- **Campos custom:** alguns adicionais para conformidade PT (NIF do fornecedor, ATCUD, série)

## Por que não fazemos mais sync com upstream

1. **Divergência de scope** — upstream é generalista mundial, este é especificamente PT
2. **Schema divergente** — campos adicionados quebram migrations one-way
3. **Endpoints novos** (`/api/buildflow/*`) que upstream não conhece
4. **Risco de regressão fiscal** — mudanças upstream poderiam quebrar SAF-T/ATCUD sem aviso
5. **Velocidade** — precisamos iterar rápido para clientes PT, sem dependência do calendário do vas3k

Mantemos copyright do upstream no `LICENSE` (obrigação MIT) e este documento como reconhecimento.

## Roadmap não-herdado (BuildFlow-specific)

- Comunicação real-time à AT (e-fatura, FRT, RGS)
- Integração chave-móvel-digital para autenticação fiscal
- Importação de extrato bancário (CGD, Millennium, BCP, Santander) para reconciliação
- Geração de Modelo 22 / IES auxiliares
- Multi-empresa por user (gestor de várias entidades fiscais no mesmo workspace)
- App mobile companion (captura via foto)

## Como atualizar este documento

Sempre que adicionares uma feature significativa que **não vinha do upstream**, regista-a aqui na secção apropriada. Quando *removeres* algo do upstream, regista também — para um futuro engenheiro entender o que se perdeu intencionalmente.
