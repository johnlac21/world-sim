// app/world/[id]/standings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Trend = 'up' | 'down' | 'same' | 'new';

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

// Top companies types (unchanged)
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
  TECH: 'Tech',
  FINANCE: 'Finance',
  RESEARCH: 'Research',
};

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'up') {
    return <span className="text-green-600 text-sm">↑</span>;
  }
  if (trend === 'down') {
    return <span className="text-red-600 text-sm">↓</span>;
  }
  if (trend === 'same') {
    return <span className="text-gray-500 text-sm">→</span>;
  }
  // 'new'
  return <span className="text-blue-600 text-sm">•</span>;
}

export default function WorldStandingsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Top companies state (unchanged)
  const [topCompanies, setTopCompanies] =
    useState<TopCompaniesResponse | null>(null);
  const [topLoading, setTopLoading] = useState(true);
  const [topError, setTopError] = useState<string | null>(null);

  // --------- LOAD STANDINGS (CountryYearPerformance-based) ---------
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
          setError(e.message ?? 'Failed to load standings');
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

  // --------- LOAD TOP COMPANIES (unchanged) ---------
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
          setTopError(e.message ?? 'Failed to load top companies');
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

  // --------- EARLY RETURNS (NO HOOKS BELOW THIS LINE) ---------
  if (loading) {
    return <main className="p-4">Loading league table…</main>;
  }

  if (error || !data) {
    return (
      <main className="p-4 space-y-3">
        <p className="text-red-600">
          Failed to load standings
          {error ? `: ${error}` : '.'}
        </p>
        <Link href="/" className="text-blue-600 underline">
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
        <Link href="/" className="text-blue-600 underline">
          ← Back to world overview
        </Link>
      </main>
    );
  }

  // Ensure standings are sorted by currentRank ascending
  const sortedStandings = [...standings].sort(
    (a, b) => a.currentRank - b.currentRank,
  );

  return (
    <main className="p-4 space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <Link href="/" className="text-blue-600 underline">
          ← Back to world overview
        </Link>
        <h1 className="text-2xl font-bold">Country Standings</h1>
        <p className="text-sm text-gray-600">
          World: {world.name} · Year {world.currentYear}
        </p>
        <p className="text-xs text-gray-500">
          Countries are ranked by their <code>totalScore</code> from{' '}
          <code>CountryYearPerformance</code> for the current season. Arrows
          show movement compared to last year.
        </p>
      </header>

      {/* League Table */}
      {sortedStandings.length === 0 ? (
        <section>
          <p className="text-sm text-gray-600">
            No league standings yet — simulate at least one year to generate
            country performance.
          </p>
        </section>
      ) : (
        <section className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Rank
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Country
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Score
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Last Year
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Trend
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Recent Seasons
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sortedStandings.map((row) => {
                const historySorted = [...row.history].sort(
                  (a, b) => a.year - b.year,
                );

                return (
                  <tr
                    key={row.countryId}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {row.currentRank}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/country/${row.countryId}`}
                        className="text-sm font-medium text-blue-700 hover:underline"
                      >
                        {row.countryName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.totalScore.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-700">
                      {row.lastYearRank != null ? row.lastYearRank : '–'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <TrendIcon trend={row.trend} />
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {historySorted.length === 0 ? (
                        <span>—</span>
                      ) : (
                        <span>
                          {historySorted
                            .map(
                              (h) =>
                                `${h.year}: ${h.totalScore.toFixed(1)}`,
                            )
                            .join(' · ')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Top companies (unchanged) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Top Companies</h2>
        {topLoading ? (
          <p className="text-sm text-gray-600">
            Loading top companies…
          </p>
        ) : topError ? (
          <p className="text-sm text-red-600">
            Failed to load top companies: {topError}
          </p>
        ) : !topCompanies || !topCompanies.companies.length ? (
          <p className="text-sm text-gray-600">
            No company performance data yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left border-b">Rank</th>
                  <th className="px-2 py-1 text-left border-b">Company</th>
                  <th className="px-2 py-1 text-left border-b">Country</th>
                  <th className="px-2 py-1 text-left border-b">
                    Industry
                  </th>
                  <th className="px-2 py-1 text-right border-b">
                    Output
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCompanies.companies.map((c, idx) => (
                  <tr
                    key={c.companyId}
                    className="odd:bg-white even:bg-gray-50"
                  >
                    <td className="px-2 py-1 border-b align-middle">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-1 border-b align-middle">
                      <Link
                        href={`/company/${c.companyId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-2 py-1 border-b align-middle">
                      <Link
                        href={`/country/${c.countryId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {c.countryName}
                      </Link>
                    </td>
                    <td className="px-2 py-1 border-b align-middle">
                      {INDUSTRY_LABELS[c.industry] ?? c.industry}
                    </td>
                    <td className="px-2 py-1 border-b text-right align-middle">
                      {c.outputScore.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
