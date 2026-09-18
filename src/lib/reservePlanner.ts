export interface ReservePlanInput {
  monthlyExpenses: number;
  coverageMonths: number;
  currentReserve: number;
  monthlyContribution: number;
}

export interface ReserveProjectionPoint {
  month: number;
  reserve: number;
  target: number;
}

export interface ReservePlan {
  target: number;
  remaining: number;
  progress: number;
  estimatedMonths: number | null;
  reached: boolean;
  projection: ReserveProjectionPoint[];
}

const MAX_PROJECTION_POINTS = 120;

export function isValidReservePlanInput(input: ReservePlanInput): boolean {
  return Number.isFinite(input.monthlyExpenses)
    && Number.isFinite(input.coverageMonths)
    && Number.isFinite(input.currentReserve)
    && Number.isFinite(input.monthlyContribution)
    && input.monthlyExpenses > 0
    && input.coverageMonths > 0
    && input.currentReserve >= 0
    && input.monthlyContribution >= 0;
}

function buildProjection(
  currentReserve: number,
  monthlyContribution: number,
  target: number,
  estimatedMonths: number | null,
): ReserveProjectionPoint[] {
  if (estimatedMonths === null || estimatedMonths === 0) return [];

  const intervals = Math.min(estimatedMonths, MAX_PROJECTION_POINTS);
  return Array.from({ length: intervals + 1 }, (_, index) => {
    const month = Math.round((index * estimatedMonths) / intervals);
    return {
      month,
      reserve: Math.min(currentReserve + month * monthlyContribution, target),
      target,
    };
  });
}

export function calculateReservePlan(input: ReservePlanInput): ReservePlan | null {
  if (!isValidReservePlanInput(input)) return null;

  const target = input.monthlyExpenses * input.coverageMonths;
  const remaining = Math.max(target - input.currentReserve, 0);
  const reached = remaining === 0;
  const estimatedMonths = reached
    ? 0
    : input.monthlyContribution === 0
      ? null
      : Math.ceil(remaining / input.monthlyContribution);

  return {
    target,
    remaining,
    progress: Math.min((input.currentReserve / target) * 100, 100),
    estimatedMonths,
    reached,
    projection: buildProjection(input.currentReserve, input.monthlyContribution, target, estimatedMonths),
  };
}
