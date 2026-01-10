import { useEffect, useState } from "react";
import { RefreshCw, ExternalLink, Newspaper } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchWithCache, canManualRefresh, getRemainingCooldown, updateManualRefreshTimestamp } from "@/lib/apiCache";
import { toast } from "sonner";

interface Noticia {
  titulo: string;
  link: string;
  fonte: string;
  data_publicacao: string;
  imagem: string;
}

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const baseUrl = url.replace(/\/$/, ""); // Remove trailing slash
  // Garante que sempre tenha /api no final
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};
const API_BASE_URL = getApiUrl();

export default function News() {
  const { t } = useTranslation();
  
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNoticias = async (forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      const data = await fetchWithCache<Noticia[]>(
        'noticias',
        async () => {
          const response = await fetch(`${API_BASE_URL}/noticias`);
          if (!response.ok) {
            // Se API não tem o endpoint ainda, não quebra o app
            console.warn(`⚠️ Notícias não disponíveis (${response.status}). Aguardando deploy...`);
            return [];
          }
          return response.json();
        },
        forceRefresh
      );
      
      setNoticias(data || []);
    } catch (error) {
      console.warn("⚠️ Erro ao buscar notícias:", error);
      setNoticias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticias();
  }, []);

  const handleManualRefresh = async () => {
    if (!canManualRefresh(null)) {
      const remaining = getRemainingCooldown(null);
      toast.error(`Aguarde ${Math.floor(remaining / 60)}m${remaining % 60}s para atualizar novamente`);
      return;
    }

    setIsRefreshing(true);
    try {
      await fetchNoticias(true);
      updateManualRefreshTimestamp('news_refresh');
      // Só mostra sucesso se realmente carregou notícias
      if (noticias.length > 0) {
        toast.success("Notícias atualizadas!");
      }
    } catch (error) {
      console.warn("⚠️ Erro ao atualizar notícias:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNoticiaClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Newspaper className="h-8 w-8" />
            {t('news.title') || "Notícias Financeiras"}
          </h2>
          <p className="text-muted-foreground">
            {t('news.description') || "Últimas notícias de economia e negócios do Brasil"}
          </p>
        </div>
        <button 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('news.refresh') || "Atualizar notícias (disponível a cada 5 minutos)"}
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : noticias.length === 0 ? (
        <Card className="p-12 text-center">
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
              className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => handleNoticiaClick(noticia.link)}
            >
              <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
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
              
              <CardHeader className="pb-3">
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
