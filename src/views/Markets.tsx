import { useEffect, useState } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import MarketExchange from "@/components/markets/MarketExchange";
import MarketBrazil from "@/components/markets/MarketBrazil";
import MarketArgentina from "@/components/markets/MarketArgentina";
import MarketUSA from "@/components/markets/MarketUSA";
import { DollarSign, Euro } from "lucide-react";
import { fetchWithCache, canManualRefresh, getRemainingCooldown, updateManualRefreshTimestamp, getLastManualRefresh } from "@/lib/apiCache";
import { toast } from "sonner";

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const baseUrl = url.replace(/\/$/, "");
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};
const API_BASE_URL = getApiUrl();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = "exchange" | "brazil" | "argentina" | "usa";

interface TabState {
  loading: boolean;
  error: string | null;
}

const initialTabStates = (): Record<TabKey, TabState> => ({
  exchange:  { loading: true, error: null },
  brazil:    { loading: true, error: null },
  argentina: { loading: true, error: null },
  usa:       { loading: true, error: null },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildExchangeArray(exchangeJson: any) {
  return [
    // Principais + Bitcoin
    { pair: "USD_BRL", label: exchangeJson.USD_BRL?.label || "Dólar Comercial → Real", valor: `R$ ${parseFloat(exchangeJson.USD_BRL?.valor || "0").toFixed(2)}`,        var: exchangeJson.USD_BRL?.var || "0", icon: <DollarSign className="h-4 w-4" />,          color: "emerald-500", group: "Principais" },
    { pair: "EUR_BRL", label: exchangeJson.EUR_BRL?.label || "Euro → Real",             valor: `R$ ${parseFloat(exchangeJson.EUR_BRL?.valor || "0").toFixed(2)}`,        var: exchangeJson.EUR_BRL?.var || "0", icon: <Euro className="h-4 w-4" />,               color: "blue-500",    group: "Principais" },
    { pair: "EUR_USD", label: exchangeJson.EUR_USD?.label || "Euro → Dólar",            valor: `US$ ${parseFloat(exchangeJson.EUR_USD?.valor || "0").toFixed(4)}`,       var: exchangeJson.EUR_USD?.var || "0", icon: <Euro className="h-4 w-4" />,               color: "indigo-500",  group: "Principais" },
    { pair: "BTC_USD", label: exchangeJson.BTC_USD?.label || "Bitcoin → Dólar",        valor: `US$ ${parseFloat(exchangeJson.BTC_USD?.valor || "0").toLocaleString('pt-BR')}`, var: exchangeJson.BTC_USD?.var || "0", icon: <span className="font-bold">₿</span>, color: "orange-500",  group: "Principais" },
    { pair: "BTC_BRL", label: exchangeJson.BTC_BRL?.label || "Bitcoin → Real",         valor: `R$ ${parseFloat(exchangeJson.BTC_BRL?.valor || "0").toLocaleString('pt-BR')}`,  var: exchangeJson.BTC_BRL?.var || "0", icon: <span className="font-bold">₿</span>, color: "amber-500",   group: "Principais" },
    // América do Sul - Argentina
    { pair: "USD_ARS", label: exchangeJson.USD_ARS?.label || "Dólar → Peso Argentino", valor: `ARS$ ${parseFloat(exchangeJson.USD_ARS?.valor || "0").toFixed(2)}`,       var: exchangeJson.USD_ARS?.var || "0", icon: <span>🇦🇷</span>,       color: "cyan-500",  group: "América do Sul" },
    { pair: "ARS_BRL", label: exchangeJson.ARS_BRL?.label || "Peso Argentino → Real",  valor: `R$ ${parseFloat(exchangeJson.ARS_BRL?.valor || "0").toFixed(4)}`,         var: exchangeJson.ARS_BRL?.var || "0", icon: <span>🇦🇷→🇧🇷</span>,  color: "sky-500",   group: "América do Sul" },
    { pair: "BRL_ARS", label: exchangeJson.BRL_ARS?.label || "Real → Peso Argentino",  valor: `ARS$ ${parseFloat(exchangeJson.BRL_ARS?.valor || "0").toFixed(2)}`,       var: exchangeJson.BRL_ARS?.var || "0", icon: <span>🇧🇷→🇦🇷</span>,  color: "teal-500",  group: "América do Sul" },
    // América do Sul - Chile
    { pair: "USD_CLP", label: exchangeJson.USD_CLP?.label || "Dólar → Peso Chileno",   valor: `CLP$ ${parseFloat(exchangeJson.USD_CLP?.valor || "0").toFixed(2)}`,       var: exchangeJson.USD_CLP?.var || "0", icon: <span>🇨🇱</span>,       color: "red-500",   group: "América do Sul" },
    { pair: "CLP_BRL", label: exchangeJson.CLP_BRL?.label || "Peso Chileno → Real",    valor: `R$ ${parseFloat(exchangeJson.CLP_BRL?.valor || "0").toFixed(4)}`,         var: exchangeJson.CLP_BRL?.var || "0", icon: <span>🇨🇱→🇧🇷</span>,  color: "red-400",   group: "América do Sul" },
    // América Central - México
    { pair: "USD_MXN", label: exchangeJson.USD_MXN?.label || "Dólar → Peso Mexicano",  valor: `MXN$ ${parseFloat(exchangeJson.USD_MXN?.valor || "0").toFixed(2)}`,       var: exchangeJson.USD_MXN?.var || "0", icon: <span>🇲🇽</span>,       color: "pink-500",  group: "América Central" },
    { pair: "MXN_BRL", label: exchangeJson.MXN_BRL?.label || "Peso Mexicano → Real",   valor: `R$ ${parseFloat(exchangeJson.MXN_BRL?.valor || "0").toFixed(4)}`,         var: exchangeJson.MXN_BRL?.var || "0", icon: <span>🇲🇽→🇧🇷</span>,  color: "pink-400",  group: "América Central" },
  ];
}

function TabError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function TabSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Markets() {
  const { t } = useTranslation();

  const [exchangeData, setExchangeData]       = useState<any[]>([]);
  const [brazilIndexes, setBrazilIndexes]     = useState<any[]>([]);
  const [argentinaIndexes, setArgentinaIndexes] = useState<any[]>([]);
  const [usaIndexes, setUsaIndexes]           = useState<any[]>([]);
  const [tabStates, setTabStates]             = useState<Record<TabKey, TabState>>(initialTabStates());
  const [isRefreshing, setIsRefreshing]       = useState(false);

  const setTab = (tab: TabKey, state: Partial<TabState>) =>
    setTabStates(prev => ({ ...prev, [tab]: { ...prev[tab], ...state } }));

  const fetchAllData = async (forceRefresh = false) => {
    // Reset all tabs to loading, clear previous errors
    setTabStates(initialTabStates());

    // Fire all 4 fetches simultaneously — each tab resolves independently
    const p1 = fetchWithCache(
      'exchange_rates',
      async () => {
        const res = await fetch(`${API_BASE_URL}/exchange-rates`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      },
      forceRefresh,
    ).then(json => {
      setExchangeData(buildExchangeArray(json));
      setTab('exchange', { loading: false, error: null });
    }).catch(() => {
      setTab('exchange', { loading: false, error: 'Não foi possível carregar os dados de câmbio.' });
    });

    const p2 = fetchWithCache(
      'indexes_brazil',
      async () => {
        const res = await fetch(`${API_BASE_URL}/indexes/brazil`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      },
      forceRefresh,
    ).then(json => {
      setBrazilIndexes(Object.values(json));
      setTab('brazil', { loading: false, error: null });
    }).catch(() => {
      setTab('brazil', { loading: false, error: 'Não foi possível carregar os índices brasileiros.' });
    });

    const p3 = fetchWithCache(
      'indexes_argentina',
      async () => {
        const res = await fetch(`${API_BASE_URL}/indexes/argentina`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      },
      forceRefresh,
    ).then(json => {
      setArgentinaIndexes(Object.values(json));
      setTab('argentina', { loading: false, error: null });
    }).catch(() => {
      setTab('argentina', { loading: false, error: 'Não foi possível carregar os índices argentinos.' });
    });

    const p4 = fetchWithCache(
      'indexes_usa',
      async () => {
        const res = await fetch(`${API_BASE_URL}/indexes/usa`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      },
      forceRefresh,
    ).then(json => {
      setUsaIndexes(Object.values(json));
      setTab('usa', { loading: false, error: null });
    }).catch(() => {
      setTab('usa', { loading: false, error: 'Não foi possível carregar os índices americanos.' });
    });

    // Aguarda todos para que o caller saiba quando tudo terminou (ex: botão de refresh)
    await Promise.all([p1, p2, p3, p4]);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleManualRefresh = async () => {
    if (!canManualRefresh(getLastManualRefresh('markets_refresh'))) {
      const remaining = getRemainingCooldown(getLastManualRefresh('markets_refresh'));
      toast.error(`Aguarde ${Math.floor(remaining / 60)}m${remaining % 60}s para atualizar novamente`);
      return;
    }

    setIsRefreshing(true);
    try {
      await fetchAllData(true);
      updateManualRefreshTimestamp('markets_refresh');
      toast.success("Dados atualizados com sucesso!");
    } catch {
      toast.error("Erro ao atualizar dados");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('markets.title') || "Mercados Financeiros"}
          </h2>
          <p className="text-muted-foreground">
            {t('markets.description') || "Cotações e índices em tempo real"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Atualizar agora (disponível a cada 5 minutos)"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <Tabs defaultValue="exchange" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="exchange"  className="text-xs sm:text-sm">Câmbio</TabsTrigger>
          <TabsTrigger value="brazil"    className="text-xs sm:text-sm">Brasil</TabsTrigger>
          <TabsTrigger value="argentina" className="text-xs sm:text-sm">Argentina</TabsTrigger>
          <TabsTrigger value="usa"       className="text-xs sm:text-sm">EUA</TabsTrigger>
        </TabsList>

        <TabsContent value="exchange" className="space-y-4">
          {tabStates.exchange.loading  ? <TabSkeleton count={6} /> :
           tabStates.exchange.error    ? <TabError message={tabStates.exchange.error} /> :
           <MarketExchange exchangeData={exchangeData} />}
        </TabsContent>

        <TabsContent value="brazil" className="space-y-4">
          {tabStates.brazil.loading  ? <TabSkeleton count={2} /> :
           tabStates.brazil.error    ? <TabError message={tabStates.brazil.error} /> :
           <MarketBrazil indexes={brazilIndexes} />}
        </TabsContent>

        <TabsContent value="argentina" className="space-y-4">
          {tabStates.argentina.loading  ? <TabSkeleton count={2} /> :
           tabStates.argentina.error    ? <TabError message={tabStates.argentina.error} /> :
           <MarketArgentina indexes={argentinaIndexes} />}
        </TabsContent>

        <TabsContent value="usa" className="space-y-4">
          {tabStates.usa.loading  ? <TabSkeleton count={3} /> :
           tabStates.usa.error    ? <TabError message={tabStates.usa.error} /> :
           <MarketUSA indexes={usaIndexes} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
