// src/components/ui/StatPill.tsx
type StatPillProps = {
  label: string;
  value: number;
  /** max scale for the bar; person stats are 0–20 by default */
  max?: number;
};

export function StatPill({ label, value, max = 20 }: StatPillProps) {
  const safe = Number.isFinite(value) ? value : 0;
  const clamped = Math.max(0, Math.min(max, safe));
  const pct = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div className="flex items-center justify-between rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800">
      <span className="font-medium">{label}</span>
      <div className="ml-2 flex items-center gap-2 w-28">
        <div className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-gray-600">
          {safe}
        </span>
      </div>
    </div>
  );
}
