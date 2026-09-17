import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, BarChart3, TrendingUp } from "lucide-react";

interface BrazilIndex {
  name: string;
  label: string;
  valor: string;
  var: string;
  description: string;
}

interface MarketBrazilProps {
  indexes: BrazilIndex[];
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

export default function MarketBrazil({ indexes }: MarketBrazilProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 border-l-4 border-l-blue-500 bg-muted/30 p-4">
        <h3 className="mb-1.5 text-lg font-semibold text-foreground">
          Mercado Brasileiro - B3
        </h3>
        <p className="text-sm text-muted-foreground">
          Principais índices e ETFs da Bolsa de Valores do Brasil (B3 - Brasil, Bolsa, Balcão)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {indexes.map((index) => (
          <Card 
            key={index.name}
            className="border-border/70 bg-card transition-shadow duration-200 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {index.label}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {parseFloat(index.valor).toLocaleString('pt-BR')}
              </div>
              <div className="flex justify-between items-center mt-2">
                <VariationBadge value={index.var} />
                <span className="text-xs text-muted-foreground">Pontos</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
                {index.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
