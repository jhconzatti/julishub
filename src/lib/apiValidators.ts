const EXCHANGE_PAIRS = [
  "USD_BRL", "EUR_BRL", "EUR_USD", "BTC_USD", "BTC_BRL", "USD_ARS",
  "ARS_BRL", "BRL_ARS", "USD_CLP", "CLP_BRL", "USD_MXN", "MXN_BRL",
] as const;

export interface ExchangeRate {
  valor: string;
  var: string | null;
  label: string;
}

export type ExchangeRatesResponse = Record<string, ExchangeRate>;

export interface MarketIndex {
  name: string;
  label: string;
  valor: string;
  var: string;
  description: string;
}

export type MarketIndexesResponse = Record<string, MarketIndex>;

export interface IndicatorData {
  valor: string;
  data?: string;
  descricao: string;
}

export interface IndicatorsResponse {
  selic: IndicatorData;
  ipca: IndicatorData;
  cdi: IndicatorData;
}

export interface NewsItem {
  titulo: string;
  link: string;
  fonte: string;
  data_publicacao: string;
  imagem: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNumericValue = (value: unknown): value is string => {
  if (typeof value !== "string" || value.trim() === "") return false;
  return Number.isFinite(Number(value));
};

const isExchangeRate = (value: unknown): value is ExchangeRate =>
  isRecord(value)
  && isNumericValue(value.valor)
  && (value.var === null || isNumericValue(value.var))
  && isNonEmptyString(value.label);

export const isExchangeRatesResponse = (value: unknown): value is ExchangeRatesResponse =>
  isRecord(value) && EXCHANGE_PAIRS.every((pair) => isExchangeRate(value[pair]));

const isMarketIndex = (value: unknown): value is MarketIndex =>
  isRecord(value)
  && isNonEmptyString(value.name)
  && isNonEmptyString(value.label)
  && isNumericValue(value.valor)
  && isNumericValue(value.var)
  && isNonEmptyString(value.description);

export const hasMarketIndexes = (
  value: unknown,
  expectedKeys: readonly string[],
): value is MarketIndexesResponse =>
  isRecord(value) && expectedKeys.every((key) => isMarketIndex(value[key]));

const isIndicator = (value: unknown): value is IndicatorData =>
  isRecord(value)
  && isNumericValue(value.valor)
  && isNonEmptyString(value.descricao)
  && (value.data === undefined || isNonEmptyString(value.data));

export const isIndicatorsResponse = (value: unknown): value is IndicatorsResponse =>
  isRecord(value)
  && isIndicator(value.selic)
  && isIndicator(value.ipca)
  && isIndicator(value.cdi);

const isNewsItem = (value: unknown): value is NewsItem =>
  isRecord(value)
  && isNonEmptyString(value.titulo)
  && isNonEmptyString(value.link)
  && isNonEmptyString(value.fonte)
  && isNonEmptyString(value.data_publicacao)
  && isNonEmptyString(value.imagem);

export const isNewsResponse = (value: unknown): value is NewsItem[] =>
  Array.isArray(value) && value.every(isNewsItem);
