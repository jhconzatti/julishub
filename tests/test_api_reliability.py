import unittest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from app import app
from routers import markets, news


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code

    def json(self):
        return self._payload


class ExchangeClient:
    fiat_payloads = {
        "USD-BRL": ("USDBRL", {"bid": "0", "pctChange": "0"}),
        "EUR-BRL": ("EURBRL", {"bid": "6.20", "pctChange": "0.10"}),
        "EUR-USD": ("EURUSD", {"bid": "1.10", "pctChange": "-0.20"}),
        "USD-ARS": ("USDARS", {"bid": "1200", "pctChange": "0.30"}),
        "ARS-BRL": ("ARSBRL", {"bid": "0.0045", "pctChange": "0.40"}),
        "USD-CLP": ("USDCLP", {"bid": "950", "pctChange": "0.50"}),
        "CLP-BRL": ("CLPBRL", {"bid": "0.0055", "pctChange": "0.60"}),
        "USD-MXN": ("USDMXN", {"bid": "18", "pctChange": "0.70"}),
        "MXN-BRL": ("MXNBRL", {"bid": "0.30", "pctChange": "0.80"}),
    }

    async def get(self, url):
        if "coingecko" in url:
            return FakeResponse({"bitcoin": {"usd": 60000, "brl": 300000}})
        source_key, payload = self.fiat_payloads[url.rsplit("/", 1)[-1]]
        return FakeResponse({source_key: payload.copy()})


class FailingClient:
    async def get(self, _url, **_kwargs):
        raise httpx.TimeoutException("provider timeout")


class IncompleteExchangeClient(ExchangeClient):
    async def get(self, url, **_kwargs):
        response = await super().get(url)
        if url.endswith("MXN-BRL"):
            response._payload.clear()
        return response


class CoinGeckoUnavailableClient(ExchangeClient):
    async def get(self, url, **_kwargs):
        if "coingecko" in url:
            raise httpx.TimeoutException("CoinGecko timeout")
        return await super().get(url)


class AwesomeUnavailableClient(ExchangeClient):
    async def get(self, url, **_kwargs):
        if "coingecko" not in url:
            raise httpx.TimeoutException("AwesomeAPI timeout")
        return await super().get(url)


class InvalidArsExchangeClient(ExchangeClient):
    async def get(self, url, **_kwargs):
        response = await super().get(url)
        if url.endswith("ARS-BRL"):
            response._payload["ARSBRL"] = {"bid": "invalid", "pctChange": "0.40"}
        return response


class PairFailureExchangeClient(ExchangeClient):
    failures = {}

    async def get(self, url, **_kwargs):
        pair = url.rsplit("/", 1)[-1]
        failure = self.failures.get(pair)
        if isinstance(failure, Exception):
            raise failure
        if isinstance(failure, int):
            return FakeResponse({}, failure)
        if failure == "malformed":
            source_key, _ = self.fiat_payloads[pair]
            return FakeResponse({source_key: {"bid": "invalid", "pctChange": "0.10"}})
        return await super().get(url)


class OneNon200PairClient(PairFailureExchangeClient):
    failures = {"USD-ARS": 404}


class SeveralFailedPairsClient(PairFailureExchangeClient):
    failures = {"EUR-USD": 404, "USD-CLP": 503, "MXN-BRL": 404}


class TimedOutPairClient(PairFailureExchangeClient):
    failures = {"EUR-BRL": httpx.TimeoutException("EUR-BRL timeout")}


class MalformedPairClient(PairFailureExchangeClient):
    failures = {"CLP-BRL": "malformed"}


class YahooIndexesClient:
    values = {
        "%5EMERV": (2345678.9, 1.23),
        "%5EGSPC": (6123.45, 0.42),
        "%5EDJI": (42123.67, -0.31),
        "%5EIXIC": (19876.54, 0.18),
    }

    async def get(self, url, **_kwargs):
        symbol = next((candidate for candidate in self.values if candidate in url), None)
        if symbol is None:
            return FakeResponse({"chart": {"result": None, "error": {"description": "unknown symbol"}}}, 404)
        value, variation = self.values[symbol]
        return FakeResponse({
            "chart": {
                "result": [{"meta": {
                    "regularMarketPrice": value,
                    "regularMarketChangePercent": variation,
                }}],
                "error": None,
            },
        })


class InvalidYahooIndexesClient(YahooIndexesClient):
    async def get(self, url, **kwargs):
        response = await super().get(url, **kwargs)
        if "%5EMERV" in url:
            response._payload["chart"]["result"][0]["meta"].pop("regularMarketChangePercent")
        return response


class ZeroYahooIndexesClient(YahooIndexesClient):
    values = {**YahooIndexesClient.values, "%5EGSPC": (0, 0)}


class ApiReliabilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        for cache in (
            markets._cache_indicadores,
            markets._cache_exchange,
            markets._cache_cotacao,
            markets._cache_indexes,
            markets._cache_argentina_indexes,
            markets._cache_usa_indexes,
            news._cache_news,
        ):
            cache["data"] = None
            cache["timestamp"] = None

    def test_valid_provider_response_accepts_legitimate_zero(self):
        with patch("routers.markets.get_client", return_value=ExchangeClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["USD_BRL"]["valor"], "0")
        self.assertIsNone(response.json()["BTC_USD"]["var"])

    def test_all_fiat_pairs_succeed_independently(self):
        with patch("routers.markets.get_client", return_value=ExchangeClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertTrue({
            "USD_BRL", "EUR_BRL", "EUR_USD", "USD_ARS", "ARS_BRL", "BRL_ARS",
            "USD_CLP", "CLP_BRL", "USD_MXN", "MXN_BRL",
        }.issubset(response.json()))

    def test_one_non_200_fiat_pair_does_not_remove_siblings(self):
        with patch("routers.markets.get_client", return_value=OneNon200PairClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertIn("USD_BRL", response.json())
        self.assertNotIn("USD_ARS", response.json())

    def test_several_failed_fiat_pairs_preserve_usd_brl(self):
        with patch("routers.markets.get_client", return_value=SeveralFailedPairsClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertIn("USD_BRL", response.json())
        self.assertNotIn("EUR_USD", response.json())
        self.assertNotIn("USD_CLP", response.json())
        self.assertNotIn("MXN_BRL", response.json())

    def test_timed_out_fiat_pair_does_not_remove_siblings(self):
        with patch("routers.markets.get_client", return_value=TimedOutPairClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertIn("USD_BRL", response.json())
        self.assertNotIn("EUR_BRL", response.json())

    def test_malformed_fiat_pair_does_not_remove_siblings(self):
        with patch("routers.markets.get_client", return_value=MalformedPairClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertIn("USD_BRL", response.json())
        self.assertNotIn("CLP_BRL", response.json())

    def test_primary_provider_failure_uses_real_fallback(self):
        fallback = {
            "dolar": {"valor": "5.10", "var": "0.10"},
            "euro": {"valor": "6.20", "var": "0.20"},
            "bitcoin": {"valor": "60000", "var": "0.30"},
            "ibovespa": {"valor": "130000", "var": "0.40"},
        }
        with (
            patch("routers.markets.fetch_awesomeapi", new=AsyncMock(return_value=None)),
            patch("routers.markets.fetch_hgbrasil", new=AsyncMock(return_value=fallback)),
        ):
            response = self.client.get("/api/cotacao")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), fallback)

    def test_all_quote_providers_fail_with_503_without_fabricated_zero(self):
        with (
            patch("routers.markets.fetch_awesomeapi", new=AsyncMock(return_value=None)),
            patch("routers.markets.fetch_hgbrasil", new=AsyncMock(return_value=None)),
        ):
            response = self.client.get("/api/cotacao")

        self.assertEqual(response.status_code, 503)
        self.assertNotIn('"valor":"0', response.text)

    def test_exchange_provider_timeout_without_cache_returns_503(self):
        with patch("routers.markets.get_client", return_value=FailingClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 503)
        self.assertNotIn('"valor":"0', response.text)

    def test_coin_gecko_failure_preserves_current_fiat_rates(self):
        with patch("routers.markets.get_client", return_value=CoinGeckoUnavailableClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertIn("USD_BRL", response.json())
        self.assertNotIn("BTC_USD", response.json())
        self.assertNotIn("BTC_BRL", response.json())

    def test_awesomeapi_failure_preserves_current_bitcoin_rates(self):
        with patch("routers.markets.get_client", return_value=AwesomeUnavailableClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.json()), {"BTC_USD", "BTC_BRL"})

    def test_incomplete_exchange_payload_returns_valid_subset(self):
        with patch("routers.markets.get_client", return_value=IncompleteExchangeClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertIn("USD_BRL", response.json())
        self.assertIn("BTC_USD", response.json())
        self.assertNotIn("MXN_BRL", response.json())

    def test_invalid_ars_brl_omits_derived_brl_ars(self):
        with patch("routers.markets.get_client", return_value=InvalidArsExchangeClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("ARS_BRL", response.json())
        self.assertNotIn("BRL_ARS", response.json())

    def test_exchange_failure_preserves_stale_cache(self):
        cached = {
            pair: {"valor": "1", "var": None if pair.startswith("BTC") else "0", "label": pair}
            for pair in (
                "USD_BRL", "EUR_BRL", "EUR_USD", "BTC_USD", "BTC_BRL", "USD_ARS",
                "ARS_BRL", "BRL_ARS", "USD_CLP", "CLP_BRL", "USD_MXN", "MXN_BRL",
            )
        }
        markets._cache_exchange["data"] = cached
        markets._cache_exchange["timestamp"] = datetime.now() - timedelta(hours=2)

        with patch("routers.markets.get_client", return_value=FailingClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["X-Data-Stale"], "true")
        self.assertEqual(response.json(), cached)

    def test_indicators_failure_without_cache_returns_503(self):
        with patch("routers.markets.get_indicadores", new=AsyncMock(return_value=None)):
            response = self.client.get("/api/indicadores")

        self.assertEqual(response.status_code, 503)
        self.assertNotIn('"valor":"0', response.text)

    def test_news_provider_failure_is_not_a_successful_empty_list(self):
        with patch("routers.news.fetch_google_news", return_value=None):
            response = self.client.get("/api/noticias")

        self.assertEqual(response.status_code, 503)
        self.assertNotEqual(response.json(), [])

    def test_valid_empty_news_feed_remains_a_domain_success(self):
        with patch("routers.news.fetch_google_news", return_value=[]):
            response = self.client.get("/api/noticias")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_argentina_returns_real_provider_value_without_hardcoded_burcap(self):
        with patch("routers.markets.get_client", return_value=YahooIndexesClient()):
            response = self.client.get("/api/indexes/argentina")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["MERVAL"]["valor"], "2345678.9")
        self.assertNotIn("BURCAP", response.json())
        self.assertNotIn("1250000", response.text)
        self.assertNotIn("850000", response.text)

    def test_usa_returns_real_provider_values(self):
        with patch("routers.markets.get_client", return_value=YahooIndexesClient()):
            response = self.client.get("/api/indexes/usa")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["SP500"]["valor"], "6123.45")
        self.assertEqual(response.json()["DOW"]["valor"], "42123.67")
        self.assertEqual(response.json()["NASDAQ"]["valor"], "19876.54")
        for old_value in ("5000.00", "38000.00", "16000.00"):
            self.assertNotIn(old_value, response.text)

    def test_index_provider_failure_without_cache_returns_503(self):
        with patch("routers.markets.get_client", return_value=FailingClient()):
            argentina = self.client.get("/api/indexes/argentina")
            usa = self.client.get("/api/indexes/usa")

        self.assertEqual(argentina.status_code, 503)
        self.assertEqual(usa.status_code, 503)

    def test_index_provider_failure_preserves_stale_cache(self):
        cached = {
            "MERVAL": {
                "name": "MERVAL", "label": "S&P Merval", "valor": "2222222",
                "var": "0.5", "description": "Fonte: Yahoo Finance",
            },
        }
        markets._cache_argentina_indexes["data"] = cached
        markets._cache_argentina_indexes["timestamp"] = datetime.now() - timedelta(hours=2)

        with patch("routers.markets.get_client", return_value=FailingClient()):
            response = self.client.get("/api/indexes/argentina")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["X-Data-Stale"], "true")
        self.assertEqual(response.json(), cached)

    def test_invalid_index_payload_is_not_accepted(self):
        with patch("routers.markets.get_client", return_value=InvalidYahooIndexesClient()):
            response = self.client.get("/api/indexes/argentina")

        self.assertEqual(response.status_code, 503)
        self.assertNotIn("MERVAL", response.text)

    def test_legitimate_zero_from_index_provider_is_valid(self):
        with patch("routers.markets.get_client", return_value=ZeroYahooIndexesClient()):
            response = self.client.get("/api/indexes/usa")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["SP500"]["valor"], "0")
        self.assertEqual(response.json()["SP500"]["var"], "0")


if __name__ == "__main__":
    unittest.main()
