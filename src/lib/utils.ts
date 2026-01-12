import { ApiError } from "./apiError";

export function parseDate(input: string, fieldName: string): Date {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    throw new ApiError(400, `${fieldName}の日付形式が不正です。`);
  }
  return d;
}

export function ensureBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1";
  return fallback;
}
