import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, DollarSign, RefreshCw, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getMarketData } from "@/services/marketService";

// Tipos para os dados atuais (Snapshot)
interface MarketData {
  dolar: { valor: string; var: string };
  bitcoin: { valor: string; var: string };
}

// Tipo para os dados do gráfico (Histórico)
interface HistoryPoint {
  data: string;
  valor: number;
}

export default function Markets() {
  // Estados
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar qual card está expandido e o seu gráfico
  const [selectedCoin, setSelectedCoin] = useState<"dolar" | "bitcoin" | null>(null);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 1. Busca dados em tempo real (a cada 30s)
  
  const fetchCurrentData = async () => {
    try {
      const data = await getMarketData(); // A mágica acontece aqui
      if (data) {
        setMarketData(data);
        setLoading(false);
      }
    } catch (error) {
      console.error("Erro ao buscar cotação:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentData();
    const interval = setInterval(fetchCurrentData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. Busca histórico quando clica no card
  const handleCardClick = async (coin: "dolar" | "bitcoin") => {
    // Se já estiver aberto, fecha
    if (selectedCoin === coin) {
      setSelectedCoin(null);
      return;
    }

    // Se for novo, abre e carrega
    setSelectedCoin(coin);
    setLoadingHistory(true);
    setHistoryData([]); // Limpa gráfico anterior

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/historico/${coin}`);
      const json = await response.json();
      setHistoryData(json);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Componente auxiliar para a badge de variação
  const VariationBadge = ({ value }: { value: string }) => {
    const num = parseFloat(value);
    const isPositive = num >= 0;
    return (
      <span className={`flex items-center text-sm font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
        {isPositive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
        {value}%
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mercado Financeiro</h2>
          <p className="text-muted-foreground">Cotações em tempo real e histórico de 30 dias.</p>
        </div>
        <button 
          onClick={fetchCurrentData}
          className="p-2 rounded-full hover:bg-gray-100 transition-all active:scale-95"
          title="Atualizar agora"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!marketData && loading && (
        <div className="grid gap-4 md:grid-cols-2">
           <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
           <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      )}

      {marketData && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          
          {/* CARD DÓLAR */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 ${selectedCoin === 'dolar' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleCardClick('dolar')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dólar Comercial (USD/BRL)</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ {parseFloat(marketData.dolar.valor).toFixed(2)}</div>
              <div className="flex justify-between items-center mt-2">
                 <VariationBadge value={marketData.dolar.var} />
                 <span className="text-xs text-muted-foreground flex items-center">
                    {selectedCoin === 'dolar' ? 'Clique para fechar' : 'Clique para ver gráfico'} 
                    <TrendingUp className="w-3 h-3 ml-1" />
                 </span>
              </div>
            </CardContent>
            
            {/* Área do Gráfico Expandido */}
            {selectedCoin === 'dolar' && (
              <div className="h-64 w-full mt-4 border-t pt-4 bg-slate-50/50 dark:bg-slate-900/50 animate-in slide-in-from-top-2">
                {loadingHistory ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Carregando gráfico...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                      <defs>
                        <linearGradient id="colorDolar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="data" 
                        tick={{fontSize: 12}} 
                        tickLine={false} 
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        tick={{fontSize: 12}} 
                        tickLine={false} 
                        axisLine={false}
                        width={40}
                        tickFormatter={(value) => `R$${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Valor"]}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="valor" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorDolar)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </Card>

          {/* CARD BITCOIN */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-orange-400/50 ${selectedCoin === 'bitcoin' ? 'ring-2 ring-orange-400' : ''}`}
            onClick={() => handleCardClick('bitcoin')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bitcoin (BTC/USD)</CardTitle>
              <div className="font-bold text-orange-500">₿</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">US$ {parseFloat(marketData.bitcoin.valor).toLocaleString('en-US')}</div>
              <div className="flex justify-between items-center mt-2">
                 <VariationBadge value={marketData.bitcoin.var} />
                 <span className="text-xs text-muted-foreground flex items-center">
                    {selectedCoin === 'bitcoin' ? 'Clique para fechar' : 'Clique para ver gráfico'} 
                    <TrendingUp className="w-3 h-3 ml-1" />
                 </span>
              </div>
            </CardContent>

            {/* Área do Gráfico Expandido */}
            {selectedCoin === 'bitcoin' && (
              <div className="h-64 w-full mt-4 border-t pt-4 bg-slate-50/50 dark:bg-slate-900/50 animate-in slide-in-from-top-2">
                {loadingHistory ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Carregando gráfico...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                      <defs>
                        <linearGradient id="colorBtc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="data" 
                        tick={{fontSize: 12}} 
                        tickLine={false} 
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        tick={{fontSize: 12}} 
                        tickLine={false} 
                        axisLine={false}
                        width={50} // Mais largo para caber os milhares
                        tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$ ${value.toLocaleString()}`, "Valor"]}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="valor" 
                        stroke="#f97316" 
                        fillOpacity={1} 
                        fill="url(#colorBtc)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </Card>

        </div>
      )}
    </div>
  );
}