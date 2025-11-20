import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import MarketCard from '@/components/MarketCard';

const Markets = () => {
  const { t } = useTranslation();

  const exchangeRates = [
    { title: 'USD/BRL', value: '5.12', change: 0.05, changePercent: 0.98 },
    { title: 'BRL/USD', value: '0.195', change: -0.002, changePercent: -0.96 },
    { title: 'USD/ARS', value: '875.50', change: 15.30, changePercent: 1.78 },
    { title: 'ARS/USD', value: '0.0011', change: -0.00002, changePercent: -1.75 },
    { title: 'USD/EUR', value: '0.92', change: -0.01, changePercent: -1.08 },
    { title: 'EUR/USD', value: '1.09', change: 0.01, changePercent: 1.10 },
  ];

  const cryptos = [
    { title: 'BTC', value: '$67,234.00', change: 1234.56, changePercent: 1.87 },
    { title: 'ETH', value: '$3,456.78', change: -89.12, changePercent: -2.51 },
    { title: 'BNB', value: '$587.90', change: 12.45, changePercent: 2.16 },
    { title: 'SOL', value: '$143.21', change: 5.67, changePercent: 4.12 },
    { title: 'XRP', value: '$0.6234', change: 0.0123, changePercent: 2.01 },
    { title: 'ADA', value: '$0.5678', change: -0.0234, changePercent: -3.96 },
    { title: 'AVAX', value: '$34.56', change: 1.23, changePercent: 3.69 },
    { title: 'DOT', value: '$6.789', change: 0.234, changePercent: 3.57 },
    { title: 'MATIC', value: '$0.8901', change: -0.0456, changePercent: -4.87 },
    { title: 'LINK', value: '$14.56', change: 0.78, changePercent: 5.66 },
  ];

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            {t('markets.exchangeRates')}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exchangeRates.map((rate) => (
            <MarketCard key={rate.title} {...rate} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            {t('markets.topCryptos')}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cryptos.map((crypto) => (
            <MarketCard key={crypto.title} {...crypto} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Markets;
