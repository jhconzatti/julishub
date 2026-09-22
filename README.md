# JulisHub

JulisHub is a multilingual full-stack personal finance application that brings together market data, economic indicators, calculators, news, and educational content.

## About

The project is maintained as a working financial product and portfolio project. Its current priorities are data correctness, graceful handling of external-provider failures, maintainable code, and clear documentation.

Production frontend: [julishub.vercel.app](https://julishub.vercel.app)

## Features

- Market dashboard for currencies and indexes from Brazil, Argentina, and the United States.
- Economic indicators including SELIC, IPCA, and estimated CDI.
- Compound-interest, CLT net-salary, currency-conversion, and reserve-planning calculators.
- Price-financing prepayment comparison for reduced-term and reduced-installment scenarios.
- Recent historical exchange visualization for USD/BRL, EUR/BRL, and BTC/USD.
- Financial news aggregated from Google News RSS.
- Educational blog content.
- Contextual educational guidance after Reserve Planner and financing-prepayment results.
- Portuguese (Brazil), English, and Spanish locales.
- Light and dark themes.
- Cookie consent controlling optional analytics.
- Explicit loading, unavailable, retry, and stale-data states for external data.

## Architecture

```text
Browser
  └─ React frontend (Vercel)
       └─ FastAPI backend /api/* (Render)
            └─ External financial and news providers
```

The frontend calls the FastAPI backend through `VITE_API_URL`. The backend exposes domain routers for markets, calculators, news, and blog content.

External integrations currently used are:

- AwesomeAPI for exchange rates and currency history.
- CoinGecko for Bitcoin prices.
- HG Brasil Finance for Brazilian market data and provider fallback.
- Banco Central do Brasil for SELIC and IPCA.
- Yahoo Finance for MERVAL, S&P 500, Dow Jones, and Nasdaq Composite.
- Google News RSS for financial news.

The frontend keeps validated last-known-good responses in versioned `localStorage` entries. The backend also uses in-process memory caches for selected endpoints. Real provider fallbacks are retained where available.

## Tech Stack

### Frontend

- React 18 and TypeScript
- Vite 5
- Tailwind CSS and shadcn/ui
- React Router and TanStack Query
- i18next
- Recharts

### Backend

- Python and FastAPI
- Uvicorn
- Pydantic
- HTTPX, Requests, and Feedparser

### Infrastructure

- Vercel for the frontend
- Render for the backend
- npm as the Node.js package manager

## Project Structure

```text
julishub/
├── public/locales/       # PT-BR, EN, and ES translations
├── routers/              # FastAPI routers by domain
├── src/
│   ├── components/       # Product and UI components
│   ├── contexts/         # Shared React contexts
│   ├── hooks/            # Reusable hooks
│   ├── lib/              # API, cache, i18n, and utility code
│   └── views/            # Route-level views
├── tests/                # Backend unittest suite
├── app.py                # FastAPI application entry point
├── package.json          # Frontend scripts and dependencies
└── requirements.txt      # Backend dependencies
```

## Running Locally

### Requirements

- Node.js with npm
- Python 3.12 or later

### Frontend

```bash
npm ci
npm run dev
```

Vite prints the local frontend URL when the development server starts.

### Backend

Create and activate a virtual environment, then install the declared dependencies:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload
```

macOS or Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

The API is available at `http://127.0.0.1:8000`, with OpenAPI documentation at `http://127.0.0.1:8000/docs`.

### Environment Variables

Copy `.env.example` to `.env` for local frontend development:

```dotenv
VITE_API_URL="http://127.0.0.1:8000/api"
VITE_GA_MEASUREMENT_ID=""
```

- `VITE_API_URL` selects the FastAPI base URL. The frontend accepts the base with or without a trailing `/api`.
- `VITE_GA_MEASUREMENT_ID` is optional and enables Google Analytics only after the applicable cookie consent.

No additional backend environment variable is currently required for local startup. Do not place secrets in frontend `VITE_*` variables.

## Testing and Quality

```bash
npm run lint
npx tsc -b --pretty false
npm run build
.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Current baseline:

- ESLint: 0 errors and 0 warnings
- TypeScript: 0 errors
- Production build: passing
- Backend tests: 58 passing

On macOS or Linux, use `.venv/bin/python` for the unittest command.

## Deployment

- Frontend: Vercel serves the Vite application and applies the SPA rewrite in `vercel.json`.
- Backend: Render serves the FastAPI application.
- Production frontend configuration points `VITE_API_URL` to the Render backend.

Deployment and remote environment changes are managed outside the application runtime.

## Data Reliability

Market and news data depend on external providers and may be delayed or temporarily unavailable. The application distinguishes current data, stale last-known-good data, and unavailable data.

- Only validated responses replace cached data.
- A working secondary provider may supply a real fallback.
- Failed refreshes may preserve previous data with a stale indication.
- When no valid data exists, the API returns an unavailable response and the interface offers retry behavior.
- Provider failures are not represented as fabricated financial zeroes.

## Internationalization

The application includes locale resources for:

- Portuguese — Brazil (`pt-BR`)
- English (`en`)
- Spanish (`es`)

Language-prefixed routes and the locale selector are handled by the frontend.

## Privacy and Analytics

The application includes a cookie-consent interface. Optional Google Analytics and Vercel Web Analytics are loaded only after the relevant consent is granted.

## Project Evolution

Technical baselines, resolved issues, decisions, and sprint history are maintained in [docs/PROJECT_EVOLUTION.md](docs/PROJECT_EVOLUTION.md).

## Author

Juliano Conzatti
