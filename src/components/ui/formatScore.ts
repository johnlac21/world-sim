// src/components/ui/formatScore.ts
export function formatScore(value: unknown): string {
  if (value == null) return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "—";
  return Math.round(num).toString();
}
