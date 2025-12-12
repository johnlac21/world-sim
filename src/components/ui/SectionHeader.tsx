// src/components/ui/SectionHeader.tsx
import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;

  /** Optional: control title size */
  size?: "sm" | "md" | "lg";
  /** Optional: tighter spacing for BBGM-style pages */
  compact?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  size = "md",
  compact = false,
}: SectionHeaderProps) {
  const titleSizeClass =
    size === "lg"
      ? "text-2xl"
      : size === "sm"
      ? "text-lg"
      : "text-xl"; // md (default) – matches old behaviour

  const wrapperMargin = compact ? "mb-2" : "mb-4";
  const wrapperGap = compact ? "gap-2" : "gap-3";
  const descriptionMarginTop = compact ? "mt-0.5" : "mt-1";

  return (
    <div className={`${wrapperMargin} flex items-start justify-between ${wrapperGap}`}>
      <div>
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {eyebrow}
          </div>
        )}
        <h1 className={`${titleSizeClass} font-semibold text-gray-900`}>{title}</h1>
        {description && (
          <p className={`${descriptionMarginTop} text-xs text-gray-600`}>{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
