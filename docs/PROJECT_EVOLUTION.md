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

Sprint 2 está com implementação completa e validação manual/pós-deploy pendente. O produto evoluiu de correções de base para utilitários financeiros orientados a decisão e contexto histórico de câmbio, sem ampliar o escopo para uma plataforma financeira completa.

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
| JH-026 | P1 | API/Integration | O endpoint histórico respondia `200 []` para instrumento inválido e para falhas de provider/payload/timeout, sem cache, stale ou fallback, impedindo uma leitura confiável em produto. | Sprint 2E substituiu a lista ambígua por contrato estruturado, 404/503 explícitos, cache por instrumento e fallback Yahoo somente para USD/BRL; testes locais aprovados. | Resolved locally — production validation pending |

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

- Cinquenta e oito testes `unittest` aprovados localmente, incluindo confiabilidade/mercados, cálculo CLT e antecipação Price.
- A cobertura automatizada de comportamento frontend e a suíte abrangente de produto permanecem pendentes em JH-008.

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

## Sprint 2A — Product Opportunity Assessment

Status:
Concluída — avaliação de oportunidade sem alteração de código de produto.

Propósito:
Definir o próximo incremento funcional do JulisHub a partir da base atual de mercados, indicadores, calculadoras, notícias e conteúdo, priorizando utilidade financeira, baixo risco operacional e evolução incremental.

Categorias avaliadas:
- planejamento financeiro orientado a objetivo e reserva de emergência;
- profundidade das calculadoras de investimento e financiamento;
- histórico de câmbio e consulta de mercado selecionada pelo usuário;
- exportação/compartilhamento de simulações;
- descoberta contextual entre ferramentas e conteúdo;
- personalização local e possibilidade de dashboard leve.

Shortlist:
1. **Planejador de Reserva e Meta Financeira** — direção recomendada para Sprint 2B. Traduz despesas, reserva existente, prazo/meses de cobertura e aporte em uma meta, prazo estimado e evolução. É uma extensão coerente das calculadoras, não depende de provider e pode começar inteiramente no navegador, com persistência local opcional.
2. **Comparação de amortização de financiamento** — boa continuação por resolver a decisão entre prazo, parcela e aporte extra; exige um contrato de cálculo/testes mais rigoroso e, por isso, fica depois do planejador.
3. **Histórico visual de câmbio** — aproveita a rota já existente para USD/BRL, EUR/BRL e BTC/USD, mas só deve preceder as outras opções se o endpoint passar a ter contrato validado, cache/stale e indisponibilidade explícita; hoje amplia a dependência da AwesomeAPI.

Direção recomendada:
**Sprint 2B — Planejador de Reserva e Meta Financeira.** O MVP deve orientar uma decisão prática (quanto formar, quanto aportar e quando a meta pode ser atingida), sem contas, banco de dados, autenticação, provider financeiro adicional ou recomendação personalizada de investimento.

Ideias adiadas ou rejeitadas:
- dashboard pessoal amplo: com os dados atuais seria majoritariamente uma nova superfície para métricas já vistas, antes de existir informação pessoal útil;
- autenticação, banco de dados e persistência entre dispositivos: não há necessidade de compartilhamento/cross-device que justifique privacidade, operação e manutenção adicionais;
- watchlist de ativos: o universo atual é pequeno e fixo; favoritos não melhorariam materialmente a descoberta antes de haver mais instrumentos selecionáveis;
- nova integração pesada de cotações/históricos: fragilidade, rate limit e manutenção não se justificam para o primeiro incremento;
- IA, recomendações ou análises preditivas: não resolvem uma necessidade comprovada e aumentariam risco de confiança financeira;
- exportação isolada: é uma melhoria de saída útil, mas depende de uma simulação orientada a objetivo mais clara para ter valor suficiente.

### Sprint 2B — Reserve & Financial Goal Planner

Status:
Concluída localmente — validação de interface manual pendente.

Entrega:
- planejador de reserva para responder quanto falta acumular e a projeção aproximada de conclusão a partir de despesas essenciais, meses de cobertura, reserva atual e aporte mensal;
- arquitetura somente frontend: nenhum dado do planejador é enviado ao backend e não há provider externo, conta, autenticação ou banco de dados;
- fórmula determinística: reserva-alvo = despesas essenciais mensais × meses de cobertura; saldo faltante é limitado a zero e a projeção usa apenas reserva atual mais aporte mensal;
- persistência somente do formulário atual em `localStorage` do navegador/dispositivo, sem histórico ou múltiplos planos;
- progresso visual limitado a 100%, preservando o valor real da reserva; meta alcançada retorna zero meses e aporte zero abaixo da meta não recebe horizonte artificial;
- gráfico responsivo de evolução sem rendimento, inflação, juros ou impostos, limitado a 120 intervalos plotados para horizontes longos.

Validação local:
- casos determinísticos de reserva-alvo, saldo, progresso, meta alcançada e aporte zero verificados;
- ESLint, TypeScript, build e `git diff --check` aprovados.

### Sprint 2C — Financing Prepayment Comparison

Status:
Concluída localmente — validação de interface manual pendente.

Entrega:
- comparação de antecipação para responder como um pagamento extraordinário após uma parcela altera o mesmo financiamento Price ao reduzir prazo ou reduzir parcela;
- matemática financeira concentrada no backend: a antecipação ocorre depois da parcela mensal escolhida e é limitada ao saldo devedor remanescente;
- reduzir prazo mantém a parcela Price regular até a quitação; reduzir parcela recalcula a prestação Price para os meses restantes do vencimento original;
- os totais incluem a antecipação efetivamente aplicada e as economias de juros derivam das tabelas de amortização, sem arredondamentos intermediários de saldo;
- evolução de saldo devedor retornada pelo backend, com início, mês de antecipação e finais preservados e até 150 pontos;
- modelo deliberadamente simplificado: taxa fixa Price, sem datas irregulares, seguros, tarifas, impostos, indexação ou regras específicas de instituição.

Validação local:
- testes automatizados de financiamento: baseline Price, antecipação padrão, taxa zero, quitação integral, validação/invariantes e compatibilidade do endpoint existente;
- compile/import Python, suíte backend completa, ESLint, TypeScript, build e `git diff --check` aprovados.

### Sprint 2D — Exchange History Reliability Assessment

Status:
Concluída — avaliação/documentação somente; nenhuma mudança de código de produto.

Achados:
- rota atual `GET /api/historico/{moeda}` limita o mapeamento a USD/BRL, EUR/BRL e BTC/USD via AwesomeAPI, usa `bid` e inverte os registros; porém devolve `200 []` igualmente para moeda inválida, timeout, HTTP não-200, payload malformado e erro de parsing;
- execução local isolada retornou 30 registros para os três pares. Na produção Render, os três pares suportados e `invalida` retornaram HTTP 200 com lista vazia (latência aproximada de 251–839 ms); o contrato não permite distinguir causa operacional de entrada inválida;
- AwesomeAPI respondeu HTTP 200 com 30 registros, `timestamp` único e `bid` positivo/finito para USD/BRL, EUR/BRL e BTC/USD no ambiente de avaliação. Os registros vieram em ordem decrescente; a requisição representa 30 registros do provider, não uma garantia de 30 dias de calendário;
- o payload público reduz a data a `DD/MM` por conversão de timezone local, sem ano ou timestamp máquina. Isso não é contrato suficiente para gráfico confiável entre anos nem prova ordenação cronológica após o provider;
- não há validação de entrada/payload, cache por par, stale headers, fallback, testes históricos, validador frontend ou consumidor atual da rota;
- Yahoo Finance já respondeu histórico diário para `BRL=X`, `EURUSD=X`, `ARS=X`, `CLP=X` e `MXN=X`; USD/BRL é candidato direto de fallback e EUR/BRL exigiria cross-rate diário com alinhamento de timestamps. CoinGecko respondeu 31 pontos válidos BTC/USD, mas seu endpoint histórico não é usado hoje e possui semântica de preço/agregação diferente.

Decisão:
**RELIABILITY WORK REQUIRED.** Histórico continua útil, mas não é adequado para visualização enquanto lista vazia puder mascarar indisponibilidade e não existir contrato de data, cache/stale e validação equivalentes aos dados de mercado atuais.

Sprint 2E recomendada:
**Historical Exchange Data Reliability.** Definir contrato máquina (`YYYY-MM-DD`/timestamp e valor `bid` explícito), 404 para instrumento não suportado, 503 sem cache em falha de provider, cache por par com stale headers, validação/ordenação/deduplicação de payload e testes focados. Estratégia mínima: AwesomeAPI primária para os três pares atuais; Yahoo como fallback somente para USD/BRL inicialmente; avaliar CoinGecko BTC/USD em contrato separado antes de adotá-lo. A visualização e a expansão para cross-rates permanecem fora do escopo.

### Sprint 2E — Historical Exchange Data Reliability

Status:
Concluída localmente — validação pós-deploy pendente.

Entrega:
- contrato histórico estruturado para USD/BRL, EUR/BRL e BTC/USD, com instrumento, par, fonte, semântica de preço e pontos máquina (`YYYY-MM-DD`, valor numérico positivo);
- entrada não suportada retorna 404 e indisponibilidade de provider sem last-known-good retorna 503, sem resposta ambígua `200 []`;
- AwesomeAPI permanece primária; Yahoo Finance é fallback apenas de USD/BRL, identificado como `close`; EUR/BRL e BTC/USD não recebem fallback adicional;
- cache em memória independente por instrumento, válido por seis horas, preserva resposta/fonte e devolve last-known-good stale com headers durante refresh em segundo plano;
- normalização UTC, filtragem de registros inválidos, mínimo de dois pontos, ordenação cronológica e deduplicação por data;
- cobertura automatizada para contrato, falhas/fallback, normalização, cache fresco, stale e preservação/atualização do cache. A visualização histórica permanece fora do escopo.

### Sprint 2F — Historical Exchange Visualization

Status:
Concluída localmente — validação manual e pós-deploy pendentes.

Entrega:
- seção de histórico recente dentro do Conversor de Moedas, sem nova rota ou alteração da conversão atual;
- seletor independente limitado a USD/BRL, EUR/BRL e BTC/USD, usando o contrato estruturado e validado do Sprint 2E;
- gráfico responsivo de observações históricas, intervalo observado, contagem, fonte e semântica explícita de preço (`bid` AwesomeAPI ou `close` Yahoo Finance);
- cache frontend separado por instrumento, com estados independentes de carregamento, stale, indisponibilidade e retry;
- visualização contextual, sem dados em tempo real, previsão, análise técnica, derivação de pares ou funcionalidades de trading.

### Sprint 2G — Sprint 2 Review & Closure

Status:
Concluída — implementação do ciclo revisada; gate final de validação manual e pós-deploy permanece aberto.

Revisão:
- Sprint 2 confirmou a hipótese de que calculadoras orientadas a decisão agregam valor: o Planejador de Reserva usa modelo determinístico local, e a antecipação aprofunda a calculadora Price existente com matemática testada no backend;
- a sequência avaliação → contrato de confiabilidade → visualização foi útil para histórico de câmbio, onde a incerteza de provider era material; não é uma exigência universal para toda funcionalidade futura;
- `localStorage`, routers FastAPI, validadores de resposta, cache/stale e Recharts foram reutilizados de forma proporcional; não há evidência atual que justifique nova abstração;
- testes backend conhecidos: 58 `unittest` aprovados localmente; ESLint, TypeScript e build aprovados nas entregas. Não há cobertura automatizada de comportamento frontend;
- JH-026 permanece **Resolved locally — production validation pending**. Dependência de providers externos continua sendo risco operacional, não reabertura do defeito de contrato;
- riscos concretos: disponibilidade de providers, pares históricos limitados e validação manual/pós-deploy pendente. Limitações intencionais: persistência somente no navegador, simulações financeiras simplificadas e ausência de cross-rates históricos.

Oportunidades adiadas:
- retorno real de investimentos permanece adiado: inflação e tributação aumentariam a carga de manutenção além da calculadora atual;
- watchlist e dashboard continuam sem justificativa suficiente com o universo atual de instrumentos e estado pessoal local;
- exportação/compartilhamento ganhou relevância potencial após os utilitários orientados a decisão, mas deve ser avaliada após validar seu uso manual;
- links contextuais entre calculadoras e conteúdo dependem de confirmar que o Blog oferece correspondência editorial útil.

Próxima direção:
**STABILIZATION. Sprint 3A — Validação de Produção do Sprint 2.** Confirmar os fluxos manuais do Planejador de Reserva, comparação de antecipação e histórico de câmbio em produção, incluindo estados stale/indisponível quando observáveis, sem adicionar funcionalidades. Saída esperada: registro factual de validação, falhas reproduzíveis ou decisão de encerramento validado.

## Sprint 2 Closure

**SPRINT 2 IMPLEMENTATION COMPLETE — VALIDATION PENDING**

As capacidades previstas foram implementadas e possuem validação local proporcional, mas os smokes manuais do Planejador de Reserva e da antecipação, além da validação pós-deploy do histórico de câmbio e sua visualização, ainda não estão documentados como concluídos.
