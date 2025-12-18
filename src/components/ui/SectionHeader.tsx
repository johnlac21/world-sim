// src/components/ui/SectionHeader.tsx
import type { ReactNode } from "react";

type SectionHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function SectionHeader({ children, className = "" }: SectionHeaderProps) {
  return (
    <h2
      className={
        "text-[11px] font-semibold mb-1 uppercase tracking-wide text-gray-700 " +
        className
      }
    >
      {children}
    </h2>
  );
}
