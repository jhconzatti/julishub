import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Landmark, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

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

interface IndicadorData {
  valor: string;
  data?: string;
  descricao: string;
}

interface IndicadoresResponse {
  selic: IndicadorData;
  ipca: IndicadorData;
  cdi: IndicadorData;
  erro?: string;
}

const Indicators = () => {
  const { t } = useTranslation();
  const [indicadores, setIndicadores] = useState<IndicadoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIndicadores = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/indicadores`);
        if (!response.ok) {
          throw new Error('Erro ao buscar indicadores');
        }
        const data = await response.json();
        setIndicadores(data);
      } catch (err) {
        setError('Não foi possível carregar os indicadores. Tente novamente mais tarde.');
        console.error('Erro ao buscar indicadores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIndicadores();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('indicators.title') || 'Indicadores Econômicos'}</h2>
          <p className="text-muted-foreground">{t('indicators.description') || 'Dados oficiais em tempo real'}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
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
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Erro desconhecido ao carregar indicadores.'}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        {/* Aviso se houver erro parcial */}
        {indicadores.erro && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{indicadores.erro}</AlertDescription>
          </Alert>
        )}

        {/* Cards dos Indicadores */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* SELIC */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Landmark className="h-5 w-5" />
                SELIC Meta
              </CardTitle>
              <CardDescription className="text-xs">{indicadores.selic.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                {indicadores.selic.valor}%
              </div>
              {indicadores.selic.data && (
                <p className="text-xs text-muted-foreground mt-2">
                  Atualizado em {indicadores.selic.data}
                </p>
              )}
            </CardContent>
          </Card>

          {/* IPCA */}
          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <TrendingUp className="h-5 w-5" />
                IPCA (12 meses)
              </CardTitle>
              <CardDescription className="text-xs">{indicadores.ipca.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-red-600 dark:text-red-400">
                {indicadores.ipca.valor}%
              </div>
              {indicadores.ipca.data && (
                <p className="text-xs text-muted-foreground mt-2">
                  Atualizado em {indicadores.ipca.data}
                </p>
              )}
            </CardContent>
          </Card>

          {/* CDI */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Activity className="h-5 w-5" />
                CDI Estimado
              </CardTitle>
              <CardDescription className="text-xs">{indicadores.cdi.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-green-600 dark:text-green-400">
                {indicadores.cdi.valor}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">Baseado na SELIC - 0.10%</p>
            </CardContent>
          </Card>
        </div>

        {/* Seção Educativa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">💡 Como isso afeta seu bolso?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-blue-700 dark:text-blue-400">SELIC (Taxa Básica de Juros)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                É a taxa de juros básica da economia brasileira. Quando ela sobe, os empréstimos ficam mais caros,
                mas investimentos em renda fixa rendem mais. Afeta diretamente o crédito e o consumo.
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-red-700 dark:text-red-400">IPCA (Inflação Oficial)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Mede o aumento dos preços dos produtos e serviços. Quanto maior o IPCA, menor o poder de compra
                do seu dinheiro. É usado como referência para reajustes salariais e contratos.
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-green-700 dark:text-green-400">CDI (Certificado de Depósito Interbancário)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                É a taxa de juros praticada entre bancos e serve como referência para investimentos em renda fixa.
                Geralmente fica próxima à SELIC. Muitos fundos e CDBs são atrelados ao CDI.
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
        <strong>Indicadores argentinos em desenvolvimento.</strong>
        <br />
        Em breve: Tasa de Interés (BCRA), Inflación (IPC), y más.
      </AlertDescription>
    </Alert>
  );

  const renderEUATab = () => (
    <Alert className="border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-800">
      <AlertCircle className="h-4 w-4 text-indigo-600" />
      <AlertDescription className="text-sm">
        <strong>US economic indicators coming soon.</strong>
        <br />
        Coming: Federal Funds Rate, CPI, Core Inflation, and more.
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('indicators.title') || 'Indicadores Econômicos'}</h2>
        <p className="text-muted-foreground">
          {t('indicators.description') || 'Dados oficiais em tempo real'}
        </p>
      </div>

      {/* Abas */}
      <Tabs defaultValue="brasil" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="brasil">🇧🇷 Brasil</TabsTrigger>
          <TabsTrigger value="argentina">🇦🇷 Argentina</TabsTrigger>
          <TabsTrigger value="eua">🇺🇸 EUA</TabsTrigger>
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

