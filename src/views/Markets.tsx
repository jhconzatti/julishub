import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import MarketExchange from "@/components/markets/MarketExchange";
import MarketBrazil from "@/components/markets/MarketBrazil";
import MarketArgentina from "@/components/markets/MarketArgentina";
import MarketUSA from "@/components/markets/MarketUSA";
import { DollarSign, Euro } from "lucide-react";
import { fetchWithCache, canManualRefresh, getRemainingCooldown, updateManualRefreshTimestamp } from "@/lib/apiCache";
import { toast } from "sonner";

interface HistoryPoint {
  data: string;
  valor: number;
}

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const baseUrl = url.replace(/\/$/, ""); // Remove trailing slash
  // Garante que sempre tenha /api no final
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};
const API_BASE_URL = getApiUrl();

export default function Markets() {
  const { t } = useTranslation();
  
  const [exchangeData, setExchangeData] = useState<any[]>([]);
  const [brazilIndexes, setBrazilIndexes] = useState<any[]>([]);
  const [argentinaIndexes, setArgentinaIndexes] = useState<any[]>([]);
  const [usaIndexes, setUsaIndexes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchAllData = async (forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      // Exchange rates com cache
      const exchangeJson = await fetchWithCache(
        'exchange_rates',
        async () => {
          const response = await fetch(`${API_BASE_URL}/exchange-rates`);
          return response.json();
        },
        forceRefresh
      );
      
      const exchangeArray = [
        {
          pair: "USD_BRL",
          label: exchangeJson.USD_BRL?.label || "USD/BRL",
          valor: `R$ ${parseFloat(exchangeJson.USD_BRL?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_BRL?.var || "0",
          icon: <DollarSign className="h-4 w-4" />,
          color: "emerald-500",
        },
        {
          pair: "EUR_BRL",
          label: exchangeJson.EUR_BRL?.label || "EUR/BRL",
          valor: `R$ ${parseFloat(exchangeJson.EUR_BRL?.valor || "0").toFixed(2)}`,
          var: exchangeJson.EUR_BRL?.var || "0",
          icon: <Euro className="h-4 w-4" />,
          color: "blue-500",
        },
        {
          pair: "BTC_USD",
          label: exchangeJson.BTC_USD?.label || "BTC/USD",
          valor: `US$ ${parseFloat(exchangeJson.BTC_USD?.valor || "0").toLocaleString()}`,
          var: exchangeJson.BTC_USD?.var || "0",
          icon: <span className="font-bold">₿</span>,
          color: "orange-500",
        },
        {
          pair: "USD_ARS",
          label: exchangeJson.USD_ARS?.label || "USD/ARS",
          valor: `ARS$ ${parseFloat(exchangeJson.USD_ARS?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_ARS?.var || "0",
          icon: <DollarSign className="h-4 w-4" />,
          color: "cyan-500",
        },
        {
          pair: "ARS_BRL",
          label: exchangeJson.ARS_BRL?.label || "ARS/BRL",
          valor: `R$ ${parseFloat(exchangeJson.ARS_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.ARS_BRL?.var || "0",
          icon: <span>🇦🇷→🇧🇷</span>,
          color: "sky-500",
        },
        {
          pair: "BRL_ARS",
          label: exchangeJson.BRL_ARS?.label || "BRL/ARS",
          valor: `ARS$ ${parseFloat(exchangeJson.BRL_ARS?.valor || "0").toFixed(2)}`,
          var: exchangeJson.BRL_ARS?.var || "0",
          icon: <span>🇧🇷→🇦🇷</span>,
          color: "teal-500",
        },
        {
          pair: "EUR_USD",
          label: exchangeJson.EUR_USD?.label || "EUR/USD",
          valor: `US$ ${parseFloat(exchangeJson.EUR_USD?.valor || "0").toFixed(4)}`,
          var: exchangeJson.EUR_USD?.var || "0",
          icon: <Euro className="h-4 w-4" />,
          color: "indigo-500",
        },
        {
          pair: "EUR_ARS",
          label: exchangeJson.EUR_ARS?.label || "EUR/ARS",
          valor: `ARS$ ${parseFloat(exchangeJson.EUR_ARS?.valor || "0").toFixed(2)}`,
          var: exchangeJson.EUR_ARS?.var || "0",
          icon: <span>€→ARS</span>,
          color: "violet-500",
        },
      ];
      
      setExchangeData(exchangeArray);
      
      // Brazil indexes com cache
      const brazilJson = await fetchWithCache(
        'indexes_brazil',
        async () => {
          const response = await fetch(`${API_BASE_URL}/indexes/brazil`);
          return response.json();
        },
        forceRefresh
      );
      setBrazilIndexes(Object.values(brazilJson));
      
      // Argentina indexes com cache
      const argentinaJson = await fetchWithCache(
        'indexes_argentina',
        async () => {
          const response = await fetch(`${API_BASE_URL}/indexes/argentina`);
          return response.json();
        },
        forceRefresh
      );
      setArgentinaIndexes(Object.values(argentinaJson));
      
      // USA indexes com cache
      const usaJson = await fetchWithCache(
        'indexes_usa',
        async () => {
          const response = await fetch(`${API_BASE_URL}/indexes/usa`);
          return response.json();
        },
        forceRefresh
      );
      setUsaIndexes(Object.values(usaJson));
    } catch (error) {
      console.error("❌ Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllData();
    // Removido o intervalo automático - agora usa apenas cache de 60 minutos
  }, []);

  const handleManualRefresh = async () => {
    // Verifica se pode fazer refresh (trava de 5 minutos)
    if (!canManualRefresh(null)) {
      const remaining = getRemainingCooldown(null);
      toast.error(`Aguarde ${Math.floor(remaining / 60)}m${remaining % 60}s para atualizar novamente`);
      return;
    }

    setIsRefreshing(true);
    try {
      await fetchAllData(true);
      updateManualRefreshTimestamp('markets_refresh');
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar dados");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCardClick = async (pair: string) => {
    if (selectedPair === pair) {
      setSelectedPair(null);
      setHistoryData([]);
      return;
    }

    setSelectedPair(pair);
    setLoadingHistory(true);
    setHistoryData([]);

    // Apenas pares principais têm histórico disponível
    const historyMap: Record<string, string> = {
      "USD_BRL": "dolar",
      "EUR_BRL": "euro",
      "BTC_USD": "bitcoin",
    };

    const historyKey = historyMap[pair];
    if (!historyKey) {
      setLoadingHistory(false);
      return;
    }

    try {
      const endpoint = `${API_BASE_URL}/historico/${historyKey}`;
      const response = await fetch(endpoint);
      
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      
      const json = await response.json() as HistoryPoint[];
      setHistoryData(json);
    } catch (error) {
      console.error("❌ Erro ao buscar histórico:", error);
    } finally {
      setLoadingHistory(false);
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
        <button 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Atualizar agora (disponível a cada 5 minutos)"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <Tabs defaultValue="exchange" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="exchange" className="text-xs sm:text-sm">
            Câmbio
          </TabsTrigger>
          <TabsTrigger value="brazil" className="text-xs sm:text-sm">
            Brasil
          </TabsTrigger>
          <TabsTrigger value="argentina" className="text-xs sm:text-sm">
            Argentina
          </TabsTrigger>
          <TabsTrigger value="usa" className="text-xs sm:text-sm">
            EUA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exchange" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <MarketExchange 
              exchangeData={exchangeData}
              onCardClick={handleCardClick}
              selectedPair={selectedPair}
              historyData={historyData}
              loadingHistory={loadingHistory}
            />
          )}
        </TabsContent>

        <TabsContent value="brazil" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map(i => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <MarketBrazil indexes={brazilIndexes} />
          )}
        </TabsContent>

        <TabsContent value="argentina" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map(i => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <MarketArgentina indexes={argentinaIndexes} />
          )}
        </TabsContent>

        <TabsContent value="usa" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <MarketUSA indexes={usaIndexes} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
