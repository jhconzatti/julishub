import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calculator, Activity, ChartBar, Sparkles, ArrowRight, Home, Newspaper, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-8 md:py-12 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium animate-in slide-in-from-top-4 duration-500">
          <Sparkles className="h-4 w-4" />
          {t('home.tagline')}
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight animate-in slide-in-from-bottom-4 duration-500 delay-100">
          {t('home.title.part1')}{' '}
          <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {t('home.title.part2')}
          </span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500 delay-200 px-4">
          {t('home.subtitle')}
        </p>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center animate-in slide-in-from-bottom-4 duration-500 delay-300 px-4">
          <Button
            size="lg"
            className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
            onClick={() => navigate('/calculators')}
          >
            {t('home.cta.simulate')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
            onClick={() => navigate('/markets')}
          >
            {t('home.cta.quotes')}
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('home.features.title')}</h2>
          <p className="text-muted-foreground">
            {t('home.features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card Mercado */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-bottom-4 duration-500 delay-100"
            onClick={() => navigate('/markets')}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>{t('home.features.markets.title')}</CardTitle>
              <CardDescription>
                {t('home.features.markets.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                {t('home.features.markets.action')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Card Notícias */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-bottom-4 duration-500 delay-150"
            onClick={() => navigate('/news')}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 rounded-lg flex items-center justify-center mb-2">
                <Newspaper className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle>{t('home.features.news.title')}</CardTitle>
              <CardDescription>
                {t('home.features.news.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                {t('home.features.news.action')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Card Calculadoras */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-bottom-4 duration-500 delay-200"
            onClick={() => navigate('/calculators')}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center mb-2">
                <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>{t('home.features.calculators.title')}</CardTitle>
              <CardDescription>
                {t('home.features.calculators.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                {t('home.features.calculators.action')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Card Indicadores */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-bottom-4 duration-500 delay-300"
            onClick={() => navigate('/indicators')}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center mb-2">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>{t('home.features.indicators.title')}</CardTitle>
              <CardDescription>
                {t('home.features.indicators.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                {t('home.features.indicators.action')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Card Blog */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-bottom-4 duration-500 delay-350"
            onClick={() => navigate('/blog')}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 rounded-lg flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <CardTitle>{t('home.features.blog.title')}</CardTitle>
              <CardDescription>
                {t('home.features.blog.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                {t('home.features.blog.action')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action - Destaque */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-12 text-white animate-in slide-in-from-bottom-4 duration-500 delay-400">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <ChartBar className="h-16 w-16 mx-auto opacity-90" />
          
          <h2 className="text-4xl font-bold">
            {t('home.cta.title')}
          </h2>
          
          <p className="text-lg text-white/90">
            {t('home.cta.description')}
          </p>
          
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 mt-4"
            onClick={() => navigate('/calculators')}
          >
            {t('home.cta.button')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center animate-in slide-in-from-bottom-4 duration-500 delay-500">
        <div className="space-y-2">
          <div className="text-4xl font-bold text-primary">100%</div>
          <p className="text-muted-foreground">{t('home.stats.realData')}</p>
        </div>
        <div className="space-y-2">
          <div className="text-4xl font-bold text-primary">4</div>
          <p className="text-muted-foreground">{t('home.stats.calculators')}</p>
        </div>
        <div className="space-y-2">
          <div className="text-4xl font-bold text-primary">20+</div>
          <p className="text-muted-foreground">{t('home.stats.news')}</p>
        </div>
        <div className="space-y-2">
          <div className="text-4xl font-bold text-primary">24/7</div>
          <p className="text-muted-foreground">{t('home.stats.realtime')}</p>
        </div>
      </section>
    </div>
  );
};

export default Index;


