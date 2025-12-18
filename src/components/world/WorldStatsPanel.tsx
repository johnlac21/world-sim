// src/components/world/WorldStatsPanel.tsx
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { WorldStats } from "./types";

type Props = {
  stats: WorldStats | null;
};

export function WorldStatsPanel({ stats }: Props) {
  return (
    <section>
      <SectionHeader>World stats</SectionHeader>
      {stats ? (
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <div className="text-gray-500">Average company output</div>
            <div className="font-semibold">
              {stats.avgCompanyOutput.toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Champion (last year)</div>
            <div className="font-semibold">
              {stats.lastChampionName ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Best gov score</div>
            <div className="font-semibold">
              {stats.bestGovernmentScoreName
                ? `${stats.bestGovernmentScoreName} (${Math.round(
                    stats.bestGovernmentScoreValue
                  )})`
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-gray-500">
              Countries with &gt;0 gov score
            </div>
            <div className="font-semibold">
              {stats.countriesWithGovScore}/{stats.totalCountries}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-gray-500">
          World stats will appear after the first simulated season.
        </p>
      )}
    </section>
  );
}
