import { useTranslation } from 'react-i18next';
import { Briefcase, Building2, TrendingUp } from 'lucide-react';
import MarketCard from '@/components/MarketCard';

const Stocks = () => {
  const { t } = useTranslation();

  const usStocks = [
    { title: 'AAPL', value: '$178.45', change: 2.34, changePercent: 1.33 },
    { title: 'MSFT', value: '$412.89', change: -3.21, changePercent: -0.77 },
    { title: 'GOOGL', value: '$142.56', change: 1.89, changePercent: 1.34 },
    { title: 'AMZN', value: '$178.23', change: 4.56, changePercent: 2.63 },
    { title: 'TSLA', value: '$234.67', change: -7.89, changePercent: -3.25 },
    { title: 'NVDA', value: '$876.54', change: 23.45, changePercent: 2.75 },
  ];

  const brazilStocks = [
    { title: 'PETR4', value: 'R$ 36.45', change: 0.87, changePercent: 2.44 },
    { title: 'VALE3', value: 'R$ 67.89', change: -1.23, changePercent: -1.78 },
    { title: 'ITUB4', value: 'R$ 28.34', change: 0.45, changePercent: 1.61 },
    { title: 'BBDC4', value: 'R$ 14.56', change: 0.23, changePercent: 1.60 },
    { title: 'ABEV3', value: 'R$ 11.89', change: -0.12, changePercent: -1.00 },
    { title: 'WEGE3', value: 'R$ 42.78', change: 1.34, changePercent: 3.23 },
  ];

  const indices = [
    { title: 'S&P 500', value: '5,234.18', change: 45.67, changePercent: 0.88 },
    { title: 'NASDAQ', value: '16,789.45', change: 123.45, changePercent: 0.74 },
    { title: 'DOW JONES', value: '38,456.78', change: -89.23, changePercent: -0.23 },
    { title: 'IBOVESPA', value: '129,876.34', change: 1234.56, changePercent: 0.96 },
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Briefcase className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            {t('stocks.usStocks')}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {usStocks.map((stock) => (
            <MarketCard key={stock.title} {...stock} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            {t('stocks.brazilStocks')}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brazilStocks.map((stock) => (
            <MarketCard key={stock.title} {...stock} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            {t('stocks.indices')}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {indices.map((index) => (
            <MarketCard key={index.title} {...index} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Stocks;
