import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Calendar, Share2, Tag, Linkedin, Twitter, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Artigo {
  slug: string;
  titulo: string;
  resumo: string;
  conteudo: string;
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

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [artigo, setArtigo] = useState<Artigo | null>(null);
  const [artigosRelacionados, setArtigosRelacionados] = useState<Artigo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchArtigo(slug);
      window.scrollTo(0, 0);
    }
  }, [slug]);

  const fetchArtigo = async (slug: string) => {
    setLoading(true);
    try {
      // Busca o artigo completo
      const response = await fetch(`${API_BASE_URL}/blog/${slug}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setArtigo(data);

      // Busca todos os artigos para calcular relacionados
      const allResponse = await fetch(`${API_BASE_URL}/blog`);
      const allArtigos = await allResponse.json();
      
      // Filtra artigos relacionados por tags em comum
      const relacionados = allArtigos
        .filter((a: Artigo) => a.slug !== slug) // Exclui o artigo atual
        .map((a: Artigo) => ({
          ...a,
          tagsEmComum: a.tags.filter(tag => data.tags.includes(tag)).length
        }))
        .filter((a: any) => a.tagsEmComum > 0) // Apenas com tags em comum
        .sort((a: any, b: any) => b.tagsEmComum - a.tagsEmComum) // Ordena por relevância
        .slice(0, 2); // Pega os 2 mais relevantes

      setArtigosRelacionados(relacionados);
    } catch (error) {
      console.error("❌ Erro ao carregar artigo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (platform: 'whatsapp' | 'linkedin' | 'twitter') => {
    const url = window.location.href;
    const text = artigo ? `${artigo.titulo} - JulisHub` : 'Artigo do JulisHub';

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    };

    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        
        {/* Image Skeleton */}
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        
        {/* Content Skeleton */}
        <div className="space-y-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!artigo) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Artigo não encontrado</h2>
        <Button onClick={() => navigate('/blog')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o blog
        </Button>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Breadcrumb / Voltar */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/blog')}
        className="group"
      >
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        {t('blog.backToList') || "Voltar para o blog"}
      </Button>

      {/* Header do Artigo */}
      <header className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          {artigo.titulo}
        </h1>

        <p className="text-xl text-muted-foreground leading-relaxed border-l-4 border-primary pl-4 italic">
          {artigo.resumo}
        </p>

        {/* Metadados */}
        <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
          {/* Autor */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-lg">
              <AvatarImage src="https://github.com/julianoheberhardt.png" alt="Juliano Heberhardt Conzatti" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">JC</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">Juliano Heberhardt Conzatti</p>
              <p className="text-xs">Especialista em Finanças</p>
            </div>
          </div>

          {/* Data */}
          <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">{artigo.data}</span>
          </div>

          {/* Tempo de Leitura */}
          <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              {Math.max(1, Math.ceil(artigo.conteudo.split(' ').length / 200))} min de leitura
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {artigo.tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="px-3 py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
            >
              <Tag className="h-3 w-3 mr-1.5" />
              {tag}
            </Badge>
          ))}
        </div>
      </header>

      {/* Imagem de Capa */}
      <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
        <img 
          src={artigo.imagem_capa}
          alt={artigo.titulo}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=600&fit=crop`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <Separator />

      {/* Conteúdo do Artigo (Markdown) */}
      <article className="prose prose-lg dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-16
        prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-10 prose-h1:border-b prose-h1:pb-4
        prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-10 prose-h2:text-primary
        prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-8
        prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-6
        prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6 prose-p:text-foreground/90
        prose-p:first-of-type:text-xl prose-p:first-of-type:leading-relaxed prose-p:first-of-type:text-foreground
        prose-p:first-of-type:first-letter:text-7xl prose-p:first-of-type:first-letter:font-bold prose-p:first-of-type:first-letter:text-primary 
        prose-p:first-of-type:first-letter:float-left prose-p:first-of-type:first-letter:mr-3 prose-p:first-of-type:first-letter:mt-1
        prose-li:text-lg prose-li:leading-relaxed prose-li:mb-2
        prose-ul:my-6 prose-ol:my-6
        prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:transition-all
        prose-strong:text-foreground prose-strong:font-bold prose-strong:text-primary/90
        prose-em:text-foreground/80 prose-em:italic
        prose-code:text-primary prose-code:bg-primary/10 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-base prose-code:font-mono
        prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-6 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:border prose-pre:border-slate-700
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-4 
        prose-blockquote:italic prose-blockquote:rounded-r-xl prose-blockquote:text-foreground/90 prose-blockquote:shadow-sm
        prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:text-xl
        prose-table:border-collapse prose-table:w-full prose-table:my-8 prose-table:shadow-lg prose-table:rounded-lg prose-table:overflow-hidden
        prose-th:bg-primary/10 prose-th:p-4 prose-th:text-left prose-th:font-bold prose-th:text-primary
        prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700 prose-td:p-4 prose-td:bg-white dark:prose-td:bg-slate-900/50
        prose-tr:transition-colors hover:prose-tr:bg-primary/5
        prose-img:rounded-xl prose-img:shadow-2xl prose-img:my-8 prose-img:border-4 prose-img:border-white dark:prose-img:border-slate-800
        prose-hr:border-primary/20 prose-hr:my-12
      ">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Customização adicional para tabelas
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-8">
                <table {...props} className="min-w-full" />
              </div>
            ),
            // Destaque para citações importantes
            blockquote: ({node, children, ...props}) => (
              <blockquote {...props} className="relative">
                <span className="absolute -left-2 top-0 text-6xl text-primary/20 font-serif">"</span>
                {children}
              </blockquote>
            ),
            // Código inline destacado
            code: ({node, inline, ...props}) => 
              inline ? (
                <code {...props} className="inline-code" />
              ) : (
                <code {...props} />
              ),
          }}
        >
          {artigo.conteudo}
        </ReactMarkdown>
      </article>

      <Separator className="my-12" />

      {/* Rodapé do Post: Compartilhamento */}
      <div className="bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-3">
          <Share2 className="h-8 w-8 mx-auto text-primary" />
          <h3 className="text-2xl font-bold">
            {t('blog.share.title') || "Gostou deste artigo?"}
          </h3>
          <p className="text-muted-foreground">
            {t('blog.share.description') || "Compartilhe com seus amigos e ajude mais pessoas a aprenderem sobre finanças!"}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            onClick={() => handleShare('whatsapp')}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp
          </Button>

          <Button 
            onClick={() => handleShare('linkedin')}
            className="bg-blue-700 hover:bg-blue-800 text-white gap-2"
          >
            <Linkedin className="h-5 w-5" />
            LinkedIn
          </Button>

          <Button 
            onClick={() => handleShare('twitter')}
            className="bg-black hover:bg-gray-900 text-white gap-2"
          >
            <Twitter className="h-5 w-5" />
            Twitter (X)
          </Button>
        </div>
      </div>

      {/* Você também pode gostar */}
      {artigosRelacionados.length > 0 && (
        <>
          <Separator className="my-12" />
          
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-center">
              {t('blog.related.title') || "Você também pode gostar"}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {artigosRelacionados.map((relacionado) => (
                <Card 
                  key={relacionado.slug}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  onClick={() => navigate(`/blog/${relacionado.slug}`)}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={relacionado.imagem_capa}
                      alt={relacionado.titulo}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {relacionado.titulo}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {relacionado.resumo}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {relacionado.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </article>
  );
}
