import type { ApiResponse } from "@/lib/apiRequest";

interface CacheData<T> {
  version: 2;
  data: T;
  timestamp: number;
}

export interface CachedFetchResult<T> {
  data: T;
  isStale: boolean;
  timestamp: number | null;
  refreshFailed: boolean;
}

const CACHE_VERSION = "v2";
const CACHE_DURATION = 60 * 60 * 1000;
const MANUAL_REFRESH_COOLDOWN = 5 * 60 * 1000;

const cacheKey = (key: string) => `api_cache_${CACHE_VERSION}_${key}`;
const manualRefreshKey = (key: string) => `api_manual_refresh_${CACHE_VERSION}_${key}`;

export function isCacheValid(timestamp: number | null): boolean {
  return timestamp !== null && Date.now() - timestamp < CACHE_DURATION;
}

export function canManualRefresh(lastRefreshTimestamp: number | null): boolean {
  return lastRefreshTimestamp === null
    || Date.now() - lastRefreshTimestamp >= MANUAL_REFRESH_COOLDOWN;
}

export function getRemainingCooldown(lastRefreshTimestamp: number | null): number {
  if (lastRefreshTimestamp === null) return 0;
  const remaining = MANUAL_REFRESH_COOLDOWN - (Date.now() - lastRefreshTimestamp);
  return Math.max(0, Math.ceil(remaining / 1000));
}

function readCache<T>(key: string, validate: (value: unknown) => value is T): CacheData<T> | null {
  try {
    const stored = localStorage.getItem(cacheKey(key));
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed !== "object"
      || parsed === null
      || !("version" in parsed)
      || parsed.version !== 2
      || !("timestamp" in parsed)
      || typeof parsed.timestamp !== "number"
      || !Number.isFinite(parsed.timestamp)
      || !("data" in parsed)
      || !validate(parsed.data)
    ) {
      localStorage.removeItem(cacheKey(key));
      return null;
    }

    return parsed as CacheData<T>;
  } catch (error) {
    console.error(`Erro ao ler cache para ${key}:`, error);
    return null;
  }
}

function setCache<T>(key: string, data: T, timestamp: number): void {
  try {
    const cacheData: CacheData<T> = { version: 2, data, timestamp };
    localStorage.setItem(cacheKey(key), JSON.stringify(cacheData));
  } catch (error) {
    console.error(`Erro ao salvar cache para ${key}:`, error);
  }
}

export function getLastManualRefresh(key: string): number | null {
  try {
    const value = localStorage.getItem(manualRefreshKey(key));
    if (!value) return null;
    const timestamp = Number(value);
    return Number.isFinite(timestamp) ? timestamp : null;
  } catch {
    return null;
  }
}

export function updateManualRefreshTimestamp(key: string): void {
  try {
    localStorage.setItem(manualRefreshKey(key), String(Date.now()));
  } catch (error) {
    console.error(`Erro ao atualizar timestamp de refresh para ${key}:`, error);
  }
}

export function clearAllCache(): void {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("api_cache_") || key.startsWith("api_manual_refresh_")) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Erro ao limpar cache:", error);
  }
}

/**
 * Usa apenas payload validado como last-known-good. Se a atualização falhar,
 * mantém inclusive cache expirado como stale; sem cache, propaga a falha.
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<ApiResponse<T>>,
  validate: (value: unknown) => value is T,
  forceRefresh = false,
): Promise<CachedFetchResult<T>> {
  const cached = readCache(key, validate);

  if (!forceRefresh && cached && isCacheValid(cached.timestamp)) {
    return {
      data: cached.data,
      isStale: false,
      timestamp: cached.timestamp,
      refreshFailed: false,
    };
  }

  try {
    const response = await fetchFn();
    if (!validate(response.data)) {
      throw new Error(`Payload inválido para ${key}`);
    }

    if (response.isStale) {
      if (cached) {
        return {
          data: cached.data,
          isStale: true,
          timestamp: cached.timestamp,
          refreshFailed: true,
        };
      }

      const staleTimestamp = response.timestamp ?? Date.now();
      setCache(key, response.data, staleTimestamp);
      return {
        data: response.data,
        isStale: true,
        timestamp: response.timestamp,
        refreshFailed: true,
      };
    }

    const timestamp = response.timestamp ?? Date.now();
    setCache(key, response.data, timestamp);
    return {
      data: response.data,
      isStale: false,
      timestamp,
      refreshFailed: false,
    };
  } catch (error) {
    if (cached) {
      return {
        data: cached.data,
        isStale: true,
        timestamp: cached.timestamp,
        refreshFailed: true,
      };
    }
    throw error;
  }
}
