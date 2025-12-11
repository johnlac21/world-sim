// src/components/ui/DepthChartRow.tsx
import type { ReactNode } from "react";

/**
 * Generic "depth chart" row: label on the left, rank/meta on the right,
 * with a content area below. Used for company hierarchies and similar.
 */
type DepthChartRowProps = {
  title: ReactNode;
  rankLabel?: ReactNode;
  children?: ReactNode;
  muted?: boolean;
};

export function DepthChartRow({
  title,
  rankLabel,
  children,
  muted = false,
}: DepthChartRowProps) {
  const base =
    "rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm";
  const mutedClass = muted ? "opacity-70" : "";

  return (
    <li className={[base, mutedClass].filter(Boolean).join(" ")}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-gray-800">{title}</span>
        {rankLabel && (
          <span className="text-[10px] text-gray-400 uppercase">
            {rankLabel}
          </span>
        )}
      </div>
      {children && <div className="mt-1 text-[11px] text-gray-700">{children}</div>}
    </li>
  );
}
