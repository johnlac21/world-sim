"use client";

export function countryColor(id: number): string {
  const hue = (id * 47) % 360;
  return `hsl(${hue}, 70%, 65%)`;
}

export function countryCode(name: string): string {
  if (!name) return "??";
  const parts = name.split(" ");
  if (parts.length === 1) {
    return name.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function CountryCrest({ id, name }: { id: number; name: string }) {
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
      style={{ background: countryColor(id) }}
    >
      {countryCode(name)}
    </div>
  );
}
