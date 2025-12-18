// src/components/world/WorldSnapshotPanel.tsx
import { SectionHeader } from "@/components/ui/SectionHeader";

type WorldSummary = {
  currentYear: number;
  countriesCount: number;
  peopleCount: number;
};

type Props = {
  world: WorldSummary;
  companyCount: number;
};

export function WorldSnapshotPanel({ world, companyCount }: Props) {
  return (
    <section>
      <SectionHeader>World snapshot</SectionHeader>
      <div className="grid grid-cols-4 gap-2 text-[11px]">
        <div>
          <div className="text-gray-500">Year</div>
          <div className="font-semibold">{world.currentYear}</div>
        </div>
        <div>
          <div className="text-gray-500">Countries</div>
          <div className="font-semibold">{world.countriesCount}</div>
        </div>
        <div>
          <div className="text-gray-500">People</div>
          <div className="font-semibold">
            {world.peopleCount.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Companies</div>
          <div className="font-semibold">
            {companyCount.toLocaleString()}
          </div>
        </div>
      </div>
    </section>
  );
}
