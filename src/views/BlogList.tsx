import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Calendar, Tag, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Artigo {
  slug: string;
  titulo: string;
  resumo: string;
  tags: string[];
  data: string;
  imagem_capa: string;
}

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const baseUrl = url.replace(/\/$/, ""); // Remove trailing slash
  // Garante que sempre tenha /api no final
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};
const API_BASE_URL = getApiUrl();

export default function BlogList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [filteredArtigos, setFilteredArtigos] = useState<Artigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchArtigos();
  }, []);

  useEffect(() => {
    // Filtrar artigos conforme o termo de busca
    if (searchTerm.trim() === "") {
      setFilteredArtigos(artigos);
    } else {
      const filtered = artigos.filter(artigo =>
        artigo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artigo.resumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artigo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredArtigos(filtered);
    }
  }, [searchTerm, artigos]);

  const fetchArtigos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/blog`);
      if (!response.ok) {
        // Se API em produção ainda não tem o endpoint, não quebra
        console.warn(`⚠️ API retornou ${response.status}. Aguardando deploy do backend...`);
        return;
      }
      const data = await response.json();
      setArtigos(data);
      setFilteredArtigos(data);
    } catch (error) {
      console.warn("⚠️ Backend do blog ainda não disponível:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArtigoClick = (slug: string) => {
    navigate(`/blog/${slug}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center space-y-4 px-4">
        <div className="flex items-center justify-center gap-3">
          <BookOpen className="h-10 w-10 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t('blog.title') || "Blog de Educação Financeira"}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('blog.subtitle') || "Aprenda a gerenciar suas finanças, investir melhor e conquistar seus objetivos financeiros"}
        </p>
      </div>

      {/* Barra de Busca */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('blog.searchPlaceholder') || "Buscar artigos por título, tags ou conteúdo..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Grid de Artigos */}
      {loading ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredArtigos.length === 0 && artigos.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            {t('blog.comingSoon') || "Blog em manutenção"}
          </h3>
          <p className="text-muted-foreground">
            {t('blog.comingSoonDescription') || "Os artigos estarão disponíveis em breve. Aguarde enquanto atualizamos nosso servidor."}
          </p>
        </Card>
      ) : filteredArtigos.length === 0 ? (
        <Card className="p-12 text-center">
          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            {t('blog.noResults') || "Nenhum artigo encontrado"}
          </h3>
          <p className="text-muted-foreground">
            {t('blog.noResultsDescription') || "Tente buscar por outros termos ou limpe a busca para ver todos os artigos."}
          </p>
          {searchTerm && (
            <Button 
              variant="outline" 
              onClick={() => setSearchTerm("")}
              className="mt-4"
            >
              Limpar busca
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredArtigos.map((artigo) => (
            <Card 
              key={artigo.slug}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col"
              onClick={() => handleArtigoClick(artigo.slug)}
            >
              {/* Imagem de Capa */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-blue-500/20">
                <img 
                  src={artigo.imagem_capa}
                  alt={artigo.titulo}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = `https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Data */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{artigo.data}</span>
                </div>
              </div>

              {/* Conteúdo do Card */}
              <CardHeader className="flex-grow">
                <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                  {artigo.titulo}
                </CardTitle>
                <CardDescription className="line-clamp-3 text-base mt-2">
                  {artigo.resumo}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {artigo.tags.slice(0, 3).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Botão Ler Mais */}
                <Button 
                  variant="ghost" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArtigoClick(artigo.slug);
                  }}
                >
                  {t('blog.readMore') || "Ler artigo completo"}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer da Lista */}
      {!loading && filteredArtigos.length > 0 && (
        <div className="text-center text-sm text-muted-foreground pt-8">
          {t('blog.showing') || "Mostrando"} {filteredArtigos.length} {filteredArtigos.length === 1 ? 'artigo' : 'artigos'}
        </div>
      )}
    </div>
  );
}
