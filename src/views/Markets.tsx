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
        // Principais + Bitcoin
        {
          pair: "USD_BRL",
          label: exchangeJson.USD_BRL?.label || "Dólar Comercial → Real",
          valor: `R$ ${parseFloat(exchangeJson.USD_BRL?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_BRL?.var || "0",
          icon: <DollarSign className="h-4 w-4" />,
          color: "emerald-500",
          group: "Principais",
        },
        {
          pair: "USDT_BRL",
          label: exchangeJson.USDT_BRL?.label || "Dólar Turismo → Real",
          valor: `R$ ${parseFloat(exchangeJson.USDT_BRL?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USDT_BRL?.var || "0",
          icon: <span>✈️💵</span>,
          color: "green-600",
          group: "Principais",
        },
        {
          pair: "EUR_BRL",
          label: exchangeJson.EUR_BRL?.label || "Euro → Real",
          valor: `R$ ${parseFloat(exchangeJson.EUR_BRL?.valor || "0").toFixed(2)}`,
          var: exchangeJson.EUR_BRL?.var || "0",
          icon: <Euro className="h-4 w-4" />,
          color: "blue-500",
          group: "Principais",
        },
        {
          pair: "EURT_BRL",
          label: exchangeJson.EURT_BRL?.label || "Euro Turismo → Real",
          valor: `R$ ${parseFloat(exchangeJson.EURT_BRL?.valor || "0").toFixed(2)}`,
          var: exchangeJson.EURT_BRL?.var || "0",
          icon: <span>✈️€</span>,
          color: "blue-600",
          group: "Principais",
        },
        {
          pair: "EUR_USD",
          label: exchangeJson.EUR_USD?.label || "Euro → Dólar",
          valor: `US$ ${parseFloat(exchangeJson.EUR_USD?.valor || "0").toFixed(4)}`,
          var: exchangeJson.EUR_USD?.var || "0",
          icon: <Euro className="h-4 w-4" />,
          color: "indigo-500",
          group: "Principais",
        },
        {
          pair: "BTC_USD",
          label: exchangeJson.BTC_USD?.label || "Bitcoin → Dólar",
          valor: `US$ ${parseFloat(exchangeJson.BTC_USD?.valor || "0").toLocaleString('pt-BR')}`,
          var: exchangeJson.BTC_USD?.var || "0",
          icon: <span className="font-bold">₿</span>,
          color: "orange-500",
          group: "Principais",
        },
        {
          pair: "BTC_BRL",
          label: exchangeJson.BTC_BRL?.label || "Bitcoin → Real",
          valor: `R$ ${parseFloat(exchangeJson.BTC_BRL?.valor || "0").toLocaleString('pt-BR')}`,
          var: exchangeJson.BTC_BRL?.var || "0",
          icon: <span className="font-bold">₿</span>,
          color: "amber-500",
          group: "Principais",
        },

        // América do Sul - Argentina
        {
          pair: "USD_ARS",
          label: exchangeJson.USD_ARS?.label || "Dólar → Peso Argentino",
          valor: `ARS$ ${parseFloat(exchangeJson.USD_ARS?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_ARS?.var || "0",
          icon: <span>🇦🇷</span>,
          color: "cyan-500",
          group: "América do Sul",
        },
        {
          pair: "ARS_BRL",
          label: exchangeJson.ARS_BRL?.label || "Peso Argentino → Real",
          valor: `R$ ${parseFloat(exchangeJson.ARS_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.ARS_BRL?.var || "0",
          icon: <span>🇦🇷→🇧🇷</span>,
          color: "sky-500",
          group: "América do Sul",
        },
        {
          pair: "BRL_ARS",
          label: exchangeJson.BRL_ARS?.label || "Real → Peso Argentino",
          valor: `ARS$ ${parseFloat(exchangeJson.BRL_ARS?.valor || "0").toFixed(2)}`,
          var: exchangeJson.BRL_ARS?.var || "0",
          icon: <span>🇧🇷→🇦🇷</span>,
          color: "teal-500",
          group: "América do Sul",
        },

        // América do Sul - Chile
        {
          pair: "USD_CLP",
          label: exchangeJson.USD_CLP?.label || "Dólar → Peso Chileno",
          valor: `CLP$ ${parseFloat(exchangeJson.USD_CLP?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_CLP?.var || "0",
          icon: <span>🇨🇱</span>,
          color: "red-500",
          group: "América do Sul",
        },
        {
          pair: "CLP_BRL",
          label: exchangeJson.CLP_BRL?.label || "Peso Chileno → Real",
          valor: `R$ ${parseFloat(exchangeJson.CLP_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.CLP_BRL?.var || "0",
          icon: <span>🇨🇱→🇧🇷</span>,
          color: "red-400",
          group: "América do Sul",
        },

        // América do Sul - Colômbia
        {
          pair: "USD_COP",
          label: exchangeJson.USD_COP?.label || "Dólar → Peso Colombiano",
          valor: `COP$ ${parseFloat(exchangeJson.USD_COP?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_COP?.var || "0",
          icon: <span>🇨🇴</span>,
          color: "yellow-500",
          group: "América do Sul",
        },
        {
          pair: "COP_BRL",
          label: exchangeJson.COP_BRL?.label || "Peso Colombiano → Real",
          valor: `R$ ${parseFloat(exchangeJson.COP_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.COP_BRL?.var || "0",
          icon: <span>🇨🇴→🇧🇷</span>,
          color: "yellow-400",
          group: "América do Sul",
        },

        // América do Sul - Peru
        {
          pair: "USD_PEN",
          label: exchangeJson.USD_PEN?.label || "Dólar → Sol Peruano",
          valor: `PEN S/ ${parseFloat(exchangeJson.USD_PEN?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_PEN?.var || "0",
          icon: <span>🇵🇪</span>,
          color: "rose-500",
          group: "América do Sul",
        },
        {
          pair: "PEN_BRL",
          label: exchangeJson.PEN_BRL?.label || "Sol Peruano → Real",
          valor: `R$ ${parseFloat(exchangeJson.PEN_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.PEN_BRL?.var || "0",
          icon: <span>🇵🇪→🇧🇷</span>,
          color: "rose-400",
          group: "América do Sul",
        },

        // América do Sul - Uruguai
        {
          pair: "USD_UYU",
          label: exchangeJson.USD_UYU?.label || "Dólar → Peso Uruguaio",
          valor: `UYU$ ${parseFloat(exchangeJson.USD_UYU?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_UYU?.var || "0",
          icon: <span>🇺🇾</span>,
          color: "sky-600",
          group: "América do Sul",
        },
        {
          pair: "UYU_BRL",
          label: exchangeJson.UYU_BRL?.label || "Peso Uruguaio → Real",
          valor: `R$ ${parseFloat(exchangeJson.UYU_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.UYU_BRL?.var || "0",
          icon: <span>🇺🇾→🇧🇷</span>,
          color: "sky-400",
          group: "América do Sul",
        },

        // América do Sul - Paraguai
        {
          pair: "USD_PYG",
          label: exchangeJson.USD_PYG?.label || "Dólar → Guarani Paraguaio",
          valor: `PYG₲ ${parseFloat(exchangeJson.USD_PYG?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_PYG?.var || "0",
          icon: <span>🇵🇾</span>,
          color: "emerald-600",
          group: "América do Sul",
        },
        {
          pair: "PYG_BRL",
          label: exchangeJson.PYG_BRL?.label || "Guarani Paraguaio → Real",
          valor: `R$ ${parseFloat(exchangeJson.PYG_BRL?.valor || "0").toFixed(6)}`,
          var: exchangeJson.PYG_BRL?.var || "0",
          icon: <span>🇵🇾→🇧🇷</span>,
          color: "emerald-400",
          group: "América do Sul",
        },

        // América do Sul - Bolívia
        {
          pair: "USD_BOB",
          label: exchangeJson.USD_BOB?.label || "Dólar → Boliviano",
          valor: `BOB Bs ${parseFloat(exchangeJson.USD_BOB?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_BOB?.var || "0",
          icon: <span>🇧🇴</span>,
          color: "green-500",
          group: "América do Sul",
        },
        {
          pair: "BOB_BRL",
          label: exchangeJson.BOB_BRL?.label || "Boliviano → Real",
          valor: `R$ ${parseFloat(exchangeJson.BOB_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.BOB_BRL?.var || "0",
          icon: <span>🇧🇴→🇧🇷</span>,
          color: "green-400",
          group: "América do Sul",
        },

        // América do Sul - Venezuela
        {
          pair: "USD_VES",
          label: exchangeJson.USD_VES?.label || "Dólar → Bolívar Venezuelano",
          valor: `VES Bs.S ${parseFloat(exchangeJson.USD_VES?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_VES?.var || "0",
          icon: <span>🇻🇪</span>,
          color: "red-600",
          group: "América do Sul",
        },
        {
          pair: "VES_BRL",
          label: exchangeJson.VES_BRL?.label || "Bolívar Venezuelano → Real",
          valor: `R$ ${parseFloat(exchangeJson.VES_BRL?.valor || "0").toFixed(6)}`,
          var: exchangeJson.VES_BRL?.var || "0",
          icon: <span>🇻🇪→🇧🇷</span>,
          color: "red-400",
          group: "América do Sul",
        },

        // América Central e Caribe - México
        {
          pair: "USD_MXN",
          label: exchangeJson.USD_MXN?.label || "Dólar → Peso Mexicano",
          valor: `MXN$ ${parseFloat(exchangeJson.USD_MXN?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_MXN?.var || "0",
          icon: <span>🇲🇽</span>,
          color: "pink-500",
          group: "América Central e Caribe",
        },
        {
          pair: "MXN_BRL",
          label: exchangeJson.MXN_BRL?.label || "Peso Mexicano → Real",
          valor: `R$ ${parseFloat(exchangeJson.MXN_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.MXN_BRL?.var || "0",
          icon: <span>🇲🇽→🇧🇷</span>,
          color: "pink-400",
          group: "América Central e Caribe",
        },

        // América Central - Costa Rica
        {
          pair: "USD_CRC",
          label: exchangeJson.USD_CRC?.label || "Dólar → Colón Costarriquenho",
          valor: `CRC₡ ${parseFloat(exchangeJson.USD_CRC?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_CRC?.var || "0",
          icon: <span>🇨🇷</span>,
          color: "blue-600",
          group: "América Central e Caribe",
        },
        {
          pair: "CRC_BRL",
          label: exchangeJson.CRC_BRL?.label || "Colón Costarriquenho → Real",
          valor: `R$ ${parseFloat(exchangeJson.CRC_BRL?.valor || "0").toFixed(6)}`,
          var: exchangeJson.CRC_BRL?.var || "0",
          icon: <span>🇨🇷→🇧🇷</span>,
          color: "blue-400",
          group: "América Central e Caribe",
        },

        // América Central - Guatemala
        {
          pair: "USD_GTQ",
          label: exchangeJson.USD_GTQ?.label || "Dólar → Quetzal Guatemalteco",
          valor: `GTQ Q ${parseFloat(exchangeJson.USD_GTQ?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_GTQ?.var || "0",
          icon: <span>🇬🇹</span>,
          color: "cyan-600",
          group: "América Central e Caribe",
        },
        {
          pair: "GTQ_BRL",
          label: exchangeJson.GTQ_BRL?.label || "Quetzal Guatemalteco → Real",
          valor: `R$ ${parseFloat(exchangeJson.GTQ_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.GTQ_BRL?.var || "0",
          icon: <span>🇬🇹→🇧🇷</span>,
          color: "cyan-400",
          group: "América Central e Caribe",
        },

        // América Central - Honduras
        {
          pair: "USD_HNL",
          label: exchangeJson.USD_HNL?.label || "Dólar → Lempira Hondurenho",
          valor: `HNL L ${parseFloat(exchangeJson.USD_HNL?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_HNL?.var || "0",
          icon: <span>🇭🇳</span>,
          color: "indigo-600",
          group: "América Central e Caribe",
        },
        {
          pair: "HNL_BRL",
          label: exchangeJson.HNL_BRL?.label || "Lempira Hondurenho → Real",
          valor: `R$ ${parseFloat(exchangeJson.HNL_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.HNL_BRL?.var || "0",
          icon: <span>🇭🇳→🇧🇷</span>,
          color: "indigo-400",
          group: "América Central e Caribe",
        },

        // América Central - Nicarágua
        {
          pair: "USD_NIO",
          label: exchangeJson.USD_NIO?.label || "Dólar → Córdoba Nicaraguense",
          valor: `NIO C$ ${parseFloat(exchangeJson.USD_NIO?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_NIO?.var || "0",
          icon: <span>🇳🇮</span>,
          color: "purple-600",
          group: "América Central e Caribe",
        },
        {
          pair: "NIO_BRL",
          label: exchangeJson.NIO_BRL?.label || "Córdoba Nicaraguense → Real",
          valor: `R$ ${parseFloat(exchangeJson.NIO_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.NIO_BRL?.var || "0",
          icon: <span>🇳🇮→🇧🇷</span>,
          color: "purple-400",
          group: "América Central e Caribe",
        },

        // América Central - Panamá
        {
          pair: "USD_PAB",
          label: exchangeJson.USD_PAB?.label || "Dólar → Balboa Panamenho",
          valor: `PAB B/ ${parseFloat(exchangeJson.USD_PAB?.valor || "0").toFixed(4)}`,
          var: exchangeJson.USD_PAB?.var || "0",
          icon: <span>🇵🇦</span>,
          color: "teal-600",
          group: "América Central e Caribe",
        },
        {
          pair: "PAB_BRL",
          label: exchangeJson.PAB_BRL?.label || "Balboa Panamenho → Real",
          valor: `R$ ${parseFloat(exchangeJson.PAB_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.PAB_BRL?.var || "0",
          icon: <span>🇵🇦→🇧🇷</span>,
          color: "teal-400",
          group: "América Central e Caribe",
        },

        // Caribe - República Dominicana
        {
          pair: "USD_DOP",
          label: exchangeJson.USD_DOP?.label || "Dólar → Peso Dominicano",
          valor: `DOP RD$ ${parseFloat(exchangeJson.USD_DOP?.valor || "0").toFixed(2)}`,
          var: exchangeJson.USD_DOP?.var || "0",
          icon: <span>🇩🇴</span>,
          color: "violet-600",
          group: "América Central e Caribe",
        },
        {
          pair: "DOP_BRL",
          label: exchangeJson.DOP_BRL?.label || "Peso Dominicano → Real",
          valor: `R$ ${parseFloat(exchangeJson.DOP_BRL?.valor || "0").toFixed(4)}`,
          var: exchangeJson.DOP_BRL?.var || "0",
          icon: <span>🇩🇴→🇧🇷</span>,
          color: "violet-400",
          group: "América Central e Caribe",
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
