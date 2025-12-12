// src/components/world/CountriesList.tsx
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

type CountryStanding = {
  countryId: number;
  countryName: string;
  currentRank: number;
};

type Props = {
  standings: CountryStanding[];
};

export function CountriesList({ standings }: Props) {
  const sorted = standings
    .slice()
    .sort((a, b) => a.currentRank - b.currentRank)
    .slice(0, 10);

  return (
    <section>
      <SectionHeader>Countries</SectionHeader>
      {sorted.length === 0 ? (
        <p className="text-[11px] text-gray-500">
          Standings will populate after the first simulated year.
        </p>
      ) : (
        <ul className="list-disc pl-4 space-y-[1px]">
          {sorted.map((c) => (
            <li key={c.countryId}>
              <Link
                href={`/country/${c.countryId}`}
                className="text-blue-700 hover:underline"
              >
                {c.countryName}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
