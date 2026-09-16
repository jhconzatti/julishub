import { useCallback, useEffect, useState, type ReactNode } from "react";
import { DollarSign, Euro, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataUnavailable, SlowLoadingNotice, StaleDataNotice } from "@/components/DataState";
import MarketExchange from "@/components/markets/MarketExchange";
import MarketBrazil from "@/components/markets/MarketBrazil";
import MarketArgentina from "@/components/markets/MarketArgentina";
import MarketUSA from "@/components/markets/MarketUSA";
import {
  fetchWithCache,
  canManualRefresh,
  getRemainingCooldown,
  updateManualRefreshTimestamp,
  getLastManualRefresh,
} from "@/lib/apiCache";
import { fetchJsonWithRetry } from "@/lib/apiRequest";
import {
  hasMarketIndexes,
  isExchangeRatesResponse,
  type ExchangeRatesResponse,
  type MarketIndex,
  type MarketIndexesResponse,
} from "@/lib/apiValidators";

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const baseUrl = url.replace(/\/$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
};

const API_BASE_URL = getApiUrl();
const BRAZIL_KEYS = ["IBOVESPA", "IFIX"] as const;
const ARGENTINA_KEYS = ["MERVAL"] as const;
const USA_KEYS = ["SP500", "DOW", "NASDAQ"] as const;

type TabKey = "exchange" | "brazil" | "argentina" | "usa";

interface TabState {
  loading: boolean;
  error: boolean;
  stale: boolean;
  timestamp: number | null;
}

interface ExchangeDisplay {
  pair: string;
  label: string;
  valor: string;
  var: string | null;
  icon: ReactNode;
  color: string;
  group: string;
}

const initialTabStates = (): Record<TabKey, TabState> => ({
  exchange: { loading: true, error: false, stale: false, timestamp: null },
  brazil: { loading: true, error: false, stale: false, timestamp: null },
  argentina: { loading: true, error: false, stale: false, timestamp: null },
  usa: { loading: true, error: false, stale: false, timestamp: null },
});

function buildExchangeArray(exchange: ExchangeRatesResponse): ExchangeDisplay[] {
  return [
    { pair: "USD_BRL", label: exchange.USD_BRL.label, valor: `R$ ${Number(exchange.USD_BRL.valor).toFixed(2)}`, var: exchange.USD_BRL.var, icon: <DollarSign className="h-4 w-4" />, color: "emerald-500", group: "Principais" },
    { pair: "EUR_BRL", label: exchange.EUR_BRL.label, valor: `R$ ${Number(exchange.EUR_BRL.valor).toFixed(2)}`, var: exchange.EUR_BRL.var, icon: <Euro className="h-4 w-4" />, color: "blue-500", group: "Principais" },
    { pair: "EUR_USD", label: exchange.EUR_USD.label, valor: `US$ ${Number(exchange.EUR_USD.valor).toFixed(4)}`, var: exchange.EUR_USD.var, icon: <Euro className="h-4 w-4" />, color: "indigo-500", group: "Principais" },
    { pair: "BTC_USD", label: exchange.BTC_USD.label, valor: `US$ ${Number(exchange.BTC_USD.valor).toLocaleString("pt-BR")}`, var: exchange.BTC_USD.var, icon: <span className="font-bold">₿</span>, color: "orange-500", group: "Principais" },
    { pair: "BTC_BRL", label: exchange.BTC_BRL.label, valor: `R$ ${Number(exchange.BTC_BRL.valor).toLocaleString("pt-BR")}`, var: exchange.BTC_BRL.var, icon: <span className="font-bold">₿</span>, color: "amber-500", group: "Principais" },
    { pair: "USD_ARS", label: exchange.USD_ARS.label, valor: `ARS$ ${Number(exchange.USD_ARS.valor).toFixed(2)}`, var: exchange.USD_ARS.var, icon: <span>🇦🇷</span>, color: "cyan-500", group: "América do Sul" },
    { pair: "ARS_BRL", label: exchange.ARS_BRL.label, valor: `R$ ${Number(exchange.ARS_BRL.valor).toFixed(4)}`, var: exchange.ARS_BRL.var, icon: <span>🇦🇷→🇧🇷</span>, color: "sky-500", group: "América do Sul" },
    { pair: "BRL_ARS", label: exchange.BRL_ARS.label, valor: `ARS$ ${Number(exchange.BRL_ARS.valor).toFixed(2)}`, var: exchange.BRL_ARS.var, icon: <span>🇧🇷→🇦🇷</span>, color: "teal-500", group: "América do Sul" },
    { pair: "USD_CLP", label: exchange.USD_CLP.label, valor: `CLP$ ${Number(exchange.USD_CLP.valor).toFixed(2)}`, var: exchange.USD_CLP.var, icon: <span>🇨🇱</span>, color: "red-500", group: "América do Sul" },
    { pair: "CLP_BRL", label: exchange.CLP_BRL.label, valor: `R$ ${Number(exchange.CLP_BRL.valor).toFixed(4)}`, var: exchange.CLP_BRL.var, icon: <span>🇨🇱→🇧🇷</span>, color: "red-400", group: "América do Sul" },
    { pair: "USD_MXN", label: exchange.USD_MXN.label, valor: `MXN$ ${Number(exchange.USD_MXN.valor).toFixed(2)}`, var: exchange.USD_MXN.var, icon: <span>🇲🇽</span>, color: "pink-500", group: "América Central" },
    { pair: "MXN_BRL", label: exchange.MXN_BRL.label, valor: `R$ ${Number(exchange.MXN_BRL.valor).toFixed(4)}`, var: exchange.MXN_BRL.var, icon: <span>🇲🇽→🇧🇷</span>, color: "pink-400", group: "América Central" },
  ];
}

function TabSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  );
}

interface TabPanelProps {
  state: TabState;
  skeletonCount: number;
  onRetry: () => void;
  children: ReactNode;
}

function TabPanel({ state, skeletonCount, onRetry, children }: TabPanelProps) {
  if (state.loading) {
    return (
      <div className="space-y-4">
        <SlowLoadingNotice loading />
        <TabSkeleton count={skeletonCount} />
      </div>
    );
  }
  if (state.error) return <DataUnavailable onRetry={onRetry} />;
  return (
    <div className="space-y-4">
      {state.stale ? <StaleDataNotice timestamp={state.timestamp} /> : null}
      {children}
    </div>
  );
}

export default function Markets() {
  const { t } = useTranslation();
  const [exchangeData, setExchangeData] = useState<ExchangeDisplay[]>([]);
  const [brazilIndexes, setBrazilIndexes] = useState<MarketIndex[]>([]);
  const [argentinaIndexes, setArgentinaIndexes] = useState<MarketIndex[]>([]);
  const [usaIndexes, setUsaIndexes] = useState<MarketIndex[]>([]);
  const [tabStates, setTabStates] = useState<Record<TabKey, TabState>>(initialTabStates);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setTab = useCallback((tab: TabKey, state: Partial<TabState>) => {
    setTabStates((previous) => ({
      ...previous,
      [tab]: { ...previous[tab], ...state },
    }));
  }, []);

  const fetchAllData = useCallback(async (forceRefresh = false): Promise<boolean> => {
    setTabStates(initialTabStates());

    const exchangeRequest = fetchWithCache<ExchangeRatesResponse>(
      "exchange_rates",
      () => fetchJsonWithRetry(`${API_BASE_URL}/exchange-rates`, isExchangeRatesResponse),
      isExchangeRatesResponse,
      forceRefresh,
    ).then((result) => {
      setExchangeData(buildExchangeArray(result.data));
      setTab("exchange", { loading: false, error: false, stale: result.isStale, timestamp: result.timestamp });
      return !result.refreshFailed;
    }).catch(() => {
      setTab("exchange", { loading: false, error: true, stale: false, timestamp: null });
      return false;
    });

    const fetchIndexes = (
      key: string,
      endpoint: string,
      expectedKeys: readonly string[],
      tab: TabKey,
      setter: (indexes: MarketIndex[]) => void,
    ) => {
      const validate = (value: unknown): value is MarketIndexesResponse => hasMarketIndexes(value, expectedKeys);
      return fetchWithCache<MarketIndexesResponse>(
        key,
        () => fetchJsonWithRetry(`${API_BASE_URL}${endpoint}`, validate),
        validate,
        forceRefresh,
      ).then((result) => {
        setter(expectedKeys.map((indexKey) => result.data[indexKey]));
        setTab(tab, { loading: false, error: false, stale: result.isStale, timestamp: result.timestamp });
        return !result.refreshFailed;
      }).catch(() => {
        setTab(tab, { loading: false, error: true, stale: false, timestamp: null });
        return false;
      });
    };

    const results = await Promise.all([
      exchangeRequest,
      fetchIndexes("indexes_brazil", "/indexes/brazil", BRAZIL_KEYS, "brazil", setBrazilIndexes),
      fetchIndexes("indexes_argentina", "/indexes/argentina", ARGENTINA_KEYS, "argentina", setArgentinaIndexes),
      fetchIndexes("indexes_usa", "/indexes/usa", USA_KEYS, "usa", setUsaIndexes),
    ]);
    return results.every(Boolean);
  }, [setTab]);

  useEffect(() => {
    void fetchAllData();
  }, [fetchAllData]);

  const handleManualRefresh = async () => {
    const lastRefresh = getLastManualRefresh("markets_refresh");
    if (!canManualRefresh(lastRefresh)) {
      const remaining = getRemainingCooldown(lastRefresh);
      toast.error(t("dataStates.cooldown", { minutes: Math.floor(remaining / 60), seconds: remaining % 60 }));
      return;
    }

    updateManualRefreshTimestamp("markets_refresh");
    setIsRefreshing(true);
    const succeeded = await fetchAllData(true);
    toast[succeeded ? "success" : "error"](t(succeeded ? "dataStates.refreshSuccess" : "dataStates.refreshFailed"));
    setIsRefreshing(false);
  };

  const retry = () => void fetchAllData(true);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("markets.title")}</h2>
          <p className="text-muted-foreground">{t("markets.description")}</p>
        </div>
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="rounded-full p-2 transition-all hover:bg-gray-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800"
          title={t("dataStates.refresh")}
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <Tabs defaultValue="exchange" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-4">
          <TabsTrigger value="exchange" className="text-xs sm:text-sm">Câmbio</TabsTrigger>
          <TabsTrigger value="brazil" className="text-xs sm:text-sm">Brasil</TabsTrigger>
          <TabsTrigger value="argentina" className="text-xs sm:text-sm">Argentina</TabsTrigger>
          <TabsTrigger value="usa" className="text-xs sm:text-sm">EUA</TabsTrigger>
        </TabsList>

        <TabsContent value="exchange">
          <TabPanel state={tabStates.exchange} skeletonCount={6} onRetry={retry}>
            <MarketExchange exchangeData={exchangeData} />
          </TabPanel>
        </TabsContent>
        <TabsContent value="brazil">
          <TabPanel state={tabStates.brazil} skeletonCount={2} onRetry={retry}>
            <MarketBrazil indexes={brazilIndexes} />
          </TabPanel>
        </TabsContent>
        <TabsContent value="argentina">
          <TabPanel state={tabStates.argentina} skeletonCount={2} onRetry={retry}>
            <MarketArgentina indexes={argentinaIndexes} />
          </TabPanel>
        </TabsContent>
        <TabsContent value="usa">
          <TabPanel state={tabStates.usa} skeletonCount={3} onRetry={retry}>
            <MarketUSA indexes={usaIndexes} />
          </TabPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
