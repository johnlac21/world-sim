"use client";

import { useEffect, useMemo, useState } from "react";
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
    controlledCountryId: number | null;
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
  OTHER: "Other",
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

type SortKey = "rank" | "country" | "score";

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

  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

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

  // ---- derive lightweight values for hooks ----
  const world = data?.world ?? null;
  const standings = data?.standings ?? [];

  const sortedStandings = useMemo(() => {
    const rows = [...standings];

    rows.sort((a, b) => {
      let cmp = 0;

      if (sortKey === "rank") {
        cmp = a.currentRank - b.currentRank;
      } else if (sortKey === "country") {
        cmp = a.countryName.localeCompare(b.countryName);
      } else if (sortKey === "score") {
        cmp = a.totalScore - b.totalScore;
      }

      if (sortDir === "desc") {
        cmp = -cmp;
      }
      return cmp;
    });

    // Ensure stable ordering when ties on the sort key
    if (sortKey !== "rank") {
      rows.sort((a, b) => {
        if (sortKey === "country" && a.countryName === b.countryName) {
          return a.currentRank - b.currentRank;
        }
        if (sortKey === "score" && a.totalScore === b.totalScore) {
          return a.currentRank - b.currentRank;
        }
        return 0;
      });
    }

    return rows;
  }, [standings, sortKey, sortDir]);

  const industryTotals = useMemo(() => {
    if (!topCompanies || !topCompanies.companies.length) return [];
    const map = new Map<
      string,
      { industry: string; totalOutput: number; count: number }
    >();

    for (const c of topCompanies.companies) {
      const key = c.industry;
      const existing =
        map.get(key) ?? { industry: key, totalOutput: 0, count: 0 };
      existing.totalOutput += c.outputScore;
      existing.count += 1;
      map.set(key, existing);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.totalOutput - a.totalOutput,
    );
  }, [topCompanies]);

  const handleSort = (key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortDir("desc"); // default high-first behaviour
      return key;
    });
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return (
      <span className="ml-1 text-[10px]">
        {sortDir === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  // --------- EARLY RETURNS (after all hooks) ---------
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

  const playerCountryId = world.controlledCountryId;

  return (
    <main className="p-4 space-y-4 md:p-6">
      <SectionHeader
        title="Country Standings"
        description={
          <span className="text-sm text-gray-600">
            World: <span className="font-semibold">{world.name}</span> · Year{" "}
            {world.currentYear}
          </span>
        }
        action={
          <Link href="/" className="text-xs text-blue-600 hover:underline">
            ← Back to world overview
          </Link>
        }
      />

      {/* Two-column layout: standings + top companies / industry totals */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.4fr)_minmax(260px,1.3fr)] lg:gap-6">
        {/* LEFT: League Table */}
        <section className="space-y-3">
          <Panel id="standings">
            <PanelHeader
              title="League Table"
              subtitle="Countries ranked by totalScore from CountryYearPerformance for the current season. Arrows show movement vs. last year."
            />
            {sortedStandings.length === 0 ? (
              <PanelBody>
                <p className="text-sm text-gray-600">
                  No league standings yet — simulate at least one year to
                  generate country performance.
                </p>
              </PanelBody>
            ) : (
              <PanelBody>
                <Table dense>
                  <TableHead>
                    <tr>
                      <Th
                        onClick={() => handleSort("rank")}
                        className="cursor-pointer select-none"
                      >
                        Rank {sortIndicator("rank")}
                      </Th>
                      <Th
                        onClick={() => handleSort("country")}
                        className="cursor-pointer select-none"
                      >
                        Country {sortIndicator("country")}
                      </Th>
                      <Th
                        align="right"
                        onClick={() => handleSort("score")}
                        className="cursor-pointer select-none"
                      >
                        Score {sortIndicator("score")}
                      </Th>
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
                      const isPlayer =
                        playerCountryId != null &&
                        row.countryId === playerCountryId;

                      return (
                        <TableRow
                          key={row.countryId}
                          highlight={isPlayer}
                          className={isPlayer ? "bg-blue-50/80" : undefined}
                        >
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
                            {isPlayer && (
                              <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-[1px] text-[10px] font-semibold text-white">
                                You
                              </span>
                            )}
                          </Td>
                          <Td
                            align="right"
                            className="text-sm font-mono"
                          >
                            {row.totalScore.toFixed(1)}
                          </Td>
                          <Td
                            align="right"
                            className="text-xs text-gray-700 min-w-[40px]"
                          >
                            {row.lastYearRank != null
                              ? row.lastYearRank
                              : "–"}
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
                                      `${h.year}: ${h.totalScore.toFixed(
                                        1,
                                      )}`,
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
        </section>

        {/* RIGHT: Top Companies + Industry totals */}
        <aside className="space-y-3">
          <Panel id="top-companies">
            <PanelHeader title="Top Companies" />
            {topLoading ? (
              <PanelBody>
                <p className="text-sm text-gray-600">
                  Loading top companies…
                </p>
              </PanelBody>
            ) : topError ? (
              <PanelBody>
                <p className="text-sm text-red-600">
                  Failed to load top companies: {topError}
                </p>
              </PanelBody>
            ) : !topCompanies || !topCompanies.companies.length ? (
              <PanelBody>
                <p className="text-sm text-gray-600">
                  No company performance data yet.
                </p>
              </PanelBody>
            ) : (
              <PanelBody>
                <Table dense>
                  <TableHead>
                    <tr>
                      <Th>Rank</Th>
                      <Th>Company</Th>
                      <Th>Country</Th>
                      <Th>Ind.</Th>
                      <Th align="right">Output</Th>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {topCompanies.companies.map((c, idx) => (
                      <TableRow key={c.companyId}>
                        <Td className="text-xs text-gray-500">
                          {idx + 1}
                        </Td>
                        <Td>
                          <Link
                            href={`/company/${c.companyId}`}
                            className="text-xs text-blue-700 hover:underline"
                          >
                            {c.name}
                          </Link>
                        </Td>
                        <Td className="text-xs">
                          <Link
                            href={`/country/${c.countryId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {c.countryName}
                          </Link>
                        </Td>
                        <Td className="text-xs text-gray-700">
                          {INDUSTRY_LABELS[c.industry] ?? c.industry}
                        </Td>
                        <Td
                          align="right"
                          className="font-mono text-xs"
                        >
                          {c.outputScore.toFixed(1)}
                        </Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </PanelBody>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Per-Industry Totals (Top Companies)" />
            <PanelBody>
              {!industryTotals.length ? (
                <p className="text-sm text-gray-600">
                  Industry breakdown will appear once company performance
                  data is available.
                </p>
              ) : (
                <ul className="space-y-1 text-xs text-gray-700">
                  {industryTotals.map((row) => (
                    <li
                      key={row.industry}
                      className="flex items-center justify-between"
                    >
                      <span className="font-medium">
                        {INDUSTRY_LABELS[row.industry] ?? row.industry}
                      </span>
                      <span className="font-mono">
                        {row.totalOutput.toFixed(1)}{" "}
                        <span className="text-[10px] text-gray-500">
                          ({row.count}{" "}
                          {row.count === 1 ? "company" : "companies"})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelBody>
          </Panel>
        </aside>
      </div>
    </main>
  );
}
