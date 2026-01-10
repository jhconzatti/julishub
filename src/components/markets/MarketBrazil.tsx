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
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Mercado Brasileiro - B3
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Principais índices e ETFs da Bolsa de Valores do Brasil (B3 - Brasil, Bolsa, Balcão)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {indexes.map((index) => (
          <Card 
            key={index.name}
            className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-purple-500/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {index.label}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
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
