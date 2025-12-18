// src/components/world/WorldSummaryPanel.tsx
"use client";

import type { WorldStats } from "./types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WorldStatsPanel } from "./WorldStatsPanel";

type Props = {
  stats: WorldStats | null;
};

export function WorldSummaryPanel({ stats }: Props) {
  // WorldStatsPanel already renders its own SectionHeader,
  // so you can either keep that or let this wrapper control the header.
  return (
    <div className="mb-4">
      <SectionHeader>World summary</SectionHeader>
      <div className="mt-1">
        <WorldStatsPanel stats={stats} />
      </div>
    </div>
  );
}
