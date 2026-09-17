import { useCallback, useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DataFreshness, DataUnavailable, SlowLoadingNotice, StaleDataNotice } from "@/components/DataState";
import { fetchWithCache } from "@/lib/apiCache";
import { fetchJsonWithRetry } from "@/lib/apiRequest";
import { isExchangeRatesResponse, type ExchangeRatesResponse } from "@/lib/apiValidators";

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const baseUrl = url.replace(/\/$/, ""); // remove trailing slash
  // ensure /api suffix, matching logic used in Markets view
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};
const API_BASE_URL = getApiUrl();

const CURRENCIES = [
  // Principais - Moedas disponíveis na AwesomeAPI
  { code: "BRL", symbol: "R$", flag: "🇧🇷" },
  { code: "USD", symbol: "US$", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "BTC", symbol: "₿", flag: "₿" },
  
  // América do Sul
  { code: "ARS", symbol: "ARS$", flag: "🇦🇷" },
  { code: "CLP", symbol: "CLP$", flag: "🇨🇱" },
  
  // América Central
  { code: "MXN", symbol: "MXN$", flag: "🇲🇽" },
];

function resolveRate(
  exchangeRates: ExchangeRatesResponse,
  from: string,
  to: string,
  visited = new Set<string>(),
): number | null {
  if (from === to) return 1;
  const route = `${from}_${to}`;
  if (visited.has(route)) return null;
  visited.add(route);

  const direct = exchangeRates[route];
  if (direct) return Number(direct.valor);

  const reverse = exchangeRates[`${to}_${from}`];
  if (reverse) {
    const reverseValue = Number(reverse.valor);
    return reverseValue === 0 ? null : 1 / reverseValue;
  }

  for (const intermediate of ["USD", "BRL"]) {
    if (intermediate === from || intermediate === to) continue;
    const firstRate = resolveRate(exchangeRates, from, intermediate, new Set(visited));
    const secondRate = resolveRate(exchangeRates, intermediate, to, new Set(visited));
    if (firstRate !== null && secondRate !== null) return firstRate * secondRate;
  }

  return null;
}

export default function ExchangeCalculator() {
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("BRL");
  const [result, setResult] = useState<number | null>(null);
  const [usedRate, setUsedRate] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRatesResponse | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(false);
  const [conversionError, setConversionError] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [dataTimestamp, setDataTimestamp] = useState<number | null>(null);
  const { t } = useTranslation();
  const warningItemsValue = t("calculators.warning_items", { returnObjects: true });
  const warningItems = Array.isArray(warningItemsValue)
    ? warningItemsValue.filter((item): item is string => typeof item === "string")
    : [];
  const currencies = CURRENCIES.map((currency) => ({
    ...currency,
    name: t(`exchangeCalculator.currencies.${currency.code}`),
  }));

  const fetchExchangeRates = useCallback(async (forceRefresh = false) => {
    setRatesLoading(true);
    setRatesError(false);
    try {
      const response = await fetchWithCache<ExchangeRatesResponse>(
        "exchange_rates",
        () => fetchJsonWithRetry(`${API_BASE_URL}/exchange-rates`, isExchangeRatesResponse),
        isExchangeRatesResponse,
        forceRefresh,
      );
      setExchangeRates(response.data);
      setIsStale(response.isStale);
      setDataTimestamp(response.timestamp);
    } catch (requestError) {
      console.error("Erro ao buscar taxas de câmbio:", requestError);
      setExchangeRates(null);
      setRatesError(true);
      setIsStale(false);
      setDataTimestamp(null);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchExchangeRates();
  }, [fetchExchangeRates]);

  const handleConvert = () => {
    if (!exchangeRates) return;
    const rate = resolveRate(exchangeRates, fromCurrency, toCurrency);
    if (rate === null) {
      setResult(null);
      setUsedRate(null);
      setConversionError(true);
      return;
    }
    setConversionError(false);
    setUsedRate(rate);
    setResult(amount * rate);
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
    setUsedRate(null);
    setConversionError(false);
  };

  const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
  const toCurrencyData = currencies.find(c => c.code === toCurrency);

  return (
    <div className="space-y-6">
      <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <strong>{t('calculators.warning_title')}</strong>
          <ul className="list-disc ml-5 mt-2 text-sm">
            {warningItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      {ratesLoading ? <p className="text-sm text-muted-foreground" role="status">{t('dataStates.loading')}</p> : null}
      <SlowLoadingNotice loading={ratesLoading} />
      {ratesError ? <DataUnavailable onRetry={() => void fetchExchangeRates(true)} retrying={ratesLoading} external /> : null}
      {!ratesLoading && !ratesError && (isStale ? <StaleDataNotice timestamp={dataTimestamp} /> : <DataFreshness timestamp={dataTimestamp} />)}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownUp className="w-5 h-5 text-blue-600" />
              {t('exchangeCalculator.title')}
            </CardTitle>
            <CardDescription>
              {t('exchangeCalculator.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('exchangeCalculator.amount')}</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(parseFloat(e.target.value) || 0);
                  setResult(null);
                  setUsedRate(null);
                  setConversionError(false);
                }}
                placeholder="100.00"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('exchangeCalculator.from')}</Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <span className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span>{currency.symbol} {currency.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwapCurrencies}
                className="rounded-full"
              >
                <ArrowDownUp className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>{t('exchangeCalculator.to')}</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <span className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span>{currency.symbol} {currency.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleConvert}
              disabled={ratesLoading || ratesError || exchangeRates === null}
            >
              {t('calculators.calculate')}
            </Button>
            {conversionError ? (
              <p className="text-sm text-destructive" role="alert">{t('dataStates.rateUnavailable')}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('exchangeCalculator.resultTitle')}</CardTitle>
            <CardDescription>{t('exchangeCalculator.resultDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {result !== null ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-muted-foreground mb-2">
                    {fromCurrencyData?.symbol} {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fromCurrency}
                  </div>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {toCurrencyData?.symbol} {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: toCurrency === "BTC" ? 8 : 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">{toCurrency}</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border">
                  <div className="text-sm text-muted-foreground mb-1">{t('exchangeCalculator.rateLabel')}</div>
                  {usedRate !== null ? (
                    <div className="text-lg font-semibold">
                      1 {fromCurrency} = {usedRate.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {toCurrency}
                    </div>
                  ) : null}
                </div>

                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <p>💡 {t('exchangeCalculator.marketReference')}</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-10 min-h-[300px]">
                <ArrowDownUp className="w-16 h-16 mb-4 opacity-20" />
                <p>{t('exchangeCalculator.emptyResult')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('exchangeCalculator.referenceTableTitle')}</CardTitle>
          <CardDescription>{t('exchangeCalculator.referenceTableDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(exchangeRates ?? {}).slice(0, 6).map(([pair, data]) => (
              <div key={pair} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                <div className="text-xs text-muted-foreground">{data.label}</div>
                <div className="text-lg font-bold mt-1">
                  {parseFloat(data.valor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
