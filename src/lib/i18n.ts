import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  'pt-BR': {
    translation: {
      nav: {
        home: 'Inicial',
        markets: 'Mercados',
        indicators: 'Indicadores',
        calculators: 'Calculadoras',
        news: 'Notícias',
        blog: 'Blog',
      },
      home: {
        tagline: 'Seu hub financeiro completo',
        title: {
          part1: 'Domine suas',
          part2: 'Finanças',
        },
        subtitle: 'Acompanhe o mercado financeiro, simule investimentos e tome decisões mais inteligentes com dados em tempo real.',
        cta: {
          simulate: 'Simular Agora',
          quotes: 'Ver Cotações',
          title: 'Planeje seu futuro financeiro com Juros Compostos',
          description: 'Descubra quanto seu dinheiro pode render ao longo do tempo. Nossa calculadora de juros compostos mostra graficamente a evolução do seu patrimônio e o poder dos aportes mensais.',
          button: 'Experimentar Agora',
        },
        features: {
          title: 'Explore as Funcionalidades',
          subtitle: 'Tudo que você precisa para gerenciar suas finanças em um só lugar',
          markets: {
            title: 'Mercado Financeiro',
            description: 'Cotações de moedas, criptomoedas e índices atualizadas em tempo real',
            action: 'Acessar',
          },
          calculators: {
            title: 'Calculadoras',
            description: 'Simule investimentos, financiamentos e calcule seu salário líquido',
            action: 'Calcular',
          },
          indicators: {
            title: 'Indicadores Econômicos',
            description: 'SELIC, IPCA, CDI e outros indicadores oficiais do Banco Central',
            action: 'Visualizar',
          },
          news: {
            title: 'Notícias Financeiras',
            description: 'Últimas notícias de economia e negócios do Brasil em tempo real',
            action: 'Ler Agora',
          },
          blog: {
            title: 'Blog de Educação Financeira',
            description: 'Artigos completos sobre investimentos, planejamento e independência financeira',
            action: 'Ler Artigos',
          },
        },
        stats: {
          news: 'Notícias por dia',
          realData: 'Dados Reais de APIs Oficiais',
          calculators: 'Calculadoras Financeiras Completas',
          realtime: 'Atualização em Tempo Real',
        },
      },
      markets: {
        title: 'Mercados',
        description: 'Cotações e índices em tempo real',
        exchangeRates: 'Taxas de Câmbio',
        topCryptos: 'Top 10 Criptomoedas',
      },
      news: {
        title: 'Notícias Financeiras',
        description: 'Últimas notícias de economia e negócios do Brasil',
        refresh: 'Atualizar notícias (disponível a cada 5 minutos)',
        empty: 'Nenhuma notícia disponível',
        emptyDescription: 'Tente atualizar novamente em alguns minutos.',
        readMore: 'Ler Mais',
        footer: 'Notícias fornecidas pelo Google News • Atualização automática a cada 60 minutos',
      },
      blog: {
        title: 'Blog de Educação Financeira',
        subtitle: 'Aprenda a gerenciar suas finanças, investir melhor e conquistar seus objetivos financeiros',
        searchPlaceholder: 'Buscar artigos por título, tags ou conteúdo...',
        noResults: 'Nenhum artigo encontrado',
        noResultsDescription: 'Tente buscar por outros termos ou limpe a busca para ver todos os artigos.',
        readMore: 'Ler artigo completo',
        showing: 'Mostrando',
        backToList: 'Voltar para o blog',
        share: {
          title: 'Gostou deste artigo?',
          description: 'Compartilhe com seus amigos e ajude mais pessoas a aprenderem sobre finanças!',
        },
        related: {
          title: 'Você também pode gostar',
        },
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
      footer: {
        rights: "Todos os direitos reservados.",
        developedBy: "Desenvolvido por",
      },
    },
  },
  en: {
    translation: {
      nav: {
        home: 'Home',
        markets: 'Markets',
        indicators: 'Indicators',
        calculators: 'Calculators',
        news: 'News',
        blog: 'Blog',
      },
      home: {
        tagline: 'Your complete financial hub',
        title: {
          part1: 'Master your',
          part2: 'Finances',
        },
        subtitle: 'Track the financial market, simulate investments and make smarter decisions with real-time data.',
        cta: {
          simulate: 'Simulate Now',
          quotes: 'View Quotes',
          title: 'Plan your financial future with Compound Interest',
          description: 'Discover how much your money can grow over time. Our compound interest calculator graphically shows the evolution of your wealth and the power of monthly contributions.',
          button: 'Try Now',
        },
        features: {
          title: 'Explore Features',
          subtitle: 'Everything you need to manage your finances in one place',
          markets: {
            title: 'Financial Market',
            description: 'Real-time updated quotes for currencies, cryptocurrencies and indices',
            action: 'Access',
          },
          calculators: {
            title: 'Calculators',
            description: 'Simulate investments, loans and calculate your net salary',
            action: 'Calculate',
          },
          indicators: {
            title: 'Economic Indicators',
            description: 'SELIC, IPCA, CDI and other official Central Bank indicators',
            action: 'View',
          },
          news: {
            title: 'Financial News',
            description: 'Latest economy and business news from Brazil in real-time',
            action: 'Read Now',
          },
          blog: {
            title: 'Financial Education Blog',
            description: 'Complete articles about investments, planning and financial independence',
            action: 'Read Articles',
          },
        },
        stats: {
          news: 'News per day',
          realData: 'Real Data from Official APIs',
          calculators: 'Complete Financial Calculators',
          realtime: 'Real-Time Updates',
        },
      },
      markets: {
        title: 'Markets',
        description: 'Real-time quotes and indices',
        exchangeRates: 'Exchange Rates',
        topCryptos: 'Top 10 Cryptocurrencies',
      },
      news: {
        title: 'Financial News',
        description: 'Latest economy and business news from Brazil',
        refresh: 'Refresh news (available every 5 minutes)',
        empty: 'No news available',
        emptyDescription: 'Try refreshing again in a few minutes.',
        readMore: 'Read More',
        footer: 'News provided by Google News • Auto-update every 60 minutes',
      },
      blog: {
        title: 'Financial Education Blog',
        subtitle: 'Learn to manage your finances, invest better and achieve your financial goals',
        searchPlaceholder: 'Search articles by title, tags or content...',
        noResults: 'No articles found',
        noResultsDescription: 'Try searching for other terms or clear the search to see all articles.',
        readMore: 'Read full article',
        showing: 'Showing',
        backToList: 'Back to blog',
        share: {
          title: 'Did you like this article?',
          description: 'Share with your friends and help more people learn about finance!',
        },
        related: {
          title: 'You might also like',
        },
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
      footer: {
        rights: "All rights reserved.",
        developedBy: "Developed by",
      },
    },
  },
  es: {
    translation: {
      nav: {
        home: 'Inicio',
        markets: 'Mercados',
        indicators: 'Indicadores',
        calculators: 'Calculadoras',
        news: 'Noticias',
        blog: 'Blog',
      },
      home: {
        tagline: 'Tu hub financiero completo',
        title: {
          part1: 'Dominá tus',
          part2: 'Finanzas',
        },
        subtitle: 'Seguí el mercado financiero, simulá inversiones y tomá decisiones más inteligentes con datos en tiempo real.',
        cta: {
          simulate: 'Simular Ahora',
          quotes: 'Ver Cotizaciones',
          title: 'Planeá tu futuro financiero con Interés Compuesto',
          description: 'Descubrí cuánto puede rendir tu dinero con el tiempo. Nuestra calculadora de interés compuesto muestra gráficamente la evolución de tu patrimonio y el poder de los aportes mensuales.',
          button: 'Probar Ahora',
        },
        features: {
          title: 'Explorá las Funcionalidades',
          subtitle: 'Todo lo que necesitás para gestionar tus finanzas en un solo lugar',
          markets: {
            title: 'Mercado Financiero',
            description: 'Cotizaciones de monedas, criptomonedas e índices actualizadas en tiempo real',
            action: 'Acceder',
          },
          calculators: {
            title: 'Calculadoras',
            description: 'Simulá inversiones, préstamos y calculá tu salario neto',
            action: 'Calcular',
          },
          indicators: {
            title: 'Indicadores Económicos',
            description: 'SELIC, IPCA, CDI y otros indicadores oficiales del Banco Central',
            action: 'Visualizar',
          },
          news: {
            title: 'Noticias Financieras',
            description: 'Últimas noticias de economía y negocios de Brasil en tiempo real',
            action: 'Leer Ahora',
          },
          blog: {
            title: 'Blog de Educación Financiera',
            description: 'Artículos completos sobre inversiones, planificación e independencia financiera',
            action: 'Leer Artículos',
          },
        },
        stats: {
          news: 'Noticias por día',
          realData: 'Datos Reales de APIs Oficiales',
          calculators: 'Calculadoras Financieras Completas',
          realtime: 'Actualización en Tiempo Real',
        },
      },
      markets: {
        title: 'Mercados',
        description: 'Cotizaciones e índices en tiempo real',
        exchangeRates: 'Tipos de Cambio',
        topCryptos: 'Top 10 Criptomonedas',
      },
      news: {
        title: 'Noticias Financieras',
        description: 'Últimas noticias de economía y negocios de Brasil',
        refresh: 'Actualizar noticias (disponible cada 5 minutos)',
        empty: 'No hay noticias disponibles',
        emptyDescription: 'Intentá actualizar nuevamente en algunos minutos.',
        readMore: 'Leer Más',
        footer: 'Noticias provistas por Google News • Actualización automática cada 60 minutos',
      },
      blog: {
        title: 'Blog de Educación Financiera',
        subtitle: 'Aprendé a gestionar tus finanzas, invertir mejor y lograr tus objetivos financieros',
        searchPlaceholder: 'Buscar artículos por título, tags o contenido...',
        noResults: 'No se encontraron artículos',
        noResultsDescription: 'Intentá buscar con otros términos o limpía la búsqueda para ver todos los artículos.',
        readMore: 'Leer artículo completo',
        showing: 'Mostrando',
        backToList: 'Volver al blog',
        share: {
          title: '¿Te gustó este artículo?',
          description: '¡Compartí con tus amigos y ayudá a más personas a aprender sobre finanzas!',
        },
        related: {
          title: 'También podría gustarte',
        },
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
      footer: {
        rights: "Todos los derechos reservados.",
        developedBy: "Desarrollado por",
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