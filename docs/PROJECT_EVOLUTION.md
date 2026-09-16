# JulisHub — Project Evolution

## Product Definition

JulisHub é uma aplicação financeira fullstack pessoal, com mercados, indicadores, calculadoras, notícias e conteúdo educacional. O produto existente será preservado e evoluído com prioridade para confiabilidade, correção dos dados e clareza operacional.

## Current Architecture

- Frontend: React 18, TypeScript, Vite 5, Tailwind, shadcn/ui, React Router, i18next e Recharts.
- Backend: FastAPI com routers por domínio (`markets`, `calculators`, `news` e `blog`).
- Integrações: AwesomeAPI, CoinGecko, HG Brasil, Banco Central do Brasil e Google News RSS.
- Estado/cache: `localStorage` no frontend e caches globais em memória no backend.
- Deploy identificado: frontend na Vercel e backend configurado no frontend para Render.

## Current Status

Sprint 0A concluída localmente. O build de produção é gerado e o backend compila/importa, mas lint e verificação TypeScript têm falhas. A produção está acessível; durante a auditoria, o endpoint de câmbio respondeu HTTP 200 com todos os valores zerados. Não há suíte automatizada configurada.

## Known Issues

| ID | Priority | Category | Issue | Evidence | Status |
|---|---|---|---|---|---|
| JH-001 | P1 | Production | Falhas de providers podem virar HTTP 200 com valores zero e ser exibidas/cacheadas como dados válidos. | Fallbacks de `markets.py`; validação do cache considera textos/labels; `/api/exchange-rates` em produção retornou todos os campos numéricos zerados. | Open |
| JH-002 | P1 | Product/Data Correctness | Índices de Argentina e EUA são valores fixos, embora a interface os apresente no contexto de mercado em tempo real. | Endpoints `/api/indexes/argentina` e `/api/indexes/usa`. | Open |
| JH-003 | P1 | Product/Data Correctness | Calculadora de salário usa tabelas de INSS/IRRF explicitamente rotuladas como 2024. | `routers/calculators.py`. | Open |
| JH-004 | P1 | Production | Primeiras chamadas ao backend de produção excederam 30 s; após aquecimento, responderam em menos de 1,1 s. | Smoke test HTTP do backend Render em 2026-09-16. | Open |
| JH-005 | P1 | API/Integration | Não há retries; o RSS não possui timeout explícito e há caminhos sequenciais de provider/fallback que acumulam latência. | `routers/markets.py` e `routers/news.py`. | Open |
| JH-006 | P2 | Error Handling | Estados de erro/indisponibilidade são inconsistentes; algumas telas convertem falha em vazio, zero ou apenas console. | Markets, News, Blog e ExchangeCalculator. | Open |
| JH-007 | P2 | Technical Debt | Baseline estático falha: ESLint reporta 22 erros/9 warnings e TypeScript reporta 2 erros. | Execuções da Sprint 0A. | Open |
| JH-008 | P2 | Reliability | Nenhuma suíte automatizada configurada no projeto. | Ausência de script/framework/arquivos de teste. | Open |
| JH-009 | P2 | Documentation | README e documentos históricos divergem do código/deploy atual e contêm conteúdo duplicado ou truncado. | README descreve backend Vercel, mock inexistente e timeouts divergentes; produção usa Render. | Open |
| JH-010 | P2 | Performance | Bundle principal excede o limite de aviso do Vite. | JS minificado de 1.121,55 kB (330,27 kB gzip). | Open |
| JH-011 | P3 | Repository Hygiene | Há backup e artefatos legados/mortos, além de dois lockfiles. | `MarketsOld.tsx.bak`, `marketService.ts`, `MarketCard.tsx`, `package-lock.json` e `bun.lockb`. | Open |
| JH-012 | P3 | Portfolio Readiness | Metadados residuais referenciam `@FinHubPro` e ativos hospedados em `gpt-engineer-file-uploads`; nome do pacote ainda é genérico. | `index.html` e `package.json`. | Open |
| JH-013 | P3 | Error Handling | Cooldown de refresh manual não persiste como pretendido. | Timestamp só é atualizado se uma chave de cache que não é criada já existir. | Open |

## Technical Baseline

### Frontend

- Node esperado: não definido no repositório; ambiente auditado: Node 24.11.0 e npm 11.6.1.
- Lockfiles presentes: npm e Bun; scripts: `dev`, `build`, `build:dev`, `lint`, `preview`, `backend:start` e `start`.
- ESLint: 22 erros e 9 warnings.
- TypeScript (`tsc -b`): 2 erros.

### Backend

- README declara Python 3.12+; ambiente auditado: Python 3.14.2.
- Dependências não fixadas em `requirements.txt`.
- `compileall` e importação da aplicação: aprovados.
- Endpoints esperados pelo frontend estão expostos pelo FastAPI.
- CORS inclui o frontend de produção identificado.

### Tests

Nenhuma suíte automatizada configurada no projeto.

### Build

- `npm run build`: concluído com sucesso.
- Avisos: bundle principal acima de 500 kB e base Browserslist com nove meses.

### Deployment

- Frontend identificado e acessível em `https://julishub.vercel.app`.
- Bundle publicado contém `https://julis-hub-api.onrender.com` como backend.
- Rotas SPA com refresh direto responderam HTTP 200.
- O domínio alternativo `https://julis-hub.vercel.app` respondeu 404 e permanece apenas como origem CORS residual.

## Decisions

- JulisHub será evoluído, não refeito do zero.
- Continuará sendo uma aplicação financeira.
- Não será convertido em site de Solution Architecture.
- Projetos de arquitetura poderão existir separadamente.
- Confiabilidade e correção precedem refinamento visual.

## Sprint History

### Sprint 0A — Technical & Product Health Assessment

Status:
Concluída localmente — revisão dos achados pendente.

Entregas:
- baseline técnico;
- inventário inicial;
- análise de produção;
- backlog priorizado.

## Roadmap

1. Production & API Reliability — JH-001, JH-004, JH-005, JH-006 e JH-013.
2. Functional & Data Correctness — JH-002 e JH-003.
3. Quality Baseline & Tests — JH-007 e JH-008.
4. Documentation & Repository Hygiene — JH-009 e JH-011.
5. Performance & UX Cleanup — JH-006 e JH-010.
6. Visual Polish & Portfolio Readiness — JH-012.

## Next Sprint

**Sprint 0B — Production & API Reliability:** tornar indisponibilidade, timeout e fallback semanticamente distintos de zero; validar o comportamento de cold start e estabelecer respostas observáveis sem alterar dados silenciosamente.
