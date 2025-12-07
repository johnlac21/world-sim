'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type IndustryStanding = {
  industry: string;
  numCompanies: number;
  totalOutput: number;
  averageOutput: number | null;
};

type CountryStanding = {
  country: {
    id: number;
    name: string;
  };
  overall: {
    totalOutput: number;
    averageOutput: number | null;
  };
  industries: IndustryStanding[];
};

type ApiResponse = {
  world: {
    id: number;
    name: string;
    currentYear: number;
  };
  standings: CountryStanding[];
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
  };
  companies: TopCompany[];
};

const INDUSTRY_LABELS: Record<string, string> = {
  TECH: 'Tech',
  FINANCE: 'Finance',
  RESEARCH: 'Research',
};

export default function WorldStandingsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<
    'overall' | 'TECH' | 'FINANCE' | 'RESEARCH'
  >('overall');

  // Top companies state
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
    return <main className="p-4">Loading national standings…</main>;
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

  // Sorted standings (same logic as before)
  const sortedStandings = [...standings].sort((a, b) => {
    if (sortKey === 'overall') {
      if (b.overall.totalOutput !== a.overall.totalOutput) {
        return b.overall.totalOutput - a.overall.totalOutput;
      }
      const aAvg = a.overall.averageOutput ?? 0;
      const bAvg = b.overall.averageOutput ?? 0;
      if (bAvg !== aAvg) return bAvg - aAvg;
      return a.country.name.localeCompare(b.country.name);
    }

    const getIndTotal = (row: CountryStanding) => {
      const block = row.industries.find(
        (ind) => ind.industry === sortKey,
      );
      return block ? block.totalOutput : 0;
    };

    const aTot = getIndTotal(a);
    const bTot = getIndTotal(b);

    if (bTot !== aTot) return bTot - aTot;
    return a.country.name.localeCompare(b.country.name);
  });

  // Global industry view derived from standings (no hooks)
  const globalIndustryStats = (() => {
    type GlobalInd = {
      industry: string;
      totalOutput: number;
      totalCompanies: number;
      bestCountryId: number | null;
      bestCountryName: string | null;
      bestCountryOutput: number;
    };

    const map = new Map<string, GlobalInd>();

    for (const row of standings) {
      for (const ind of row.industries) {
        let entry = map.get(ind.industry);
        if (!entry) {
          entry = {
            industry: ind.industry,
            totalOutput: 0,
            totalCompanies: 0,
            bestCountryId: null,
            bestCountryName: null,
            bestCountryOutput: 0,
          };
          map.set(ind.industry, entry);
        }

        entry.totalOutput += ind.totalOutput;
        entry.totalCompanies += ind.numCompanies;

        if (ind.totalOutput > entry.bestCountryOutput) {
          entry.bestCountryOutput = ind.totalOutput;
          entry.bestCountryId = row.country.id;
          entry.bestCountryName = row.country.name;
        }
      }
    }

    return Array.from(map.values());
  })();

  return (
    <main className="p-4 space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <Link href="/" className="text-blue-600 underline">
          ← Back to world overview
        </Link>
        <h1 className="text-2xl font-bold">
          National Industry Standings
        </h1>
        <p className="text-sm text-gray-600">
          World: {world.name} · Year {world.currentYear}
        </p>
        <p className="text-xs text-gray-500">
          Countries are ranked by total industry output (v1). Use the sort
          control to focus on a specific industry.
        </p>
      </header>

      {/* Sort controls */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Sort by
          </p>
          <p className="text-xs text-gray-500">
            Overall or per-industry total output.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setSortKey('overall')}
            className={[
              'rounded-md border px-3 py-1',
              sortKey === 'overall'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            Overall
          </button>
          <button
            type="button"
            onClick={() => setSortKey('TECH')}
            className={[
              'rounded-md border px-3 py-1',
              sortKey === 'TECH'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            Tech
          </button>
          <button
            type="button"
            onClick={() => setSortKey('FINANCE')}
            className={[
              'rounded-md border px-3 py-1',
              sortKey === 'FINANCE'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            Finance
          </button>
          <button
            type="button"
            onClick={() => setSortKey('RESEARCH')}
            className={[
              'rounded-md border px-3 py-1',
              sortKey === 'RESEARCH'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            Research
          </button>
        </div>
      </section>

      {/* Standings table */}
      {sortedStandings.length === 0 ? (
        <p className="text-sm text-gray-600">
          No standings yet — this world has no countries with companies
          and performance data.
        </p>
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
                  Overall Total
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Overall Avg
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tech Total
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Finance Total
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Research Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sortedStandings.map((row, idx) => {
                const tech = row.industries.find(
                  (i) => i.industry === 'TECH',
                );
                const fin = row.industries.find(
                  (i) => i.industry === 'FINANCE',
                );
                const res = row.industries.find(
                  (i) => i.industry === 'RESEARCH',
                );

                return (
                  <tr
                    key={row.country.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/country/${row.country.id}`}
                        className="text-sm font-medium text-blue-700 hover:underline"
                      >
                        {row.country.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.overall.totalOutput.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.overall.averageOutput != null
                        ? row.overall.averageOutput.toFixed(1)
                        : 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-700">
                      {tech ? tech.totalOutput.toFixed(1) : '0.0'}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-700">
                      {fin ? fin.totalOutput.toFixed(1) : '0.0'}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-700">
                      {res ? res.totalOutput.toFixed(1) : '0.0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Global industry performance */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Global Industry Performance
        </h2>
        {globalIndustryStats.length === 0 ? (
          <p className="text-sm text-gray-600">
            No industry performance data yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left border-b">
                    Industry
                  </th>
                  <th className="px-2 py-1 text-right border-b">
                    World Total Output
                  </th>
                  <th className="px-2 py-1 text-right border-b">
                    Avg per Company
                  </th>
                  <th className="px-2 py-1 text-left border-b">
                    Best Country
                  </th>
                  <th className="px-2 py-1 text-right border-b">
                    Best Country Output
                  </th>
                </tr>
              </thead>
              <tbody>
                {globalIndustryStats.map((ind) => {
                  const avg =
                    ind.totalCompanies === 0
                      ? null
                      : ind.totalOutput / ind.totalCompanies;
                  return (
                    <tr
                      key={ind.industry}
                      className="odd:bg-white even:bg-gray-50"
                    >
                      <td className="px-2 py-1 border-b">
                        {INDUSTRY_LABELS[ind.industry] ?? ind.industry}
                      </td>
                      <td className="px-2 py-1 border-b text-right">
                        {ind.totalOutput.toFixed(1)}
                      </td>
                      <td className="px-2 py-1 border-b text-right">
                        {avg === null ? '—' : avg.toFixed(1)}
                      </td>
                      <td className="px-2 py-1 border-b">
                        {ind.bestCountryId ? (
                          <Link
                            href={`/country/${ind.bestCountryId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {ind.bestCountryName}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-2 py-1 border-b text-right">
                        {ind.bestCountryOutput.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Top companies */}
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
        ) : !topCompanies || topCompanies.companies.length === 0 ? (
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
