from fastapi import APIRouter, HTTPException
from datetime import datetime
import requests

router = APIRouter()

@router.get("/cotacao")
def get_cotacao():
    # Lógica Original
    url = "https://economia.awesomeapi.com.br/last/USD-BRL,BTC-USD"
    try:
        response = requests.get(url)
        data = response.json()
        return {
            "dolar": {
                "valor": data['USDBRL']['bid'],
                "var": data['USDBRL']['varBid']
            },
            "bitcoin": {
                "valor": data['BTCUSD']['bid'],
                "var": data['BTCUSD']['varBid']
            }
        }
    except Exception:
        raise HTTPException(status_code=503, detail="Erro ao buscar cotação")

@router.get("/historico/{moeda}")
def get_historico(moeda: str):
    # Lógica Nova: Busca 30 dias de histórico
    # Mapeamento simples para entender o que o frontend pede
    codigos = {
        "dolar": "USD-BRL",
        "bitcoin": "BTC-USD"
    }
    
    if moeda not in codigos:
        raise HTTPException(status_code=400, detail="Moeda não suportada")
    
    pair_code = codigos[moeda]
    # API do AwesomeAPI para sequencial (30 dias)
    url = f"https://economia.awesomeapi.com.br/json/daily/{pair_code}/30"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        # Tratamento de dados: A API devolve muita sujeira, vamos limpar para o React
        # Ela devolve uma lista. Vamos pegar Data e Valor de Fechamento (bid)
        historico_limpo = []
        
        for dia in data:
            # Converter timestamp para data legível (Ex: "20/11")
            timestamp = int(dia['timestamp'])
            data_formatada = datetime.fromtimestamp(timestamp).strftime('%d/%m')
            
            historico_limpo.append({
                "data": data_formatada,
                "valor": float(dia['bid'])
            })
            
        # A API entrega do mais novo pro mais velho, vamos inverter para o gráfico
        return historico_limpo[::-1] 

    except Exception as e:
        print(e) # Para debug no terminal
        raise HTTPException(status_code=503, detail="Erro ao buscar histórico")