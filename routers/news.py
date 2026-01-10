from fastapi import APIRouter, HTTPException
import feedparser
import requests
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import logging
from hashlib import md5

router = APIRouter()

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache simples em memória (1 hora)
_cache_news = {
    "data": None,
    "timestamp": None,
}

CACHE_DURATION = timedelta(hours=1)


def is_cache_valid(cache_timestamp: Optional[datetime]) -> bool:
    """Verifica se o cache ainda é válido (menos de 1 hora)"""
    if cache_timestamp is None:
        return False
    return datetime.now() - cache_timestamp < CACHE_DURATION


def get_fonte_display_name(link: str) -> str:
    """Extrai o nome amigável da fonte a partir do link"""
    fonte_map = {
        "infomoney": "InfoMoney",
        "g1.globo": "G1",
        "valor": "Valor Econômico",
        "exame": "Exame",
        "estadao": "Estadão",
        "folha": "Folha de S.Paulo",
        "uol": "UOL Economia",
        "cnnbrasil": "CNN Brasil",
        "moneytimes": "Money Times",
        "seudinheiro": "Seu Dinheiro",
        "investnews": "InvestNews",
        "neofeed": "NeoFeed",
        "investidor10": "Investidor10",
        "suno": "Suno Notícias",
    }
    
    link_lower = link.lower()
    for key, name in fonte_map.items():
        if key in link_lower:
            return name
    
    # Fallback: tenta extrair domínio
    try:
        from urllib.parse import urlparse
        domain = urlparse(link).netloc
        # Remove www. e .com.br/.com
        domain = domain.replace("www.", "").replace(".com.br", "").replace(".com", "")
        return domain.capitalize()
    except:
        return "Fonte Desconhecida"


def get_placeholder_image(fonte: str) -> str:
    """Retorna imagem placeholder baseada na fonte"""
    # Gera um hash da fonte para cor consistente
    fonte_hash = int(md5(fonte.encode()).hexdigest(), 16) % 10
    
    colors = [
        "f59e0b",  # amber
        "10b981",  # emerald
        "3b82f6",  # blue
        "8b5cf6",  # violet
        "ef4444",  # red
        "06b6d4",  # cyan
        "f97316",  # orange
        "14b8a6",  # teal
        "6366f1",  # indigo
        "ec4899",  # pink
    ]
    
    color = colors[fonte_hash]
    # Placeholder via UI Avatars ou similar
    return f"https://ui-avatars.com/api/?name={fonte[0]}&background={color}&color=fff&size=400&bold=true"


def format_relative_time(pub_date_str: str) -> str:
    """Formata data para formato relativo (ex: 'Há 2 horas')"""
    try:
        # Parse da data (Google News usa formato RFC 822)
        from email.utils import parsedate_to_datetime
        pub_date = parsedate_to_datetime(pub_date_str)
        
        now = datetime.now(pub_date.tzinfo)
        diff = now - pub_date
        
        if diff.days > 0:
            if diff.days == 1:
                return "Há 1 dia"
            elif diff.days < 7:
                return f"Há {diff.days} dias"
            else:
                return pub_date.strftime("%d/%m/%Y")
        
        hours = diff.seconds // 3600
        if hours > 0:
            return f"Há {hours}h"
        
        minutes = diff.seconds // 60
        if minutes > 0:
            return f"Há {minutes}min"
        
        return "Agora"
    except Exception as e:
        logger.warning(f"⚠️ Erro ao formatar data: {e}")
        return "Data desconhecida"


def fetch_google_news() -> List[Dict[str, Any]]:
    """Busca notícias do RSS do Google News (Economia Brasil)"""
    try:
        logger.info("🔄 Buscando notícias do Google News...")
        
        rss_url = "https://news.google.com/rss/search?q=economia+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419"
        
        # Parse do RSS feed
        feed = feedparser.parse(rss_url)
        
        if not feed.entries:
            logger.warning("⚠️ Nenhuma notícia encontrada no feed")
            return []
        
        noticias = []
        for entry in feed.entries[:20]:  # Limita a 20 notícias
            try:
                titulo = entry.get("title", "Sem título")
                link = entry.get("link", "")
                pub_date = entry.get("published", "")
                
                # Extrai fonte do link
                fonte = get_fonte_display_name(link)
                
                # Tenta extrair imagem (Google News geralmente não fornece)
                imagem = None
                if hasattr(entry, "media_content") and entry.media_content:
                    imagem = entry.media_content[0].get("url")
                elif hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
                    imagem = entry.media_thumbnail[0].get("url")
                
                # Se não tem imagem, usa placeholder
                if not imagem:
                    imagem = get_placeholder_image(fonte)
                
                # Formata data
                data_formatada = format_relative_time(pub_date)
                
                noticia = {
                    "titulo": titulo,
                    "link": link,
                    "fonte": fonte,
                    "data_publicacao": data_formatada,
                    "imagem": imagem,
                }
                
                noticias.append(noticia)
            except Exception as e:
                logger.warning(f"⚠️ Erro ao processar notícia individual: {e}")
                continue
        
        logger.info(f"✅ {len(noticias)} notícias carregadas com sucesso")
        return noticias
    
    except Exception as e:
        logger.error(f"❌ Erro ao buscar notícias do Google News: {e}")
        return []


@router.get("/noticias")
async def get_noticias():
    """
    Retorna lista de notícias financeiras do Google News (Economia Brasil)
    
    Cache de 1 hora para evitar sobrecarga no feed do Google
    """
    try:
        # Verifica cache
        if is_cache_valid(_cache_news["timestamp"]):
            logger.info("📦 Retornando notícias do cache")
            return _cache_news["data"]
        
        # Busca notícias frescas
        noticias = fetch_google_news()
        
        if not noticias:
            # Retorna lista vazia ao invés de erro para não quebrar o frontend
            logger.warning("⚠️ Nenhuma notícia disponível, retornando lista vazia")
            return []
        
        # Atualiza cache
        _cache_news["data"] = noticias
        _cache_news["timestamp"] = datetime.now()
        
        return noticias
    
    except Exception as e:
        logger.error(f"❌ Erro crítico no endpoint /noticias: {e}")
        # Retorna lista vazia ao invés de HTTPException para não quebrar o frontend
        return []
