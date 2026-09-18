import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GitCompare, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FinancingForm {
  valor_financiamento: number;
  taxa_mensal: number;
  meses: number;
}

interface PrepaymentResponse {
  original: { prestacao: number; prazo: number; total_pago: number; total_juros: number };
  antecipacao: { mes: number; valor_solicitado: number; valor_aplicado: number };
  reduzir_prazo: { prestacao_regular: number; prestacao_final: number; prazo: number; meses_economizados: number; total_pago: number; total_juros: number; juros_economizados: number; quitado: boolean };
  reduzir_parcela: { prestacao_original: number; prestacao_recalculada: number | null; reducao_prestacao: number | null; prazo: number; parcelas_restantes: number; total_pago: number; total_juros: number; juros_economizados: number; quitado: boolean };
  evolucao: Array<{ mes: number; original: number; reduzir_prazo: number; reduzir_parcela: number }>;
}

const getApiBaseUrl = () => {
  const url = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
  return url.endsWith("/api") ? url : `${url}/api`;
};

const API_BASE_URL = getApiBaseUrl();

export default function FinancingPrepaymentComparison({ financing }: { financing: FinancingForm }) {
  const { t, i18n } = useTranslation();
  const [month, setMonth] = useState(12);
  const [amount, setAmount] = useState(20000);
  const [result, setResult] = useState<PrepaymentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = new Intl.NumberFormat(i18n.language, { style: "currency", currency: "BRL" });

  const compare = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/financiamento-antecipacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...financing, mes_antecipacao: month, valor_antecipacao: amount }),
      });
      if (!response.ok) throw new Error("prepayment comparison failed");
      setResult((await response.json()) as PrepaymentResponse);
    } catch {
      setError(t("financingPrepayment.validationError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/70 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2"><GitCompare className="h-5 w-5 text-primary" />{t("financingPrepayment.title")}</CardTitle>
        <CardDescription>{t("financingPrepayment.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prepayment-month">{t("financingPrepayment.month")}</Label>
            <Input id="prepayment-month" type="number" min="1" max={Math.max(financing.meses - 1, 1)} step="1" value={month} onChange={(event) => setMonth(Number(event.target.value))} />
            <p className="text-xs text-muted-foreground">{t("financingPrepayment.monthHelp")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prepayment-amount">{t("financingPrepayment.amount")}</Label>
            <Input id="prepayment-amount" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
            <p className="text-xs text-muted-foreground">{t("financingPrepayment.amountHelp")}</p>
          </div>
        </div>
        <Button className="w-full sm:w-auto" onClick={compare} disabled={loading}>{loading ? t("financingPrepayment.calculating") : t("financingPrepayment.compare")}</Button>
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        <p className="text-xs text-muted-foreground">{t("financingPrepayment.disclaimer")}</p>

        {result ? <div className="space-y-6">
          <Card className="border-border/70 bg-muted/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t("financingPrepayment.original")}</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
              <p><span className="text-muted-foreground">{t("financingPrepayment.installment")}: </span><strong>{currency.format(result.original.prestacao)}</strong></p>
              <p><span className="text-muted-foreground">{t("financingPrepayment.term")}: </span><strong>{t("financingPrepayment.monthCount", { count: result.original.prazo })}</strong></p>
              <p><span className="text-muted-foreground">{t("financingPrepayment.totalInterest")}: </span><strong>{currency.format(result.original.total_juros)}</strong></p>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">{t("financingPrepayment.applied", { month: result.antecipacao.mes, value: currency.format(result.antecipacao.valor_aplicado) })}</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70 bg-card">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("financingPrepayment.reduceTerm")}</CardTitle><CardDescription>{t("financingPrepayment.reduceTermTradeoff")}</CardDescription></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">{t("financingPrepayment.monthsSaved")}: </span><strong>{t("financingPrepayment.monthCount", { count: result.reduzir_prazo.meses_economizados })}</strong></p>
                <p><span className="text-muted-foreground">{t("financingPrepayment.interestSaved")}: </span><strong>{currency.format(result.reduzir_prazo.juros_economizados)}</strong></p>
                <p><span className="text-muted-foreground">{t("financingPrepayment.term")}: </span>{t("financingPrepayment.monthCount", { count: result.reduzir_prazo.prazo })}</p>
                <p><span className="text-muted-foreground">{t("financingPrepayment.totalInterest")}: </span>{currency.format(result.reduzir_prazo.total_juros)}</p>
                {result.reduzir_prazo.quitado ? <p className="font-medium text-green-700 dark:text-green-400">{t("financingPrepayment.fullyPaid")}</p> : null}
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("financingPrepayment.reduceInstallment")}</CardTitle><CardDescription>{t("financingPrepayment.reduceInstallmentTradeoff")}</CardDescription></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {result.reduzir_parcela.quitado ? <p className="font-medium text-green-700 dark:text-green-400">{t("financingPrepayment.fullyPaid")}</p> : <><p><span className="text-muted-foreground">{t("financingPrepayment.newInstallment")}: </span><strong>{currency.format(result.reduzir_parcela.prestacao_recalculada ?? 0)}</strong></p><p><span className="text-muted-foreground">{t("financingPrepayment.installmentReduction")}: </span><strong>{currency.format(result.reduzir_parcela.reducao_prestacao ?? 0)}</strong></p></>}
                <p><span className="text-muted-foreground">{t("financingPrepayment.interestSaved")}: </span><strong>{currency.format(result.reduzir_parcela.juros_economizados)}</strong></p>
                <p><span className="text-muted-foreground">{t("financingPrepayment.totalInterest")}: </span>{currency.format(result.reduzir_parcela.total_juros)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70 bg-card">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><TrendingDown className="h-5 w-5 text-primary" />{t("financingPrepayment.chartTitle")}</CardTitle><CardDescription>{t("financingPrepayment.chartDescription")}</CardDescription></CardHeader>
            <CardContent className="h-[240px] pt-2 sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.evolucao} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tickFormatter={(value) => t("financingPrepayment.monthShort", { count: value })} />
                  <YAxis width={70} tickFormatter={(value) => currency.format(value)} />
                  <Tooltip formatter={(value: number) => currency.format(value)} labelFormatter={(value) => t("financingPrepayment.monthLabel", { count: value })} />
                  <Legend />
                  <Line type="monotone" dataKey="original" name={t("financingPrepayment.original")} stroke="#64748b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="reduzir_prazo" name={t("financingPrepayment.reduceTerm")} stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="reduzir_parcela" name={t("financingPrepayment.reduceInstallment")} stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div> : null}
      </CardContent>
    </Card>
  );
}
