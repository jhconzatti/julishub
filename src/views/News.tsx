import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ExternalLink, Newspaper } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataFreshness, DataUnavailable, SlowLoadingNotice, StaleDataNotice } from "@/components/DataState";
import { fetchWithCache, canManualRefresh, getLastManualRefresh, getRemainingCooldown, updateManualRefreshTimestamp } from "@/lib/apiCache";
import { fetchJsonWithRetry } from "@/lib/apiRequest";
import { isNewsResponse, type NewsItem } from "@/lib/apiValidators";
import { toast } from "sonner";

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const baseUrl = url.replace(/\/$/, ""); // Remove trailing slash
  // Garante que sempre tenha /api no final
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};
const API_BASE_URL = getApiUrl();

export default function News() {
  const { t } = useTranslation();
  
  const [noticias, setNoticias] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [dataTimestamp, setDataTimestamp] = useState<number | null>(null);

  const fetchNoticias = useCallback(async (forceRefresh = false): Promise<boolean> => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchWithCache<NewsItem[]>(
        'noticias',
        () => fetchJsonWithRetry(`${API_BASE_URL}/noticias`, isNewsResponse),
        isNewsResponse,
        forceRefresh,
      );
      setNoticias(result.data);
      setIsStale(result.isStale);
      setDataTimestamp(result.timestamp);
      return !result.refreshFailed;
    } catch (requestError) {
      console.warn("Erro ao buscar notícias:", requestError);
      setNoticias([]);
      setError(true);
      setIsStale(false);
      setDataTimestamp(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNoticias();
  }, [fetchNoticias]);

  const handleManualRefresh = async () => {
    const lastRefresh = getLastManualRefresh('news_refresh');
    if (!canManualRefresh(lastRefresh)) {
      const remaining = getRemainingCooldown(lastRefresh);
      toast.error(t('dataStates.cooldown', { minutes: Math.floor(remaining / 60), seconds: remaining % 60 }));
      return;
    }

    updateManualRefreshTimestamp('news_refresh');
    setIsRefreshing(true);
    const succeeded = await fetchNoticias(true);
    if (succeeded) toast.success(t('dataStates.refreshSuccess'));
    else toast.error(t('dataStates.refreshFailed'));
    setIsRefreshing(false);
  };

  const handleNoticiaClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Newspaper className="h-7 w-7" />
            {t('news.title') || "Notícias Financeiras"}
          </h2>
          <p className="text-muted-foreground">
            {t('news.description') || "Últimas notícias de economia e negócios do Brasil"}
          </p>
        </div>
        <button 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          aria-label={t('news.refresh')}
          aria-busy={isRefreshing}
          className="rounded-full p-2 transition-all hover:bg-muted active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          title={t('news.refresh') || "Atualizar notícias (disponível a cada 5 minutos)"}
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!loading && !error && (isStale ? <StaleDataNotice timestamp={dataTimestamp} /> : <DataFreshness timestamp={dataTimestamp} />)}

      {loading ? (
        <div className="space-y-4">
          <SlowLoadingNotice loading />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <Card key={i} className="overflow-hidden border-border/70 bg-card">
                <div className="h-48 animate-pulse bg-muted" />
                <CardHeader>
                  <div className="mb-2 h-6 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ) : error ? (
        <DataUnavailable onRetry={() => void fetchNoticias(true)} external />
      ) : noticias.length === 0 ? (
        <Card className="border-border/70 bg-card p-12 text-center">
          <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            {t('news.empty') || "Nenhuma notícia disponível"}
          </h3>
          <p className="text-muted-foreground">
            {t('news.emptyDescription') || "Tente atualizar novamente em alguns minutos."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {noticias.map((noticia, index) => (
            <Card 
              key={index} 
              className="group flex h-full cursor-pointer flex-col overflow-hidden border-border/70 bg-card transition-shadow duration-200 hover:shadow-md"
              onClick={() => handleNoticiaClick(noticia.link)}
            >
              <div className="relative h-48 overflow-hidden bg-muted">
                <img 
                  src={noticia.imagem} 
                  alt={noticia.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${noticia.fonte[0]}&background=0ea5e9&color=fff&size=400&bold=true`;
                  }}
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-medium">
                  {noticia.data_publicacao}
                </div>
              </div>
              
              <CardHeader className="flex-1 pb-3">
                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {noticia.titulo}
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span className="font-medium">{noticia.fonte}</span>
                  <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNoticiaClick(noticia.link);
                  }}
                >
                  {t('news.readMore') || "Ler Mais"}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && noticias.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {t('news.footer') || "Notícias fornecidas pelo Google News • Atualização automática a cada 60 minutos"}
        </div>
      )}
    </div>
  );
}
