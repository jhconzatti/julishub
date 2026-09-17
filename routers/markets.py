from fastapi import APIRouter, BackgroundTasks, HTTPException, Response
import httpx
import asyncio
import math
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
_cache_argentina_indexes = {"data": None, "timestamp": None}
_cache_usa_indexes       = {"data": None, "timestamp": None}

CACHE_DURATION = timedelta(hours=1)
SERVICE_UNAVAILABLE_DETAIL = "Dados temporariamente indisponíveis."


def is_cache_valid(cache_timestamp: Optional[datetime]) -> bool:
    """Verifica se o cache ainda é válido (menos de 1 hora)"""
    if cache_timestamp is None:
        return False
    return datetime.now() - cache_timestamp < CACHE_DURATION


def set_stale_headers(response: Response, timestamp: Optional[datetime]) -> None:
    response.headers["X-Data-Stale"] = "true"
    if timestamp is not None:
        response.headers["X-Data-Timestamp"] = timestamp.isoformat()


def is_numeric_value(value: object) -> bool:
    """Aceita zero como dado, mas rejeita ausência, vazio, NaN e infinito."""
    if value is None or isinstance(value, bool):
        return False
    if isinstance(value, str) and not value.strip():
        return False
    try:
        return math.isfinite(float(value))
    except (TypeError, ValueError):
        return False


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
        required = ("USDBRL", "EURBRL", "BTCUSD")
        if not all(
            key in data
            and is_numeric_value(data[key].get("bid"))
            and is_numeric_value(data[key].get("pctChange"))
            for key in required
        ):
            logger.error("❌ AwesomeAPI retornou payload inválido ou incompleto")
            return None
        logger.info("✅ Dados da AwesomeAPI obtidos com sucesso")

        return {
            "dolar":    {"valor": data["USDBRL"]["bid"],  "var": data["USDBRL"]["pctChange"]},
            "euro":     {"valor": data["EURBRL"]["bid"],  "var": data["EURBRL"]["pctChange"]},
            "bitcoin":  {"valor": data["BTCUSD"]["bid"],  "var": data["BTCUSD"]["pctChange"]},
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

        values = (
            currencies["USD"]["buy"], currencies["USD"]["variation"],
            currencies["EUR"]["buy"], currencies["EUR"]["variation"],
            currencies["BTC"]["buy"], currencies["BTC"]["variation"],
            stocks["IBOVESPA"]["points"], stocks["IBOVESPA"]["variation"],
        )
        if not all(is_numeric_value(value) for value in values):
            logger.error("❌ HG Brasil retornou payload inválido ou incompleto")
            return None

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

async def _refresh_cotacao() -> bool:
    """Busca cotações das APIs externas e atualiza o cache interno."""
    global _cache_cotacao

    data = await fetch_awesomeapi()

    if not data:
        logger.warning("⚠️ AwesomeAPI falhou, tentando HG Brasil...")
        data = await fetch_hgbrasil()

    if not data:
        logger.error("❌ Todas as APIs falharam ao atualizar cotação")
        return False

    # A AwesomeAPI não fornece IBOVESPA; o contrato só é atualizado quando
    # o complemento real do HG Brasil também está disponível.
    if "ibovespa" not in data:
        logger.info("🔄 Buscando IBOVESPA complementar da HG Brasil...")
        hg_data = await fetch_hgbrasil()
        if hg_data:
            data["ibovespa"] = hg_data["ibovespa"]
            logger.info("✅ IBOVESPA complementado com sucesso")
        else:
            logger.error("❌ Cotação incompleta: IBOVESPA indisponível")
            return False

    _cache_cotacao["data"]      = data
    _cache_cotacao["timestamp"] = datetime.now()
    logger.info("✅ Cache de cotação atualizado")
    return True


@router.get("/indicadores")
async def route_indicadores(response: Response):
    """Rota para retornar indicadores econômicos oficiais do Banco Central"""
    logger.info("📊 Requisição recebida: /indicadores")
    indicadores = await get_indicadores()

    if not indicadores:
        if _cache_indicadores["data"] is not None:
            logger.warning("♻️ Retornando indicadores stale após falha de atualização")
            set_stale_headers(response, _cache_indicadores["timestamp"])
            return _cache_indicadores["data"]
        logger.error("❌ Indicadores indisponíveis e sem cache válido")
        raise HTTPException(status_code=503, detail=SERVICE_UNAVAILABLE_DETAIL)

    return indicadores


@router.get("/cotacao")
async def get_cotacao(background_tasks: BackgroundTasks, response: Response):
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
        set_stale_headers(response, _cache_cotacao["timestamp"])
        background_tasks.add_task(_refresh_cotacao)
        return _cache_cotacao["data"]

    # Cold start: não há nenhum dado em cache — aguarda fetch completo
    logger.info("🆕 Cold start: buscando cotação pela primeira vez")
    refreshed = await _refresh_cotacao()

    if refreshed and _cache_cotacao["data"]:
        return _cache_cotacao["data"]

    logger.error("❌ Cotações indisponíveis e sem cache válido")
    raise HTTPException(status_code=503, detail=SERVICE_UNAVAILABLE_DETAIL)


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
async def get_exchange_rates(response: Response):
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

    awesome_result, btc_result = await asyncio.gather(
        get_client().get(awesome_url),
        get_client().get(btc_url),
        return_exceptions=True,
    )

    result = {}
    awesome_pairs = {
        "USDBRL": ("USD_BRL", "Dólar Comercial → Real"),
        "EURBRL": ("EUR_BRL", "Euro → Real"),
        "EURUSD": ("EUR_USD", "Euro → Dólar"),
        "USDARS": ("USD_ARS", "Dólar → Peso Argentino"),
        "ARSBRL": ("ARS_BRL", "Peso Argentino → Real"),
        "USDCLP": ("USD_CLP", "Dólar → Peso Chileno"),
        "CLPBRL": ("CLP_BRL", "Peso Chileno → Real"),
        "USDMXN": ("USD_MXN", "Dólar → Peso Mexicano"),
        "MXNBRL": ("MXN_BRL", "Peso Mexicano → Real"),
    }

    if isinstance(awesome_result, Exception):
        logger.error(f"❌ Erro ao acessar AwesomeAPI: {awesome_result}")
    elif awesome_result.status_code != 200:
        logger.error(f"❌ AwesomeAPI retornou status {awesome_result.status_code}")
    else:
        try:
            data = awesome_result.json()
            for source_key, (pair, label) in awesome_pairs.items():
                payload = data.get(source_key)
                if not isinstance(payload, dict) or not (
                    is_numeric_value(payload.get("bid")) and is_numeric_value(payload.get("pctChange"))
                ):
                    logger.warning(f"⚠️ AwesomeAPI sem taxa válida para {pair}")
                    continue
                result[pair] = {"valor": payload["bid"], "var": payload["pctChange"], "label": label}

            ars_brl = result.get("ARS_BRL")
            if ars_brl is not None and float(ars_brl["valor"]) != 0:
                result["BRL_ARS"] = {
                    "valor": f"{1 / float(ars_brl['valor']):.4f}",
                    "var": f"{-float(ars_brl['var']):.2f}",
                    "label": "Real → Peso Argentino",
                }
        except Exception as e:
            logger.error(f"❌ Payload inválido da AwesomeAPI: {e}")

    if isinstance(btc_result, Exception):
        logger.error(f"❌ Erro ao acessar CoinGecko: {btc_result}")
    elif btc_result.status_code != 200:
        logger.error(f"❌ CoinGecko retornou status {btc_result.status_code}")
    else:
        try:
            bitcoin = btc_result.json().get("bitcoin", {})
            if is_numeric_value(bitcoin.get("usd")) and is_numeric_value(bitcoin.get("brl")):
                result["BTC_USD"] = {"valor": str(bitcoin["usd"]), "var": None, "label": "Bitcoin → Dólar"}
                result["BTC_BRL"] = {"valor": str(bitcoin["brl"]), "var": None, "label": "Bitcoin → Real"}
            else:
                logger.error("❌ CoinGecko retornou payload inválido")
        except Exception as e:
            logger.error(f"❌ Payload inválido do CoinGecko: {e}")

    if result:
        _cache_exchange["data"] = result
        _cache_exchange["timestamp"] = datetime.now()
        logger.info("✅ Exchange rates obtidos com sucesso")
        return result

    if _cache_exchange["data"]:
        logger.warning("♻️  Retornando exchange rates do cache stale")
        set_stale_headers(response, _cache_exchange["timestamp"])
        return _cache_exchange["data"]
    raise HTTPException(status_code=503, detail=SERVICE_UNAVAILABLE_DETAIL)


@router.get("/indexes/brazil")
async def get_brazil_indexes(response: Response):
    """Índices brasileiros da B3 via HG Brasil Finance API"""
    logger.info("📊 Requisição recebida: /indexes/brazil")

    if is_cache_valid(_cache_indexes["timestamp"]):
        logger.info("📦 Retornando índices brasileiros do cache")
        return _cache_indexes["data"]

    try:
        url  = "https://api.hgbrasil.com/finance?format=json-cors&key=development"
        resp = await get_client().get(url)

        if resp.status_code != 200:
            raise Exception(f"HG Brasil status {resp.status_code}")

        data = resp.json()["results"]["stocks"]

        values = (
            data["IBOVESPA"]["points"], data["IBOVESPA"]["variation"],
            data["IFIX"]["points"], data["IFIX"]["variation"],
        )
        if not all(is_numeric_value(value) for value in values):
            raise ValueError("HG Brasil retornou índices inválidos")

        result = {
            "IBOVESPA": {"name": "IBOVESPA", "label": "Ibovespa", "valor": str(data["IBOVESPA"]["points"]), "var": str(data["IBOVESPA"]["variation"]), "description": "Índice Bovespa - Principal índice da B3"},
            "IFIX":     {"name": "IFIX",     "label": "IFIX",     "valor": str(data["IFIX"]["points"]),     "var": str(data["IFIX"]["variation"]),     "description": "Índice de Fundos Imobiliários"},
        }
        _cache_indexes["data"] = result
        _cache_indexes["timestamp"] = datetime.now()
        logger.info("✅ Índices brasileiros obtidos")
        return result

    except Exception as e:
        logger.error(f"❌ Erro ao buscar índices brasileiros: {e}")
        if _cache_indexes["data"] is not None:
            logger.warning("♻️ Retornando índices brasileiros stale")
            set_stale_headers(response, _cache_indexes["timestamp"])
            return _cache_indexes["data"]
        raise HTTPException(status_code=503, detail=SERVICE_UNAVAILABLE_DETAIL)


YAHOO_INDEX_URL = "https://query1.finance.yahoo.com/v8/finance/chart"


async def fetch_yahoo_index(symbol: str, name: str, label: str, description: str) -> Optional[dict]:
    """Obtém um índice real no endpoint estruturado de gráficos do Yahoo Finance."""
    try:
        response = await get_client().get(
            f"{YAHOO_INDEX_URL}/{symbol}?range=5d&interval=1d",
            headers={"User-Agent": "Mozilla/5.0 (compatible; JulisHub/1.0)"},
        )
        if response.status_code != 200:
            logger.warning("⚠️ Yahoo Finance retornou status %s para %s", response.status_code, name)
            return None

        chart = response.json().get("chart", {})
        if chart.get("error") is not None:
            logger.warning("⚠️ Yahoo Finance não possui dado disponível para %s", name)
            return None

        results = chart.get("result")
        if not isinstance(results, list) or not results:
            logger.error("❌ Yahoo Finance retornou payload vazio para %s", name)
            return None

        meta = results[0].get("meta", {})
        value = meta.get("regularMarketPrice")
        variation = meta.get("regularMarketChangePercent")
        if not is_numeric_value(value) or not is_numeric_value(variation):
            logger.error("❌ Yahoo Finance retornou payload inválido para %s", name)
            return None

        return {
            "name": name,
            "label": label,
            "valor": str(value),
            "var": str(variation),
            "description": f"{description} · Fonte: Yahoo Finance",
        }
    except httpx.TimeoutException:
        logger.error("❌ Timeout ao buscar %s no Yahoo Finance", name)
        return None
    except Exception as error:
        logger.error("❌ Erro ao buscar %s no Yahoo Finance: %s", name, error)
        return None


async def get_yahoo_indexes(response: Response, cache: dict, market: str, specs: tuple[tuple[str, str, str, str], ...]) -> dict:
    if is_cache_valid(cache["timestamp"]):
        logger.info("📦 Retornando índices de %s do cache", market)
        return cache["data"]

    results = await asyncio.gather(*(fetch_yahoo_index(*spec) for spec in specs))
    if all(result is not None for result in results):
        payload = {result["name"]: result for result in results}
        cache["data"] = payload
        cache["timestamp"] = datetime.now()
        logger.info("✅ Índices de %s obtidos no Yahoo Finance", market)
        return payload

    if cache["data"] is not None:
        logger.warning("♻️ Retornando índices de %s stale", market)
        set_stale_headers(response, cache["timestamp"])
        return cache["data"]

    logger.error("❌ Índices de %s indisponíveis e sem cache válido", market)
    raise HTTPException(status_code=503, detail=SERVICE_UNAVAILABLE_DETAIL)


@router.get("/indexes/argentina")
async def get_argentina_indexes(response: Response):
    """S&P MERVAL via Yahoo Finance; BURCAP permanece indisponível sem fonte adequada."""
    logger.info("📊 Requisição recebida: /indexes/argentina")
    return await get_yahoo_indexes(response, _cache_argentina_indexes, "Argentina", (
        ("%5EMERV", "MERVAL", "S&P Merval", "Principal índice da Bolsa de Buenos Aires"),
    ))


@router.get("/indexes/usa")
async def get_usa_indexes(response: Response):
    """S&P 500, Dow Jones e Nasdaq Composite via Yahoo Finance."""
    logger.info("📊 Requisição recebida: /indexes/usa")
    return await get_yahoo_indexes(response, _cache_usa_indexes, "Estados Unidos", (
        ("%5EGSPC", "SP500", "S&P 500", "Índice das 500 maiores empresas dos EUA"),
        ("%5EDJI", "DOW", "Dow Jones", "Dow Jones Industrial Average"),
        ("%5EIXIC", "NASDAQ", "Nasdaq Composite", "Índice amplo da Nasdaq"),
    ))
