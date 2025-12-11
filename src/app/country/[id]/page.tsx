// src/app/country/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";

type CountryOffice = {
  id: number;
  name: string;
  level: string;
  termLength: number;
  prestige: number;
  currentTerm: {
    id: number;
    personId: number;
    personName: string;
    startYear: number;
  } | null;
  pastTerms: {
    id: number;
    personId: number;
    personName: string;
    startYear: number;
    endYear: number | null;
  }[];
};

type IndustryRow = {
  industry: string;
  numCompanies: number;
  totalOutput: number;
  averageOutput: number | null;
};

type TopCompanyRow = {
  companyId: number;
  name: string;
  industry: string;
  outputScore: number;
};

type CountryPerformanceSummary = {
  countryId: number;
  year: number;
  overall: {
    numCompanies: number;
    totalOutput: number;
    averageOutput: number | null;
  };
  industries: IndustryRow[];
  topCompanies: TopCompanyRow[];
};

type CountryHistoryRow = {
  year: number;
  totalScore: number;
  rank: number | null;
  isChampion: boolean;
  leaderName: string | null;
};

type Trend = "up" | "down" | "same" | "new";

type CountryPayload = {
  id: number;
  name: string;
  worldId: number;
  worldName: string;
  offices: CountryOffice[];
  performance?: CountryPerformanceSummary | null;
  history?: CountryHistoryRow[];
};

function computeTrend(
  rows: CountryHistoryRow[],
): (CountryHistoryRow & { trend: Trend })[] {
  const sorted = rows.slice().sort((a, b) => a.year - b.year);

  return sorted.map((row, idx) => {
    const prev = idx > 0 ? sorted[idx - 1] : null;
    const currentRank = row.rank;
    const prevRank = prev?.rank ?? null;

    let trend: Trend = "same";

    if (currentRank == null) {
      trend = "same";
    } else if (prevRank == null) {
      trend = "new";
    } else if (currentRank < prevRank) {
      trend = "up";
    } else if (currentRank > prevRank) {
      trend = "down";
    } else {
      trend = "same";
    }

    return { ...row, trend };
  });
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") {
    return <span className="text-green-600 text-xs font-semibold">↑</span>;
  }
  if (trend === "down") {
    return <span className="text-red-600 text-xs font-semibold">↓</span>;
  }
  if (trend === "same") {
    return <span className="text-gray-500 text-xs">→</span>;
  }
  // "new"
  return <span className="text-blue-600 text-xs">•</span>;
}

export default function CountryPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<CountryPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        const res = await fetch(`/api/country/${id}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="p-4">
        <p className="text-sm text-gray-600">Loading country…</p>
      </main>
    );
  }

  if (!data || (data as any).error) {
    return (
      <main className="p-4 space-y-2">
        <p className="text-sm text-red-600">Country not found.</p>
        <Link href="/" className="text-blue-600 underline text-sm">
          ← Back to world
        </Link>
      </main>
    );
  }

  const perf = data.performance ?? null;
  const historyRaw: CountryHistoryRow[] = data.history ?? [];
  const history = computeTrend(historyRaw);

  return (
    <main className="p-4 space-y-6">
      <SectionHeader
        title={`${data.name} — Country Overview`}
        description={`World: ${data.worldName}`}
        action={
          <Link
            href={`/world/${data.worldId}/standings`}
            className="text-xs text-blue-600 hover:underline"
          >
            ← Back to standings
          </Link>
        }
      />

      <Panel>
        <PanelHeader
          title="Structure & Industries"
          subtitle={
            <Link
              href={`/country/${id}/industry`}
              className="text-xs text-blue-600 hover:underline"
            >
              View Industry Structure →
            </Link>
          }
        />
      </Panel>

      {/* HISTORY PANEL */}
      <Panel>
        <PanelHeader
          title="History"
          subtitle="TotalScore and rank over time. Champion years are highlighted; each season shows the country’s leader."
        />
        <PanelBody className="space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-gray-600">
              No performance history yet — simulate at least one season to
              generate country history.
            </p>
          ) : (
            <>
              <Table dense>
                <TableHead>
                  <tr>
                    <Th>Year</Th>
                    <Th align="right">TotalScore</Th>
                    <Th align="right">Rank</Th>
                    <Th>Leader</Th>
                    <Th align="center">Champ</Th>
                    <Th align="center">Trend</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {history.map((row) => (
                    <TableRow
                      key={row.year}
                      highlight={row.isChampion}
                      zebra
                    >
                      <Td>{row.year}</Td>
                      <Td align="right">
                        {row.totalScore.toFixed(1)}
                      </Td>
                      <Td align="right">{row.rank ?? "–"}</Td>
                      <Td>{row.leaderName ?? "—"}</Td>
                      <Td align="center">
                        {row.isChampion ? "★" : ""}
                      </Td>
                      <Td align="center">
                        <TrendIcon trend={row.trend} />
                      </Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <p className="text-[11px] text-gray-500">
                Recent seasons:{" "}
                {history
                  .slice(-8)
                  .map(
                    (h) =>
                      `${h.year}: ${h.totalScore.toFixed(0)}${
                        h.isChampion ? "★" : ""
                      }`,
                  )
                  .join(" · ")}
              </p>
            </>
          )}
        </PanelBody>
      </Panel>

      {/* COUNTRY PERFORMANCE PANEL */}
      <Panel>
        <PanelHeader title="Country Performance" />
        <PanelBody className="space-y-4">
          {!perf || perf.overall.numCompanies === 0 ? (
            <p className="text-sm text-gray-600">
              No performance data yet for this country — simulate a year to see
              results.
            </p>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Year {perf.year} performance:{" "}
                  <span className="ml-1 text-base font-semibold">
                    {perf.overall.totalOutput.toFixed(1)}
                  </span>
                </p>
                <p className="text-xs text-gray-600">
                  Companies with performance:{" "}
                  <span className="font-medium">
                    {perf.overall.numCompanies}
                  </span>{" "}
                  · Average output per company:{" "}
                  <span className="font-medium">
                    {perf.overall.averageOutput === null
                      ? "—"
                      : perf.overall.averageOutput.toFixed(1)}
                  </span>
                </p>
              </div>

              {/* Per-industry table */}
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-2">
                  Performance by industry
                </h3>
                <Table dense>
                  <TableHead>
                    <tr>
                      <Th>Industry</Th>
                      <Th align="right">Companies</Th>
                      <Th align="right">Total Output</Th>
                      <Th align="right">Avg Output</Th>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {perf.industries.map((ind) => (
                      <TableRow key={ind.industry}>
                        <Td>{ind.industry}</Td>
                        <Td align="right">
                          {ind.numCompanies}
                        </Td>
                        <Td align="right">
                          {ind.totalOutput.toFixed(1)}
                        </Td>
                        <Td align="right">
                          {ind.averageOutput === null
                            ? "—"
                            : ind.averageOutput.toFixed(1)}
                        </Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Top companies list */}
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-2">Top companies</h3>
                {perf.topCompanies.length === 0 ? (
                  <p className="text-xs text-gray-600">
                    No companies with performance this year.
                  </p>
                ) : (
                  <Table dense>
                    <TableHead>
                      <tr>
                        <Th>Company</Th>
                        <Th>Industry</Th>
                        <Th align="right">Output</Th>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {perf.topCompanies.map((c) => (
                        <TableRow key={c.companyId}>
                          <Td>
                            <Link
                              href={`/company/${c.companyId}`}
                              className="text-blue-600 hover:underline"
                            >
                              {c.name}
                            </Link>
                          </Td>
                          <Td>{c.industry}</Td>
                          <Td align="right">
                            {c.outputScore.toFixed(1)}
                          </Td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </PanelBody>
      </Panel>

      {/* POLITICAL OFFICES */}
      {data.offices.length === 0 ? (
        <p className="text-sm text-gray-600">
          No political offices defined for this country.
        </p>
      ) : (
        <div className="space-y-4">
          {data.offices.map((office) => (
            <Panel key={office.id}>
              <PanelHeader
                title={office.name}
                subtitle={`Level: ${office.level} · Term length: ${office.termLength} years · Prestige: ${office.prestige}`}
              />
              <PanelBody className="space-y-3">
                <div>
                  <h3 className="font-semibold text-sm">
                    Current office holder
                  </h3>
                  {office.currentTerm ? (
                    <p className="text-sm">
                      {office.currentTerm.personName} (since year{" "}
                      {office.currentTerm.startYear})
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      No current office holder.
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-sm">Past terms</h3>
                  {office.pastTerms.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No past terms yet.
                    </p>
                  ) : (
                    <ul className="list-disc ml-6 text-sm">
                      {office.pastTerms.map((t) => (
                        <li key={t.id}>
                          {t.personName} — {t.startYear}
                          {t.endYear != null ? `–${t.endYear}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </PanelBody>
            </Panel>
          ))}
        </div>
      )}
    </main>
  );
}
