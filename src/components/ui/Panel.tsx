// src/components/ui/Panel.tsx
import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "solid" | "subtle" | "muted";
};

/**
 * Panel is the base "card" / "box" component used everywhere.
 * It standardizes radius, border, shadow, and background.
 */
export function Panel({
  children,
  className,
  padding = "md",
  variant = "solid",
}: PanelProps) {
  const paddingClass =
    padding === "none"
      ? ""
      : padding === "sm"
      ? "p-3"
      : padding === "lg"
      ? "p-6"
      : "p-4";

  const bgClass =
    variant === "subtle"
      ? "bg-gray-50"
      : variant === "muted"
      ? "bg-white/70"
      : "bg-white";

  const base =
    "rounded-xl border border-gray-200 shadow-sm " + bgClass + " " + paddingClass;

  return (
    <section className={[base, className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}

type PanelHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  size?: "sm" | "md" | "lg";
};

export function PanelHeader({
  title,
  subtitle,
  action,
  size = "md",
}: PanelHeaderProps) {
  const titleSize =
    size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";

  return (
    <header className="mb-2 flex items-baseline justify-between gap-2">
      <div>
        <h2 className={`${titleSize} font-semibold text-gray-900`}>{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-gray-600">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

type PanelBodyProps = {
  children: ReactNode;
  className?: string;
};

export function PanelBody({ children, className }: PanelBodyProps) {
  return <div className={className}>{children}</div>;
}
