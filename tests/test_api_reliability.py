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
    async def get(self, url):
        if "coingecko" in url:
            return FakeResponse({"bitcoin": {"usd": 60000, "brl": 300000}})
        return FakeResponse({
            "USDBRL": {"bid": "0", "pctChange": "0"},
            "EURBRL": {"bid": "6.20", "pctChange": "0.10"},
            "EURUSD": {"bid": "1.10", "pctChange": "-0.20"},
            "USDARS": {"bid": "1200", "pctChange": "0.30"},
            "ARSBRL": {"bid": "0.0045", "pctChange": "0.40"},
            "USDCLP": {"bid": "950", "pctChange": "0.50"},
            "CLPBRL": {"bid": "0.0055", "pctChange": "0.60"},
            "USDMXN": {"bid": "18", "pctChange": "0.70"},
            "MXNBRL": {"bid": "0.30", "pctChange": "0.80"},
        })


class FailingClient:
    async def get(self, _url):
        raise httpx.TimeoutException("provider timeout")


class IncompleteExchangeClient(ExchangeClient):
    async def get(self, url):
        response = await super().get(url)
        if "coingecko" not in url:
            response._payload.pop("MXNBRL")
        return response


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

    def test_incomplete_exchange_payload_is_unavailable_without_cache(self):
        with patch("routers.markets.get_client", return_value=IncompleteExchangeClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 503)
        self.assertNotIn("MXN_BRL", response.text)

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


if __name__ == "__main__":
    unittest.main()
