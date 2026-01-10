import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, DollarSign, Euro, TrendingUp } from "lucide-react";
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ExchangeData {
  pair: string;
  label: string;
  valor: string;
  var: string;
  icon: React.ReactNode;
  color: string;
}

interface HistoryPoint {
  data: string;
  valor: number;
}

interface MarketExchangeProps {
  exchangeData: ExchangeData[];
  onCardClick: (pair: string) => void;
  selectedPair: string | null;
  historyData: HistoryPoint[];
  loadingHistory: boolean;
}

const VariationBadge = ({ value }: { value: string }) => {
  const num = parseFloat(value) || 0;
  const isPositive = num >= 0;
  return (
    <span className={`flex items-center text-sm font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
      {isPositive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
      {Math.abs(num).toFixed(2)}%
    </span>
  );
};

const HistoryChart = ({ 
  data, 
  loading, 
  color, 
  id, 
  prefix 
}: { 
  data: HistoryPoint[]; 
  loading: boolean; 
  color: string; 
  id: string; 
  prefix: string;
}) => {
  if (loading) {
    return (
      <div className="h-64 w-full mt-4 border-t pt-4 flex items-center justify-center text-muted-foreground">
        Carregando gráfico...
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full mt-4 border-t pt-4 flex items-center justify-center text-muted-foreground">
        Sem dados disponíveis.
      </div>
    );
  }

  return (
    <div className="h-64 w-full mt-4 border-t pt-4 bg-slate-50/50 dark:bg-slate-900/50 animate-in slide-in-from-top-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="data" 
            tick={{ fontSize: 10 }} 
            tickLine={false} 
            axisLine={false}
            minTickGap={20}
            tickFormatter={(value) => value ? value.slice(0, 5) : ""} 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            tick={{ fontSize: 10 }} 
            tickLine={false} 
            axisLine={false}
            width={40}
            tickFormatter={(value) => `${prefix}${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value.toFixed(0)}`}
          />
          <Tooltip 
            formatter={(value: number) => [`${prefix} ${value.toLocaleString()}`, "Valor"]}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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

export default function MarketExchange({ 
  exchangeData, 
  onCardClick, 
  selectedPair, 
  historyData, 
  loadingHistory 
}: MarketExchangeProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {exchangeData.map((item) => (
        <Card 
          key={item.pair}
          className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-${item.color}/50 ${
            selectedPair === item.pair ? `ring-2 ring-${item.color}` : ''
          }`}
          onClick={() => onCardClick(item.pair)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
            <div className={`text-${item.color}`}>{item.icon}</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {item.valor}
            </div>
            <div className="flex justify-between items-center mt-2">
              <VariationBadge value={item.var} />
              <span className="text-xs text-muted-foreground flex items-center">
                {selectedPair === item.pair ? 'Fechar' : 'Gráfico'} <TrendingUp className="w-3 h-3 ml-1" />
              </span>
            </div>
          </CardContent>
          {selectedPair === item.pair && (
            <HistoryChart 
              data={historyData} 
              loading={loadingHistory} 
              color={item.color} 
              id={item.pair} 
              prefix={item.pair.includes('BTC') ? '$' : 'R$'} 
            />
          )}
        </Card>
      ))}
    </div>
  );
}
