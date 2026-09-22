import { isValidReservePlanInput, type ReservePlanInput } from "@/lib/reservePlanner";

export const RESERVE_SCENARIOS_STORAGE_KEY = "julishub_reserve_scenarios_v1";
export const RESERVE_SCENARIOS_VERSION = 1;
export const MAX_RESERVE_SCENARIOS = 5;
export const MAX_RESERVE_SCENARIO_NAME_LENGTH = 40;

export interface SavedReserveScenario extends ReservePlanInput {
  id: string;
  name: string;
}

interface StoredReserveScenarios {
  version: number;
  scenarios: SavedReserveScenario[];
}

function isValidScenarioId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 128;
}

export function normalizeReserveScenarioName(value: string): string {
  return value.trim();
}

export function isValidReserveScenarioName(value: unknown): value is string {
  return typeof value === "string"
    && value === value.trim()
    && value.length > 0
    && value.length <= MAX_RESERVE_SCENARIO_NAME_LENGTH;
}

function isSavedReserveScenario(value: unknown): value is SavedReserveScenario {
  if (!value || typeof value !== "object") return false;
  const scenario = value as Partial<SavedReserveScenario>;
  return isValidScenarioId(scenario.id)
    && isValidReserveScenarioName(scenario.name)
    && isValidReservePlanInput({
      monthlyExpenses: scenario.monthlyExpenses as number,
      coverageMonths: scenario.coverageMonths as number,
      currentReserve: scenario.currentReserve as number,
      monthlyContribution: scenario.monthlyContribution as number,
    });
}

export function parseReserveScenarios(stored: string | null): SavedReserveScenario[] {
  if (!stored) return [];

  try {
    const value = JSON.parse(stored) as Partial<StoredReserveScenarios>;
    if (!value || typeof value !== "object" || Array.isArray(value)
      || value.version !== RESERVE_SCENARIOS_VERSION || !Array.isArray(value.scenarios)) {
      return [];
    }

    const ids = new Set<string>();
    const names = new Set<string>();
    const scenarios: SavedReserveScenario[] = [];

    for (const candidate of value.scenarios) {
      if (!isSavedReserveScenario(candidate)) continue;
      const normalizedName = candidate.name.toLocaleLowerCase();
      if (ids.has(candidate.id) || names.has(normalizedName)) continue;
      ids.add(candidate.id);
      names.add(normalizedName);
      scenarios.push(candidate);
      if (scenarios.length === MAX_RESERVE_SCENARIOS) break;
    }

    return scenarios;
  } catch {
    return [];
  }
}

export function loadReserveScenarios(): SavedReserveScenario[] {
  try {
    return parseReserveScenarios(localStorage.getItem(RESERVE_SCENARIOS_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveReserveScenarios(scenarios: SavedReserveScenario[]): boolean {
  try {
    const payload: StoredReserveScenarios = {
      version: RESERVE_SCENARIOS_VERSION,
      scenarios,
    };
    localStorage.setItem(RESERVE_SCENARIOS_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function hasReserveScenarioName(scenarios: SavedReserveScenario[], name: string): boolean {
  const normalizedName = normalizeReserveScenarioName(name).toLocaleLowerCase();
  return scenarios.some((scenario) => scenario.name.toLocaleLowerCase() === normalizedName);
}
