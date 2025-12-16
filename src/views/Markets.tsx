import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, DollarSign, RefreshCw, TrendingUp, Euro, BarChart3 } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getMarketData, MarketData } from "@/services/marketService"; 
import { useTranslation } from "react-i18next";

interface HistoryPoint {
  data: string;
  valor: number;
}

// Lógica de URL centralizada e segura
const getApiUrl = () => {
    const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
    return url.replace(/\/$/, "");
};
const API_BASE_URL = getApiUrl();

export default function Markets() {
  const { t } = useTranslation();
  
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedCoin, setSelectedCoin] = useState<"dolar" | "euro" | "bitcoin" | "ibovespa" | null>(null);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchCurrentData = async () => {
    setLoading(true);
    try {
      const data = await getMarketData(); 
      if (data) {
        setMarketData(data);
      }
    } catch (error) {
      console.error("Erro no componente Markets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentData();
    const interval = setInterval(fetchCurrentData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCardClick = async (coin: "dolar" | "euro" | "bitcoin" | "ibovespa") => {
    if (selectedCoin === coin) {
      setSelectedCoin(null);
      setHistoryData([]);
      return;
    }

    setSelectedCoin(coin);
    setLoadingHistory(true);
    setHistoryData([]);

    if (coin === 'ibovespa') return;

    try {
      // Garante URL correta sem barra duplicada
      const endpoint = `${API_BASE_URL}/historico/${coin}`;
      const response = await fetch(endpoint);
      
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      
      const json = await response.json() as HistoryPoint[];
      setHistoryData(json);
    } catch (error) {
      console.error("Erro histórico:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const VariationBadge = ({ value }: { value: string }) => {
    const num = parseFloat(value) || 0; // Proteção contra NaN
    const isPositive = num >= 0;
    return (
      <span className={`flex items-center text-sm font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
        {isPositive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
        {Math.abs(num).toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('markets.title') || "Mercado Financeiro"}</h2>
          <p className="text-muted-foreground">{t('markets.description') || "Cotações em tempo real."}</p>
        </div>
        <button 
          onClick={fetchCurrentData}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-95"
          title="Atualizar agora"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!marketData && loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
           {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      )}

      {marketData && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          
          {/* CARD DÓLAR */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-emerald-500/50 ${selectedCoin === 'dolar' ? 'ring-2 ring-emerald-500' : ''}`}
            onClick={() => handleCardClick('dolar')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dólar (USD/BRL)</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ {parseFloat(marketData.dolar?.valor || "0").toFixed(2)}</div>
              <div className="flex justify-between items-center mt-2">
                <VariationBadge value={marketData.dolar?.var || "0"} />
                <span className="text-xs text-muted-foreground flex items-center">
                   {selectedCoin === 'dolar' ? 'Fechar' : 'Gráfico'} <TrendingUp className="w-3 h-3 ml-1" />
                </span>
              </div>
            </CardContent>
            {selectedCoin === 'dolar' && <HistoryChart data={historyData} loading={loadingHistory} color="#10b981" id="dolar" prefix="R$" />}
          </Card>

          {/* CARD EURO */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-blue-500/50 ${selectedCoin === 'euro' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleCardClick('euro')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Euro (EUR/BRL)</CardTitle>
              <Euro className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ {parseFloat(marketData.euro?.valor || "0").toFixed(2)}</div>
              <div className="flex justify-between items-center mt-2">
                <VariationBadge value={marketData.euro?.var || "0"} />
                <span className="text-xs text-muted-foreground flex items-center">
                   {selectedCoin === 'euro' ? 'Fechar' : 'Gráfico'} <TrendingUp className="w-3 h-3 ml-1" />
                </span>
              </div>
            </CardContent>
            {selectedCoin === 'euro' && <HistoryChart data={historyData} loading={loadingHistory} color="#3b82f6" id="euro" prefix="R$" />}
          </Card>

          {/* CARD BITCOIN */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-orange-500/50 ${selectedCoin === 'bitcoin' ? 'ring-2 ring-orange-500' : ''}`}
            onClick={() => handleCardClick('bitcoin')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bitcoin (BTC/USD)</CardTitle>
              <div className="font-bold text-orange-500">₿</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">US$ {parseFloat(marketData.bitcoin?.valor || "0").toLocaleString('en-US', {maximumFractionDigits: 0})}</div>
              <div className="flex justify-between items-center mt-2">
                <VariationBadge value={marketData.bitcoin?.var || "0"} />
                <span className="text-xs text-muted-foreground flex items-center">
                   {selectedCoin === 'bitcoin' ? 'Fechar' : 'Gráfico'} <TrendingUp className="w-3 h-3 ml-1" />
                </span>
              </div>
            </CardContent>
            {selectedCoin === 'bitcoin' && <HistoryChart data={historyData} loading={loadingHistory} color="#f97316" id="bitcoin" prefix="$" />}
          </Card>

           {/* CARD IBOVESPA */}
           <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-purple-500/50 ${selectedCoin === 'ibovespa' ? 'ring-2 ring-purple-500' : ''}`}
            onClick={() => handleCardClick('ibovespa')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ibovespa (Pontos)</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{parseFloat(marketData.ibovespa?.valor || "0").toLocaleString('pt-BR')}</div>
              <div className="flex justify-between items-center mt-2">
                <VariationBadge value={marketData.ibovespa?.var || "0"} />
                <span className="text-xs text-muted-foreground flex items-center">
                   {selectedCoin === 'ibovespa' ? 'Fechar' : 'Ver Detalhes'}
                </span>
              </div>
            </CardContent>
            {selectedCoin === 'ibovespa' && (
              <div className="h-64 w-full mt-4 border-t pt-4 bg-slate-50/50 dark:bg-slate-900/50 animate-in slide-in-from-top-2 flex items-center justify-center">
                 <p className="text-muted-foreground text-sm">Histórico de gráficos indisponível para este índice.</p>
              </div>
            )}
          </Card>

        </div>
      )}
    </div>
  );
}

const HistoryChart = ({ data, loading, color, id, prefix }: { data: HistoryPoint[], loading: boolean, color: string, id: string, prefix: string }) => {
    if (loading) return <div className="h-64 w-full mt-4 border-t pt-4 flex items-center justify-center text-muted-foreground">Carregando gráfico...</div>;
    if (!data || data.length === 0) return <div className="h-64 w-full mt-4 border-t pt-4 flex items-center justify-center text-muted-foreground">Sem dados disponíveis.</div>;

    return (
        <div className="h-64 w-full mt-4 border-t pt-4 bg-slate-50/50 dark:bg-slate-900/50 animate-in slide-in-from-top-2">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                <linearGradient id={`color${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                dataKey="data" 
                tick={{fontSize: 12}} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30}
                tickFormatter={(value) => value ? value.slice(0, 5) : ""} 
                />
                <YAxis 
                domain={['auto', 'auto']} 
                tick={{fontSize: 12}} 
                tickLine={false} 
                axisLine={false}
                width={50}
                tickFormatter={(value) => `${prefix}${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value.toFixed(0)}`}
                />
                <Tooltip 
                formatter={(value: number) => [`${prefix} ${value.toLocaleString()}`, "Valor"]}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                type="monotone" 
                dataKey="valor" 
                stroke={color} 
                fillOpacity={1} 
                fill={`url(#color${id})`} 
                strokeWidth={2}
                />
            </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};