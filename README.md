# 🚀 JulisHub - Financial & Technical Portfolio

Bem-vindo ao **JulisHub**, uma aplicação Fullstack moderna desenvolvida para centralizar ferramentas financeiras, indicadores de mercado e demonstrar capacidades técnicas de desenvolvimento web e arquitetura de software.

O projeto utiliza uma abordagem desacoplada, separando uma interface rica e responsiva de um backend robusto em Python.

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
* **Integrações:** AwesomeAPI (Cotações), Yahoo Finance (Futuro)

---

## 📂 Estrutura do Projeto

O projeto segue uma organização modular:

```text
julishub/
├── src/                  # Frontend (React)
│   ├── components/       # Componentes reutilizáveis (Header, Cards, UI)
│   ├── views/            # Telas principais (Markets, Calculators, Stocks)
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
*O Frontend estará rodando em: `http://localhost:5173`*

---

## ✨ Funcionalidades Principais

### 1. Mercados em Tempo Real (`/markets`)
* Monitoramento de Dólar (USD/BRL) e Bitcoin (BTC/USD).
* Gráficos interativos que carregam histórico de 30 dias sob demanda.
* Atualização automática a cada 30 segundos.

### 2. Calculadora de Juros Compostos (`/calculators`)
* Simulador de investimento a longo prazo.
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