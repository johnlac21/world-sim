// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/SectionHeader';

type WorldSummary = {
  id: number;
  name: string;
  currentYear: number;
  countriesCount?: number;
  peopleCount: number;
  companiesCount?: number;
  countries?: { id: number; name: string }[];
  samplePeople?: {
    id: number;
    name: string;
    age: number;
    countryId: number;
    isAlive: boolean;
  }[];
};

type StandingRow = {
  countryId: number;
  countryName: string;
  currentRank: number;
  lastYearRank: number | null;
  trend: 'up' | 'down' | 'same' | 'new';
  totalScore: number;
};

type TopCompanyRow = {
  companyId: number;
  name: string;
  industry: string;
  countryId: number;
  countryName: string;
  outputScore: number;
};

export default function HomePage() {
  const [world, setWorld] = useState<WorldSummary | null>(null);
  const [loadingWorld, setLoadingWorld] = useState(false);

  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);

  const [topCompanies, setTopCompanies] = useState<TopCompanyRow[]>([]);
  const [loadingTopCompanies, setLoadingTopCompanies] = useState(false);

  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);

  // ---------- data loaders --------------------------------------------------

  const loadWorld = async () => {
    setLoadingWorld(true);
    try {
      const res = await fetch('/api/world');
      const data = (await res.json()) as WorldSummary;
      setWorld(data);
      return data;
    } catch (err) {
      console.error('[Home] Failed to load world:', err);
      setWorld(null);
      return null;
    } finally {
      setLoadingWorld(false);
    }
  };

  const loadStandings = async (worldId: number) => {
    setLoadingStandings(true);
    try {
      const res = await fetch(`/api/world/${worldId}/standings`);
      if (!res.ok) throw new Error('standings request failed');
      const json = await res.json();
      setStandings(json.standings ?? []);
    } catch (err) {
      console.error('[Home] Failed to load standings:', err);
      setStandings([]);
    } finally {
      setLoadingStandings(false);
    }
  };

  const loadTopCompanies = async (worldId: number) => {
    setLoadingTopCompanies(true);
    try {
      const res = await fetch(`/api/world/${worldId}/top-companies`);
      if (!res.ok) throw new Error('top companies request failed');
      const json = await res.json();
      setTopCompanies(json.companies ?? []);
    } catch (err) {
      console.error('[Home] Failed to load top companies:', err);
      setTopCompanies([]);
    } finally {
      setLoadingTopCompanies(false);
    }
  };

  useEffect(() => {
    (async () => {
      const w = await loadWorld();
      if (w && w.id) {
        void loadStandings(w.id);
        void loadTopCompanies(w.id);
      }
    })();
  }, []);

  const reloadAll = async () => {
    const w = await loadWorld();
    if (w && w.id) {
      void loadStandings(w.id);
      void loadTopCompanies(w.id);
    }
  };

  // ---------- sim + reset ---------------------------------------------------

  const handleSimYear = async () => {
    setSimulating(true);
    try {
      await fetch('/api/sim/year', { method: 'POST' });
      await reloadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetWorld = async () => {
    if (!confirm('Reset world? This will delete and regenerate everything.')) {
      return;
    }
    setResetting(true);
    try {
      await fetch('/api/world/reset', { method: 'POST' });
      await reloadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  // ---------- loading guards ------------------------------------------------

  if (loadingWorld && !world) {
    return <main className="px-3 py-4 md:px-4">Loading world…</main>;
  }
  if (!world) {
    return <main className="px-3 py-4 md:px-4">No world found.</main>;
  }

  const countries = world.countries ?? [];
  const samplePeople = world.samplePeople ?? [];
  const miniStandings = standings.slice(0, 8);

  // tiny headline generation
  const headlines: { id: string; title: string; body: string; href?: string }[] =
    [];

  if (standings.length > 0) {
    const champion = standings[0];
    headlines.push({
      id: 'champion',
      title: `${champion.countryName} on top`,
      body: `Currently ranked #${champion.currentRank} with total score ${champion.totalScore.toFixed(
        0,
      )}.`,
      href: `/country/${champion.countryId}`,
    });
  }

  if (topCompanies.length > 0) {
    const best = topCompanies[0];
    headlines.push({
      id: 'top-company',
      title: `${best.name} leads ${best.industry}`,
      body: `Top company this year with outputScore ${best.outputScore.toFixed(
        0,
      )} (${best.countryName}).`,
      href: `/company/${best.companyId}`,
    });
  }

  if (samplePeople.length > 0) {
    const notable = samplePeople[0];
    headlines.push({
      id: 'notable-person',
      title: `${notable.name} in the spotlight`,
      body: `Age ${notable.age} from countryId ${notable.countryId}${
        !notable.isAlive ? ' (retired / deceased)' : ''
      }.`,
      href: `/person/${notable.id}`,
    });
  }

  const trendSymbol = (t: StandingRow['trend']) =>
    t === 'up' ? '↑' : t === 'down' ? '↓' : t === 'same' ? '→' : '★';

  // ---------- render --------------------------------------------------------

  return (
    <main className="px-3 py-4 md:px-4 md:py-6">
      <SectionHeader
        eyebrow="World overview"
        title={world.name}
        description={`Year ${world.currentYear} · Countries: ${
          world.countriesCount ?? countries.length
        } · Total people: ${world.peopleCount}${
          world.companiesCount != null ? ` · Companies: ${world.companiesCount}` : ''
        }`}
      />

      {/* BBGM-style flat layout: single "sheet" with three columns */}
      <div className="grid gap-6 md:grid-cols-12 text-[13px]">
        {/* LEFT COLUMN ------------------------------------------------------ */}
        <section className="md:col-span-3 space-y-6">
          {/* Mini standings */}
          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Mini standings
              </div>
              <Link
                href={`/world/${world.id}/standings`}
                className="text-[11px] font-medium text-blue-600 hover:underline"
              >
                Full standings →
              </Link>
            </div>
            <div className="text-[11px] text-gray-500 mb-1">
              Year {world.currentYear}
            </div>

            {loadingStandings ? (
              <p className="text-[11px] text-gray-500">Loading standings…</p>
            ) : miniStandings.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                No standings yet. Sim a year to populate.
              </p>
            ) : (
              <table className="min-w-full border-collapse text-[12px]">
                <thead className="border-b border-gray-300 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="py-1 pr-2 text-right">#</th>
                    <th className="py-1 px-2 text-left">Country</th>
                    <th className="py-1 px-2 text-right">Score</th>
                    <th className="py-1 pl-2 pr-1 text-center">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {miniStandings.map((row, idx) => (
                    <tr
                      key={row.countryId}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="py-1 pr-2 text-right">{row.currentRank}</td>
                      <td className="py-1 px-2">
                        <Link
                          href={`/country/${row.countryId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {row.countryName}
                        </Link>
                      </td>
                      <td className="py-1 px-2 text-right">
                        {row.totalScore.toFixed(0)}
                      </td>
                      <td className="py-1 pl-2 pr-1 text-center text-[11px]">
                        <span
                          className={
                            row.trend === 'up'
                              ? 'text-green-600'
                              : row.trend === 'down'
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }
                        >
                          {trendSymbol(row.trend)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Countries list */}
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
              Countries
            </div>
            {countries.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                No countries in this world yet.
              </p>
            ) : (
              <ul className="ml-4 list-disc space-y-0.5 text-[12px]">
                {countries.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/country/${c.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* CENTER COLUMN ----------------------------------------------------- */}
        <section className="md:col-span-6 space-y-6">
          {/* World snapshot */}
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
              World snapshot
            </div>
            <div className="grid grid-cols-2 gap-y-1 gap-x-6 md:grid-cols-4 text-[12px]">
              <div>
                <div className="text-gray-500">Year</div>
                <div className="font-semibold text-gray-900">
                  {world.currentYear}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Countries</div>
                <div className="font-semibold text-gray-900">
                  {world.countriesCount ?? countries.length}
                </div>
              </div>
              <div>
                <div className="text-gray-500">People</div>
                <div className="font-semibold text-gray-900">
                  {world.peopleCount.toLocaleString()}
                </div>
              </div>
              {world.companiesCount != null && (
                <div>
                  <div className="text-gray-500">Companies</div>
                  <div className="font-semibold text-gray-900">
                    {world.companiesCount}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <button
                onClick={handleSimYear}
                disabled={simulating}
                className="rounded border border-gray-300 bg-white px-2 py-1 font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                {simulating ? 'Simulating…' : 'Sim 1 year'}
              </button>
              <button
                onClick={handleResetWorld}
                disabled={resetting}
                className="rounded border border-red-200 bg-red-50 px-2 py-1 font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                {resetting ? 'Resetting…' : 'Reset world'}
              </button>
              <Link
                href="/player"
                className="rounded bg-blue-600 px-2 py-1 font-semibold text-white hover:bg-blue-700"
              >
                My country dashboard
              </Link>
            </div>
          </div>

          {/* Top companies table */}
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
              Top companies this year
            </div>
            <div className="mb-1 text-[11px] text-gray-500">
              League leaders by outputScore
            </div>

            {loadingTopCompanies ? (
              <p className="text-[11px] text-gray-500">
                Loading top companies…
              </p>
            ) : topCompanies.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                No company performance yet. Sim a year to generate scores.
              </p>
            ) : (
              <table className="min-w-full border-collapse text-[12px]">
                <thead className="border-b border-gray-300 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="py-1 pr-2 text-right">#</th>
                    <th className="py-1 px-2 text-left">Company</th>
                    <th className="py-1 px-2 text-left">Country</th>
                    <th className="py-1 px-2 text-left">Industry</th>
                    <th className="py-1 pl-2 pr-1 text-right">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {topCompanies.map((c, idx) => (
                    <tr
                      key={c.companyId}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="py-1 pr-2 text-right">{idx + 1}</td>
                      <td className="py-1 px-2">
                        <Link
                          href={`/company/${c.companyId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-1 px-2">
                        <Link
                          href={`/country/${c.countryId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {c.countryName}
                        </Link>
                      </td>
                      <td className="py-1 px-2">{c.industry}</td>
                      <td className="py-1 pl-2 pr-1 text-right">
                        {c.outputScore.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN ------------------------------------------------------ */}
        <section className="md:col-span-3 space-y-6">
          {/* League headlines */}
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
              League headlines
            </div>
            <div className="text-[11px] text-gray-500 mb-1">
              Quick story of the current season
            </div>
            {headlines.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                No major stories yet. Sim a few years and check back.
              </p>
            ) : (
              <div className="space-y-2">
                {headlines.map((h) => (
                  <div
                    key={h.id}
                    className="border border-gray-200 bg-white px-2 py-2 text-[12px]"
                  >
                    <div className="font-semibold text-gray-900">
                      {h.href ? (
                        <Link
                          href={h.href}
                          className="text-blue-700 hover:underline"
                        >
                          {h.title}
                        </Link>
                      ) : (
                        h.title
                      )}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      {h.body}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* People sample */}
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
              People (sample)
            </div>
            {samplePeople.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                No sample people loaded yet.
              </p>
            ) : (
              <ul className="ml-4 list-disc space-y-0.5 text-[12px]">
                {samplePeople.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/person/${p.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {p.name}
                    </Link>{' '}
                    — age {p.age} — countryId {p.countryId}
                    {!p.isAlive && ' (dead)'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
