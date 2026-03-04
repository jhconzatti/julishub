/**
 * Sistema de cache para APIs
 * - Cache de 60 minutos para dados
 * - Trava de segurança de 5 minutos para atualização manual
 */

interface CacheData<T> {
  data: T;
  timestamp: number;
  lastManualRefresh?: number;
}

const CACHE_DURATION = 60 * 60 * 1000; // 60 minutos
const MANUAL_REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutos

/**
 * Verifica se o cache ainda é válido
 */
export function isCacheValid(timestamp: number | null): boolean {
  if (!timestamp) return false;
  const now = Date.now();
  return now - timestamp < CACHE_DURATION;
}

/**
 * Verifica se pode executar refresh manual (trava de 5 minutos)
 */
export function canManualRefresh(lastRefreshTimestamp: number | null): boolean {
  if (!lastRefreshTimestamp) return true;
  const now = Date.now();
  return now - lastRefreshTimestamp >= MANUAL_REFRESH_COOLDOWN;
}

/**
 * Obtém tempo restante para próximo refresh manual (em segundos)
 */
export function getRemainingCooldown(lastRefreshTimestamp: number | null): number {
  if (!lastRefreshTimestamp) return 0;
  const now = Date.now();
  const elapsed = now - lastRefreshTimestamp;
  const remaining = MANUAL_REFRESH_COOLDOWN - elapsed;
  return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Salva dados no cache do localStorage
 */
export function setCache<T>(key: string, data: T, isManualRefresh: boolean = false): void {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      lastManualRefresh: isManualRefresh ? Date.now() : undefined,
    };
    localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error(`Erro ao salvar cache para ${key}:`, error);
  }
}

/**
 * Obtém dados do cache do localStorage
 */
export function getCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(`api_cache_${key}`);
    if (!cached) return null;

    const cacheData: CacheData<T> = JSON.parse(cached);
    
    // Verifica se o cache ainda é válido (60 minutos)
    if (isCacheValid(cacheData.timestamp)) {
      return cacheData.data;
    }

    // Cache expirado, remove
    localStorage.removeItem(`api_cache_${key}`);
    return null;
  } catch (error) {
    console.error(`Erro ao ler cache para ${key}:`, error);
    return null;
  }
}

/**
 * Obtém timestamp do último refresh manual
 */
export function getLastManualRefresh(key: string): number | null {
  try {
    const cached = localStorage.getItem(`api_cache_${key}`);
    if (!cached) return null;

    const cacheData: CacheData<any> = JSON.parse(cached);
    return cacheData.lastManualRefresh || null;
  } catch (error) {
    return null;
  }
}

/**
 * Atualiza apenas o timestamp de refresh manual
 */
export function updateManualRefreshTimestamp(key: string): void {
  try {
    const cached = localStorage.getItem(`api_cache_${key}`);
    if (!cached) return;

    const cacheData: CacheData<any> = JSON.parse(cached);
    cacheData.lastManualRefresh = Date.now();
    localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error(`Erro ao atualizar timestamp de refresh para ${key}:`, error);
  }
}

/**
 * Limpa todo o cache de APIs
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('api_cache_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
}

/**
 * Hook para fetch com cache automático
 */

// helper que verifica se um valor é "válido" para ser cacheado.
// para os nossos casos quer dizer: não nulo/undefined/"" e não um objeto/array
// composto apenas por zeros numéricos ou strings vazias.
function hasNonZeroValue(obj: any): boolean {
  if (obj === null || obj === undefined) return false;
  if (typeof obj === 'number') return obj !== 0;
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (trimmed === '') return false;
    const num = parseFloat(trimmed.replace(',', '.'));
    if (!isNaN(num)) {
      return num !== 0;
    }
    return true; // string não numérica é considerada válida
  }
  if (Array.isArray(obj)) {
    return obj.some(hasNonZeroValue);
  }
  if (typeof obj === 'object') {
    return Object.values(obj).some(hasNonZeroValue);
  }
  // outros tipos (boolean, etc) assumimos válidos
  return true;
}

/**
 * Faz fetch de dados com cache e fallback.
 * - não escreve no cache respostas nulas/vazias/"só zeros";
 * - em caso de erro retorna o último valor válido em cache (stale-while-revalidate);
 * - um refresh forçado ignora cache, mas mesmo assim repete a verificação de validade.
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  forceRefresh: boolean = false
): Promise<T> {
  // tentamos cache válido se não for refresh forçado
  if (!forceRefresh) {
    const cached = getCache<T>(key);
    if (cached) {
      console.log(
        `📦 Cache hit para ${key} (válido por mais ${Math.floor(
          (CACHE_DURATION - (Date.now() - JSON.parse(localStorage.getItem(`api_cache_${key}`)!).timestamp)) /
            1000 /
            60
        )} minutos)`
      );
      return cached;
    }
  }

  console.log(`🔄 Buscando dados frescos para ${key}...`);
  try {
    const data = await fetchFn();

    // somente cacheamos se o payload tiver algum valor não-zero/valido
    if (hasNonZeroValue(data)) {
      setCache(key, data, forceRefresh);
    } else {
      console.warn(`Dados inválidos/zerados recebidos para ${key}, não salvo no cache`, data);
    }

    // se o retorno for inválido e já existia cache, devolvemos o cache
    if (!hasNonZeroValue(data)) {
      const previous = getCache<T>(key);
      if (previous) return previous;
    }

    return data;
  } catch (error) {
    console.error(`Erro ao obter dados para ${key}:`, error);
    const previous = getCache<T>(key);
    if (previous) {
      console.log(`Usando cache stale para ${key} após erro`);
      return previous;
    }
    throw error;
  }
}

