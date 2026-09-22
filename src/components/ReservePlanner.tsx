import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, CircleDollarSign, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CopySummaryButton from "@/components/CopySummaryButton";
import { buildReserveDecisionSummary } from "@/lib/decisionSummaries";
import { calculateReservePlan, type ReservePlan, type ReservePlanInput } from "@/lib/reservePlanner";
import { hasReserveScenarioName, isValidReserveScenarioName, loadReserveScenarios, MAX_RESERVE_SCENARIOS, normalizeReserveScenarioName, saveReserveScenarios, type SavedReserveScenario } from "@/lib/reserveScenarios";

const STORAGE_KEY = "julishub_reserve_planner_v1";
const DEFAULT_FORM: ReservePlanInput = { monthlyExpenses: 3000, coverageMonths: 6, currentReserve: 0, monthlyContribution: 1000 };

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
  } catch { return DEFAULT_FORM; }
}

function createScenarioId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function scenarioInput({ monthlyExpenses, coverageMonths, currentReserve, monthlyContribution }: SavedReserveScenario): ReservePlanInput {
  return { monthlyExpenses, coverageMonths, currentReserve, monthlyContribution };
}

export default function ReservePlanner() {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<ReservePlanInput>(loadStoredForm);
  const [submitted, setSubmitted] = useState(false);
  const [scenarios, setScenarios] = useState<SavedReserveScenario[]>(loadReserveScenarios);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioFeedback, setScenarioFeedback] = useState<string | null>(null);
  const [scenarioAId, setScenarioAId] = useState<string | null>(null);
  const [scenarioBId, setScenarioBId] = useState<string | null>(null);
  const plan = submitted ? calculateReservePlan(form) : null;
  const formatter = useMemo(() => new Intl.NumberFormat(i18n.language, { style: "currency", currency: "BRL" }), [i18n.language]);
  const summary = useMemo(() => plan ? buildReserveDecisionSummary(form, plan, { t, currency: (value) => formatter.format(value), percent: (value) => new Intl.NumberFormat(i18n.language, { style: "percent", maximumFractionDigits: 2 }).format(value / 100) }) : null, [form, formatter, i18n.language, plan, t]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); }, [form]);
  useEffect(() => {
    if (scenarios.length < 2) { setScenarioAId(null); setScenarioBId(null); return; }
    setScenarioAId((current) => scenarios.some((scenario) => scenario.id === current) ? current : scenarios[0].id);
    setScenarioBId((current) => scenarios.some((scenario) => scenario.id === current && scenario.id !== scenarios[0].id) ? current : scenarios[1].id);
  }, [scenarios]);

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
  const saveScenario = () => {
    if (!plan) return;
    const name = normalizeReserveScenarioName(scenarioName);
    if (!isValidReserveScenarioName(name)) { setScenarioFeedback(t("reservePlanner.scenarioNameInvalid")); return; }
    if (hasReserveScenarioName(scenarios, name)) { setScenarioFeedback(t("reservePlanner.scenarioNameDuplicate")); return; }
    if (scenarios.length >= MAX_RESERVE_SCENARIOS) { setScenarioFeedback(t("reservePlanner.scenarioLimit")); return; }
    const updatedScenarios = [...scenarios, { id: createScenarioId(), name, ...form }];
    if (!saveReserveScenarios(updatedScenarios)) { setScenarioFeedback(t("reservePlanner.scenarioStorageError")); return; }
    setScenarios(updatedScenarios); setScenarioName(""); setScenarioFeedback(t("reservePlanner.scenarioSaved"));
  };
  const loadScenario = (scenario: SavedReserveScenario) => {
    setForm(scenarioInput(scenario)); setSubmitted(true); setScenarioFeedback(t("reservePlanner.scenarioLoaded", { name: scenario.name }));
  };
  const deleteScenario = (id: string) => {
    const updatedScenarios = scenarios.filter((scenario) => scenario.id !== id);
    if (!saveReserveScenarios(updatedScenarios)) { setScenarioFeedback(t("reservePlanner.scenarioStorageError")); return; }
    setScenarios(updatedScenarios); setScenarioFeedback(t("reservePlanner.scenarioDeleted"));
  };
  const selectScenarioA = (id: string) => { setScenarioAId(id); if (id === scenarioBId) setScenarioBId(scenarios.find((scenario) => scenario.id !== id)?.id ?? null); };
  const selectScenarioB = (id: string) => { setScenarioBId(id); if (id === scenarioAId) setScenarioAId(scenarios.find((scenario) => scenario.id !== id)?.id ?? null); };

  const scenarioA = scenarios.find((scenario) => scenario.id === scenarioAId) ?? null;
  const scenarioB = scenarios.find((scenario) => scenario.id === scenarioBId) ?? null;
  const scenarioAPlan = scenarioA ? calculateReservePlan(scenarioInput(scenarioA)) : null;
  const scenarioBPlan = scenarioB ? calculateReservePlan(scenarioInput(scenarioB)) : null;
  const validationError = submitted ? validationMessage() : null;
  const formatCompletion = (scenarioPlan: ReservePlan) => scenarioPlan.reached ? t("reservePlanner.goalReached") : scenarioPlan.estimatedMonths === null ? t("reservePlanner.noCompletionEstimate") : t("reservePlanner.estimatedMonthsValue", { months: scenarioPlan.estimatedMonths });
  const comparisonMetric = (label: string, valueA: string, valueB: string) => <div className="grid gap-2 rounded-lg border border-border/70 bg-muted/30 p-3 sm:grid-cols-3 sm:items-center"><p className="text-sm font-medium">{label}</p><p className="break-words text-sm"><span className="sr-only">{t("reservePlanner.scenarioA")}: </span>{valueA}</p><p className="break-words text-sm"><span className="sr-only">{t("reservePlanner.scenarioB")}: </span>{valueB}</p></div>;

  return <div className="mt-6 space-y-6">
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="h-fit border-border/70 bg-card lg:col-span-1"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" />{t("reservePlanner.title")}</CardTitle><CardDescription>{t("reservePlanner.description")}</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="space-y-2"><Label htmlFor="reserve-monthly-expenses">{t("reservePlanner.monthlyExpenses")}</Label><Input id="reserve-monthly-expenses" type="number" min="0" step="0.01" value={Number.isFinite(form.monthlyExpenses) ? form.monthlyExpenses : ""} onChange={(event) => updateField("monthlyExpenses", event.target.value)} /><p className="text-xs text-muted-foreground">{t("reservePlanner.monthlyExpensesHelp")}</p></div>
        <div className="space-y-2"><Label htmlFor="reserve-coverage-months">{t("reservePlanner.coverageMonths")}</Label><Input id="reserve-coverage-months" type="number" min="0" step="1" value={Number.isFinite(form.coverageMonths) ? form.coverageMonths : ""} onChange={(event) => updateField("coverageMonths", event.target.value)} /><p className="text-xs text-muted-foreground">{t("reservePlanner.coverageMonthsHelp")}</p></div>
        <div className="space-y-2"><Label htmlFor="reserve-current">{t("reservePlanner.currentReserve")}</Label><Input id="reserve-current" type="number" min="0" step="0.01" value={Number.isFinite(form.currentReserve) ? form.currentReserve : ""} onChange={(event) => updateField("currentReserve", event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="reserve-contribution">{t("reservePlanner.monthlyContribution")}</Label><Input id="reserve-contribution" type="number" min="0" step="0.01" value={Number.isFinite(form.monthlyContribution) ? form.monthlyContribution : ""} onChange={(event) => updateField("monthlyContribution", event.target.value)} /></div>
        {validationError ? <p className="text-sm text-destructive" role="alert">{validationError}</p> : null}<Button className="h-10 w-full" onClick={() => setSubmitted(true)}>{t("reservePlanner.calculate")}</Button><p className="text-xs text-muted-foreground">{t("reservePlanner.localOnly")}</p>
      </CardContent></Card>
      <div className="space-y-6 lg:col-span-2">{plan ? <>
        <Card className="border-primary/20 bg-primary/5"><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-primary">{t("reservePlanner.targetReserve")}</CardTitle></CardHeader><CardContent><div className="break-words text-3xl font-bold text-primary sm:text-4xl">{formatter.format(plan.target)}</div></CardContent></Card>
        <div className="grid gap-4 sm:grid-cols-2"><Card className="border-border/70 bg-card"><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">{t("reservePlanner.currentReserve")}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{formatter.format(form.currentReserve)}</div></CardContent></Card><Card className="border-border/70 bg-card"><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">{t("reservePlanner.remaining")}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{formatter.format(plan.remaining)}</div></CardContent></Card></div>
        <Card className="border-border/70 bg-card"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CircleDollarSign className="h-5 w-5 text-primary" />{t("reservePlanner.progress")}</CardTitle></CardHeader><CardContent className="space-y-3"><Progress value={plan.progress} aria-label={t("reservePlanner.progressValue", { value: plan.progress.toFixed(2) })} /><p className="text-sm font-medium">{t("reservePlanner.progressValue", { value: plan.progress.toFixed(2) })}</p>{plan.reached ? <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400"><CheckCircle2 className="h-4 w-4" />{t("reservePlanner.goalReached")}</p> : plan.estimatedMonths === null ? <p className="text-sm text-muted-foreground">{t("reservePlanner.noCompletionEstimate")}</p> : <p className="text-sm text-muted-foreground">{t("reservePlanner.estimatedTime", { months: plan.estimatedMonths })}</p>}<p className="text-xs text-muted-foreground">{t("reservePlanner.estimateNote")}</p>{summary ? <CopySummaryButton text={summary} label={t("copySummary.copy")} copiedLabel={t("copySummary.copied")} failedLabel={t("copySummary.failed")} /> : null}</CardContent></Card>
        <Card className="border-border/70 bg-card"><CardHeader className="pb-3"><CardTitle className="text-base">{t("reservePlanner.saveScenario")}</CardTitle><CardDescription>{t("reservePlanner.saveScenarioDescription")}</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex flex-col gap-3 sm:flex-row"><div className="flex-1 space-y-2"><Label htmlFor="reserve-scenario-name">{t("reservePlanner.scenarioName")}</Label><Input id="reserve-scenario-name" maxLength={40} value={scenarioName} onChange={(event) => { setScenarioName(event.target.value); setScenarioFeedback(null); }} /></div><Button className="mt-auto sm:shrink-0" onClick={saveScenario}>{t("reservePlanner.saveScenario")}</Button></div><p className="text-xs text-muted-foreground">{t("reservePlanner.scenarioLocalOnly")}</p>{scenarioFeedback ? <p className="text-sm" role="status">{scenarioFeedback}</p> : null}</CardContent></Card>
        {plan.projection.length > 0 ? <Card className="border-border/70 bg-card"><CardHeader className="pb-3"><CardTitle className="text-base">{t("reservePlanner.chartTitle")}</CardTitle><CardDescription>{t("reservePlanner.chartDescription")}</CardDescription></CardHeader><CardContent className="h-[240px] pt-2 sm:h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={plan.projection} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tickFormatter={(value) => t("reservePlanner.monthShort", { count: value })} /><YAxis width={70} tickFormatter={(value) => formatter.format(value)} /><Tooltip formatter={(value: number) => formatter.format(value)} labelFormatter={(value) => t("reservePlanner.monthLabel", { count: value })} /><Legend /><Area type="monotone" dataKey="reserve" name={t("reservePlanner.projectedReserve")} stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.16)" strokeWidth={2} /><Area type="monotone" dataKey="target" name={t("reservePlanner.targetReserve")} stroke="hsl(var(--muted-foreground))" fill="transparent" strokeDasharray="4 4" /></AreaChart></ResponsiveContainer></CardContent></Card> : null}
      </> : <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center text-muted-foreground sm:min-h-[300px] sm:p-10"><Target className="mb-4 h-16 w-16 opacity-20" /><p>{t("reservePlanner.emptyResult")}</p></div>}</div>
    </div>
    <Card className="border-border/70 bg-card"><CardHeader className="pb-3"><CardTitle className="text-base">{t("reservePlanner.savedScenarios")}</CardTitle><CardDescription>{t("reservePlanner.savedScenariosDescription", { count: scenarios.length, max: MAX_RESERVE_SCENARIOS })}</CardDescription></CardHeader><CardContent className="space-y-4">
      {scenarios.length === 0 ? <p className="text-sm text-muted-foreground">{t("reservePlanner.savedScenariosEmpty")}</p> : <div className="grid gap-4 lg:grid-cols-2">{scenarios.map((scenario) => { const scenarioPlan = calculateReservePlan(scenarioInput(scenario)); if (!scenarioPlan) return null; return <Card key={scenario.id} className="border-border/70 bg-muted/30"><CardHeader className="pb-2"><CardTitle className="break-words text-base">{scenario.name}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="grid gap-2 sm:grid-cols-2"><p><span className="text-muted-foreground">{t("reservePlanner.monthlyExpenses")}: </span>{formatter.format(scenario.monthlyExpenses)}</p><p><span className="text-muted-foreground">{t("reservePlanner.coverageMonths")}: </span>{t("reservePlanner.monthsValue", { months: scenario.coverageMonths })}</p><p><span className="text-muted-foreground">{t("reservePlanner.currentReserve")}: </span>{formatter.format(scenario.currentReserve)}</p><p><span className="text-muted-foreground">{t("reservePlanner.monthlyContribution")}: </span>{formatter.format(scenario.monthlyContribution)}</p><p><span className="text-muted-foreground">{t("reservePlanner.targetReserve")}: </span>{formatter.format(scenarioPlan.target)}</p><p><span className="text-muted-foreground">{t("reservePlanner.estimatedCompletion")}: </span>{formatCompletion(scenarioPlan)}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => loadScenario(scenario)}>{t("reservePlanner.loadScenario")}</Button><Button size="sm" variant="ghost" onClick={() => deleteScenario(scenario.id)}>{t("reservePlanner.deleteScenario")}</Button></div></CardContent></Card>; })}</div>}
      {scenarioA && scenarioB && scenarioAPlan && scenarioBPlan ? <div className="space-y-4 border-t border-border/70 pt-5"><div><h3 className="font-semibold">{t("reservePlanner.compareScenarios")}</h3><p className="text-sm text-muted-foreground">{t("reservePlanner.compareScenariosHelp")}</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="reserve-scenario-a">{t("reservePlanner.scenarioA")}</Label><Select value={scenarioA.id} onValueChange={selectScenarioA}><SelectTrigger id="reserve-scenario-a"><SelectValue /></SelectTrigger><SelectContent>{scenarios.filter((scenario) => scenario.id !== scenarioB.id).map((scenario) => <SelectItem key={scenario.id} value={scenario.id}>{scenario.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="reserve-scenario-b">{t("reservePlanner.scenarioB")}</Label><Select value={scenarioB.id} onValueChange={selectScenarioB}><SelectTrigger id="reserve-scenario-b"><SelectValue /></SelectTrigger><SelectContent>{scenarios.filter((scenario) => scenario.id !== scenarioA.id).map((scenario) => <SelectItem key={scenario.id} value={scenario.id}>{scenario.name}</SelectItem>)}</SelectContent></Select></div></div><div className="grid gap-2 text-xs font-medium text-muted-foreground sm:grid-cols-3"><span>{t("reservePlanner.comparisonMetric")}</span><span>{scenarioA.name}</span><span>{scenarioB.name}</span></div><div className="space-y-2"><p className="pt-2 text-sm font-semibold">{t("reservePlanner.assumptions")}</p>{comparisonMetric(t("reservePlanner.monthlyExpenses"), formatter.format(scenarioA.monthlyExpenses), formatter.format(scenarioB.monthlyExpenses))}{comparisonMetric(t("reservePlanner.coverageMonths"), t("reservePlanner.monthsValue", { months: scenarioA.coverageMonths }), t("reservePlanner.monthsValue", { months: scenarioB.coverageMonths }))}{comparisonMetric(t("reservePlanner.currentReserve"), formatter.format(scenarioA.currentReserve), formatter.format(scenarioB.currentReserve))}{comparisonMetric(t("reservePlanner.monthlyContribution"), formatter.format(scenarioA.monthlyContribution), formatter.format(scenarioB.monthlyContribution))}<p className="pt-2 text-sm font-semibold">{t("reservePlanner.comparisonResults")}</p>{comparisonMetric(t("reservePlanner.targetReserve"), formatter.format(scenarioAPlan.target), formatter.format(scenarioBPlan.target))}{comparisonMetric(t("reservePlanner.remaining"), formatter.format(scenarioAPlan.remaining), formatter.format(scenarioBPlan.remaining))}{comparisonMetric(t("reservePlanner.progress"), t("reservePlanner.progressValue", { value: scenarioAPlan.progress.toFixed(2) }), t("reservePlanner.progressValue", { value: scenarioBPlan.progress.toFixed(2) }))}{comparisonMetric(t("reservePlanner.estimatedCompletion"), formatCompletion(scenarioAPlan), formatCompletion(scenarioBPlan))}</div></div> : scenarios.length >= 2 ? <p className="text-sm text-muted-foreground">{t("reservePlanner.compareScenariosHelp")}</p> : null}
    </CardContent></Card>
  </div>;
}
