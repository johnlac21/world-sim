// src/components/world/TopCountriesTable.tsx
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/ui/DataTable";
import { formatScore } from "@/components/ui/formatScore";

type CountryStanding = {
  countryId: number;
  countryName: string;
  currentRank: number;
  totalScore: number;
  companyScore: number;
  governmentScore: number;
};

type Props = {
  countries: CountryStanding[];
};

export function TopCountriesTable({ countries }: Props) {
  const top = countries.slice(0, 5);

  if (top.length === 0) {
    return (
      <section>
        <SectionHeader>Top countries this year</SectionHeader>
        <p className="text-[11px] text-gray-500">
          Sim a year to generate country performance.
        </p>
      </section>
    );
  }

  const columns: DataTableColumn[] = [
    { key: "rank", label: "#", align: "left", widthClassName: "w-4" },
    { key: "country", label: "Country", align: "left" },
    { key: "total", label: "Total", align: "right" },
    { key: "company", label: "Company", align: "right" },
    { key: "gov", label: "Gov", align: "right" },
  ];

  const rows: DataTableRow[] = top.map((c) => ({
    key: c.countryId,
    cells: {
      rank: c.currentRank,
      country: (
        <Link
          href={`/country/${c.countryId}`}
          className="text-blue-700 hover:underline"
        >
          {c.countryName}
        </Link>
      ),
      total: formatScore(c.totalScore),
      company: formatScore(c.companyScore),
      gov: formatScore(c.governmentScore),
    },
  }));

  return (
    <section>
      <SectionHeader>Top countries this year</SectionHeader>
      <DataTable columns={columns} rows={rows} />
    </section>
  );
}
