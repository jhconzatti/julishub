import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataFreshness, DataUnavailable, SlowLoadingNotice, StaleDataNotice } from "@/components/DataState";
import { fetchWithCache } from "@/lib/apiCache";
import { fetchJsonWithRetry } from "@/lib/apiRequest";
import {
  isHistoricalExchangeResponse,
  type HistoricalExchangeResponse,
} from "@/lib/apiValidators";

const HISTORY_INSTRUMENTS = {
  dolar: { instrument: "USD_BRL", pair: "USD/BRL", cacheKey: "exchange_history_USD_BRL", currency: "BRL" },
  euro: { instrument: "EUR_BRL", pair: "EUR/BRL", cacheKey: "exchange_history_EUR_BRL", currency: "BRL" },
  bitcoin: { instrument: "BTC_USD", pair: "BTC/USD", cacheKey: "exchange_history_BTC_USD", currency: "USD" },
} as const;

type HistoryRouteKey = keyof typeof HISTORY_INSTRUMENTS;

interface ExchangeHistoryChartProps {
  apiBaseUrl: string;
}

export default function ExchangeHistoryChart({ apiBaseUrl }: ExchangeHistoryChartProps) {
  const { t, i18n } = useTranslation();
  const [selectedInstrument, setSelectedInstrument] = useState<HistoryRouteKey>("dolar");
  const [history, setHistory] = useState<HistoricalExchangeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const requestId = useRef(0);

  const fetchHistory = useCallback(async (routeKey: HistoryRouteKey, forceRefresh = false) => {
    const currentRequestId = ++requestId.current;
    const config = HISTORY_INSTRUMENTS[routeKey];
    setLoading(true);
    setError(false);
    try {
      const response = await fetchWithCache<HistoricalExchangeResponse>(
        config.cacheKey,
        () => fetchJsonWithRetry(`${apiBaseUrl}/historico/${routeKey}`, isHistoricalExchangeResponse),
        isHistoricalExchangeResponse,
        forceRefresh,
      );
      if (currentRequestId !== requestId.current) return;
      setHistory(response.data);
      setIsStale(response.isStale);
      setTimestamp(response.timestamp);
    } catch (requestError) {
      if (currentRequestId !== requestId.current) return;
      console.error("Erro ao buscar histórico de câmbio:", requestError);
      setHistory(null);
      setError(true);
      setIsStale(false);
      setTimestamp(null);
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    void fetchHistory(selectedInstrument);
  }, [fetchHistory, selectedInstrument]);

  const handleInstrumentChange = (value: HistoryRouteKey) => {
    requestId.current += 1;
    setSelectedInstrument(value);
    setHistory(null);
    setError(false);
    setIsStale(false);
    setTimestamp(null);
  };

  const selectedConfig = HISTORY_INSTRUMENTS[selectedInstrument];
  const priceFormatter = useMemo(() => new Intl.NumberFormat(i18n.language, {
    style: "currency",
    currency: selectedConfig.currency,
    maximumFractionDigits: selectedInstrument === "bitcoin" ? 0 : 4,
  }), [i18n.language, selectedConfig.currency, selectedInstrument]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }), [i18n.language]);
  const formatDate = useCallback((date: string) => dateFormatter.format(new Date(`${date}T00:00:00Z`)), [dateFormatter]);

  const range = history ? {
    first: history.points[0],
    last: history.points[history.points.length - 1],
  } : null;

  return (
    <Card className="border-border/70 bg-card">
      <CardHeader className="pb-3">
        <CardTitle>{t("exchangeHistory.title")}</CardTitle>
        <CardDescription>{t("exchangeHistory.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs space-y-2">
          <Label htmlFor="exchange-history-instrument">{t("exchangeHistory.instrument")}</Label>
          <Select value={selectedInstrument} onValueChange={(value) => handleInstrumentChange(value as HistoryRouteKey)}>
            <SelectTrigger id="exchange-history-instrument">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(HISTORY_INSTRUMENTS).map(([routeKey, config]) => (
                <SelectItem key={routeKey} value={routeKey}>{config.pair}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? <div className="h-[240px] animate-pulse rounded-lg bg-muted sm:h-[300px]" aria-label={t("dataStates.loading")} /> : null}
        <SlowLoadingNotice loading={loading} />
        {error ? <DataUnavailable onRetry={() => void fetchHistory(selectedInstrument, true)} retrying={loading} external /> : null}

        {!loading && !error && history && range ? (
          <>
            {isStale ? <StaleDataNotice timestamp={timestamp} /> : <DataFreshness timestamp={timestamp} />}
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p><span className="font-medium text-foreground">{t("exchangeHistory.source")}:</span> {history.source === "yahoo" ? t("exchangeHistory.sourceYahoo") : t("exchangeHistory.sourceAwesome")}</p>
              <p><span className="font-medium text-foreground">{t("exchangeHistory.reference")}:</span> {history.price_type === "close" ? t("exchangeHistory.close") : t("exchangeHistory.bid")}</p>
              <p className="sm:col-span-2"><span className="font-medium text-foreground">{t("exchangeHistory.observedPeriod")}:</span> {formatDate(range.first.date)} – {formatDate(range.last.date)} · {t("exchangeHistory.observations", { count: history.points.length })}</p>
            </div>
            <div className="h-[240px] sm:h-[300px]" aria-label={t("exchangeHistory.chartLabel", { pair: history.pair })}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={formatDate} minTickGap={28} className="text-xs" />
                  <YAxis tickFormatter={(value: number) => priceFormatter.format(value)} width={selectedInstrument === "bitcoin" ? 76 : 74} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => [priceFormatter.format(value), history.pair]}
                    labelFormatter={(label) => formatDate(String(label))}
                  />
                  <Line type="monotone" dataKey="value" name={history.pair} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
