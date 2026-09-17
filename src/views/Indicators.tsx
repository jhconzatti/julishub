import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Landmark, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { DataFreshness, DataUnavailable, SlowLoadingNotice, StaleDataNotice } from '@/components/DataState';
import { fetchWithCache } from '@/lib/apiCache';
import { fetchJsonWithRetry } from '@/lib/apiRequest';
import { isIndicatorsResponse, type IndicatorsResponse } from '@/lib/apiValidators';

// Configuração da API
const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  url = url.replace(/\/$/, "");
  if (!url.endsWith("/api")) {
    url += "/api";
  }
  return url;
};

const API_BASE_URL = getApiBaseUrl();

const Indicators = () => {
  const { t } = useTranslation();
  const [indicadores, setIndicadores] = useState<IndicatorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [dataTimestamp, setDataTimestamp] = useState<number | null>(null);

  const fetchIndicadores = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchWithCache<IndicatorsResponse>(
        'indicadores',
        () => fetchJsonWithRetry(`${API_BASE_URL}/indicadores`, isIndicatorsResponse),
        isIndicatorsResponse,
        forceRefresh,
      );
      setIndicadores(result.data);
      setIsStale(result.isStale);
      setDataTimestamp(result.timestamp);
    } catch (requestError) {
      console.error('Erro ao buscar indicadores:', requestError);
      setError(true);
      setIsStale(false);
      setDataTimestamp(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIndicadores();
  }, [fetchIndicadores]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('indicators.title')}</h2>
          <p className="text-muted-foreground">{t('indicators.description')}</p>
        </div>
        <SlowLoadingNotice loading />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/70 bg-card">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const renderBrasilTab = () => {
    if (error || !indicadores) {
      return <DataUnavailable onRetry={() => void fetchIndicadores(true)} retrying={loading} external />;
    }

    return (
      <div className="space-y-6">
        {isStale ? <StaleDataNotice timestamp={dataTimestamp} /> : <DataFreshness timestamp={dataTimestamp} />}

        {/* Cards dos Indicadores */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* SELIC */}
          <Card className="border-border/70 border-l-4 border-l-blue-500 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                {t('indicators.selicTitle')}
              </CardTitle>
              <CardDescription className="text-xs">{indicadores.selic.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                {indicadores.selic.valor}%
              </div>
              {indicadores.selic.data && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('indicators.updatedAt', { date: indicadores.selic.data })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* IPCA */}
          <Card className="border-border/70 border-l-4 border-l-red-500 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('indicators.ipcaTitle')}
              </CardTitle>
              <CardDescription className="text-xs">{indicadores.ipca.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-red-600 dark:text-red-400">
                {indicadores.ipca.valor}%
              </div>
              {indicadores.ipca.data && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('indicators.updatedAt', { date: indicadores.ipca.data })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* CDI */}
          <Card className="border-border/70 border-l-4 border-l-green-500 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('indicators.cdiTitle')}
              </CardTitle>
              <CardDescription className="text-xs">{indicadores.cdi.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-green-600 dark:text-green-400">
                {indicadores.cdi.valor}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">{t('indicators.cdiBasis')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Seção Educativa */}
        <Card className="border-border/70 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">💡 {t('indicators.howItAffects')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-blue-700 dark:text-blue-400">{t('indicators.selicExplanationTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('indicators.selicExplanation')}
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-red-700 dark:text-red-400">{t('indicators.ipcaExplanationTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('indicators.ipcaExplanation')}
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-green-700 dark:text-green-400">{t('indicators.cdiExplanationTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('indicators.cdiExplanation')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderArgentinaTab = () => (
    <Alert className="border-sky-200 bg-sky-50/50 dark:bg-sky-950/20 dark:border-sky-800">
      <AlertCircle className="h-4 w-4 text-sky-600" />
      <AlertDescription className="text-sm">
        <strong>{t('indicators.argentinaUnavailableTitle')}</strong>
        <br />
        {t('indicators.argentinaUnavailableDescription')}
      </AlertDescription>
    </Alert>
  );

  const renderEUATab = () => (
    <Alert className="border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-800">
      <AlertCircle className="h-4 w-4 text-indigo-600" />
      <AlertDescription className="text-sm">
        <strong>{t('indicators.usaUnavailableTitle')}</strong>
        <br />
        {t('indicators.usaUnavailableDescription')}
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('indicators.title')}</h2>
        <p className="text-muted-foreground">
          {t('indicators.description')}
        </p>
      </div>

      {/* Abas */}
      <Tabs defaultValue="brasil" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="brasil">🇧🇷 {t('indicators.brazil')}</TabsTrigger>
          <TabsTrigger value="argentina">🇦🇷 {t('indicators.argentina')}</TabsTrigger>
          <TabsTrigger value="eua">🇺🇸 {t('indicators.usa')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="brasil" className="mt-6">
          {renderBrasilTab()}
        </TabsContent>
        
        <TabsContent value="argentina" className="mt-6">
          {renderArgentinaTab()}
        </TabsContent>
        
        <TabsContent value="eua" className="mt-6">
          {renderEUATab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Indicators;

