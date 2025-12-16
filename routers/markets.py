from fastapi import APIRouter, HTTPException
import requests

router = APIRouter()

def fetch_awesomeapi():
    """Tenta buscar dados da AwesomeAPI"""
    try:
        # Busca Dólar, Euro e Bitcoin
        url = "https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-USD"
        resp = requests.get(url, timeout=3)
        if resp.status_code != 200: return None
        
        data = resp.json()
        return {
            "dolar": {
                "valor": data["USDBRL"]["bid"],
                "var": data["USDBRL"]["pctChange"]
            },
            "euro": {
                "valor": data["EURBRL"]["bid"],
                "var": data["EURBRL"]["pctChange"]
            },
            "bitcoin": {
                "valor": data["BTCUSD"]["bid"],
                "var": data["BTCUSD"]["pctChange"]
            },
            "ibovespa": { # AwesomeAPI não tem IBOV fácil, retornamos zerado ou buscamos de outra
                "valor": "0.00",
                "var": "0.00"
            }
        }
    except:
        return None

def fetch_hgbrasil():
    """Fallback: Tenta buscar da HG Brasil (dados podem ter delay de 15min na free)"""
    try:
        # A chave pública da HG Brasil para testes é 'key=development' ou sem chave (limite baixo)
        # O ideal é você criar uma conta grátis em hgbrasil.com e colocar sua chave aqui
        url = "https://api.hgbrasil.com/finance?format=json-cors&key=development"
        resp = requests.get(url, timeout=3)
        if resp.status_code != 200: return None
        
        data = resp.json()["results"]
        currencies = data["currencies"]
        stocks = data["stocks"]
        
        return {
            "dolar": {
                "valor": str(currencies["USD"]["buy"]),
                "var": str(currencies["USD"]["variation"])
            },
            "euro": {
                "valor": str(currencies["EUR"]["buy"]),
                "var": str(currencies["EUR"]["variation"])
            },
            "bitcoin": {
                "valor": str(currencies["BTC"]["buy"]),
                "var": str(currencies["BTC"]["variation"])
            },
            "ibovespa": {
                "valor": str(stocks["IBOVESPA"]["points"]),
                "var": str(stocks["IBOVESPA"]["variation"])
            }
        }
    except:
        return None

@router.get("/cotacao")
def get_cotacao():
    # 1. Tenta AwesomeAPI (Melhor para moedas em tempo real)
    data = fetch_awesomeapi()
    
    # 2. Se falhar ou se quisermos complementar (ex: IBOV), tenta HG Brasil
    if not data:
        print("AwesomeAPI falhou, tentando HG Brasil...")
        data = fetch_hgbrasil()
        
    # 3. Se tudo falhar, retorna zerado para não quebrar o Frontend
    if not data:
        return {
            "dolar": {"valor": "0.00", "var": "0.00"},
            "euro": {"valor": "0.00", "var": "0.00"},
            "bitcoin": {"valor": "0.00", "var": "0.00"},
            "ibovespa": {"valor": "0.00", "var": "0.00"}
        }
        
    # Se conseguimos dados da AwesomeAPI mas falta IBOVESPA, tentamos pegar só IBOV da HG
    if data["ibovespa"]["valor"] == "0.00":
        hg_data = fetch_hgbrasil()
        if hg_data:
            data["ibovespa"] = hg_data["ibovespa"]

    return data

@router.get("/historico/{moeda}")
def get_historico(moeda: str):
    # AwesomeAPI ainda é a melhor para histórico gratuito simples
    symbol_map = {
        "dolar": "USD-BRL",
        "euro": "EUR-BRL",
        "bitcoin": "BTC-USD"
    }
    
    symbol = symbol_map.get(moeda)
    if not symbol: return []
    
    try:
        url = f"https://economia.awesomeapi.com.br/json/daily/{symbol}/30"
        resp = requests.get(url, timeout=5)
        
        if resp.status_code != 200: return []

        data = resp.json()
        historico = []
        
        for item in data:
            from datetime import datetime
            ts = int(item["timestamp"])
            date_str = datetime.fromtimestamp(ts).strftime("%d/%m")
            
            historico.append({
                "data": date_str,
                "valor": float(item["bid"])
            })
            
        return historico[::-1]
    except Exception as e:
        print(f"Erro histórico: {e}")
        return []