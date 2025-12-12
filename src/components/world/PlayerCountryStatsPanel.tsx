// src/components/world/PlayerCountryStatsPanel.tsx
"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatScore } from "@/components/ui/formatScore";

type Props = {
  totalScore: number | null;
  currentRank: number | null;
  totalCountries: number;
};

export function PlayerCountryStatsPanel({
  totalScore,
  currentRank,
  totalCountries,
}: Props) {
  return (
    <div>
      <SectionHeader>Country stats</SectionHeader>
      <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <div>
          <dt className="text-gray-500">Total score</dt>
          <dd className="font-medium">
            {totalScore != null ? formatScore(totalScore) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">League rank</dt>
          <dd className="font-medium">
            {currentRank != null && totalCountries > 0
              ? `${currentRank} / ${totalCountries}`
              : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
