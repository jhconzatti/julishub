import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  'pt-BR': {
    translation: {
      nav: {
        markets: 'Mercados',
        stocks: 'Ações',
        indicators: 'Indicadores',
        calculators: 'Calculadoras',
      },
      markets: {
        title: 'Mercados',
        exchangeRates: 'Taxas de Câmbio',
        topCryptos: 'Top 10 Criptomoedas',
      },
      stocks: {
        title: 'Ações',
        usStocks: 'Ações EUA',
        brazilStocks: 'Ações Brasil',
        indices: 'Índices',
      },
      indicators: {
        title: 'Indicadores Econômicos',
        brazil: 'Brasil',
        usa: 'Estados Unidos',
        argentina: 'Argentina',
      },
      calculators: {
        title: 'Calculadoras',
        cltSalary: 'Salário Líquido CLT',
        cltVacation: 'Férias CLT',
        thirteenth: '13º Salário',
        financialIndependence: 'Independência Financeira',
        pgblVgbl: 'PGBL/VGBL',
        fixedIncome: 'Renda Fixa',
        calculate: 'Calcular',
        result: 'Resultado',
      },
      common: {
        price: 'Preço',
        change: 'Variação',
        volume: 'Volume',
        marketCap: 'Cap. Mercado',
      },
    },
  },
  en: {
    translation: {
      nav: {
        markets: 'Markets',
        stocks: 'Stocks',
        indicators: 'Indicators',
        calculators: 'Calculators',
      },
      markets: {
        title: 'Markets',
        exchangeRates: 'Exchange Rates',
        topCryptos: 'Top 10 Cryptocurrencies',
      },
      stocks: {
        title: 'Stocks',
        usStocks: 'US Stocks',
        brazilStocks: 'Brazil Stocks',
        indices: 'Indices',
      },
      indicators: {
        title: 'Economic Indicators',
        brazil: 'Brazil',
        usa: 'United States',
        argentina: 'Argentina',
      },
      calculators: {
        title: 'Calculators',
        cltSalary: 'CLT Net Salary',
        cltVacation: 'CLT Vacation',
        thirteenth: '13th Salary',
        financialIndependence: 'Financial Independence',
        pgblVgbl: 'PGBL/VGBL',
        fixedIncome: 'Fixed Income',
        calculate: 'Calculate',
        result: 'Result',
      },
      common: {
        price: 'Price',
        change: 'Change',
        volume: 'Volume',
        marketCap: 'Market Cap',
      },
    },
  },
  es: {
    translation: {
      nav: {
        markets: 'Mercados',
        stocks: 'Acciones',
        indicators: 'Indicadores',
        calculators: 'Calculadoras',
      },
      markets: {
        title: 'Mercados',
        exchangeRates: 'Tipos de Cambio',
        topCryptos: 'Top 10 Criptomonedas',
      },
      stocks: {
        title: 'Acciones',
        usStocks: 'Acciones EE.UU.',
        brazilStocks: 'Acciones Brasil',
        indices: 'Índices',
      },
      indicators: {
        title: 'Indicadores Económicos',
        brazil: 'Brasil',
        usa: 'Estados Unidos',
        argentina: 'Argentina',
      },
      calculators: {
        title: 'Calculadoras',
        cltSalary: 'Salario Neto CLT',
        cltVacation: 'Vacaciones CLT',
        thirteenth: '13º Salario',
        financialIndependence: 'Independencia Financiera',
        pgblVgbl: 'PGBL/VGBL',
        fixedIncome: 'Renta Fija',
        calculate: 'Calcular',
        result: 'Resultado',
      },
      common: {
        price: 'Precio',
        change: 'Cambio',
        volume: 'Volumen',
        marketCap: 'Cap. Mercado',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
