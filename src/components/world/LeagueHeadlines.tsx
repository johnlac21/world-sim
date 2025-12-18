// src/components/world/LeagueHeadlines.tsx
import { SectionHeader } from "@/components/ui/SectionHeader";

type Headline = {
  id: string;
  title: string;
  subtitle: string;
};

type Props = {
  headlines: Headline[];
};

export function LeagueHeadlines({ headlines }: Props) {
  return (
    <section>
      <SectionHeader>League headlines</SectionHeader>
      {headlines.length === 0 ? (
        <p className="text-[11px] text-gray-500">
          Sim a year to generate headlines.
        </p>
      ) : (
        <div className="space-y-2">
          {headlines.map((h) => (
            <div
              key={h.id}
              className="border border-gray-200 rounded px-2 py-1.5 text-[11px] bg-white"
            >
              <div className="font-semibold text-blue-800 mb-[1px]">
                {h.title}
              </div>
              <div className="text-gray-600 leading-snug">{h.subtitle}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
