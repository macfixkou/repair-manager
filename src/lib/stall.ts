import { CaseStatus } from "@prisma/client";

const DEFAULT_THRESHOLDS: Record<CaseStatus, number> = {
  INTAKE: 2,
  DIAGNOSING: 3,
  REPAIRING: 5,
  COMPLETED: 0,
  RETURNED: 0,
  DECLINED: 0,
  CANCELLED: 0,
  BUYBACK: 0,
  DISPOSED: 0,
};

export type StallInfo = {
  ageDays: number;
  stalled: boolean;
  stallThreshold: number;
  stalledByDays: number;
};

export function parseStallThresholds(
  stallThresholdsJson?: string | null
): Record<CaseStatus, number> {
  try {
    const parsed = stallThresholdsJson ? JSON.parse(stallThresholdsJson) : {};
    return {
      ...DEFAULT_THRESHOLDS,
      ...parsed,
    };
  } catch (error) {
    console.warn("Failed to parse stallThresholdsJson, using defaults.", error);
    return DEFAULT_THRESHOLDS;
  }
}

export function calcStallInfo(
  status: CaseStatus,
  receivedAt: Date,
  thresholds: Record<CaseStatus, number>,
  now: Date
): StallInfo {
  const ageDays = Math.floor((now.getTime() - receivedAt.getTime()) / (1000 * 60 * 60 * 24));
  const stallThreshold = thresholds[status] ?? DEFAULT_THRESHOLDS[status] ?? 0;
  const stalled = stallThreshold > 0 && ageDays >= stallThreshold;
  const stalledByDays = stalled ? ageDays - stallThreshold : 0;
  return { ageDays, stalled, stallThreshold, stalledByDays };
}
