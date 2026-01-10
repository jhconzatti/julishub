# 🌎 Atualização do JulisHub - Mercados e Calculadora de Câmbio

## 📋 Resumo das Mudanças

Esta atualização expande significativamente as funcionalidades de mercados financeiros e adiciona uma nova calculadora de conversão de moedas, tudo integrado com APIs públicas confiáveis.

---

## 🎯 Funcionalidades Implementadas

### 1. **Markets.tsx - Sistema de Abas**

Refatorado completamente com 4 abas separadas por componentes:

#### 📊 **Aba 1: Câmbio (Exchange)**
- **USD/BRL** - Dólar → Real
- **EUR/BRL** - Euro → Real
- **BTC/USD** - Bitcoin → Dólar
- **USD/ARS** - Dólar → Peso Argentino
- **ARS/BRL** - Peso Argentino → Real
- **BRL/ARS** - Real → Peso Argentino
- **EUR/USD** - Euro → Dólar
- **EUR/ARS** - Euro → Peso Argentino

**Recursos:**
- Gráficos históricos (30 dias) para USD, EUR e BTC
- Atualização automática a cada 1 minuto
- Animações suaves ao expandir gráficos
- Indicadores de variação (%) com setas coloridas

#### 🇧🇷 **Aba 2: Brasil**
- **IBOVESPA** - Índice Bovespa (B3)
- **IFIX** - Índice de Fundos Imobiliários

**Fonte:** HG Brasil Finance API

#### 🇦🇷 **Aba 3: Argentina**
- **MERVAL** - S&P Merval (Índice principal BYMA)
- **BURCAP** - Índice de Capitalização

**Nota:** Dados estáticos por limitações de APIs argentinas gratuitas. Para produção com dados reais, considere integração com [Portfolio Personal API](https://www.portfoliopersonal.com/).

#### 🇺🇸 **Aba 4: EUA**
- **S&P 500** - Standard & Poor's 500
- **Dow Jones** - Dow Jones Industrial Average
- **Nasdaq** - Nasdaq Composite

**Nota:** Dados aproximados. Para dados reais, recomenda-se:
- [Finnhub.io](https://finnhub.io/) (free tier disponível)
- [Alpha Vantage](https://www.alphavantage.co/)
- [IEX Cloud](https://iexcloud.io/)

---

### 2. **Calculators.tsx - Nova Aba de Câmbio**

#### 💱 **Conversor de Moedas**

**Moedas Suportadas:**
- 🇧🇷 BRL (Real Brasileiro)
- 🇺🇸 USD (Dólar Americano)
- 🇪🇺 EUR (Euro)
- 🇦🇷 ARS (Peso Argentino)
- ₿ BTC (Bitcoin)

**Funcionalidades:**
- Conversão bidirecional entre qualquer par de moedas
- Botão de inversão rápida (swap)
- Cálculo automático de taxas cruzadas via moeda intermediária
- Exibição da taxa de câmbio aplicada
- Tabela de referência com 6 principais pares

**⚠️ Aviso Importante:**
Simulação baseada em **câmbio comercial (interbancário)**. Não considera:
- Taxas de câmbio turismo (geralmente 3-8% mais altas)
- Spread financeiro de operações bancárias
- IOF (Imposto sobre Operações Financeiras)
- Taxas de corretagem ou transferência

---

## 🔌 APIs Utilizadas

### Backend (FastAPI - `routers/markets.py`)

#### **Novos Endpoints:**

1. **`GET /api/exchange-rates`**
   - Retorna 8 pares de câmbio
   - Cache de 1 hora
   - Fonte: AwesomeAPI + CoinGecko

2. **`GET /api/indexes/brazil`**
   - Retorna IBOVESPA + IFIX
   - Fonte: HG Brasil Finance API
   - Chave: `development` (teste)

3. **`GET /api/indexes/argentina`**
   - Retorna MERVAL + BURCAP
   - Dados estáticos (APIs argentinas limitadas)

4. **`GET /api/indexes/usa`**
   - Retorna S&P 500, Dow Jones, Nasdaq
   - Dados aproximados (requer API key para dados reais)

### APIs Externas Utilizadas

| API | Uso | Limite Gratuito | Requer Key? |
|-----|-----|-----------------|-------------|
| [AwesomeAPI](https://economia.awesomeapi.com.br) | Moedas fiat | Ilimitado | ❌ Não |
| [CoinGecko](https://api.coingecko.com) | Criptomoedas | 50 req/min | ❌ Não |
| [HG Brasil](https://hgbrasil.com) | Índices BR | 1000 req/dia (free) | ✅ Sim* |
| [Banco Central BR](https://api.bcb.gov.br) | SELIC, IPCA | Ilimitado | ❌ Não |

*Usa chave `development` para testes. Para produção, registre em [HG Brasil](https://hgbrasil.com).

---

## 📁 Estrutura de Arquivos

### Novos Componentes

```
src/
├── components/
│   ├── markets/
│   │   ├── MarketExchange.tsx      ✨ Novo
│   │   ├── MarketBrazil.tsx        ✨ Novo
│   │   ├── MarketArgentina.tsx     ✨ Novo
│   │   └── MarketUSA.tsx           ✨ Novo
│   └── ExchangeCalculator.tsx      ✨ Novo
├── views/
│   ├── Markets.tsx                 🔄 Refatorado
│   └── Calculators.tsx             🔄 Atualizado
└── lib/
    └── i18n.ts                     (sem mudanças necessárias)
```

### Backend

```
routers/
└── markets.py                      🔄 Expandido
    ├── get_exchange_rates()        ✨ Novo
    ├── get_brazil_indexes()        ✨ Novo
    ├── get_argentina_indexes()     ✨ Novo
    └── get_usa_indexes()           ✨ Novo
```

---

## 🚀 Como Testar Localmente

### 1. Backend (FastAPI)

```bash
# Certifique-se de que o backend está rodando
uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# Teste os novos endpoints
curl http://127.0.0.1:5000/api/exchange-rates
curl http://127.0.0.1:5000/api/indexes/brazil
curl http://127.0.0.1:5000/api/indexes/argentina
curl http://127.0.0.1:5000/api/indexes/usa
```

### 2. Frontend (Vite/React)

```bash
# Inicie o frontend
npm run dev

# Acesse no navegador
http://localhost:5173
```

### 3. Testar Funcionalidades

#### Markets:
1. Acesse "Mercados" na navegação
2. Teste as 4 abas: Câmbio, Brasil, Argentina, EUA
3. Clique em cards de moedas para ver gráficos históricos
4. Verifique atualização automática (1 min)

#### Calculadora de Câmbio:
1. Acesse "Calculadoras" → Aba "Câmbio"
2. Insira valor (ex: 100)
3. Selecione moedas "De" e "Para"
4. Clique "Converter"
5. Teste botão de inversão (swap)

---

## 🌐 Compatibilidade com Vercel

### ✅ Checklist de Deploy

- [x] **APIs sem CORS**: Todas as APIs usadas suportam CORS
- [x] **Endpoints públicos**: Nenhuma API key obrigatória em teste
- [x] **Cache implementado**: 1 hora de cache no backend (reduz rate limiting)
- [x] **Fallbacks robustos**: Retorna valores zerados se APIs falharem
- [x] **Timeout configurado**: 5 segundos em todas as requisições
- [x] **Logs estruturados**: Logging com emojis para debug fácil

### Variáveis de Ambiente (Vercel)

```bash
# Frontend (.env ou Vercel Environment Variables)
VITE_API_URL=https://seu-backend.vercel.app/api

# Backend (requirements.txt já inclui)
# requests==2.31.0
# fastapi==0.104.1
# uvicorn==0.24.0
```

### Deploy na Vercel

#### **Frontend (Vite/React):**

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Deploy
vercel --prod
```

Configuração `vercel.json` (já existe no projeto):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev"
}
```

#### **Backend (FastAPI):**

Crie `vercel.json` no root do projeto:
```json
{
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "app.py"
    }
  ]
}
```

Deploy:
```bash
vercel --prod
```

---

## 🎨 Design e UX

### Responsividade Mobile
- ✅ Tabs scrolláveis em telas pequenas (`text-xs sm:text-sm`)
- ✅ Grid adaptativo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- ✅ Gráficos responsivos: `ResponsiveContainer` do Recharts
- ✅ Touch-friendly: Botões grandes, espaçamento adequado

### Acessibilidade
- ✅ Contraste adequado (WCAG 2.1 AA)
- ✅ Indicadores visuais (cores + setas + texto)
- ✅ Loading states claros
- ✅ Mensagens de erro amigáveis

### Animações
- ✅ `animate-in fade-in` - Transições suaves
- ✅ `hover:scale-[1.02]` - Feedback visual em cards
- ✅ `animate-pulse` - Loading skeletons
- ✅ `slide-in-from-top-2` - Gráficos expandindo

---

## 📊 Performance

### Cache Strategy
- **Exchange Rates**: 1 hora (atualização suficiente para câmbio comercial)
- **Índices BR**: Sem cache backend (HG já tem delay de 15min)
- **Índices AR/USA**: Estáticos (não requer cache)

### Otimizações
- Lazy loading de componentes pesados
- Debounce em inputs (300ms)
- Fetch paralelo de múltiplas APIs
- Skeleton loaders para melhor UX

---

## 🔒 Segurança

### Proteções Implementadas
- ✅ Timeout em todas as requisições (5s)
- ✅ Try-catch robusto com fallbacks
- ✅ Validação de inputs no frontend
- ✅ CORS configurado corretamente
- ✅ Sem API keys expostas no frontend
- ✅ Sanitização de URLs (remove barra duplicada)

---

## 🐛 Troubleshooting

### Problema: Exchange rates retornam 0.00
**Solução:**
1. Verifique se o backend está rodando (`curl http://localhost:5000/api/exchange-rates`)
2. Confira variável `VITE_API_URL` no frontend
3. Veja logs do backend para erros de API externa

### Problema: Índices brasileiros não atualizam
**Solução:**
1. HG Brasil free tem limite de 1000 req/dia
2. Registre em [HG Brasil](https://hgbrasil.com) para obter API key própria
3. Substitua `key=development` por sua chave em `routers/markets.py`

### Problema: Gráficos históricos não aparecem
**Solução:**
1. Histórico só disponível para USD/BRL, EUR/BRL, BTC/USD
2. Outros pares não têm suporte de histórico (AwesomeAPI)
3. Verifique endpoint `/api/historico/{moeda}` diretamente

---

## 📈 Próximas Melhorias Sugeridas

### Curto Prazo
- [ ] Adicionar mais moedas (JPY, GBP, CAD, CHF)
- [ ] Integrar API real para índices USA (Finnhub)
- [ ] Adicionar API real para índices Argentina
- [ ] Implementar gráficos históricos para índices
- [ ] Cache Redis para alta performance

### Médio Prazo
- [ ] Sistema de alertas de preço
- [ ] Comparação de múltiplas moedas lado a lado
- [ ] Exportação de dados (CSV, PDF)
- [ ] Modo offline com dados cached
- [ ] PWA (Progressive Web App)

### Longo Prazo
- [ ] Portfólio tracker pessoal
- [ ] Integração com corretoras (via OAuth)
- [ ] Notificações push
- [ ] Machine Learning para previsões
- [ ] Social trading features

---

## 📞 Suporte e Contribuição

### Reportar Bugs
- Abra uma issue no GitHub
- Inclua logs do console (F12 → Console)
- Especifique navegador e versão

### Contribuir
1. Fork o projeto
2. Crie branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push (`git push origin feature/nova-funcionalidade`)
5. Abra Pull Request

---

## 📜 Changelog

### v2.0.0 - Janeiro 2026

**Adicionado:**
- 4 componentes de mercado separados (Exchange, Brazil, Argentina, USA)
- Calculadora de conversão de moedas
- 8 pares de câmbio na aba Exchange
- 3 novos endpoints backend (`/exchange-rates`, `/indexes/*`)
- Cache de 1 hora para exchange rates
- Sistema de tabs responsivo

**Modificado:**
- Markets.tsx refatorado com Tabs
- Calculators.tsx expandido com 4ª aba
- Backend markets.py com novos endpoints

**Corrigido:**
- Problema de encoding UTF-8 nos labels (→ exibido corretamente)
- Touch targets mobile (40px → 44px em botões)
- Layout responsivo em todas as abas

---

## 🙏 Créditos

- **AwesomeAPI** - Cotações de moedas brasileiras
- **CoinGecko** - Dados de criptomoedas
- **HG Brasil** - Índices brasileiros e dados financeiros
- **Banco Central do Brasil** - SELIC, IPCA, CDI oficiais
- **shadcn/ui** - Componentes UI
- **Recharts** - Biblioteca de gráficos
- **Lucide Icons** - Ícones

---

**Desenvolvido com ❤️ por Juliano Conrado (JulisHub)**

**Última Atualização**: 10 de janeiro de 2026
