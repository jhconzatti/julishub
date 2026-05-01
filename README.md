# 🚀 JulisHub - Financial & Technical Portfolio

Bem-vindo ao **JulisHub**, uma aplicação Fullstack moderna desenvolvida para centralizar ferramentas financeiras, indicadores de mercado e demonstrar capacidades técnicas de desenvolvimento web e arquitetura de software.

O projeto utiliza uma abordagem desacoplada, separando uma interface rica e responsiva de um backend robusto em Python, com integração de múltiplas APIs públicas confiáveis.

## 🛠️ Tech Stack

### Frontend (Client-Side)
* **Core:** React (Vite), TypeScript
* **Estilização:** Tailwind CSS, Shadcn/ui
* **Gerenciamento de Estado/Dados:** React Hooks, Context API
* **Visualização de Dados:** Recharts
* **Internacionalização:** i18next (Suporte PT, EN, ES)
* **Deploy:** Vercel (Frontend)

### Backend (Server-Side)
* **Core:** Python 3.12+
* **Framework:** FastAPI (Alta performance e documentação automática)
* **Servidor:** Uvicorn
* **Validação de Dados:** Pydantic
* **Integrações:** 
  - AwesomeAPI (Cotações de moedas)
  - CoinGecko (Criptomoedas)
  - HG Brasil Finance (Índices brasileiros)
  - Banco Central do Brasil (SELIC, IPCA, CDI)
* **Cache:** Sistema de cache em memória (1 hora)
* **Logging:** Sistema estruturado com emojis para debug

---

## 📂 Estrutura do Projeto

O projeto segue uma organização modular:

```text
julishub/
├── src/                  # Frontend (React)
│   ├── components/       # Componentes reutilizáveis (Header, Cards, UI)
│   ├── views/            # Telas principais (Markets, Calculators, Indicators)
│   ├── contexts/         # Contextos globais (Tema)
│   ├── lib/              # Configurações (i18n, utils)
│   └── hooks/            # Hooks personalizados
├── routers/              # Backend (Rotas Modularizadas)
│   ├── markets.py        # Lógica de cotação e histórico
│   └── calculators.py    # Lógica de juros compostos
├── app.py                # Ponto de entrada da API Python
└── requirements.txt      # Dependências do Python
```

---

## ⚡ Como Rodar o Projeto

Este é um projeto Fullstack, então você precisará de **dois terminais** rodando simultaneamente.

### 1. Configurando o Backend (Python)

```bash
# Crie um ambiente virtual (apenas na primeira vez)
python -m venv .venv

# Ative o ambiente
# Windows:
.\.venv\Scripts\Activate
# Linux/Mac:
source .venv/bin/activate

# Instale as dependências
pip install fastapi uvicorn requests

# Rode o servidor
uvicorn app:app --reload
```
*O Backend estará rodando em: `http://127.0.0.1:8000`*
*Documentação da API (Swagger): `http://127.0.0.1:8000/docs`*

### 2. Configurando o Frontend (React)

Abra um **novo terminal** na raiz do projeto:

```bash
# Instale as dependências do Node
npm install

# Rode o servidor de desenvolvimento
npm run dev
```
*O Fron📊 Mercados Financeiros (`/markets`)
Sistema completo de monitoramento de mercados com **4 abas especializadas**:

#### **Câmbio (Exchange)**
- USD/BRL, EUR/BRL, BTC/USD (pares principais)
- USD/ARS, ARS/BRL, BRL/ARS (América Latina)
- EUR/USD, EUR/ARS (Europa)
- Gráficos históricos de 30 dias para pares principais
- Atualização automática a cada 1 minuto

#### **Brasil**
- IBOVESPA - Índice Bovespa (B3)
- IFIX - Índice de Fundos Imobiliários
- Dados em tempo real via HG Brasil Finance API

#### **Argentina**
- MERVAL - S&P Merval (BYMA)
- BURCAP - Índice de Capitalização

#### **EUA**
- S&P 500 - Standard & Poor's 500
- Dow Jones Industrial Average
- N🔌 Integrações com APIs Públicas

| API | Uso | Limite Gratuito | Requer API Key? |
|-----|-----|-----------------|-----------------|
| [AwesomeAPI](https://economia.awesomeapi.com.br) | Moedas fiat | Ilimitado | ❌ Não |
| [CoinGecko](https://api.coingecko.com) | Criptomoedas | 50 req/min | ❌ Não |
| [HG Brasil](https://hgbrasil.com) | Índices BR | 1000 req/dia (free) | ✅ Sim* |
| [Banco Central BR](https://api.bcb.gov.br) | SELIC, IPCA | Ilimitado | ❌ Não |

*Usa chave `development` para testes. Para produção, registre em [HG Brasil](https://hgbrasil.com).

### 🔐 Sistema de Cache e Fallback
- **Cache de 1 hora** para indicadores econômicos
- **Fallback em cascata**: Se API principal falhar, tenta secundária
- **Retorno seguro**: Valores zerados ao invés de erro 500
- **Logging estruturado**: Rastreamento com emojis (🔄✅❌⚠️📦)

---

## 📱 Responsividade Mobile

O projeto foi desenvolvido **mobile-first** e é totalmente responsivo:

✅ Menu hamburger em telas pequenas  
✅ Tabs scrolláveis  
✅ Grids adaptativos: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`  
✅ Touch targets de 40px+ (acessibilidade)  
✅ Gráficos responsivos com `ResponsiveContainer`  
✅ Diálogos com altura máxima (90vh)

Testado em: iPhone SE, iPhone 12 Pro, iPad Mini, iPad Pro, Desktop (1280px+)

---

## 🌐 Modo Offline (Mock Mode)

Para facilitar o desenvolvimento de interface sem depender da API Python (ou para trabalhar sem internet), o projeto suporta um modo Mock.

1. Crie um arquivo `.env` na raiz do projeto.
2. Adicione a configuração:
```properties
VITE_USE_MOCK=true
```
3. O Frontend passará a usar dados fictícios instantaneamente, permitindo trabalhar no layout sem o backend rodando.

---

## 🚀 Deploy na Vercel

### Frontend
```bash
npm i -g vercel
vercel --prod
```

### Backend (FastAPI)
Adicione `vercel.json` na raiz:
```json
{
  "builds": [{"src": "app.py", "use": "@vercel/python"}],
  "routes": [{"src": "/api/(.*)", "dest": "app.py"}]
}
```

### Variáveis de Ambiente
```bash
VITE_API_URL=https://seu-backend.vercel.app/api
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

O Google Analytics 4 só é carregado quando o usuário aceita cookies não essenciais no banner de consentimento. O Vercel Web Analytics segue o mesmo gate de consentimento.

---

## 📊 Estrutura de Componentes

### Componentes Reutilizáveis
- **Header**: Logo, navegação, seletor de idioma/tema
- **Footer**: Informações de copyright
- **Navigation**: Menu desktop com links ativos
- **MobileNav**: Menu hamburger com drawer lateral
- **LanguageToggle**: Bandeiras SVG para seleção de idioma
- **ExchangeCalculator**: Conversor de moedas standalone

### Componentes de Mercado
- **MarketExchange**: Cards de pares de câmbio com gráficos
- **MarketBrazil**: Índices brasileiros (IBOVESPA, IFIX)
- **MarketArgentina**: Índices argentinos (MERVAL, BURCAP)
- **MarketUSA**: Índices americanos (S&P 500, Dow, Nasdaq)

---

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Verifique se o ambiente virtual está ativo
.\.venv\Scripts\Activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Reinstale dependências
pip install -r requirements.txt

# Tente porta alternativa
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

### Frontend não conecta ao backend
1. Verifique se `VITE_API_URL` está configurado corretamente
2. Certifique-se de que o backend está rodando (teste `curl http://localhost:5000/api/indicadores`)
3. Verifique CORS no backend (FastAPI já configurado)

### Gráficos não aparecem
- Apenas USD/BRL, EUR/BRL e BTC/USD têm histórico disponível
- Outros pares não suportam gráficos históricos pela API

### Índices zerados
- **HG Brasil**: Limite de 1000 req/dia na versão free. Registre para obter API key própria
- **USA/Argentina**: Dados aproximados. Para produção, integre APIs pagas

---

## 📈 Roadmap Futuro

- [ ] Sistema de alertas de preço
- [ ] Portfólio tracker pessoal
- [ ] Exportação de relatórios (PDF/CSV)
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] Integração com mais APIs de mercado
- Persistência de dados em localStorage

#### **Empréstimos/Financiamentos**
- Cálculo de parcelas
- Visualização de amortização
- Total de juros pagos

#### **Salário Líquido CLT**
- Cálculo de INSS e IRRF
- Descontos detalhados
- Salário líquido final

#### **Conversor de Câmbio** ⭐ NOVO
- Conversão entre BTC, USD, EUR, ARS, BRL
- Cálculo bidirecional instantâneo
- Tabela de referência de taxas
- ⚠️ Aviso sobre câmbio comercial vs. turismo

### 3. 📈 Indicadores Econômicos (`/indicators`)
- **SELIC Meta** - Taxa oficial do Banco Central
- **IPCA (12 meses)** - Inflação oficial
- **CDI** - Taxa de referência para investimentos
- Dados oficiais com atualização horária
- Sistema de fallback robusto

### 4. 🌍 Internacionalização
- **3 idiomas completos**: Português (BR), Inglês (US), Espanhol (AR)
- Seletor com bandeiras SVG
- Traduções contextuais em todas as telas
- Alternância Dark Mode / Light Mode.
* Cálculo processado no Backend (Python) garantindo precisão.
* Gráfico de evolução patrimonial (Total Investido vs. Juros).

### 3. Internacionalização e Temas
* Alternância completa entre **Dark Mode** (Padrão) e **Light Mode**.
* Suporte a Português, Inglês e Espanhol.

---

## 🌍 Modo Offline (Mock Mode)

Para facilitar o desenvolvimento de interface sem depender da API Python (ou para trabalhar sem internet), o projeto suporta um modo Mock.

1. Crie um arquivo `.env` na raiz do projeto.
2. Adicione a configuração:
```properties
VITE_USE_MOCK=true
```
3. O Frontend passará a usar dados fictícios instantaneamente, permitindo trabalhar no layout sem o backend rodando.

---

## 📝 Licença

Desenvolvido por **Juliano Conzatti**.