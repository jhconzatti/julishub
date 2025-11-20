from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import markets, calculators

app = FastAPI()

# Configuração de Segurança (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rota Raiz (Health Check)
@app.get("/")
def home():
    return {"status": "online", "project": "JulisHub API"}

# Registrando as rotas de Mercado com o prefixo /api
app.include_router(markets.router, prefix="/api") # Markets
app.include_router(calculators.router, prefix="/api") # Calculators