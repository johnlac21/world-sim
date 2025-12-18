// src/components/ui/StatBadge.tsx
import type { ReactNode } from "react";

type StatBadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "metric";

type StatBadgeSize = "xs" | "sm";

type StatBadgeProps = {
  label: ReactNode;
  variant?: StatBadgeVariant;
  size?: StatBadgeSize;
  className?: string;
};

export function StatBadge({
  label,
  variant = "neutral",
  size = "xs",
  className,
}: StatBadgeProps) {
  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-0.5 text-[11px]"
      : "px-2 py-0.5 text-[10px]";

  const colorClasses =
    variant === "primary"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : variant === "success"
      ? "bg-green-100 text-green-800 border-green-200"
      : variant === "warning"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : variant === "danger"
      ? "bg-red-100 text-red-800 border-red-200"
      : variant === "info"
      ? "bg-sky-100 text-sky-800 border-sky-200"
      : variant === "metric"
      ? "bg-gray-900 text-gray-50 border-gray-900"
      : "bg-gray-100 text-gray-800 border-gray-200";

  const base =
    "inline-flex items-center rounded-full border font-semibold " +
    sizeClasses +
    " " +
    colorClasses;

  return (
    <span className={[base, className].filter(Boolean).join(" ")}>
      {label}
    </span>
  );
}
