// src/components/world/CountryStandingsMini.tsx
import Link from "next/link";
import { CountryCrest } from "@/components/ui/CountryCrest";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/ui/DataTable";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatScore } from "@/components/ui/formatScore";

type CountryStanding = {
  countryId: number;
  countryName: string;
  currentRank: number;
  totalScore: number;
};

type Props = {
  standings: CountryStanding[];
  worldId: number;
};

export function CountryStandingsMini({ standings, worldId }: Props) {
  const sorted = standings
    .slice()
    .sort((a, b) => a.currentRank - b.currentRank)
    .slice(0, 10);

  const columns: DataTableColumn[] = [
    { key: "country", label: "Country", align: "left" },
    { key: "score", label: "Score", align: "right", widthClassName: "w-10" },
  ];

  const rows: DataTableRow[] = sorted.map((c, index) => ({
    key: c.countryId,
    cells: {
      country: (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{index + 1}</span>
          <CountryCrest id={c.countryId} name={c.countryName} />
          <Link
            href={`/country/${c.countryId}`}
            className="text-blue-700 hover:underline"
          >
            {c.countryName}
          </Link>
        </div>
      ),
      score: formatScore(c.totalScore),
    },
  }));

  return (
    <section>
      <SectionHeader>Standings</SectionHeader>
      {rows.length === 0 ? (
        <p className="text-[11px] text-gray-500">No standings yet.</p>
      ) : (
        <DataTable columns={columns} rows={rows} />
      )}
      <div className="mt-1 text-[11px]">
        <Link
          href={`/world/${worldId}/standings`}
          className="text-blue-700 hover:underline"
        >
          Full standings →
        </Link>
      </div>
    </section>
  );
}
