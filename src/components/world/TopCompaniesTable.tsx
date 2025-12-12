// src/components/world/TopCompaniesTable.tsx
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/ui/DataTable";
import { formatScore } from "@/components/ui/formatScore";

type TopCompany = {
  companyId?: number;
  id?: number;
  companyName?: string;
  name?: string;
  countryId: number;
  countryName?: string;
  country?: string;
  industry: string;
  outputScore: number;
};

type Props = {
  companies: TopCompany[];
};

export function TopCompaniesTable({ companies }: Props) {
  const rowsSource = companies.slice(0, 10);

  return (
    <section>
      <SectionHeader>Top companies this year</SectionHeader>
      {rowsSource.length === 0 ? (
        <p className="text-[11px] text-gray-500">
          Sim a year to generate company performance.
        </p>
      ) : (
        <DataTable
          columns={
            [
              { key: "rank", label: "#", align: "left", widthClassName: "w-4" },
              { key: "company", label: "Company", align: "left" },
              { key: "country", label: "Country", align: "left" },
              { key: "industry", label: "Industry", align: "left" },
              { key: "output", label: "Output", align: "right" },
            ] satisfies DataTableColumn[]
          }
          rows={rowsSource.map((c, index) => {
            const companyId = c.companyId ?? c.id ?? index;
            const companyName = c.companyName ?? c.name ?? "Unknown";
            const countryName = c.countryName ?? c.country ?? "Unknown";
            return {
              key: companyId,
              cells: {
                rank: index + 1,
                company: (
                  <Link
                    href={`/company/${companyId}`}
                    className="text-blue-700 hover:underline"
                  >
                    {companyName}
                  </Link>
                ),
                country: (
                  <Link
                    href={`/country/${c.countryId}`}
                    className="text-blue-700 hover:underline"
                  >
                    {countryName}
                  </Link>
                ),
                industry: c.industry,
                output: formatScore(c.outputScore),
              },
            } satisfies DataTableRow;
          })}
        />
      )}
    </section>
  );
}
