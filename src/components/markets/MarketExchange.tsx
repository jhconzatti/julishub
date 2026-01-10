import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface ExchangeData {
  pair: string;
  label: string;
  valor: string;
  var: string;
  icon: React.ReactNode;
  color: string;
  group?: string;
}

interface MarketExchangeProps {
  exchangeData: ExchangeData[];
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

export default function MarketExchange({ 
  exchangeData
}: MarketExchangeProps) {
  // Agrupar moedas por região
  const groupedData = exchangeData.reduce((acc, item) => {
    const group = item.group || "Outros";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, ExchangeData[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedData).map(([groupName, items]) => (
        <div key={groupName} className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground/80 border-b pb-2">
            {groupName}
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card 
                key={item.pair}
                className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                  <div className={`text-${item.color}`}>{item.icon}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {item.valor}
                  </div>
                  <div className="mt-2">
                    <VariationBadge value={item.var} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
