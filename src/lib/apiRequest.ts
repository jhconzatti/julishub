export const API_REQUEST_TIMEOUT_MS = 20_000;
const API_RETRY_DELAY_MS = 1_000;
const TRANSIENT_STATUSES = new Set([502, 503, 504]);

export interface ApiResponse<T> {
  data: T;
  isStale: boolean;
  timestamp: number | null;
}

class ApiRequestError extends Error {
  readonly status?: number;
  readonly transient: boolean;

  constructor(message: string, transient: boolean, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.transient = transient;
  }
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const parseTimestamp = (value: string | null): number | null => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

async function requestOnce<T>(
  url: string,
  validate: (value: unknown) => value is T,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });

    if (!response.ok) {
      throw new ApiRequestError(
        `HTTP ${response.status}`,
        TRANSIENT_STATUSES.has(response.status),
        response.status,
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ApiRequestError("Resposta da API não contém JSON válido", false);
    }
    if (!validate(data)) {
      throw new ApiRequestError("Resposta da API inválida", false);
    }

    return {
      data,
      isStale: response.headers.get("X-Data-Stale") === "true",
      timestamp: parseTimestamp(response.headers.get("X-Data-Timestamp")),
    };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    throw new ApiRequestError("Falha de rede ou timeout", true);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Executa uma tentativa e, apenas para falhas transitórias, uma segunda após 1 s.
 */
export async function fetchJsonWithRetry<T>(
  url: string,
  validate: (value: unknown) => value is T,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    return await requestOnce(url, validate, init);
  } catch (error) {
    if (!(error instanceof ApiRequestError) || !error.transient) {
      throw error;
    }
    await wait(API_RETRY_DELAY_MS);
    return requestOnce(url, validate, init);
  }
}
