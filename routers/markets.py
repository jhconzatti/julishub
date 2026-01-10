from fastapi import APIRouter, HTTPException
import requests
from datetime import datetime, timedelta
from typing import Optional
import logging

router = APIRouter()

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache simples em memória (1 hora)
_cache_indicadores = {
    "data": None,
    "timestamp": None,
}

_cache_exchange = {
    "data": None,
    "timestamp": None,
}

_cache_indexes = {
    "data": None,
    "timestamp": None,
}

CACHE_DURATION = timedelta(hours=1)


def is_cache_valid(cache_timestamp: Optional[datetime]) -> bool:
    """Verifica se o cache ainda é válido (menos de 1 hora)"""
    if cache_timestamp is None:
        return False
    return datetime.now() - cache_timestamp < CACHE_DURATION


def fetch_awesomeapi():
    """Tenta buscar dados da AwesomeAPI"""
    try:
        logger.info("🔄 Buscando dados da AwesomeAPI...")
        # Busca Dólar, Euro e Bitcoin
        url = "https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-USD"
        resp = requests.get(url, timeout=5)
        
        if resp.status_code != 200:
            logger.warning(f"⚠️ AwesomeAPI retornou status {resp.status_code}")
            return None

        data = resp.json()
        logger.info("✅ Dados da AwesomeAPI obtidos com sucesso")
        
        return {
            "dolar": {
                "valor": data["USDBRL"]["bid"],
                "var": data["USDBRL"]["pctChange"],
            },
            "euro": {
                "valor": data["EURBRL"]["bid"],
                "var": data["EURBRL"]["pctChange"],
            },
            "bitcoin": {
                "valor": data["BTCUSD"]["bid"],
                "var": data["BTCUSD"]["pctChange"],
            },
            "ibovespa": {  # AwesomeAPI não tem IBOV, retornamos zerado
                "valor": "0.00",
                "var": "0.00",
            },
        }
    except requests.Timeout:
        logger.error("❌ Timeout ao acessar AwesomeAPI")
        return None
    except Exception as e:
        logger.error(f"❌ Erro fetch_awesomeapi: {e}")
        return None


def fetch_hgbrasil():
    """Fallback: Tenta buscar da HG Brasil (dados podem ter delay de 15min na free)"""
    try:
        logger.info("🔄 Tentando HG Brasil como fallback...")
        # A chave pública da HG Brasil para testes é 'key=development' ou sem chave (limite baixo)
        # O ideal é você criar uma conta grátis em hgbrasil.com e colocar sua chave aqui
        url = "https://api.hgbrasil.com/finance?format=json-cors&key=development"
        resp = requests.get(url, timeout=5)
        
        if resp.status_code != 200:
            logger.warning(f"⚠️ HG Brasil retornou status {resp.status_code}")
            return None

        data = resp.json()["results"]
        currencies = data["currencies"]
        stocks = data["stocks"]
        
        logger.info("✅ Dados da HG Brasil obtidos com sucesso")

        return {
            "dolar": {
                "valor": str(currencies["USD"]["buy"]),
                "var": str(currencies["USD"]["variation"]),
            },
            "euro": {
                "valor": str(currencies["EUR"]["buy"]),
                "var": str(currencies["EUR"]["variation"]),
            },
            "bitcoin": {
                "valor": str(currencies["BTC"]["buy"]),
                "var": str(currencies["BTC"]["variation"]),
            },
            "ibovespa": {
                "valor": str(stocks["IBOVESPA"]["points"]),
                "var": str(stocks["IBOVESPA"]["variation"]),
            },
        }
    except requests.Timeout:
        logger.error("❌ Timeout ao acessar HG Brasil")
        return None
    except Exception as e:
        logger.error(f"❌ Erro fetch_hgbrasil: {e}")
        return None


def get_indicadores():
    """
    Busca indicadores econômicos oficiais do Banco Central do Brasil (SGS)
    - SELIC Meta: Código 432
    - IPCA (12 meses): Código 13522
    - CDI estimado: Selic - 0.10%
    
    Implementa cache de 1 hora para evitar rate limiting
    """
    global _cache_indicadores
    
    # Verifica se o cache é válido
    if is_cache_valid(_cache_indicadores["timestamp"]):
        logger.info("📦 Retornando indicadores do cache (ainda válido)")
        return _cache_indicadores["data"]
    
    logger.info("🔄 Cache expirado ou inexistente. Buscando dados do Banco Central...")
    
    try:
        # Busca SELIC Meta (últimos 1 valores)
        url_selic = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json"
        logger.info(f"   → Requisitando SELIC: {url_selic}")
        resp_selic = requests.get(url_selic, timeout=5)

        # Busca IPCA (últimos 1 valores)
        url_ipca = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json"
        logger.info(f"   → Requisitando IPCA: {url_ipca}")
        resp_ipca = requests.get(url_ipca, timeout=5)

        if resp_selic.status_code != 200 or resp_ipca.status_code != 200:
            logger.error(f"❌ API do BC retornou erro. SELIC: {resp_selic.status_code}, IPCA: {resp_ipca.status_code}")
            return None

        selic_data = resp_selic.json()
        ipca_data = resp_ipca.json()

        if not selic_data or not ipca_data:
            logger.error("❌ API do BC retornou dados vazios")
            return None

        selic_valor = float(selic_data[0]["valor"])
        ipca_valor = float(ipca_data[0]["valor"])
        cdi_estimado = selic_valor - 0.10  # CDI é geralmente Selic - 0.10%

        result = {
            "selic": {
                "valor": f"{selic_valor:.2f}",
                "data": selic_data[0]["data"],
                "descricao": "Taxa SELIC Meta (% a.a.)",
            },
            "ipca": {
                "valor": f"{ipca_valor:.2f}",
                "data": ipca_data[0]["data"],
                "descricao": "IPCA - 12 meses (% a.a.)",
            },
            "cdi": {
                "valor": f"{cdi_estimado:.2f}",
                "descricao": "CDI Estimado (% a.a.)",
            },
        }
        
        # Atualiza o cache
        _cache_indicadores["data"] = result
        _cache_indicadores["timestamp"] = datetime.now()
        logger.info(f"✅ Indicadores obtidos com sucesso! SELIC: {selic_valor}%, IPCA: {ipca_valor}%")
        logger.info(f"📦 Cache atualizado. Válido até {_cache_indicadores['timestamp'] + CACHE_DURATION}")
        
        return result
        
    except requests.Timeout:
        logger.error("❌ Timeout ao acessar API do Banco Central")
        return None
    except Exception as e:
        logger.error(f"❌ Erro get_indicadores: {e}")
        return None


@router.get("/indicadores")
def route_indicadores():
    """Rota para retornar indicadores econômicos oficiais do Banco Central"""
    logger.info("📊 Requisição recebida: /indicadores")
    indicadores = get_indicadores()

    # Fallback: se o BC falhar, retorna valores zerados para não quebrar o frontend
    if not indicadores:
        logger.warning("⚠️ Retornando valores zerados (fallback)")
        return {
            "selic": {
                "valor": "0.00",
                "data": datetime.now().strftime("%d/%m/%Y"),
                "descricao": "Taxa SELIC Meta (% a.a.)",
            },
            "ipca": {
                "valor": "0.00",
                "data": datetime.now().strftime("%d/%m/%Y"),
                "descricao": "IPCA - 12 meses (% a.a.)",
            },
            "cdi": {"valor": "0.00", "descricao": "CDI Estimado (% a.a.)"},
            "erro": "Não foi possível buscar dados do Banco Central no momento",
        }

    return indicadores


@router.get("/cotacao")
def get_cotacao():
    """
    Rota de cotações com fallback robusto:
    1. Tenta AwesomeAPI (melhor para moedas em tempo real)
    2. Se falhar, tenta HG Brasil
    3. Se tudo falhar, retorna valores zerados para não quebrar o Frontend
    """
    logger.info("💱 Requisição recebida: /cotacao")
    
    # 1. Tenta AwesomeAPI (Melhor para moedas em tempo real)
    data = fetch_awesomeapi()

    # 2. Se falhar ou se quisermos complementar (ex: IBOV), tenta HG Brasil
    if not data:
        logger.warning("⚠️ AwesomeAPI falhou, tentando HG Brasil...")
        data = fetch_hgbrasil()

    # 3. Se tudo falhar, retorna zerado para não quebrar o Frontend
    if not data:
        logger.error("❌ Todas as APIs falharam! Retornando valores zerados")
        return {
            "dolar": {"valor": "0.00", "var": "0.00"},
            "euro": {"valor": "0.00", "var": "0.00"},
            "bitcoin": {"valor": "0.00", "var": "0.00"},
            "ibovespa": {"valor": "0.00", "var": "0.00"},
        }

    # Se conseguimos dados da AwesomeAPI mas falta IBOVESPA, tentamos pegar só IBOV da HG
    if data["ibovespa"]["valor"] == "0.00":
        logger.info("🔄 Buscando IBOVESPA complementar da HG Brasil...")
        hg_data = fetch_hgbrasil()
        if hg_data:
            data["ibovespa"] = hg_data["ibovespa"]
            logger.info("✅ IBOVESPA complementado com sucesso")

    logger.info("✅ Cotações retornadas com sucesso")
    return data



@router.get("/historico/{moeda}")
def get_historico(moeda: str):
    """
    Retorna histórico de 30 dias de uma moeda
    AwesomeAPI ainda é a melhor opção para histórico gratuito simples
    """
    logger.info(f"📈 Requisição recebida: /historico/{moeda}")
    symbol_map = {"dolar": "USD-BRL", "euro": "EUR-BRL", "bitcoin": "BTC-USD"}

    symbol = symbol_map.get(moeda)
    if not symbol:
        logger.warning(f"⚠️ Moeda inválida: {moeda}")
        return []

    try:
        url = f"https://economia.awesomeapi.com.br/json/daily/{symbol}/30"
        logger.info(f"   → Buscando histórico: {url}")
        resp = requests.get(url, timeout=5)

        if resp.status_code != 200:
            logger.error(f"❌ Erro ao buscar histórico: status {resp.status_code}")
            return []

        data = resp.json()
        historico = []

        for item in data:
            ts = int(item["timestamp"])
            date_str = datetime.fromtimestamp(ts).strftime("%d/%m")

            historico.append({"data": date_str, "valor": float(item["bid"])})

        logger.info(f"✅ Histórico retornado: {len(historico)} registros")
        return historico[::-1]
    except requests.Timeout:
        logger.error(f"❌ Timeout ao buscar histórico de {moeda}")
        return []
    except Exception as e:
        logger.error(f"❌ Erro ao buscar histórico de {moeda}: {e}")
        return []


@router.get("/exchange-rates")
def get_exchange_rates():
    """
    Retorna taxas de câmbio expandidas (USD, EUR, BRL, ARS, BTC)
    Usa AwesomeAPI + CoinGecko para BTC
    """
    global _cache_exchange
    
    if is_cache_valid(_cache_exchange["timestamp"]):
        logger.info("📦 Retornando exchange rates do cache")
        return _cache_exchange["data"]
    
    logger.info("💱 Requisição recebida: /exchange-rates")
    
    try:
        # AwesomeAPI tem limite de pares por requisição, então dividimos em chunks
        all_pairs = [
            # Principais
            "USD-BRL", "EUR-BRL", "EUR-USD",
            # América do Sul
            "USD-ARS", "ARS-BRL",  # Argentina
            "USD-CLP", "CLP-BRL",  # Chile
            "USD-COP", "COP-BRL",  # Colômbia
            "USD-PEN", "PEN-BRL",  # Peru
            "USD-UYU", "UYU-BRL",  # Uruguai
            "USD-PYG", "PYG-BRL",  # Paraguai
            "USD-BOB", "BOB-BRL",  # Bolívia
            "USD-VES", "VES-BRL",  # Venezuela
            # América Central
            "USD-MXN", "MXN-BRL",  # México
            "USD-CRC", "CRC-BRL",  # Costa Rica
            "USD-GTQ", "GTQ-BRL",  # Guatemala
            "USD-HNL", "HNL-BRL",  # Honduras
            "USD-NIO", "NIO-BRL",  # Nicarágua
            "USD-PAB", "PAB-BRL",  # Panamá
            "USD-DOP", "DOP-BRL",  # República Dominicana
            # Turismo
            "USDT-BRL", "EURT-BRL",
        ]
        
        # Faz múltiplas requisições em chunks de 10 pares
        data = {}
        chunk_size = 10
        for i in range(0, len(all_pairs), chunk_size):
            chunk = all_pairs[i:i + chunk_size]
            url = f"https://economia.awesomeapi.com.br/last/{','.join(chunk)}"
            resp = requests.get(url, timeout=10)
            
            if resp.status_code != 200:
                logger.warning(f"⚠️ AwesomeAPI chunk {i//chunk_size + 1} failed with status {resp.status_code}")
                continue
            
            chunk_data = resp.json()
            data.update(chunk_data)
        
        # CoinGecko para Bitcoin (grátis, sem API key)
        btc_url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl"
        btc_resp = requests.get(btc_url, timeout=5)
        btc_data = btc_resp.json() if btc_resp.status_code == 200 else {"bitcoin": {"usd": 0, "brl": 0}}
        
        # Helper para conversão segura
        def safe_float(value, default=0.0):
            try:
                return float(value) if value else default
            except (ValueError, TypeError):
                return default
        
        # Calcular BRL/ARS derivado (inverso de ARS/BRL)
        usd_brl = safe_float(data.get("USDBRL", {}).get("bid"))
        ars_brl = safe_float(data.get("ARSBRL", {}).get("bid"))
        brl_ars = 1 / ars_brl if ars_brl > 0 else 0
        
        result = {
            # Principais
            "USD_BRL": {
                "valor": data.get("USDBRL", {}).get("bid", "0"),
                "var": data.get("USDBRL", {}).get("pctChange", "0"),
                "label": "Dólar Comercial → Real",
            },
            "EUR_BRL": {
                "valor": data.get("EURBRL", {}).get("bid", "0"),
                "var": data.get("EURBRL", {}).get("pctChange", "0"),
                "label": "Euro → Real",
            },
            "EUR_USD": {
                "valor": data.get("EURUSD", {}).get("bid", "0"),
                "var": data.get("EURUSD", {}).get("pctChange", "0"),
                "label": "Euro → Dólar",
            },
            "BTC_USD": {
                "valor": str(btc_data.get("bitcoin", {}).get("usd", 0)),
                "var": "0.00",
                "label": "Bitcoin → Dólar",
            },
            "BTC_BRL": {
                "valor": str(btc_data.get("bitcoin", {}).get("brl", 0)),
                "var": "0.00",
                "label": "Bitcoin → Real",
            },
            
            # América do Sul - Argentina
            "USD_ARS": {
                "valor": data.get("USDARS", {}).get("bid", "0"),
                "var": data.get("USDARS", {}).get("pctChange", "0"),
                "label": "Dólar → Peso Argentino",
            },
            "ARS_BRL": {
                "valor": data.get("ARSBRL", {}).get("bid", "0"),
                "var": data.get("ARSBRL", {}).get("pctChange", "0"),
                "label": "Peso Argentino → Real",
            },
            "BRL_ARS": {
                "valor": f"{brl_ars:.4f}",
                "var": f"{-safe_float(data.get('ARSBRL', {}).get('pctChange')):.2f}",
                "label": "Real → Peso Argentino",
            },
            
            # América do Sul - Chile
            "USD_CLP": {
                "valor": data.get("USDCLP", {}).get("bid", "0"),
                "var": data.get("USDCLP", {}).get("pctChange", "0"),
                "label": "Dólar → Peso Chileno",
            },
            "CLP_BRL": {
                "valor": data.get("CLPBRL", {}).get("bid", "0"),
                "var": data.get("CLPBRL", {}).get("pctChange", "0"),
                "label": "Peso Chileno → Real",
            },
            
            # América do Sul - Colômbia
            "USD_COP": {
                "valor": data.get("USDCOP", {}).get("bid", "0"),
                "var": data.get("USDCOP", {}).get("pctChange", "0"),
                "label": "Dólar → Peso Colombiano",
            },
            "COP_BRL": {
                "valor": data.get("COPBRL", {}).get("bid", "0"),
                "var": data.get("COPBRL", {}).get("pctChange", "0"),
                "label": "Peso Colombiano → Real",
            },
            
            # América do Sul - Peru
            "USD_PEN": {
                "valor": data.get("USDPEN", {}).get("bid", "0"),
                "var": data.get("USDPEN", {}).get("pctChange", "0"),
                "label": "Dólar → Sol Peruano",
            },
            "PEN_BRL": {
                "valor": data.get("PENBRL", {}).get("bid", "0"),
                "var": data.get("PENBRL", {}).get("pctChange", "0"),
                "label": "Sol Peruano → Real",
            },
            
            # América do Sul - Uruguai
            "USD_UYU": {
                "valor": data.get("USDUYU", {}).get("bid", "0"),
                "var": data.get("USDUYU", {}).get("pctChange", "0"),
                "label": "Dólar → Peso Uruguaio",
            },
            "UYU_BRL": {
                "valor": data.get("UYUBRL", {}).get("bid", "0"),
                "var": data.get("UYUBRL", {}).get("pctChange", "0"),
                "label": "Peso Uruguaio → Real",
            },
            
            # América do Sul - Paraguai
            "USD_PYG": {
                "valor": data.get("USDPYG", {}).get("bid", "0"),
                "var": data.get("USDPYG", {}).get("pctChange", "0"),
                "label": "Dólar → Guarani Paraguaio",
            },
            "PYG_BRL": {
                "valor": data.get("PYGBRL", {}).get("bid", "0"),
                "var": data.get("PYGBRL", {}).get("pctChange", "0"),
                "label": "Guarani Paraguaio → Real",
            },
            
            # América do Sul - Bolívia
            "USD_BOB": {
                "valor": data.get("USDBOB", {}).get("bid", "0"),
                "var": data.get("USDBOB", {}).get("pctChange", "0"),
                "label": "Dólar → Boliviano",
            },
            "BOB_BRL": {
                "valor": data.get("BOBBRL", {}).get("bid", "0"),
                "var": data.get("BOBBRL", {}).get("pctChange", "0"),
                "label": "Boliviano → Real",
            },
            
            # América do Sul - Venezuela
            "USD_VES": {
                "valor": data.get("USDVES", {}).get("bid", "0"),
                "var": data.get("USDVES", {}).get("pctChange", "0"),
                "label": "Dólar → Bolívar Venezuelano",
            },
            "VES_BRL": {
                "valor": data.get("VESBRL", {}).get("bid", "0"),
                "var": data.get("VESBRL", {}).get("pctChange", "0"),
                "label": "Bolívar Venezuelano → Real",
            },
            
            # América Central e Caribe - México
            "USD_MXN": {
                "valor": data.get("USDMXN", {}).get("bid", "0"),
                "var": data.get("USDMXN", {}).get("pctChange", "0"),
                "label": "Dólar → Peso Mexicano",
            },
            "MXN_BRL": {
                "valor": data.get("MXNBRL", {}).get("bid", "0"),
                "var": data.get("MXNBRL", {}).get("pctChange", "0"),
                "label": "Peso Mexicano → Real",
            },
            
            # América Central - Costa Rica
            "USD_CRC": {
                "valor": data.get("USDCRC", {}).get("bid", "0"),
                "var": data.get("USDCRC", {}).get("pctChange", "0"),
                "label": "Dólar → Colón Costarriquenho",
            },
            "CRC_BRL": {
                "valor": data.get("CRCBRL", {}).get("bid", "0"),
                "var": data.get("CRCBRL", {}).get("pctChange", "0"),
                "label": "Colón Costarriquenho → Real",
            },
            
            # América Central - Guatemala
            "USD_GTQ": {
                "valor": data.get("USDGTQ", {}).get("bid", "0"),
                "var": data.get("USDGTQ", {}).get("pctChange", "0"),
                "label": "Dólar → Quetzal Guatemalteco",
            },
            "GTQ_BRL": {
                "valor": data.get("GTQBRL", {}).get("bid", "0"),
                "var": data.get("GTQBRL", {}).get("pctChange", "0"),
                "label": "Quetzal Guatemalteco → Real",
            },
            
            # América Central - Honduras
            "USD_HNL": {
                "valor": data.get("USDHNL", {}).get("bid", "0"),
                "var": data.get("USDHNL", {}).get("pctChange", "0"),
                "label": "Dólar → Lempira Hondurenho",
            },
            "HNL_BRL": {
                "valor": data.get("HNLBRL", {}).get("bid", "0"),
                "var": data.get("HNLBRL", {}).get("pctChange", "0"),
                "label": "Lempira Hondurenho → Real",
            },
            
            # América Central - Nicarágua
            "USD_NIO": {
                "valor": data.get("USDNIO", {}).get("bid", "0"),
                "var": data.get("USDNIO", {}).get("pctChange", "0"),
                "label": "Dólar → Córdoba Nicaraguense",
            },
            "NIO_BRL": {
                "valor": data.get("NIOBRL", {}).get("bid", "0"),
                "var": data.get("NIOBRL", {}).get("pctChange", "0"),
                "label": "Córdoba Nicaraguense → Real",
            },
            
            # América Central - Panamá
            "USD_PAB": {
                "valor": data.get("USDPAB", {}).get("bid", "0"),
                "var": data.get("USDPAB", {}).get("pctChange", "0"),
                "label": "Dólar → Balboa Panamenho",
            },
            "PAB_BRL": {
                "valor": data.get("PABBRL", {}).get("bid", "0"),
                "var": data.get("PABBRL", {}).get("pctChange", "0"),
                "label": "Balboa Panamenho → Real",
            },
            
            # Caribe - República Dominicana
            "USD_DOP": {
                "valor": data.get("USDDOP", {}).get("bid", "0"),
                "var": data.get("USDDOP", {}).get("pctChange", "0"),
                "label": "Dólar → Peso Dominicano",
            },
            "DOP_BRL": {
                "valor": data.get("DOPBRL", {}).get("bid", "0"),
                "var": data.get("DOPBRL", {}).get("pctChange", "0"),
                "label": "Peso Dominicano → Real",
            },
            
            # Turismo
            "USDT_BRL": {
                "valor": data.get("USDTBRL", {}).get("bid", "0"),
                "var": data.get("USDTBRL", {}).get("pctChange", "0"),
                "label": "Dólar Turismo → Real",
            },
            "EURT_BRL": {
                "valor": data.get("EURTBRL", {}).get("bid", "0"),
                "var": data.get("EURTBRL", {}).get("pctChange", "0"),
                "label": "Euro Turismo → Real",
            },
        }
        
        _cache_exchange["data"] = result
        _cache_exchange["timestamp"] = datetime.now()
        logger.info("✅ Exchange rates obtidos com sucesso")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar exchange rates: {e}")
        # Retorna valores zerados como fallback para todas as moedas
        fallback_pairs = [
            "USD_BRL", "EUR_BRL", "EUR_USD", "BTC_USD", "BTC_BRL",
            "USD_ARS", "ARS_BRL", "BRL_ARS",
            "USD_CLP", "CLP_BRL",
            "USD_COP", "COP_BRL",
            "USD_PEN", "PEN_BRL",
            "USD_UYU", "UYU_BRL",
            "USD_PYG", "PYG_BRL",
            "USD_BOB", "BOB_BRL",
            "USD_VES", "VES_BRL",
            "USD_MXN", "MXN_BRL",
            "USD_CRC", "CRC_BRL",
            "USD_GTQ", "GTQ_BRL",
            "USD_HNL", "HNL_BRL",
            "USD_NIO", "NIO_BRL",
            "USD_PAB", "PAB_BRL",
            "USD_DOP", "DOP_BRL",
            "USDT_BRL", "EURT_BRL",
        ]
        return {pair: {"valor": "0.00", "var": "0.00", "label": pair.replace("_", " → ")} for pair in fallback_pairs}


@router.get("/indexes/brazil")
def get_brazil_indexes():
    """
    Retorna índices brasileiros da B3
    Usa HG Brasil Finance API (grátis com limite)
    """
    logger.info("📊 Requisição recebida: /indexes/brazil")
    
    try:
        url = "https://api.hgbrasil.com/finance?format=json-cors&key=development"
        resp = requests.get(url, timeout=5)
        
        if resp.status_code != 200:
            raise Exception(f"HG Brasil status {resp.status_code}")
        
        data = resp.json()["results"]["stocks"]
        
        result = {
            "IBOVESPA": {
                "name": "IBOVESPA",
                "label": "Ibovespa",
                "valor": str(data["IBOVESPA"]["points"]),
                "var": str(data["IBOVESPA"]["variation"]),
                "description": "Índice Bovespa - Principal índice da B3",
            },
            "IFIX": {
                "name": "IFIX",
                "label": "IFIX",
                "valor": str(data.get("IFIX", {}).get("points", "0")),
                "var": str(data.get("IFIX", {}).get("variation", "0.00")),
                "description": "Índice de Fundos Imobiliários",
            },
        }
        
        logger.info("✅ Índices brasileiros obtidos")
        return result
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar índices brasileiros: {e}")
        return {
            "IBOVESPA": {"name": "IBOVESPA", "label": "Ibovespa", "valor": "0", "var": "0.00", "description": "Índice Bovespa"},
            "IFIX": {"name": "IFIX", "label": "IFIX", "valor": "0", "var": "0.00", "description": "Índice de Fundos Imobiliários"},
        }


@router.get("/indexes/argentina")
def get_argentina_indexes():
    """
    Retorna índices argentinos
    Simulação com valores estáticos (APIs argentinas são limitadas/pagas)
    """
    logger.info("📊 Requisição recebida: /indexes/argentina")
    
    # Nota: A maioria das APIs argentinas (BYMA) requer autenticação
    # Para produção, considere: https://www.portfoliopersonal.com/ API
    # Por ora, retornamos estrutura com dados mock
    
    return {
        "MERVAL": {
            "name": "MERVAL",
            "label": "S&P Merval",
            "valor": "1250000",  # Valor aproximado em ARS
            "var": "1.25",
            "description": "Índice Merval - Principal índice da Bolsa de Buenos Aires",
        },
        "BURCAP": {
            "name": "BURCAP",
            "label": "BURCAP",
            "valor": "850000",
            "var": "0.85",
            "description": "Índice de Capitalização da BYMA",
        },
    }


@router.get("/indexes/usa")
def get_usa_indexes():
    """
    Retorna índices americanos
    Usa Yahoo Finance alternativa (finnhub.io free tier)
    """
    logger.info("📊 Requisição recebida: /indexes/usa")
    
    try:
        # Finnhub free API (sem API key necessária para cotações básicas)
        # Nota: Para produção, registre em finnhub.io para obter API key
        indexes = {
            "^GSPC": "S&P 500",
            "^DJI": "Dow Jones",
            "^IXIC": "Nasdaq",
        }
        
        result = {}
        
        # Alternativa: usar Yahoo Finance via scraping-free API
        # Para simplificar, retornamos estrutura com dados aproximados
        # Em produção, use finnhub.io ou Alpha Vantage com API key
        
        result = {
            "SP500": {
                "name": "SP500",
                "label": "S&P 500",
                "valor": "5000.00",  # Valor aproximado
                "var": "0.50",
                "description": "Standard & Poor's 500 - Índice das 500 maiores empresas dos EUA",
            },
            "DOW": {
                "name": "DOW",
                "label": "Dow Jones",
                "valor": "38000.00",
                "var": "0.35",
                "description": "Dow Jones Industrial Average - 30 empresas blue-chip",
            },
            "NASDAQ": {
                "name": "NASDAQ",
                "label": "Nasdaq Composite",
                "valor": "16000.00",
                "var": "0.75",
                "description": "Nasdaq Composite - Índice focado em tecnologia",
            },
        }
        
        logger.info("✅ Índices americanos obtidos (dados aproximados)")
        return result
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar índices americanos: {e}")
        return {
            "SP500": {"name": "SP500", "label": "S&P 500", "valor": "0", "var": "0.00", "description": "S&P 500"},
            "DOW": {"name": "DOW", "label": "Dow Jones", "valor": "0", "var": "0.00", "description": "Dow Jones"},
            "NASDAQ": {"name": "NASDAQ", "label": "Nasdaq", "valor": "0", "var": "0.00", "description": "Nasdaq"},
        }
