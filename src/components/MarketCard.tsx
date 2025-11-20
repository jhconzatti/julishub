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
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-card-foreground">{value}</div>
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? 'text-success' : 'text-destructive'
            }`}
          >
            {isPositive ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketCard;
