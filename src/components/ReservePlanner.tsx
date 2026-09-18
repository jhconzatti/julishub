import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, CircleDollarSign, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { calculateReservePlan, type ReservePlanInput } from "@/lib/reservePlanner";

const STORAGE_KEY = "julishub_reserve_planner_v1";

const DEFAULT_FORM: ReservePlanInput = {
  monthlyExpenses: 3000,
  coverageMonths: 6,
  currentReserve: 0,
  monthlyContribution: 1000,
};

function loadStoredForm(): ReservePlanInput {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_FORM;
    const value = JSON.parse(stored) as Partial<ReservePlanInput>;
    const form = {
      monthlyExpenses: value.monthlyExpenses ?? DEFAULT_FORM.monthlyExpenses,
      coverageMonths: value.coverageMonths ?? DEFAULT_FORM.coverageMonths,
      currentReserve: value.currentReserve ?? DEFAULT_FORM.currentReserve,
      monthlyContribution: value.monthlyContribution ?? DEFAULT_FORM.monthlyContribution,
    };
    return Object.values(form).every(Number.isFinite) ? form : DEFAULT_FORM;
  } catch {
    return DEFAULT_FORM;
  }
}

export default function ReservePlanner() {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<ReservePlanInput>(loadStoredForm);
  const [submitted, setSubmitted] = useState(false);
  const plan = submitted ? calculateReservePlan(form) : null;
  const formatter = new Intl.NumberFormat(i18n.language, { style: "currency", currency: "BRL" });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const updateField = (field: keyof ReservePlanInput, value: string) => {
    setSubmitted(false);
    setForm((previous) => ({ ...previous, [field]: Number(value) }));
  };

  const validationMessage = () => {
    if (!Number.isFinite(form.monthlyExpenses) || form.monthlyExpenses <= 0) return t("reservePlanner.validationExpenses");
    if (!Number.isFinite(form.coverageMonths) || form.coverageMonths <= 0) return t("reservePlanner.validationCoverage");
    if (!Number.isFinite(form.currentReserve) || form.currentReserve < 0) return t("reservePlanner.validationCurrentReserve");
    if (!Number.isFinite(form.monthlyContribution) || form.monthlyContribution < 0) return t("reservePlanner.validationContribution");
    return null;
  };

  const validationError = submitted ? validationMessage() : null;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <Card className="h-fit border-border/70 bg-card lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" />{t("reservePlanner.title")}</CardTitle>
          <CardDescription>{t("reservePlanner.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="reserve-monthly-expenses">{t("reservePlanner.monthlyExpenses")}</Label>
            <Input id="reserve-monthly-expenses" type="number" min="0" step="0.01" value={Number.isFinite(form.monthlyExpenses) ? form.monthlyExpenses : ""} onChange={(event) => updateField("monthlyExpenses", event.target.value)} />
            <p className="text-xs text-muted-foreground">{t("reservePlanner.monthlyExpensesHelp")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reserve-coverage-months">{t("reservePlanner.coverageMonths")}</Label>
            <Input id="reserve-coverage-months" type="number" min="0" step="1" value={Number.isFinite(form.coverageMonths) ? form.coverageMonths : ""} onChange={(event) => updateField("coverageMonths", event.target.value)} />
            <p className="text-xs text-muted-foreground">{t("reservePlanner.coverageMonthsHelp")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reserve-current">{t("reservePlanner.currentReserve")}</Label>
            <Input id="reserve-current" type="number" min="0" step="0.01" value={Number.isFinite(form.currentReserve) ? form.currentReserve : ""} onChange={(event) => updateField("currentReserve", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reserve-contribution">{t("reservePlanner.monthlyContribution")}</Label>
            <Input id="reserve-contribution" type="number" min="0" step="0.01" value={Number.isFinite(form.monthlyContribution) ? form.monthlyContribution : ""} onChange={(event) => updateField("monthlyContribution", event.target.value)} />
          </div>
          {validationError ? <p className="text-sm text-destructive" role="alert">{validationError}</p> : null}
          <Button className="h-10 w-full" onClick={() => setSubmitted(true)}>{t("reservePlanner.calculate")}</Button>
          <p className="text-xs text-muted-foreground">{t("reservePlanner.localOnly")}</p>
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        {plan ? (
          <>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-primary">{t("reservePlanner.targetReserve")}</CardTitle></CardHeader>
              <CardContent><div className="break-words text-3xl font-bold text-primary sm:text-4xl">{formatter.format(plan.target)}</div></CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border/70 bg-card"><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">{t("reservePlanner.currentReserve")}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{formatter.format(form.currentReserve)}</div></CardContent></Card>
              <Card className="border-border/70 bg-card"><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">{t("reservePlanner.remaining")}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{formatter.format(plan.remaining)}</div></CardContent></Card>
            </div>

            <Card className="border-border/70 bg-card">
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CircleDollarSign className="h-5 w-5 text-primary" />{t("reservePlanner.progress")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Progress value={plan.progress} aria-label={t("reservePlanner.progressValue", { value: plan.progress.toFixed(2) })} />
                <p className="text-sm font-medium">{t("reservePlanner.progressValue", { value: plan.progress.toFixed(2) })}</p>
                {plan.reached ? <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400"><CheckCircle2 className="h-4 w-4" />{t("reservePlanner.goalReached")}</p> : plan.estimatedMonths === null ? <p className="text-sm text-muted-foreground">{t("reservePlanner.noCompletionEstimate")}</p> : <p className="text-sm text-muted-foreground">{t("reservePlanner.estimatedTime", { months: plan.estimatedMonths })}</p>}
                <p className="text-xs text-muted-foreground">{t("reservePlanner.estimateNote")}</p>
              </CardContent>
            </Card>

            {plan.projection.length > 0 ? <Card className="border-border/70 bg-card">
              <CardHeader className="pb-3"><CardTitle className="text-base">{t("reservePlanner.chartTitle")}</CardTitle><CardDescription>{t("reservePlanner.chartDescription")}</CardDescription></CardHeader>
              <CardContent className="h-[240px] pt-2 sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={plan.projection} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={(value) => t("reservePlanner.monthShort", { count: value })} />
                    <YAxis width={70} tickFormatter={(value) => formatter.format(value)} />
                    <Tooltip formatter={(value: number) => formatter.format(value)} labelFormatter={(value) => t("reservePlanner.monthLabel", { count: value })} />
                    <Legend />
                    <Area type="monotone" dataKey="reserve" name={t("reservePlanner.projectedReserve")} stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.16)" strokeWidth={2} />
                    <Area type="monotone" dataKey="target" name={t("reservePlanner.targetReserve")} stroke="hsl(var(--muted-foreground))" fill="transparent" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card> : null}
          </>
        ) : <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center text-muted-foreground sm:min-h-[300px] sm:p-10"><Target className="mb-4 h-16 w-16 opacity-20" /><p>{t("reservePlanner.emptyResult")}</p></div>}
      </div>
    </div>
  );
}
