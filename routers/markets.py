from fastapi import APIRouter, BackgroundTasks
import httpx
import asyncio
from datetime import datetime, timedelta
from typing import Optional
import logging

router = APIRouter()

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# HTTP Client com connection pooling (reutilizado entre todas as requisições)
# ---------------------------------------------------------------------------

_http_client: Optional[httpx.AsyncClient] = None


def get_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=5.0),
            follow_redirects=True,
        )
    return _http_client


# ---------------------------------------------------------------------------
# Cache em memória
# ---------------------------------------------------------------------------

_cache_indicadores = {"data": None, "timestamp": None}
_cache_exchange    = {"data": None, "timestamp": None}
_cache_cotacao     = {"data": None, "timestamp": None}
_cache_indexes     = {"data": None, "timestamp": None}

CACHE_DURATION = timedelta(hours=1)


def is_cache_valid(cache_timestamp: Optional[datetime]) -> bool:
    """Verifica se o cache ainda é válido (menos de 1 hora)"""
    if cache_timestamp is None:
        return False
    return datetime.now() - cache_timestamp < CACHE_DURATION


# ---------------------------------------------------------------------------
# Fetch helpers (async)
# ---------------------------------------------------------------------------

async def fetch_awesomeapi() -> Optional[dict]:
    """Busca Dólar, Euro e Bitcoin via AwesomeAPI"""
    try:
        logger.info("🔄 Buscando dados da AwesomeAPI...")
        url = "https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-USD"
        resp = await get_client().get(url)

        if resp.status_code != 200:
            logger.warning(f"⚠️ AwesomeAPI retornou status {resp.status_code}")
            return None

        data = resp.json()
        logger.info("✅ Dados da AwesomeAPI obtidos com sucesso")

        return {
            "dolar":    {"valor": data["USDBRL"]["bid"],  "var": data["USDBRL"]["pctChange"]},
            "euro":     {"valor": data["EURBRL"]["bid"],  "var": data["EURBRL"]["pctChange"]},
            "bitcoin":  {"valor": data["BTCUSD"]["bid"],  "var": data["BTCUSD"]["pctChange"]},
            "ibovespa": {"valor": "0.00", "var": "0.00"},  # AwesomeAPI não tem IBOV
        }
    except httpx.TimeoutException:
        logger.error("❌ Timeout ao acessar AwesomeAPI")
        return None
    except Exception as e:
        logger.error(f"❌ Erro fetch_awesomeapi: {e}")
        return None


async def fetch_hgbrasil() -> Optional[dict]:
    """Fallback: HG Brasil Finance API"""
    try:
        logger.info("🔄 Tentando HG Brasil como fallback...")
        url = "https://api.hgbrasil.com/finance?format=json-cors&key=development"
        resp = await get_client().get(url)

        if resp.status_code != 200:
            logger.warning(f"⚠️ HG Brasil retornou status {resp.status_code}")
            return None

        data = resp.json()["results"]
        currencies = data["currencies"]
        stocks = data["stocks"]

        logger.info("✅ Dados da HG Brasil obtidos com sucesso")

        return {
            "dolar":    {"valor": str(currencies["USD"]["buy"]),      "var": str(currencies["USD"]["variation"])},
            "euro":     {"valor": str(currencies["EUR"]["buy"]),      "var": str(currencies["EUR"]["variation"])},
            "bitcoin":  {"valor": str(currencies["BTC"]["buy"]),      "var": str(currencies["BTC"]["variation"])},
            "ibovespa": {"valor": str(stocks["IBOVESPA"]["points"]),  "var": str(stocks["IBOVESPA"]["variation"])},
        }
    except httpx.TimeoutException:
        logger.error("❌ Timeout ao acessar HG Brasil")
        return None
    except Exception as e:
        logger.error(f"❌ Erro fetch_hgbrasil: {e}")
        return None


# ---------------------------------------------------------------------------
# Indicadores (SELIC + IPCA em paralelo)
# ---------------------------------------------------------------------------

async def get_indicadores() -> Optional[dict]:
    """
    Busca SELIC e IPCA do Banco Central em paralelo com asyncio.gather.
    Cache de 1 hora para evitar rate limiting.
    """
    global _cache_indicadores

    if is_cache_valid(_cache_indicadores["timestamp"]):
        logger.info("📦 Retornando indicadores do cache (ainda válido)")
        return _cache_indicadores["data"]

    logger.info("🔄 Buscando indicadores do Banco Central em paralelo...")

    try:
        url_selic = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json"
        url_ipca  = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json"

        # SELIC e IPCA em paralelo — de ~2s para ~1s
        resp_selic, resp_ipca = await asyncio.gather(
            get_client().get(url_selic),
            get_client().get(url_ipca),
        )

        if resp_selic.status_code != 200 or resp_ipca.status_code != 200:
            logger.error(f"❌ BC retornou erro. SELIC: {resp_selic.status_code}, IPCA: {resp_ipca.status_code}")
            return None

        selic_data = resp_selic.json()
        ipca_data  = resp_ipca.json()

        if not selic_data or not ipca_data:
            logger.error("❌ API do BC retornou dados vazios")
            return None

        selic_valor  = float(selic_data[0]["valor"])
        ipca_valor   = float(ipca_data[0]["valor"])
        cdi_estimado = selic_valor - 0.10

        result = {
            "selic": {"valor": f"{selic_valor:.2f}", "data": selic_data[0]["data"], "descricao": "Taxa SELIC Meta (% a.a.)"},
            "ipca":  {"valor": f"{ipca_valor:.2f}",  "data": ipca_data[0]["data"],  "descricao": "IPCA - 12 meses (% a.a.)"},
            "cdi":   {"valor": f"{cdi_estimado:.2f}",                               "descricao": "CDI Estimado (% a.a.)"},
        }

        _cache_indicadores["data"]      = result
        _cache_indicadores["timestamp"] = datetime.now()
        logger.info(f"✅ Indicadores obtidos! SELIC: {selic_valor}%, IPCA: {ipca_valor}%")
        logger.info(f"📦 Cache válido até {_cache_indicadores['timestamp'] + CACHE_DURATION}")

        return result

    except httpx.TimeoutException:
        logger.error("❌ Timeout ao acessar API do Banco Central")
        return None
    except Exception as e:
        logger.error(f"❌ Erro get_indicadores: {e}")
        return None


# ---------------------------------------------------------------------------
# Cotação (cache + stale-while-revalidate)
# ---------------------------------------------------------------------------

async def _refresh_cotacao() -> None:
    """Busca cotações das APIs externas e atualiza o cache interno."""
    global _cache_cotacao

    data = await fetch_awesomeapi()

    if not data:
        logger.warning("⚠️ AwesomeAPI falhou, tentando HG Brasil...")
        data = await fetch_hgbrasil()

    if not data:
        logger.error("❌ Todas as APIs falharam ao atualizar cotação")
        return

    # Complementa IBOVESPA via HG Brasil, se necessário
    if data["ibovespa"]["valor"] == "0.00":
        logger.info("🔄 Buscando IBOVESPA complementar da HG Brasil...")
        hg_data = await fetch_hgbrasil()
        if hg_data:
            data["ibovespa"] = hg_data["ibovespa"]
            logger.info("✅ IBOVESPA complementado com sucesso")

    _cache_cotacao["data"]      = data
    _cache_cotacao["timestamp"] = datetime.now()
    logger.info("✅ Cache de cotação atualizado")


@router.get("/indicadores")
async def route_indicadores():
    """Rota para retornar indicadores econômicos oficiais do Banco Central"""
    logger.info("📊 Requisição recebida: /indicadores")
    indicadores = await get_indicadores()

    if not indicadores:
        logger.warning("⚠️ Retornando valores zerados (fallback)")
        return {
            "selic": {"valor": "0.00", "data": datetime.now().strftime("%d/%m/%Y"), "descricao": "Taxa SELIC Meta (% a.a.)"},
            "ipca":  {"valor": "0.00", "data": datetime.now().strftime("%d/%m/%Y"), "descricao": "IPCA - 12 meses (% a.a.)"},
            "cdi":   {"valor": "0.00", "descricao": "CDI Estimado (% a.a.)"},
            "erro":  "Não foi possível buscar dados do Banco Central no momento",
        }

    return indicadores


@router.get("/cotacao")
async def get_cotacao(background_tasks: BackgroundTasks):
    """
    Cotações com cache + stale-while-revalidate:
    - Cache válido  → retorna imediatamente (sem bater em API externa)
    - Cache vencido → retorna dado stale agora + dispara refresh em background
    - Sem cache     → aguarda fetch (cold start)
    """
    logger.info("💱 Requisição recebida: /cotacao")

    if is_cache_valid(_cache_cotacao["timestamp"]):
        logger.info("📦 Retornando cotação do cache (válido)")
        return _cache_cotacao["data"]

    if _cache_cotacao["data"] is not None:
        logger.info("♻️  Retornando cotação stale, disparando refresh em background")
        background_tasks.add_task(_refresh_cotacao)
        return _cache_cotacao["data"]

    # Cold start: não há nenhum dado em cache — aguarda fetch completo
    logger.info("🆕 Cold start: buscando cotação pela primeira vez")
    await _refresh_cotacao()

    if _cache_cotacao["data"]:
        return _cache_cotacao["data"]

    logger.error("❌ Todas as APIs falharam! Retornando valores zerados")
    return {
        "dolar":    {"valor": "0.00", "var": "0.00"},
        "euro":     {"valor": "0.00", "var": "0.00"},
        "bitcoin":  {"valor": "0.00", "var": "0.00"},
        "ibovespa": {"valor": "0.00", "var": "0.00"},
    }


@router.get("/historico/{moeda}")
async def get_historico(moeda: str):
    """Retorna histórico de 30 dias de uma moeda via AwesomeAPI"""
    logger.info(f"📈 Requisição recebida: /historico/{moeda}")
    symbol_map = {"dolar": "USD-BRL", "euro": "EUR-BRL", "bitcoin": "BTC-USD"}

    symbol = symbol_map.get(moeda)
    if not symbol:
        logger.warning(f"⚠️ Moeda inválida: {moeda}")
        return []

    try:
        url = f"https://economia.awesomeapi.com.br/json/daily/{symbol}/30"
        logger.info(f"   → Buscando histórico: {url}")
        resp = await get_client().get(url)

        if resp.status_code != 200:
            logger.error(f"❌ Erro ao buscar histórico: status {resp.status_code}")
            return []

        data = resp.json()
        historico = [
            {"data": datetime.fromtimestamp(int(item["timestamp"])).strftime("%d/%m"), "valor": float(item["bid"])}
            for item in data
        ]

        logger.info(f"✅ Histórico retornado: {len(historico)} registros")
        return historico[::-1]

    except httpx.TimeoutException:
        logger.error(f"❌ Timeout ao buscar histórico de {moeda}")
        return []
    except Exception as e:
        logger.error(f"❌ Erro ao buscar histórico de {moeda}: {e}")
        return []


@router.get("/exchange-rates")
async def get_exchange_rates():
    """
    Taxas de câmbio expandidas (USD, EUR, BRL, ARS, CLP, MXN, BTC).
    AwesomeAPI + CoinGecko disparados em paralelo com asyncio.gather.
    """
    global _cache_exchange

    if is_cache_valid(_cache_exchange["timestamp"]):
        logger.info("📦 Retornando exchange rates do cache")
        return _cache_exchange["data"]

    logger.info("💱 Buscando exchange rates em paralelo...")

    all_pairs = [
        "USD-BRL", "EUR-BRL", "EUR-USD",
        "USD-ARS", "ARS-BRL",
        "USD-CLP", "CLP-BRL",
        "USD-MXN", "MXN-BRL",
    ]
    awesome_url = f"https://economia.awesomeapi.com.br/last/{','.join(all_pairs)}"
    btc_url     = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl"

    try:
        # AwesomeAPI + CoinGecko em paralelo — de ~2.5s para ~800ms
        awesome_result, btc_result = await asyncio.gather(
            get_client().get(awesome_url),
            get_client().get(btc_url),
            return_exceptions=True,
        )

        if isinstance(awesome_result, Exception):
            raise awesome_result

        if awesome_result.status_code != 200:
            raise Exception(f"AwesomeAPI status {awesome_result.status_code}")

        data = awesome_result.json()
        btc_data = (
            btc_result.json()
            if not isinstance(btc_result, Exception) and btc_result.status_code == 200
            else {"bitcoin": {"usd": 0, "brl": 0}}
        )

        def safe_float(value, default=0.0):
            try:
                return float(value) if value else default
            except (ValueError, TypeError):
                return default

        ars_brl = safe_float(data.get("ARSBRL", {}).get("bid"))
        brl_ars = 1 / ars_brl if ars_brl > 0 else 0

        result = {
            "USD_BRL": {"valor": data.get("USDBRL", {}).get("bid", "0"),  "var": data.get("USDBRL", {}).get("pctChange", "0"),  "label": "Dólar Comercial → Real"},
            "EUR_BRL": {"valor": data.get("EURBRL", {}).get("bid", "0"),  "var": data.get("EURBRL", {}).get("pctChange", "0"),  "label": "Euro → Real"},
            "EUR_USD": {"valor": data.get("EURUSD", {}).get("bid", "0"),  "var": data.get("EURUSD", {}).get("pctChange", "0"),  "label": "Euro → Dólar"},
            "BTC_USD": {"valor": str(btc_data.get("bitcoin", {}).get("usd", 0)), "var": "0.00", "label": "Bitcoin → Dólar"},
            "BTC_BRL": {"valor": str(btc_data.get("bitcoin", {}).get("brl", 0)), "var": "0.00", "label": "Bitcoin → Real"},
            "USD_ARS": {"valor": data.get("USDARS", {}).get("bid", "0"),  "var": data.get("USDARS", {}).get("pctChange", "0"),  "label": "Dólar → Peso Argentino"},
            "ARS_BRL": {"valor": data.get("ARSBRL", {}).get("bid", "0"),  "var": data.get("ARSBRL", {}).get("pctChange", "0"),  "label": "Peso Argentino → Real"},
            "BRL_ARS": {"valor": f"{brl_ars:.4f}", "var": f"{-safe_float(data.get('ARSBRL', {}).get('pctChange')):.2f}", "label": "Real → Peso Argentino"},
            "USD_CLP": {"valor": data.get("USDCLP", {}).get("bid", "0"),  "var": data.get("USDCLP", {}).get("pctChange", "0"),  "label": "Dólar → Peso Chileno"},
            "CLP_BRL": {"valor": data.get("CLPBRL", {}).get("bid", "0"),  "var": data.get("CLPBRL", {}).get("pctChange", "0"),  "label": "Peso Chileno → Real"},
            "USD_MXN": {"valor": data.get("USDMXN", {}).get("bid", "0"),  "var": data.get("USDMXN", {}).get("pctChange", "0"),  "label": "Dólar → Peso Mexicano"},
            "MXN_BRL": {"valor": data.get("MXNBRL", {}).get("bid", "0"),  "var": data.get("MXNBRL", {}).get("pctChange", "0"),  "label": "Peso Mexicano → Real"},
        }

        _cache_exchange["data"]      = result
        _cache_exchange["timestamp"] = datetime.now()
        logger.info("✅ Exchange rates obtidos com sucesso")
        return result

    except Exception as e:
        logger.error(f"❌ Erro ao buscar exchange rates: {e}")
        # Retorna stale cache se disponível, evitando zeros desnecessários
        if _cache_exchange["data"]:
            logger.warning("♻️  Retornando exchange rates do cache stale")
            return _cache_exchange["data"]
        fallback_pairs = ["USD_BRL", "EUR_BRL", "EUR_USD", "BTC_USD", "BTC_BRL", "USD_ARS", "ARS_BRL", "BRL_ARS", "USD_CLP", "CLP_BRL", "USD_MXN", "MXN_BRL"]
        return {pair: {"valor": "0.00", "var": "0.00", "label": pair.replace("_", " → ")} for pair in fallback_pairs}


@router.get("/indexes/brazil")
async def get_brazil_indexes():
    """Índices brasileiros da B3 via HG Brasil Finance API"""
    logger.info("📊 Requisição recebida: /indexes/brazil")

    try:
        url  = "https://api.hgbrasil.com/finance?format=json-cors&key=development"
        resp = await get_client().get(url)

        if resp.status_code != 200:
            raise Exception(f"HG Brasil status {resp.status_code}")

        data = resp.json()["results"]["stocks"]

        logger.info("✅ Índices brasileiros obtidos")
        return {
            "IBOVESPA": {"name": "IBOVESPA", "label": "Ibovespa", "valor": str(data["IBOVESPA"]["points"]),            "var": str(data["IBOVESPA"]["variation"]),            "description": "Índice Bovespa - Principal índice da B3"},
            "IFIX":     {"name": "IFIX",     "label": "IFIX",     "valor": str(data.get("IFIX", {}).get("points", "0")), "var": str(data.get("IFIX", {}).get("variation", "0.00")), "description": "Índice de Fundos Imobiliários"},
        }

    except Exception as e:
        logger.error(f"❌ Erro ao buscar índices brasileiros: {e}")
        return {
            "IBOVESPA": {"name": "IBOVESPA", "label": "Ibovespa", "valor": "0", "var": "0.00", "description": "Índice Bovespa"},
            "IFIX":     {"name": "IFIX",     "label": "IFIX",     "valor": "0", "var": "0.00", "description": "Índice de Fundos Imobiliários"},
        }


@router.get("/indexes/argentina")
async def get_argentina_indexes():
    """Índices argentinos (mock — APIs BYMA requerem autenticação paga)"""
    logger.info("📊 Requisição recebida: /indexes/argentina")
    return {
        "MERVAL": {"name": "MERVAL", "label": "S&P Merval", "valor": "1250000", "var": "1.25", "description": "Índice Merval - Principal índice da Bolsa de Buenos Aires"},
        "BURCAP": {"name": "BURCAP", "label": "BURCAP",     "valor": "850000",  "var": "0.85", "description": "Índice de Capitalização da BYMA"},
    }


@router.get("/indexes/usa")
async def get_usa_indexes():
    """Índices americanos (aproximados — use finnhub.io/Alpha Vantage com API key em produção)"""
    logger.info("📊 Requisição recebida: /indexes/usa")
    return {
        "SP500":  {"name": "SP500",  "label": "S&P 500",         "valor": "5000.00",  "var": "0.50", "description": "Standard & Poor's 500 - Índice das 500 maiores empresas dos EUA"},
        "DOW":    {"name": "DOW",    "label": "Dow Jones",        "valor": "38000.00", "var": "0.35", "description": "Dow Jones Industrial Average - 30 empresas blue-chip"},
        "NASDAQ": {"name": "NASDAQ", "label": "Nasdaq Composite", "valor": "16000.00", "var": "0.75", "description": "Nasdaq Composite - Índice focado em tecnologia"},
    }
