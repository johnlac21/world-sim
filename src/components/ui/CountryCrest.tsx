// src/components/ui/CountryCrest.tsx
import type { CSSProperties } from "react";

export function countryColor(id: number): string {
  const hue = (id * 47) % 360;
  return `hsl(${hue}, 70%, 65%)`;
}

export function countryCode(name: string): string {
  if (!name) return "??";
  const trimmed = name.trim();
  if (!trimmed) return "??";

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return trimmed.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function CountryCrest({
  id,
  name,
  className = "",
}: {
  id: number;
  name: string;
  className?: string;
}) {
  const style: CSSProperties = { background: countryColor(id) };
  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${className}`}
      style={style}
    >
      {countryCode(name)}
    </div>
  );
}
