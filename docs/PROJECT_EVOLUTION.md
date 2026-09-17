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

Sprint 0H concluída localmente. A identidade técnica e os metadados públicos usam JulisHub, favicon local e descrições factuais; a fase Sprint 0 está encerrada com validação pós-deploy ainda pendente.

## Known Issues

| ID | Priority | Category | Issue | Evidence | Status |
|---|---|---|---|---|---|
| JH-001 | P1 | Production | Falhas de providers podem virar HTTP 200 com valores zero e ser exibidas/cacheadas como dados válidos. | Fallbacks numéricos removidos; sem cache, falha total retorna 503; payloads recebem validação por contrato. Esse comportamento foi validado em produção. | Validated in production for zero/503 behavior |
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
| JH-012 | P3 | Portfolio Readiness | A identidade técnica, o favicon e os metadados públicos continham referências herdadas. | Package identificado como `julishub`; favicon local; title, description, Open Graph e Twitter alinhados ao produto, sem ativos sociais externos residuais. | Resolved |
| JH-013 | P3 | Error Handling | Cooldown de refresh manual não persiste como pretendido. | Timestamp agora possui chave versionada própria, criada no início de cada refresh manual em Markets e News. | Resolved locally |
| JH-014 | P1 | API/Integration | Exchange rates usam contrato all-or-nothing, permitindo que uma falha de provider ou par torne todos os dados indisponíveis. | R2 foi validado em produção: respostas parciais retornam HTTP 200 e o frontend renderiza somente as taxas disponíveis. | Resolved in production |
| JH-015 | P1 | API/Integration | AwesomeAPI não disponibiliza taxas fiat no backend de produção, deixando conversões fiat ordinárias indisponíveis. | Produção após R2 retornou somente BTC da CoinGecko; R3 mantém AwesomeAPI como primária e adiciona Yahoo Finance como fallback de taxas fiat. | Resolved locally — production validation pending |

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
- A identidade técnica do package é `julishub`; sem imagem raster local adequada, os metadados sociais não declaram imagem.

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

### Sprint 0H — Product Identity & Portfolio Readiness

Status:
Concluída localmente.

Entregas:
- package renomeado para `julishub`, com lockfile raiz consistente;
- favicon local configurado;
- metadados base, Open Graph e Twitter alinhados à identidade atual;
- remoção de handles e ativos externos herdados;
- fallback estático de idioma ajustado para `pt-BR`, preservando a atualização dinâmica por rota.

## Sprint 0 Closure

Status:
Technical & Product Health Assessment completed.

Baseline:
- ESLint: 0 errors / 0 warnings
- TypeScript: 0 errors
- Build: passing
- Tests: 27+ passing

Completed areas:
- reliability;
- data correctness;
- static quality;
- documentation;
- repository hygiene;
- frontend performance;
- product metadata and identity.

Operational validation pending:
- post-deploy smoke for reliability/data changes from Sprints 0B–0D.

Next phase:
Sprint 1 — UX & Visual Assessment.

## Roadmap

1. Post-deploy Reliability Validation — JH-001, JH-004 e JH-005.
2. Quality Baseline & Tests — JH-008.
3. UX Cleanup — JH-006.

## Next Phase

**Sprint 1 — UX & Visual Assessment.**

## Sprint 1A — UX & Visual Assessment

Status:
Concluída — avaliação da experiência renderizada em desktop e mobile, nos idiomas pt-BR, en e es; nenhum código de produto foi alterado.

New findings:

| ID | Priority | Category | Finding | Status |
|---|---|---|---|---|
| JH-016 | P1 | Data Trust / Content | Afirmações de dados “em tempo real”, “oficiais” e “100%” são absolutas e entram em conflito com cache, providers externos e estados stale/indisponível. | Resolved locally — Sprint 1B removed scoped absolute claims and the Home quality statistic |
| JH-017 | P1 | Content | Indicadores, conversor de câmbio e partes do blog/post têm texto fixo em português ou inglês, produzindo experiência híbrida em en/es. | Resolved locally — Sprint 1B localized scoped interface copy in pt-BR, en and es |
| JH-018 | P2 | Data Trust | Origem, atualização e natureza derivada/estimada dos dados são comunicadas de formas diferentes entre mercados, indicadores, notícias e conversor. | Resolved locally — Sprint 1C applies shared current/stale/external-unavailable trust messaging to scoped data screens |
| JH-019 | P2 | Visual System | Cards, cores semânticas, superfícies e tratamento de estados variam por tela em vez de derivarem de padrões compartilhados. | Resolved locally — Sprint 1E aligns primary workspace surfaces, spacing and restrained semantic accents |
| JH-020 | P2 | Navigation / Responsive | Header desktop fica denso em larguras intermediárias; a troca para menu mobile acontece tarde para seis destinos, três idiomas e tema. | Resolved locally — Sprint 1D transitions to the existing mobile sheet before the desktop navigation becomes cramped |
| JH-021 | P2 | Calculators / Responsive | As quatro abas de calculadoras ficam apertadas em 360 px e a hierarquia entre formulário, resultado e gráfico não é padronizada entre ferramentas. | Resolved locally — Sprint 1F adds adaptive tabs and aligns calculator workspace hierarchy |
| JH-022 | P2 | Feedback States | Skeletons, aviso de lentidão, refresh e estados vazios existem, mas a ação de refresh depende de ícone/tooltip e o estado persistente de atualização não é consistente. | Resolved locally — Sprint 1C unifies freshness/degraded messaging and adds refresh accessible names |
| JH-023 | P2 | Blog | Falha de carregamento de artigo pode parecer “não encontrado”; credencial de autor, leitura e compartilhamento contêm cópia fixa e/ou não localizada. | Resolved locally — Sprint 1G distinguishes explicit 404 from temporary article failures and preserves loaded articles when related content fails |
| JH-024 | P2 | Home | Cinco cards formam uma grade 4+1 em desktop e a segunda CTA/estatísticas reiteram a mesma promessa antes de levar o usuário ao produto. | Resolved locally — Sprint 1B removed statistics; Sprint 1D removes the duplicate CTA and balances the product-entry grid |
| JH-025 | P3 | Accessibility | Alguns controles somente com ícone dependem de `title`; contraste de textos em superfícies coloridas e indicação de foco precisam de checagem visual compartilhada. | Resolved locally — Sprint 1G adds scoped accessible names, native article links, and focus-visible treatment |

Preserve decisions:

- Preservar a estrutura de produto atual: Home, mercados, indicadores, calculadoras, notícias e conteúdo educacional.
- Preservar navegação por rotas, menu lateral mobile, tema claro/escuro e controle visível de idioma.
- Preservar o padrão de cards, skeletons e avisos explícitos para loading, stale e indisponibilidade; a evolução é de consistência, não de substituição.
- Preservar calculadoras por abas e resultados detalhados, gráficos responsivos e separação visual entre dados positivos, alerta e erro.
- Preservar o Blog como experiência editorial com busca, cards, tags e artigo em leitura longa.

Proposed Sprint 1 implementation roadmap:

1. **Sprint 1B — Foundations, language and data trust**: consolidar tokens/padrões de cards e feedback, tornar a cópia PT-BR/en/es completa e substituir promessas absolutas por origem/atualização contextual. Findings: JH-016, JH-017, JH-018, JH-019, JH-022, JH-025. Areas: `index.css`, componentes UI/`DataState`, traduções, Markets, Indicators, News e `ExchangeCalculator`.
2. **Sprint 1C — Entry point and navigation**: ajustar hierarquia/grade da Home e densidade/responsividade da navegação sem mudar a estrutura do produto. Findings: JH-020, JH-024. Areas: `Index`, `Header`, `Navigation`, `MobileNav`, `Footer`.
3. **Sprint 1D — Financial workspaces**: padronizar abas, formulários, resultados, gráficos e ações de refresh das telas financeiras. Findings: JH-018, JH-021, JH-022. Areas: Markets, Indicators, Calculators e `ExchangeCalculator`.
4. **Sprint 1E — Editorial and responsive polish**: corrigir feedback/cópia do Blog e validar os ajustes de conteúdo em mobile. Findings: JH-017, JH-023, JH-025. Areas: BlogList, BlogPost, PrivacyPolicy e traduções.

### Sprint 1B — Copy & Localization Baseline

Status:
Concluída localmente.

Entregas:
- remoção, nas superfícies avaliadas, de promessas absolutas de dados em tempo real/oficiais e da estatística `100%` da Home;
- descrições factuais para Home, Markets, Indicators e referências de câmbio;
- CDI explicitamente identificado como estimativa;
- cópia de Indicators, Exchange Calculator e metadados/controles de Blog Post localizada em pt-BR, en e es;
- conteúdo armazenado dos artigos preservado no idioma de origem, sem tradução artificial;
- ESLint, TypeScript e build aprovados localmente.

### Sprint 1C — Data Trust & Feedback States

Status:
Concluída localmente.

Entregas:
- `DataFreshness` compartilhado para indicar a atualização do cache/fetch em dados atuais;
- alerta stale esclarece que os dados exibidos são os últimos válidos em cache e que a atualização falhou;
- indisponibilidade de dados externos comunica a dependência de fontes externas, sem expor detalhes de provider;
- Markets aplica o padrão por aba; Indicators preserva datas de referência SELIC/IPCA separadas da atualização frontend; News e Exchange Calculator seguem o mesmo padrão;
- ações compactas de refresh em Markets e News recebem `aria-label` e estado `aria-busy`;
- mensagens adicionadas em pt-BR, en e es, sem alteração de APIs, cache, providers ou cálculos.

### Sprint 1D — Home & Navigation Refinement

Status:
Concluída localmente.

Entregas:
- Home simplificada para hero com duas entradas de alto valor e grade de áreas do produto, sem métricas ou CTA promocional duplicada;
- grade de cinco cards ajustada para três colunas com segunda linha centralizada e anatomia de CTA alinhada;
- navegação desktop passa a usar o menu lateral existente antes de larguras intermediárias ficarem comprimidas;
- idiomas, tema, rotas e estado ativo foram preservados; não houve alteração de telas financeiras, APIs ou backend.

### Sprint 1E — Shared Visual-System Consistency

Status:
Concluída localmente.

Entregas:
- baseline de workspaces: cabeçalhos existentes, superfícies `bg-card`, bordas neutras, ritmo de `CardHeader`/conteúdo e hover discreto;
- Markets, Indicators, News, superfícies externas das Calculators e Exchange Calculator alinhados sem alterar dados, cálculos, estruturas de abas ou estados de confiança;
- gradientes decorativos e superfícies regionais fortes reduzidos a cartões neutros com acentos contidos; variações positivas/negativas, alertas e distinções editoriais foram preservados;
- `DataFreshness`, estados stale/indisponível/lento e comportamento de retry permanecem semanticamente inalterados;
- a reestruturação responsiva e de hierarquia das Calculators continua em JH-021.

### Sprint 1F — Calculator Workspace Refinement

Status:
Concluída localmente.

Entregas:
- Tabs adaptativas em duas colunas em telas estreitas e quatro colunas a partir de `sm`, com alvos de toque e rótulos íntegros;
- fluxo consistente de formulário, ação primária, resultado dominante e detalhes secundários para investimentos, financiamento, salário e câmbio;
- resultados e estados vazios adaptados para largura estreita; gráfico de investimentos permanece responsivo;
- histórico, comparação, persistência local, dados do gráfico, cálculos e os estados de confiança do conversor foram preservados.

### Sprint 1G — Editorial Reliability & Accessibility Polish

Status:
Concluída localmente.

Entregas:
- Blog Post diferencia 404 explícito de indisponibilidade temporária/inesperada, com retry e retorno ao Blog; a falha de relacionados não invalida o artigo principal;
- metadados editoriais e controles fixos permanecem localizados em pt-BR, en e es; tempo de leitura é apresentado como estimativa; tags são apresentacionais;
- cards de artigos usam links nativos com foco visível; controles somente por ícone no escopo recebem nomes acessíveis;
- esta é uma linha de base de acessibilidade do produto, não uma certificação WCAG.

### Sprint 1 — Implementation Closure

Status:
Concluída localmente, com smoke pós-deploy e responsivo/acessível ainda pendente.

Resumo:
- cópia e localização do produto, confiança/feedback de dados, hierarquia de Home/navegação, consistência visual, responsividade das calculadoras, confiabilidade editorial e linha de base de acessibilidade foram refinadas;
- não representa conformidade integral de acessibilidade, SLA de produção ou tradução de corpos de artigos.
