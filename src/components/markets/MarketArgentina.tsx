import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, BarChart3 } from "lucide-react";

interface ArgentinaIndex {
  name: string;
  label: string;
  valor: string;
  var: string;
  description: string;
}

interface MarketArgentinaProps {
  indexes: ArgentinaIndex[];
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

export default function MarketArgentina({ indexes }: MarketArgentinaProps) {
  return (
    <div className="space-y-6">
      <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-sky-900 dark:text-sky-100 mb-2">
          Mercado Argentino - BYMA
        </h3>
        <p className="text-sm text-sky-700 dark:text-sky-300">
          Principais índices da Bolsa de Valores de Buenos Aires (BYMA - Bolsas y Mercados Argentinos)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {indexes.map((index) => (
          <Card 
            key={index.name}
            className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-sky-500/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {index.label}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {parseFloat(index.valor).toLocaleString('es-AR')}
              </div>
              <div className="flex justify-between items-center mt-2">
                <VariationBadge value={index.var} />
                <span className="text-xs text-muted-foreground">Puntos</span>
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
