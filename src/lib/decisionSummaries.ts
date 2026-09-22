import type { ReservePlan, ReservePlanInput } from "@/lib/reservePlanner";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface FinancingComparisonResult {
  original: { prestacao: number; prazo: number; total_pago: number; total_juros: number };
  antecipacao: { mes: number; valor_solicitado: number; valor_aplicado: number };
  reduzir_prazo: { prestacao_regular: number; prestacao_final: number; prazo: number; meses_economizados: number; total_pago: number; total_juros: number; juros_economizados: number; quitado: boolean };
  reduzir_parcela: { prestacao_original: number; prestacao_recalculada: number | null; reducao_prestacao: number | null; prazo: number; parcelas_restantes: number; total_pago: number; total_juros: number; juros_economizados: number; quitado: boolean };
  evolucao: Array<{ mes: number; original: number; reduzir_prazo: number; reduzir_parcela: number }>;
}

export interface FinancingComparisonRequest {
  valor_financiamento: number;
  taxa_mensal: number;
  meses: number;
  mes_antecipacao: number;
  valor_antecipacao: number;
}

interface SummaryFormatters { t: Translate; currency: (value: number) => string; percent: (value: number) => string; }
const line = (label: string, value: string) => `- ${label}: ${value}`;

export function buildReserveDecisionSummary(input: ReservePlanInput, plan: ReservePlan, format: SummaryFormatters): string {
  const completion = plan.reached ? format.t("reservePlanner.goalReached") : plan.estimatedMonths === null ? format.t("reservePlanner.noCompletionEstimate") : format.t("reservePlanner.estimatedMonthsValue", { months: plan.estimatedMonths });
  return [format.t("reservePlanner.summaryTitle"), "", format.t("reservePlanner.summaryAssumptions"), line(format.t("reservePlanner.monthlyExpenses"), format.currency(input.monthlyExpenses)), line(format.t("reservePlanner.coverageMonths"), format.t("reservePlanner.monthsValue", { months: input.coverageMonths })), line(format.t("reservePlanner.currentReserve"), format.currency(input.currentReserve)), line(format.t("reservePlanner.monthlyContribution"), format.currency(input.monthlyContribution)), "", format.t("reservePlanner.summaryResults"), line(format.t("reservePlanner.targetReserve"), format.currency(plan.target)), line(format.t("reservePlanner.remaining"), format.currency(plan.remaining)), line(format.t("reservePlanner.progress"), format.percent(plan.progress)), line(format.t("reservePlanner.estimatedCompletion"), completion), "", format.t("reservePlanner.summaryCaveat")].join("\n");
}

export function buildFinancingDecisionSummary(request: FinancingComparisonRequest, result: FinancingComparisonResult, format: SummaryFormatters): string {
  const months = (count: number) => format.t("financingPrepayment.monthCount", { count });
  const reduceTerm = [format.t("financingPrepayment.reduceTerm"), line(format.t("financingPrepayment.term"), months(result.reduzir_prazo.prazo)), line(format.t("financingPrepayment.monthsSaved"), months(result.reduzir_prazo.meses_economizados)), line(format.t("financingPrepayment.interestSaved"), format.currency(result.reduzir_prazo.juros_economizados)), line(format.t("financingPrepayment.totalInterest"), format.currency(result.reduzir_prazo.total_juros)), result.reduzir_prazo.quitado ? `- ${format.t("financingPrepayment.fullyPaid")}` : ""];
  const reduceInstallment = [format.t("financingPrepayment.reduceInstallment"), result.reduzir_parcela.quitado ? `- ${format.t("financingPrepayment.fullyPaid")}` : line(format.t("financingPrepayment.newInstallment"), format.currency(result.reduzir_parcela.prestacao_recalculada as number)), result.reduzir_parcela.quitado ? "" : line(format.t("financingPrepayment.installmentReduction"), format.currency(result.reduzir_parcela.reducao_prestacao as number)), line(format.t("financingPrepayment.interestSaved"), format.currency(result.reduzir_parcela.juros_economizados)), line(format.t("financingPrepayment.totalInterest"), format.currency(result.reduzir_parcela.total_juros))];
  return [format.t("financingPrepayment.summaryTitle"), "", format.t("financingPrepayment.summaryAssumptions"), line(format.t("financingPrepayment.summaryFinancedAmount"), format.currency(request.valor_financiamento)), line(format.t("financingPrepayment.summaryMonthlyRate"), format.percent(request.taxa_mensal / 100)), line(format.t("financingPrepayment.term"), months(request.meses)), "", format.t("financingPrepayment.summaryPrepayment"), line(format.t("financingPrepayment.month"), months(result.antecipacao.mes)), line(format.t("financingPrepayment.summaryRequestedAmount"), format.currency(result.antecipacao.valor_solicitado)), line(format.t("financingPrepayment.summaryAppliedAmount"), format.currency(result.antecipacao.valor_aplicado)), "", format.t("financingPrepayment.summaryOriginal"), line(format.t("financingPrepayment.installment"), format.currency(result.original.prestacao)), line(format.t("financingPrepayment.term"), months(result.original.prazo)), line(format.t("financingPrepayment.totalInterest"), format.currency(result.original.total_juros)), "", ...reduceTerm, "", ...reduceInstallment, "", format.t("financingPrepayment.disclaimer")].filter(Boolean).join("\n");
}
