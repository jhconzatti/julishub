import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface ExchangeData {
  pair: string;
  label: string;
  valor: string;
  var: string | null;
  icon: React.ReactNode;
  color: string;
  group?: string;
}

interface MarketExchangeProps {
  exchangeData: ExchangeData[];
}

const VariationBadge = ({ value }: { value: string | null }) => {
  if (value === null) {
    return <span className="text-sm font-medium text-muted-foreground">—</span>;
  }
  const num = parseFloat(value);
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
          <h3 className="border-b border-border/70 pb-2 text-lg font-semibold text-foreground">
            {groupName}
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card 
                key={item.pair}
                className="border-border/70 bg-card transition-shadow duration-200 hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                  <div className="text-primary">{item.icon}</div>
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
