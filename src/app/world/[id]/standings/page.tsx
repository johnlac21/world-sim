// src/app/world/[id]/standings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

type Trend = "up" | "down" | "same" | "new";

type HistoryEntry = {
  year: number;
  totalScore: number;
};

type LeagueStanding = {
  countryId: number;
  countryName: string;
  currentRank: number;
  lastYearRank: number | null;
  trend: Trend;
  totalScore: number;
  history: HistoryEntry[];
};

type ApiResponse = {
  world: {
    id: number;
    name: string;
    currentYear: number;
  } | null;
  standings: LeagueStanding[];
};

type TopCompany = {
  companyId: number;
  name: string;
  industry: string;
  countryId: number;
  countryName: string;
  outputScore: number;
};

type TopCompaniesResponse = {
  world: {
    id: number;
    name: string;
    currentYear: number;
  } | null;
  companies: TopCompany[];
};

const INDUSTRY_LABELS: Record<string, string> = {
  TECH: "Tech",
  FINANCE: "Finance",
  RESEARCH: "Research",
};

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") {
    return <span className="text-green-600 text-sm">↑</span>;
  }
  if (trend === "down") {
    return <span className="text-red-600 text-sm">↓</span>;
  }
  if (trend === "same") {
    return <span className="text-gray-500 text-sm">→</span>;
  }
  // "new"
  return <span className="text-blue-600 text-sm">•</span>;
}

export default function WorldStandingsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topCompanies, setTopCompanies] =
    useState<TopCompaniesResponse | null>(null);
  const [topLoading, setTopLoading] = useState(true);
  const [topError, setTopError] = useState<string | null>(null);

  // --------- LOAD STANDINGS ---------
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/world/${id}/standings`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message ?? "Failed to load standings");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // --------- LOAD TOP COMPANIES ---------
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadTop() {
      setTopLoading(true);
      setTopError(null);

      try {
        const res = await fetch(`/api/world/${id}/top-companies`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const json = (await res.json()) as TopCompaniesResponse;
        if (!cancelled) {
          setTopCompanies(json);
        }
      } catch (e: any) {
        if (!cancelled) {
          setTopError(e.message ?? "Failed to load top companies");
        }
      } finally {
        if (!cancelled) {
          setTopLoading(false);
        }
      }
    }

    loadTop();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // --------- EARLY RETURNS ---------
  if (loading) {
    return (
      <main className="p-4">
        <p className="text-sm text-gray-600">Loading league table…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="p-4 space-y-3">
        <p className="text-red-600 text-sm">
          Failed to load standings{error ? `: ${error}` : "."}
        </p>
        <Link href="/" className="text-blue-600 underline text-sm">
          ← Back to world overview
        </Link>
      </main>
    );
  }

  const { world, standings } = data;

  if (!world) {
    return (
      <main className="p-4 space-y-3">
        <p className="text-sm text-gray-600">
          No world found in the database yet.
        </p>
        <Link href="/" className="text-blue-600 underline text-sm">
          ← Back to world overview
        </Link>
      </main>
    );
  }

  const sortedStandings = [...standings].sort(
    (a, b) => a.currentRank - b.currentRank,
  );

  return (
    <main className="p-4 space-y-6">
      <SectionHeader
        title="Country Standings"
        description={`World: ${world.name} · Year ${world.currentYear}`}
        action={
          <Link href="/" className="text-xs text-blue-600 hover:underline">
            ← Back to world overview
          </Link>
        }
      />

      {/* League Table */}
      <Panel id="standings">
        <PanelHeader
          title="League Table"
          subtitle="Countries ranked by totalScore from CountryYearPerformance for the current season. Arrows show movement vs. last year."
        />
        {sortedStandings.length === 0 ? (
          <p className="text-sm text-gray-600">
            No league standings yet — simulate at least one year to generate
            country performance.
          </p>
        ) : (
          <PanelBody>
            <Table>
              <TableHead>
                <tr>
                  <Th>Rank</Th>
                  <Th>Country</Th>
                  <Th align="right">Score</Th>
                  <Th align="right">Last Year</Th>
                  <Th align="center">Trend</Th>
                  <Th>Recent Seasons</Th>
                </tr>
              </TableHead>
              <TableBody>
                {sortedStandings.map((row) => {
                  const historySorted = [...row.history].sort(
                    (a, b) => a.year - b.year,
                  );

                  return (
                    <TableRow key={row.countryId}>
                      <Td className="text-xs text-gray-500">
                        {row.currentRank}
                      </Td>
                      <Td>
                        <Link
                          href={`/country/${row.countryId}`}
                          className="text-sm font-medium text-blue-700 hover:underline"
                        >
                          {row.countryName}
                        </Link>
                      </Td>
                      <Td align="right" className="text-sm">
                        {row.totalScore.toFixed(1)}
                      </Td>
                      <Td
                        align="right"
                        className="text-xs text-gray-700 min-w-[40px]"
                      >
                        {row.lastYearRank != null ? row.lastYearRank : "–"}
                      </Td>
                      <Td align="center">
                        <TrendIcon trend={row.trend} />
                      </Td>
                      <Td className="text-[11px] text-gray-600">
                        {historySorted.length === 0 ? (
                          <span>—</span>
                        ) : (
                          <span>
                            {historySorted
                              .map(
                                (h) =>
                                  `${h.year}: ${h.totalScore.toFixed(1)}`,
                              )
                              .join(" · ")}
                          </span>
                        )}
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </PanelBody>
        )}
      </Panel>

      {/* Top companies */}
      <Panel id="top-companies">
        <PanelHeader title="Top Companies" />
        {topLoading ? (
          <p className="text-sm text-gray-600">Loading top companies…</p>
        ) : topError ? (
          <p className="text-sm text-red-600">
            Failed to load top companies: {topError}
          </p>
        ) : !topCompanies || !topCompanies.companies.length ? (
          <p className="text-sm text-gray-600">
            No company performance data yet.
          </p>
        ) : (
          <PanelBody>
            <Table dense>
              <TableHead>
                <tr>
                  <Th>Rank</Th>
                  <Th>Company</Th>
                  <Th>Country</Th>
                  <Th>Industry</Th>
                  <Th align="right">Output</Th>
                </tr>
              </TableHead>
              <TableBody>
                {topCompanies.companies.map((c, idx) => (
                  <TableRow key={c.companyId}>
                    <Td>{idx + 1}</Td>
                    <Td>
                      <Link
                        href={`/company/${c.companyId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </Td>
                    <Td>
                      <Link
                        href={`/country/${c.countryId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {c.countryName}
                      </Link>
                    </Td>
                    <Td>
                      {INDUSTRY_LABELS[c.industry] ?? c.industry}
                    </Td>
                    <Td align="right" className="font-mono">
                      {c.outputScore.toFixed(1)}
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </PanelBody>
        )}
      </Panel>
    </main>
  );
}
