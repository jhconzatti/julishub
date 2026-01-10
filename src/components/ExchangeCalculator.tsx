import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  return url.replace(/\/$/, "");
};
const API_BASE_URL = getApiUrl();

interface ExchangeRate {
  valor: string;
  label: string;
}

const CURRENCIES = [
  // Principais - Moedas disponíveis na AwesomeAPI
  { code: "BRL", symbol: "R$", name: "Real Brasileiro", flag: "🇧🇷" },
  { code: "USD", symbol: "US$", name: "Dólar Americano", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "BTC", symbol: "₿", name: "Bitcoin", flag: "₿" },
  
  // América do Sul
  { code: "ARS", symbol: "ARS$", name: "Peso Argentino", flag: "🇦🇷" },
  { code: "CLP", symbol: "CLP$", name: "Peso Chileno", flag: "🇨🇱" },
  
  // América Central
  { code: "MXN", symbol: "MXN$", name: "Peso Mexicano", flag: "🇲🇽" },
];

export default function ExchangeCalculator() {
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("BRL");
  const [result, setResult] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, ExchangeRate>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/exchange-rates`);
      const data = await response.json();
      setExchangeRates(data);
    } catch (error) {
      console.error("Erro ao buscar taxas de câmbio:", error);
    }
  };

  const getRate = (from: string, to: string): number => {
    if (from === to) return 1;

    const pair = `${from}_${to}`;
    const reversePair = `${to}_${from}`;

    if (exchangeRates[pair]) {
      return parseFloat(exchangeRates[pair].valor);
    }

    if (exchangeRates[reversePair]) {
      return 1 / parseFloat(exchangeRates[reversePair].valor);
    }

    // Conversão via USD como moeda intermediária
    if (from !== "USD" && to !== "USD") {
      const fromToUsd = getRate(from, "USD");
      const usdToTo = getRate("USD", to);
      return fromToUsd * usdToTo;
    }

    // Conversão via BRL como moeda intermediária
    if (from !== "BRL" && to !== "BRL") {
      const fromToBrl = getRate(from, "BRL");
      const brlToTo = getRate("BRL", to);
      return fromToBrl * brlToTo;
    }

    return 0;
  };

  const handleConvert = () => {
    setLoading(true);
    setTimeout(() => {
      const rate = getRate(fromCurrency, toCurrency);
      const convertedAmount = amount * rate;
      setResult(convertedAmount);
      setLoading(false);
    }, 300);
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  const fromCurrencyData = CURRENCIES.find(c => c.code === fromCurrency);
  const toCurrencyData = CURRENCIES.find(c => c.code === toCurrency);

  return (
    <div className="space-y-6">
      <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <strong>Aviso:</strong> Esta simulação é baseada em câmbio comercial. Não considera:
          <ul className="list-disc ml-5 mt-2 text-sm">
            <li>Taxas de câmbio turismo (geralmente 3-8% mais altas)</li>
            <li>Spread financeiro de operações bancárias</li>
            <li>IOF (Imposto sobre Operações Financeiras)</li>
            <li>Taxas de corretagem ou transferência</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownUp className="w-5 h-5 text-blue-600" />
              Conversor de Moedas
            </CardTitle>
            <CardDescription>
              Simule a conversão entre diferentes moedas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(parseFloat(e.target.value) || 0);
                  setResult(null);
                }}
                placeholder="100.00"
              />
            </div>

            <div className="space-y-2">
              <Label>De</Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <span className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span>{currency.symbol} {currency.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwapCurrencies}
                className="rounded-full"
              >
                <ArrowDownUp className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Para</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <span className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span>{currency.symbol} {currency.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleConvert}
              disabled={loading || !amount}
            >
              {loading ? "Convertendo..." : "Converter"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>Valor convertido na moeda de destino</CardDescription>
          </CardHeader>
          <CardContent>
            {result !== null ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-muted-foreground mb-2">
                    {fromCurrencyData?.symbol} {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fromCurrency}
                  </div>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {toCurrencyData?.symbol} {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: toCurrency === "BTC" ? 8 : 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">{toCurrency}</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border">
                  <div className="text-sm text-muted-foreground mb-1">Taxa de Câmbio</div>
                  <div className="text-lg font-semibold">
                    1 {fromCurrency} = {getRate(fromCurrency, toCurrency).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {toCurrency}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <p>💡 Valores baseados em cotação comercial (interbancária)</p>
                  <p className="mt-1">⏱️ Atualização automática a cada hora</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-10 min-h-[300px]">
                <ArrowDownUp className="w-16 h-16 mb-4 opacity-20" />
                <p>Preencha os campos e clique em "Converter"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabela de Referência</CardTitle>
          <CardDescription>Principais taxas de câmbio em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(exchangeRates).slice(0, 6).map(([pair, data]) => (
              <div key={pair} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                <div className="text-xs text-muted-foreground">{data.label}</div>
                <div className="text-lg font-bold mt-1">
                  {parseFloat(data.valor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
