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

Sprint 0C implementada localmente, com validação de produção pendente. MERVAL, S&P 500, Dow Jones e Nasdaq Composite agora usam dados estruturados do Yahoo Finance; os números fixos foram removidos. O BURCAP permanece explicitamente indisponível por não haver fonte simples e confiável dentro das restrições da sprint.

## Known Issues

| ID | Priority | Category | Issue | Evidence | Status |
|---|---|---|---|---|---|
| JH-001 | P1 | Production | Falhas de providers podem virar HTTP 200 com valores zero e ser exibidas/cacheadas como dados válidos. | Fallbacks numéricos removidos; sem cache, falha total retorna 503; payloads recebem validação por contrato. | Resolved locally — production validation pending |
| JH-002 | P1 | Product/Data Correctness | Índices de Argentina e EUA eram valores fixos, embora a interface os apresentasse no contexto de mercado em tempo real. | MERVAL (`^MERV`), S&P 500 (`^GSPC`), Dow Jones (`^DJI`) e Nasdaq Composite (`^IXIC`) usam Yahoo Finance; BURCAP fica explicitamente indisponível e nenhum hardcode permanece como fallback. | Resolved locally — production validation pending |
| JH-003 | P1 | Product/Data Correctness | Calculadora de salário usa tabelas de INSS/IRRF explicitamente rotuladas como 2024. | `routers/calculators.py`. | Open |
| JH-004 | P1 | Production | Primeiras chamadas ao backend de produção excederam 30 s; após aquecimento, responderam em menos de 1,1 s. | Frontend limitado a 20 s por tentativa e uma segunda tentativa transitória; cold start da hospedagem não foi alterado. | Partially resolved — post-deploy validation pending |
| JH-005 | P1 | API/Integration | Não há retries; o RSS não possui timeout explícito e há caminhos sequenciais de provider/fallback que acumulam latência. | Retry do cliente limitado a uma tentativa adicional; RSS usa timeout de conexão/leitura; fallback real sequencial foi preservado. | Resolved locally — production validation pending |
| JH-006 | P2 | Error Handling | Estados de erro/indisponibilidade são inconsistentes; algumas telas convertem falha em vazio, zero ou apenas console. | Markets, Indicators, News e ExchangeCalculator agora distinguem loading, stale e indisponibilidade; Blog não pertenceu ao escopo da Sprint 0B. | Partially resolved |
| JH-007 | P2 | Technical Debt | Baseline estático falha: ESLint reporta 22 erros/9 warnings e TypeScript reporta 2 erros. | Execuções da Sprint 0A. | Open |
| JH-008 | P2 | Reliability | Não existe uma suíte automatizada abrangente para o produto. | Sprint 0B adicionou apenas nove testes backend focados na semântica de providers/cache; cobertura ampla continua pendente. | Open |
| JH-009 | P2 | Documentation | README e documentos históricos divergem do código/deploy atual e contêm conteúdo duplicado ou truncado. | README descreve backend Vercel, mock inexistente e timeouts divergentes; produção usa Render. | Open |
| JH-010 | P2 | Performance | Bundle principal excede o limite de aviso do Vite. | JS minificado de 1.121,55 kB (330,27 kB gzip). | Open |
| JH-011 | P3 | Repository Hygiene | Há backup e artefatos legados/mortos, além de dois lockfiles. | `MarketsOld.tsx.bak`, `marketService.ts`, `MarketCard.tsx`, `package-lock.json` e `bun.lockb`. | Open |
| JH-012 | P3 | Portfolio Readiness | Metadados residuais referenciam `@FinHubPro` e ativos hospedados em `gpt-engineer-file-uploads`; nome do pacote ainda é genérico. | `index.html` e `package.json`. | Open |
| JH-013 | P3 | Error Handling | Cooldown de refresh manual não persiste como pretendido. | Timestamp agora possui chave versionada própria, criada no início de cada refresh manual em Markets e News. | Resolved locally |

## Technical Baseline

### Frontend

- Node esperado: não definido no repositório; ambiente auditado: Node 24.11.0 e npm 11.6.1.
- Lockfiles presentes: npm e Bun; scripts: `dev`, `build`, `build:dev`, `lint`, `preview`, `backend:start` e `start`.
- ESLint após Sprint 0B: 14 erros e 8 warnings; nenhuma falha nova nos arquivos tocados.
- TypeScript (`tsc -b`): 2 erros.

### Backend

- README declara Python 3.12+; ambiente auditado: Python 3.14.2.
- Dependências não fixadas em `requirements.txt`.
- `compileall` e importação da aplicação: aprovados.
- Endpoints esperados pelo frontend estão expostos pelo FastAPI.
- CORS inclui o frontend de produção identificado.

### Tests

- Quinze testes `unittest` focados em provider válido, fallback real, falha total, 503, zero legítimo, stale cache, News e integridade dos índices de Argentina/EUA.
- A suíte abrangente de produto permanece pendente em JH-008.

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
- Indisponibilidade operacional nunca é representada por zero.
- Requests do frontend usam timeout de 20 segundos por tentativa e no máximo um retry após 1 segundo, somente para rede/timeout/502/503/504.
- Somente payload aprovado por validador específico substitui o last-known-good.
- Falha de atualização preserva cache anterior como stale; ausência de cache resulta em indisponibilidade explícita.
- MERVAL, S&P 500, Dow Jones e Nasdaq Composite usam o endpoint estruturado de gráficos do Yahoo Finance, sem credencial ou nova dependência.
- BURCAP não é substituído por outro índice nem recebe valor fictício; permanece explicitamente indisponível até existir fonte adequada.

## Sprint History

### Sprint 0A — Technical & Product Health Assessment

Status:
Concluída localmente — revisão dos achados pendente.

Entregas:
- baseline técnico;
- inventário inicial;
- análise de produção;
- backlog priorizado.

### Sprint 0B — Production & API Reliability

Status:
Implementada localmente — validação de produção pendente.

Entregas:
- HTTP 503 sem zeros fabricados quando providers falham e não há cache;
- timeout e retry transitório limitado no frontend;
- cache versionado, validado e preservado como stale;
- estados traduzidos de loading, indisponibilidade e stale;
- cooldown persistente de refresh manual;
- testes backend focados em confiabilidade.

### Sprint 0C — Market Index Data Integrity

Status:
Implementada localmente — validação de produção pendente.

Entregas:
- remoção dos valores hardcoded de Argentina e Estados Unidos;
- MERVAL, S&P 500, Dow Jones e Nasdaq Composite integrados ao Yahoo Finance;
- BURCAP explicitamente indisponível, sem substituição por outro índice;
- cache separado e stale por mercado;
- testes focados em valor real, falha, stale, payload inválido e zero legítimo.

## Roadmap

1. Post-deploy Reliability Validation — JH-001, JH-004 e JH-005.
2. Functional & Data Correctness — JH-003.
3. Quality Baseline & Tests — JH-007 e JH-008.
4. Documentation & Repository Hygiene — JH-009 e JH-011.
5. Performance & UX Cleanup — JH-006 e JH-010.
6. Visual Polish & Portfolio Readiness — JH-012.

## Next Sprint

**Functional & Data Correctness:** resolver JH-003 após as validações pós-deploy pendentes.
