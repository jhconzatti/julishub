from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import markets, calculators

app = FastAPI()

# Configuração de CORS (Permite que o React acesse o Python)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://julishub.vercel.app",  # Seu frontend em produção
    "https://julis-hub.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Para desenvolvimento, liberar tudo é mais seguro contra erros de CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluindo as rotas com o prefixo /api
app.include_router(markets.router, prefix="/api")
app.include_router(calculators.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "JulisHub API is running!"}