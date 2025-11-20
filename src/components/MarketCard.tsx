import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MarketCardProps {
  title: string;
  value: string;
  change: number;
  changePercent: number;
}

const MarketCard = ({ title, value, change, changePercent }: MarketCardProps) => {
  const isPositive = change >= 0;

  return (
    <Card className="transition-all duration-300 hover:shadow-md border-border rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <ArrowUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${
                isPositive ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {isPositive ? '+' : ''}
              {change.toFixed(2)} ({isPositive ? '+' : ''}
              {changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketCard;
