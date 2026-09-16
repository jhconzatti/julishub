# JulisHub — Project Evolution

## Product Definition

JulisHub é uma aplicação financeira fullstack pessoal, com mercados, indicadores, calculadoras, notícias e conteúdo educacional. O produto existente será preservado e evoluído com prioridade para confiabilidade, correção dos dados e clareza operacional.

## Current Architecture

- Frontend: React 18, TypeScript, Vite 5, Tailwind, shadcn/ui, React Router, i18next e Recharts.
- Backend: FastAPI com routers por domínio (`markets`, `calculators`, `news` e `blog`).
- Integrações: AwesomeAPI, CoinGecko, HG Brasil, Banco Central do Brasil, Yahoo Finance e Google News RSS.
- Estado/cache: `localStorage` no frontend e caches globais em memória no backend.
- Deploy identificado: frontend na Vercel e backend configurado no frontend para Render.

## Current Status

Sprint 0G concluída localmente. As views de Markets, Calculators, Indicators, News, Blog e Privacy são carregadas sob demanda por rota; o entry JavaScript caiu de 1.124,48 kB para 450,95 kB minificados.

## Known Issues

| ID | Priority | Category | Issue | Evidence | Status |
|---|---|---|---|---|---|
| JH-001 | P1 | Production | Falhas de providers podem virar HTTP 200 com valores zero e ser exibidas/cacheadas como dados válidos. | Fallbacks numéricos removidos; sem cache, falha total retorna 503; payloads recebem validação por contrato. | Resolved locally — production validation pending |
| JH-002 | P1 | Product/Data Correctness | Índices de Argentina e EUA eram valores fixos, embora a interface os apresentasse no contexto de mercado em tempo real. | MERVAL (`^MERV`), S&P 500 (`^GSPC`), Dow Jones (`^DJI`) e Nasdaq Composite (`^IXIC`) usam Yahoo Finance; BURCAP fica explicitamente indisponível e nenhum hardcode permanece como fallback. | Resolved locally — production validation pending |
| JH-003 | P1 | Product/Data Correctness | Calculadora de salário usava tabelas de INSS/IRRF explicitamente rotuladas como 2024. | INSS progressivo, teto previdenciário, deduções e redução mensal de IRRF atualizados para 2026; casos de R$ 4.000, R$ 5.000 e R$ 6.000 cobertos por testes e smoke local. | Resolved locally — production validation pending |
| JH-004 | P1 | Production | Primeiras chamadas ao backend de produção excederam 30 s; após aquecimento, responderam em menos de 1,1 s. | Frontend limitado a 20 s por tentativa e uma segunda tentativa transitória; cold start da hospedagem não foi alterado. | Partially resolved — post-deploy validation pending |
| JH-005 | P1 | API/Integration | Não há retries; o RSS não possui timeout explícito e há caminhos sequenciais de provider/fallback que acumulam latência. | Retry do cliente limitado a uma tentativa adicional; RSS usa timeout de conexão/leitura; fallback real sequencial foi preservado. | Resolved locally — production validation pending |
| JH-006 | P2 | Error Handling | Estados de erro/indisponibilidade são inconsistentes; algumas telas convertem falha em vazio, zero ou apenas console. | Markets, Indicators, News e ExchangeCalculator agora distinguem loading, stale e indisponibilidade; Blog não pertenceu ao escopo da Sprint 0B. | Partially resolved |
| JH-007 | P2 | Technical Debt | Baseline estático falhava com erros e warnings de ESLint e dois erros TypeScript. | Sprint 0E: ESLint 0 erros/0 warnings, TypeScript 0 erros e build aprovado. | Resolved |
| JH-008 | P2 | Reliability | Não existe uma suíte automatizada abrangente para o produto. | Há 27 testes backend focados em confiabilidade, mercados e salário CLT; cobertura ampla de frontend e dos demais domínios continua pendente. | Open |
| JH-009 | P2 | Documentation | README e documentos históricos divergiam do código/deploy atual e continham conteúdo duplicado ou truncado. | README reestruturado com arquitetura React/Vercel + FastAPI/Render, providers atuais, execução local, qualidade e política de confiabilidade. | Resolved |
| JH-010 | P2 | Performance | Bundle principal excedia o limite de aviso do Vite e carregava antecipadamente views independentes. | Lazy loading por rota reduziu o entry de 1.124,48 kB (331,52 kB gzip) para 450,95 kB (142,74 kB gzip); o aviso de chunk acima de 500 kB deixou de ocorrer. | Resolved |
| JH-011 | P3 | Repository Hygiene | Havia backup e artefatos legados sem uso, além de dois lockfiles. | `MarketsOld.tsx.bak`, `marketService.ts`, `MarketCard.tsx` e `bun.lockb` removidos após busca sem referências; `package-lock.json` preservado para npm. | Resolved |
| JH-012 | P3 | Portfolio Readiness | Metadados residuais referenciam `@FinHubPro` e ativos hospedados em `gpt-engineer-file-uploads`; nome do pacote ainda é genérico. | `index.html` e `package.json`. | Open |
| JH-013 | P3 | Error Handling | Cooldown de refresh manual não persiste como pretendido. | Timestamp agora possui chave versionada própria, criada no início de cada refresh manual em Markets e News. | Resolved locally |

## Technical Baseline

### Frontend

- Node esperado: não definido no repositório; ambiente auditado: Node 24.11.0 e npm 11.6.1.
- Package manager oficial: npm; `package-lock.json` é o único lockfile. Scripts: `dev`, `build`, `build:dev`, `lint`, `preview`, `backend:start` e `start`.
- ESLint após Sprint 0E: 0 erros e 0 warnings.
- TypeScript (`tsc -b`) após Sprint 0E: 0 erros.

### Backend

- README declara Python 3.12+; ambiente auditado: Python 3.14.2.
- Dependências não fixadas em `requirements.txt`.
- `compileall` e importação da aplicação: aprovados.
- Endpoints esperados pelo frontend estão expostos pelo FastAPI.
- CORS inclui o frontend de produção identificado.

### Tests

- Vinte e sete testes `unittest`: quinze de confiabilidade/mercados e doze da calculadora CLT 2026.
- A suíte abrangente de produto permanece pendente em JH-008.

### Build

- `npm run build`: concluído com sucesso.
- Entry JavaScript após Sprint 0G: 450,95 kB minificados e 142,74 kB gzip.
- Aviso restante: base Browserslist com nove meses; nenhum chunk excede 500 kB.

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
- A calculadora CLT usa as faixas progressivas de INSS vigentes desde janeiro de 2026; os exemplos previdenciários de 2025 não são usados como referência.
- A base do IRRF usa a maior dedução entre INSS mais dependentes e o desconto simplificado mensal; outros descontos são aplicados somente ao líquido.
- A redução mensal de IRRF segue a Lei 15.270/2025 e utiliza o salário bruto para definir e calcular a redução.
- npm é o package manager oficial; backups de código pertencem ao histórico do Git, não à árvore versionada.
- Views não essenciais à Home são carregadas sob demanda por rota, mantendo a Home no entry inicial.

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

### Sprint 0D — CLT Salary Calculator 2026

Status:
Implementada localmente — validação de produção pendente.

Entregas:
- INSS progressivo com faixas de R$ 1.621,00, R$ 2.902,84, R$ 4.354,27 e teto de R$ 8.475,55;
- IRRF mensal 2026, dedução por dependente de R$ 189,59 e desconto simplificado de R$ 607,20;
- escolha automática da dedução mais vantajosa;
- redução integral até R$ 5.000,00, parcial até R$ 7.350,00 e inexistente acima desse limite;
- validação de entradas não negativas e doze testes específicos;
- referências visuais de 2024 atualizadas para 2026 nos três idiomas.

Casos de referência ajustados às faixas oficiais de INSS 2026:
- R$ 4.000,00: INSS R$ 368,60; IRRF R$ 0,00; líquido R$ 3.631,40;
- R$ 5.000,00: INSS R$ 501,51; IRRF R$ 0,00; líquido R$ 4.498,49;
- R$ 6.000,00: INSS R$ 641,51; IRRF R$ 385,10; líquido R$ 4.973,39.

### Sprint 0E — Static Quality Baseline

Status:
Concluída localmente.

Entregas:
- ESLint reduzido de 14 erros/8 warnings para 0/0;
- TypeScript reduzido de 2 erros para 0;
- tipos explícitos nos resultados das calculadoras e artigos relacionados;
- renderização de Markdown adaptada ao contrato atual do `react-markdown`;
- exports não-componentes separados dos arquivos React necessários ao Fast Refresh;
- configuração Tailwind convertida para imports tipados;
- build e 27 testes aprovados.

### Sprint 0F — Documentation & Repository Hygiene

Status:
Concluída localmente.

Entregas:
- README reestruturado e alinhado ao produto, execução local e deploy atuais;
- frontend documentado na Vercel e backend no Render;
- providers e comportamento de cache/fallback documentados sem promessas absolutas de tempo real;
- npm definido como package manager oficial, com remoção de `bun.lockb`;
- remoção de `MarketsOld.tsx.bak`, `marketService.ts` e `MarketCard.tsx`, todos sem referências na aplicação atual.

### Sprint 0G — Frontend Performance Baseline

Status:
Concluída localmente.

Entregas:
- lazy loading para Markets, Calculators, Indicators, News, BlogList, BlogPost e PrivacyPolicy;
- boundary de Suspense no nível das rotas com fallback acessível e traduzido;
- redução do entry de 1.124,48 kB para 450,95 kB minificados e de 331,52 kB para 142,74 kB gzip;
- geração de chunks independentes por área, sem `manualChunks` e sem novas dependências;
- remoção do aviso de chunk acima de 500 kB no build.

## Roadmap

1. Post-deploy Reliability Validation — JH-001, JH-004 e JH-005.
2. Quality Baseline & Tests — JH-008.
3. UX Cleanup — JH-006.
4. Visual Polish & Portfolio Readiness — JH-012.

## Next Sprint

**Post-deploy Reliability Validation:** validar em produção as entregas locais das Sprints 0B, 0C e 0D antes de avançar para melhorias de qualidade e manutenção.
