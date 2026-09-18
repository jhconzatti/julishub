const EXCHANGE_PAIRS = [
  "USD_BRL", "EUR_BRL", "EUR_USD", "BTC_USD", "BTC_BRL", "USD_ARS",
  "ARS_BRL", "BRL_ARS", "USD_CLP", "CLP_BRL", "USD_MXN", "MXN_BRL",
] as const;

const HISTORICAL_INSTRUMENTS = ["USD_BRL", "EUR_BRL", "BTC_USD"] as const;
const HISTORICAL_SOURCES = ["awesomeapi", "yahoo"] as const;
const HISTORICAL_PRICE_TYPES = ["bid", "close"] as const;

export interface ExchangeRate {
  valor: string;
  var: string | null;
  label: string;
}

export type ExchangePair = typeof EXCHANGE_PAIRS[number];
export type ExchangeRatesResponse = Partial<Record<ExchangePair, ExchangeRate>>;

export type HistoricalExchangeInstrument = typeof HISTORICAL_INSTRUMENTS[number];
export type HistoricalExchangeSource = typeof HISTORICAL_SOURCES[number];
export type HistoricalExchangePriceType = typeof HISTORICAL_PRICE_TYPES[number];

export interface HistoricalExchangePoint {
  date: string;
  value: number;
}

export interface HistoricalExchangeResponse {
  instrument: HistoricalExchangeInstrument;
  pair: string;
  source: HistoricalExchangeSource;
  price_type: HistoricalExchangePriceType;
  points: HistoricalExchangePoint[];
}

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

const isHistoricalPoint = (value: unknown): value is HistoricalExchangePoint =>
  isRecord(value)
  && typeof value.date === "string"
  && /^\d{4}-\d{2}-\d{2}$/.test(value.date)
  && typeof value.value === "number"
  && Number.isFinite(value.value)
  && value.value > 0;

export const isHistoricalExchangeResponse = (value: unknown): value is HistoricalExchangeResponse => {
  if (!isRecord(value)
    || !HISTORICAL_INSTRUMENTS.includes(value.instrument as HistoricalExchangeInstrument)
    || !isNonEmptyString(value.pair)
    || !HISTORICAL_SOURCES.includes(value.source as HistoricalExchangeSource)
    || !HISTORICAL_PRICE_TYPES.includes(value.price_type as HistoricalExchangePriceType)
    || !Array.isArray(value.points)
    || value.points.length < 2
    || !value.points.every(isHistoricalPoint)) {
    return false;
  }

  return value.points.every((point, index) => index === 0 || point.date > value.points[index - 1].date);
};

const isExchangeRate = (value: unknown): value is ExchangeRate =>
  isRecord(value)
  && isNumericValue(value.valor)
  && (value.var === null || isNumericValue(value.var))
  && isNonEmptyString(value.label);

export const isExchangeRatesResponse = (value: unknown): value is ExchangeRatesResponse =>
  isRecord(value)
  && Object.keys(value).length > 0
  && Object.keys(value).every(
    (pair) => EXCHANGE_PAIRS.includes(pair as ExchangePair) && isExchangeRate(value[pair]),
  );

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
