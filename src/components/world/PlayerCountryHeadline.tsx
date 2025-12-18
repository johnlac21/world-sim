// src/components/world/PlayerCountryHeadline.tsx
"use client";

import { formatScore } from "@/components/ui/formatScore";

type Props = {
  worldName: string;
  currentYear: number;
  totalCountries: number;
  currentRank: number | null;
  totalScore: number | null;
};

function formatOrdinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function PlayerCountryHeadline({
  worldName,
  currentYear,
  totalCountries,
  currentRank,
  totalScore,
}: Props) {
  const rankLabel =
    currentRank != null && totalCountries > 0
      ? `${formatOrdinal(currentRank)} of ${totalCountries} countries`
      : "Rank not available";

  const scoreLabel =
    totalScore != null ? formatScore(totalScore) : "—";

  return (
    <div className="mb-2 flex flex-col items-center text-center">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">
        {worldName} · Year {currentYear}
      </div>
      <div className="mt-1 text-4xl font-semibold leading-none">
        {scoreLabel}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-600">
        {rankLabel}
      </div>
      {/* thin divider bar, like BBGM */}
      <div className="mt-2 h-px w-10 rounded bg-gray-300" />
    </div>
  );
}
