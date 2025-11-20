import { useTranslation } from 'react-i18next';
import MarketCard from '@/components/MarketCard';

const Indicators = () => {
  const { t } = useTranslation();

  const brazilIndicators = [
    { title: 'IPCA', value: '4.62%', change: 0.12, changePercent: 2.67 },
    { title: 'INPC', value: '4.45%', change: 0.08, changePercent: 1.83 },
    { title: 'IGP-M', value: '3.89%', change: -0.23, changePercent: -5.58 },
    { title: 'SELIC', value: '11.75%', change: 0.00, changePercent: 0.00 },
  ];

  const usaIndicators = [
    { title: 'CPI', value: '3.14%', change: 0.06, changePercent: 1.95 },
    { title: 'PPI', value: '2.87%', change: -0.11, changePercent: -3.69 },
    { title: 'Fed Rate', value: '5.50%', change: 0.00, changePercent: 0.00 },
    { title: 'Unemployment', value: '3.8%', change: 0.10, changePercent: 2.70 },
  ];

  const argentinaIndicators = [
    { title: 'IPC', value: '211.4%', change: 15.3, changePercent: 7.80 },
    { title: 'Tasa Leliq', value: '133.0%', change: -7.00, changePercent: -5.00 },
    { title: 'Desempleo', value: '6.2%', change: 0.30, changePercent: 5.08 },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          {t('indicators.brazil')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {brazilIndicators.map((indicator) => (
            <MarketCard key={indicator.title} {...indicator} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          {t('indicators.usa')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {usaIndicators.map((indicator) => (
            <MarketCard key={indicator.title} {...indicator} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          {t('indicators.argentina')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {argentinaIndicators.map((indicator) => (
            <MarketCard key={indicator.title} {...indicator} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Indicators;
