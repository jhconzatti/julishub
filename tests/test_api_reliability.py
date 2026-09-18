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
        "USD-BRL": ("USDBRL", {"bid": "5", "pctChange": "0"}),
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


class HistoricalClient:
    payloads = {
        "USD-BRL": [
            {"timestamp": "1725235200", "bid": "5.20"},
            {"timestamp": "1725062400", "bid": "5.10"},
        ],
        "EUR-BRL": [
            {"timestamp": "1725235200", "bid": "6.20"},
            {"timestamp": "1725062400", "bid": "6.10"},
        ],
        "BTC-USD": [
            {"timestamp": "1725235200", "bid": "58000"},
            {"timestamp": "1725062400", "bid": "57000"},
        ],
    }

    async def get(self, url, **_kwargs):
        if "query1.finance.yahoo.com" in url:
            return FakeResponse({"chart": {"result": [{
                "timestamp": [1725062400, 1725235200],
                "indicators": {"quote": [{"close": [5.10, 5.20]}]},
            }], "error": None}})
        symbol = url.split("/daily/", 1)[1].rsplit("/", 1)[0]
        return FakeResponse(self.payloads[symbol])


class HistoricalPrimaryFailureClient(HistoricalClient):
    def __init__(self, failure="timeout"):
        self.failure = failure
        self.yahoo_called = False

    async def get(self, url, **kwargs):
        if "query1.finance.yahoo.com" in url:
            self.yahoo_called = True
            return await super().get(url, **kwargs)
        if self.failure == "timeout":
            raise httpx.TimeoutException("history timeout")
        if self.failure == "non-200":
            return FakeResponse({}, 502)
        return FakeResponse([{"timestamp": "invalid", "bid": "invalid"}])


class HistoricalAllFailureClient(HistoricalPrimaryFailureClient):
    async def get(self, url, **kwargs):
        if "query1.finance.yahoo.com" in url:
            self.yahoo_called = True
            raise httpx.TimeoutException("Yahoo timeout")
        return await super().get(url, **kwargs)


class ZeroExchangeClient(ExchangeClient):
    fiat_payloads = {
        **ExchangeClient.fiat_payloads,
        "USD-BRL": ("USDBRL", {"bid": "0", "pctChange": "0"}),
    }


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


class YahooFallbackClient(AwesomeUnavailableClient):
    yahoo_values = {
        "BRL=X": (5, 0.1),
        "EURUSD=X": (1.1, 0.2),
        "ARS=X": (1000, 0.3),
        "CLP=X": (900, 0.4),
        "MXN=X": (20, 0.5),
    }
    yahoo_failures = {}

    async def get(self, url, **_kwargs):
        if "query1.finance.yahoo.com" in url:
            symbol = next((candidate for candidate in self.yahoo_values if candidate in url), None)
            failure = self.yahoo_failures.get(symbol)
            if isinstance(failure, Exception):
                raise failure
            if isinstance(failure, int):
                return FakeResponse({}, failure)
            price, change = self.yahoo_values[symbol]
            if failure == "invalid":
                price = "invalid"
            meta = {"regularMarketPrice": price}
            if change is not None:
                meta["regularMarketChangePercent"] = change
            return FakeResponse({"chart": {"result": [{"meta": meta}], "error": None}})
        return await super().get(url)


class PartialAwesomeYahooClient(ExchangeClient):
    async def get(self, url, **_kwargs):
        if "query1.finance.yahoo.com" in url:
            return await YahooFallbackClient().get(url)
        if url.endswith("USD-BRL"):
            raise httpx.TimeoutException("USD-BRL timeout")
        return await super().get(url)


class DirectCrossYahooClient(YahooFallbackClient):
    async def get(self, url, **_kwargs):
        if url.endswith("EUR-BRL"):
            return await ExchangeClient().get(url)
        return await super().get(url)


class YahooUnavailableCoinGeckoUnavailableClient(YahooFallbackClient):
    async def get(self, url, **_kwargs):
        if "coingecko" in url:
            raise httpx.TimeoutException("CoinGecko timeout")
        return await super().get(url)


class YahooTrackingExchangeClient(ExchangeClient):
    def __init__(self):
        self.yahoo_called = False

    async def get(self, url, **_kwargs):
        if "query1.finance.yahoo.com" in url:
            self.yahoo_called = True
            return FakeResponse({}, 500)
        return await super().get(url)


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
        for cache in markets._cache_history.values():
            cache["data"] = None
            cache["timestamp"] = None

    def test_historical_awesomeapi_success_returns_structured_contract(self):
        expected = {
            "dolar": ("USD_BRL", "USD/BRL"),
            "euro": ("EUR_BRL", "EUR/BRL"),
            "bitcoin": ("BTC_USD", "BTC/USD"),
        }
        with patch("routers.markets.get_client", return_value=HistoricalClient()):
            for route_key, (instrument, pair) in expected.items():
                with self.subTest(route_key=route_key):
                    response = self.client.get(f"/api/historico/{route_key}")
                    data = response.json()
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(data["instrument"], instrument)
                    self.assertEqual(data["pair"], pair)
                    self.assertEqual(data["source"], "awesomeapi")
                    self.assertEqual(data["price_type"], "bid")
                    self.assertEqual([point["date"] for point in data["points"]], sorted(point["date"] for point in data["points"]))
                    self.assertTrue(all(point["value"] > 0 for point in data["points"]))

    def test_historical_unsupported_instrument_is_404_without_provider_call(self):
        with patch("routers.markets.get_client") as get_client:
            response = self.client.get("/api/historico/invalida")

        self.assertEqual(response.status_code, 404)
        get_client.assert_not_called()

    def test_historical_usd_brl_uses_yahoo_for_primary_failures(self):
        for failure in ("timeout", "non-200", "malformed"):
            with self.subTest(failure=failure):
                client = HistoricalPrimaryFailureClient(failure)
                with patch("routers.markets.get_client", return_value=client):
                    response = self.client.get("/api/historico/dolar")
                data = response.json()
                self.assertEqual(response.status_code, 200)
                self.assertTrue(client.yahoo_called)
                self.assertEqual(data["source"], "yahoo")
                self.assertEqual(data["price_type"], "close")
                for cache in markets._cache_history.values():
                    cache["data"] = None
                    cache["timestamp"] = None

    def test_historical_euro_and_bitcoin_fail_without_unapproved_fallbacks(self):
        for route_key in ("euro", "bitcoin"):
            with self.subTest(route_key=route_key):
                client = HistoricalPrimaryFailureClient()
                with patch("routers.markets.get_client", return_value=client):
                    response = self.client.get(f"/api/historico/{route_key}")
                self.assertEqual(response.status_code, 503)
                self.assertFalse(client.yahoo_called)

    def test_historical_usd_brl_returns_503_when_all_providers_fail(self):
        client = HistoricalAllFailureClient()
        with patch("routers.markets.get_client", return_value=client):
            response = self.client.get("/api/historico/dolar")

        self.assertEqual(response.status_code, 503)
        self.assertTrue(client.yahoo_called)

    def test_historical_normalization_filters_invalid_records_and_requires_two_points(self):
        points = markets.normalize_historical_points([
            {"timestamp": "1725235200", "bid": "5.2"},
            {"timestamp": "1725062400", "bid": "5.1"},
            {"timestamp": None, "bid": "5.0"},
            {"timestamp": "1725148800", "bid": "invalid"},
            {"timestamp": "1725148800", "bid": "0"},
            {"timestamp": "1725148800", "bid": "-1"},
            {"timestamp": "1725148800", "bid": "nan"},
            {"timestamp": "1725148800", "bid": "inf"},
        ], "bid")
        self.assertEqual([point["value"] for point in points], [5.1, 5.2])
        self.assertIsNone(markets.normalize_historical_points([
            {"timestamp": "1725235200", "bid": "5.2"},
            {"timestamp": None, "bid": "5.0"},
        ], "bid"))

    def test_historical_normalization_orders_and_deduplicates_dates_deterministically(self):
        points = markets.normalize_historical_points([
            {"timestamp": "1725238800", "bid": "5.3"},
            {"timestamp": "1725062400", "bid": "5.1"},
            {"timestamp": "1725235200", "bid": "5.2"},
        ], "bid")
        self.assertEqual([point["date"] for point in points], ["2024-08-31", "2024-09-02"])
        self.assertEqual(points[-1]["value"], 5.3)

    def test_historical_fresh_cache_skips_provider(self):
        cached = {"instrument": "USD_BRL", "pair": "USD/BRL", "source": "awesomeapi", "price_type": "bid", "points": [
            {"date": "2024-09-01", "value": 5.1}, {"date": "2024-09-02", "value": 5.2},
        ]}
        markets._cache_history["dolar"] = {"data": cached, "timestamp": datetime.now()}
        with patch("routers.markets.get_client") as get_client:
            response = self.client.get("/api/historico/dolar")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), cached)
        get_client.assert_not_called()
        self.assertNotIn("X-Data-Stale", response.headers)

    def test_historical_expired_cache_returns_stale_and_preserves_it_after_failed_refresh(self):
        cached = {"instrument": "USD_BRL", "pair": "USD/BRL", "source": "awesomeapi", "price_type": "bid", "points": [
            {"date": "2024-09-01", "value": 5.1}, {"date": "2024-09-02", "value": 5.2},
        ]}
        markets._cache_history["dolar"] = {
            "data": cached,
            "timestamp": datetime.now() - timedelta(hours=7),
        }
        with patch("routers.markets.get_client", return_value=HistoricalAllFailureClient()):
            response = self.client.get("/api/historico/dolar")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["X-Data-Stale"], "true")
        self.assertEqual(response.json(), cached)
        self.assertEqual(markets._cache_history["dolar"]["data"], cached)

    def test_historical_successful_refresh_replaces_expired_cache(self):
        old = {"instrument": "USD_BRL", "pair": "USD/BRL", "source": "awesomeapi", "price_type": "bid", "points": [
            {"date": "2024-09-01", "value": 4.1}, {"date": "2024-09-02", "value": 4.2},
        ]}
        markets._cache_history["dolar"] = {"data": old, "timestamp": datetime.now() - timedelta(hours=7)}
        with patch("routers.markets.get_client", return_value=HistoricalClient()):
            refreshed = __import__("asyncio").run(markets.refresh_historical_data("dolar"))

        self.assertTrue(refreshed)
        self.assertNotEqual(markets._cache_history["dolar"]["data"], old)

    def test_valid_provider_response_accepts_legitimate_zero(self):
        with patch("routers.markets.get_client", return_value=ZeroExchangeClient()):
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

    def test_yahoo_fallback_is_not_called_for_valid_awesome_base_rates(self):
        client = YahooTrackingExchangeClient()
        with patch("routers.markets.get_client", return_value=client):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["USD_BRL"]["valor"], "5")
        self.assertFalse(client.yahoo_called)

    def test_yahoo_fallback_supplies_fiat_when_awesomeapi_fails(self):
        with patch("routers.markets.get_client", return_value=YahooFallbackClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["USD_BRL"]["valor"], "5")
        self.assertEqual(response.json()["EUR_BRL"]["valor"], "5.5000")

    def test_yahoo_fiat_rates_survive_coin_gecko_failure(self):
        with patch("routers.markets.get_client", return_value=YahooUnavailableCoinGeckoUnavailableClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertIn("USD_BRL", response.json())
        self.assertNotIn("BTC_USD", response.json())

    def test_yahoo_fallback_fills_only_missing_usd_brl(self):
        with patch("routers.markets.get_client", return_value=PartialAwesomeYahooClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["USD_BRL"]["valor"], "5")
        self.assertEqual(response.json()["EUR_BRL"]["valor"], "6.20")

    def test_yahoo_base_quotes_derive_cross_rates_without_variation(self):
        with patch("routers.markets.get_client", return_value=YahooFallbackClient()):
            response = self.client.get("/api/exchange-rates")

        data = response.json()
        self.assertEqual(data["ARS_BRL"]["valor"], "0.0050")
        self.assertEqual(data["BRL_ARS"]["valor"], "200.0000")
        self.assertEqual(data["CLP_BRL"]["valor"], "0.0056")
        self.assertEqual(data["MXN_BRL"]["valor"], "0.2500")
        self.assertIsNone(data["EUR_BRL"]["var"])

    def test_direct_awesome_cross_rate_is_not_overwritten_by_yahoo_derivation(self):
        with patch("routers.markets.get_client", return_value=DirectCrossYahooClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["EUR_BRL"]["valor"], "6.20")

    def test_one_yahoo_failure_does_not_remove_other_fallback_rates(self):
        client = YahooFallbackClient()
        client.yahoo_failures = {"ARS=X": 429}
        with patch("routers.markets.get_client", return_value=client):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertIn("USD_BRL", response.json())
        self.assertNotIn("USD_ARS", response.json())
        self.assertIn("USD_CLP", response.json())

    def test_invalid_yahoo_price_is_omitted_without_invalidating_siblings(self):
        client = YahooFallbackClient()
        client.yahoo_failures = {"CLP=X": "invalid"}
        with patch("routers.markets.get_client", return_value=client):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("USD_CLP", response.json())
        self.assertIn("USD_BRL", response.json())

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
        self.assertEqual(response.json()["MXN_BRL"]["valor"], "0.2778")

    def test_timed_out_fiat_pair_does_not_remove_siblings(self):
        with patch("routers.markets.get_client", return_value=TimedOutPairClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertIn("USD_BRL", response.json())
        self.assertEqual(response.json()["EUR_BRL"]["valor"], "5.5000")
        self.assertIsNone(response.json()["EUR_BRL"]["var"])

    def test_malformed_fiat_pair_does_not_remove_siblings(self):
        with patch("routers.markets.get_client", return_value=MalformedPairClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertIn("USD_BRL", response.json())
        self.assertEqual(response.json()["CLP_BRL"]["valor"], "0.0053")
        self.assertIsNone(response.json()["CLP_BRL"]["var"])

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
        self.assertEqual(response.json()["MXN_BRL"]["valor"], "0.2778")
        self.assertIsNone(response.json()["MXN_BRL"]["var"])

    def test_invalid_ars_brl_omits_derived_brl_ars(self):
        with patch("routers.markets.get_client", return_value=InvalidArsExchangeClient()):
            response = self.client.get("/api/exchange-rates")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ARS_BRL"]["valor"], "0.0042")
        self.assertEqual(response.json()["BRL_ARS"]["valor"], "240.0000")
        self.assertIsNone(response.json()["ARS_BRL"]["var"])

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
