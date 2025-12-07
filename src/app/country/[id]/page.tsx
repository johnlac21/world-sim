// src/app/country/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

type CountryPayload = {
  id: number;
  name: string;
  worldId: number;
  worldName: string;
  offices: CountryOffice[];
  // New: optional performance summary
  performance?: CountryPerformanceSummary | null;
};

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
    return <main className="p-4">Loading country…</main>;
  }

  if (!data || (data as any).error) {
    return (
      <main className="p-4 space-y-2">
        <p>Country not found.</p>
        <Link href="/" className="text-blue-600 underline">
          ← Back to world
        </Link>
      </main>
    );
  }

  const perf = data.performance ?? null;

  return (
    <main className="p-4 space-y-6">
      <header className="space-y-1">
        <Link href="/" className="text-blue-600 underline">
          ← Back to world
        </Link>
        <h1 className="text-2xl font-bold">
          {data.name} — Political History
        </h1>
        <p className="text-sm text-gray-600">World: {data.worldName}</p>
        <p className="mt-1">
          <Link
            href={`/country/${id}/industry`}
            className="text-sm text-blue-600 underline"
          >
            View Industry Structure →
          </Link>
        </p>
      </header>

      {/* Country Performance Panel (NEW) */}
      <section className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Country Performance</h2>

        {!perf || perf.overall.numCompanies === 0 ? (
          <p className="text-sm text-gray-600">
            No performance data yet for this country — simulate a year to see
            results.
          </p>
        ) : (
          <>
            {/* Overall summary */}
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Year {perf.year} performance:
                <span className="ml-1 text-base font-semibold">
                  {perf.overall.totalOutput.toFixed(1)}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                Companies with performance:{' '}
                <span className="font-medium">
                  {perf.overall.numCompanies}
                </span>{' '}
                · Average output per company:{' '}
                <span className="font-medium">
                  {perf.overall.averageOutput === null
                    ? '—'
                    : perf.overall.averageOutput.toFixed(1)}
                </span>
              </p>
            </div>

            {/* Per-industry table */}
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">
                Performance by industry
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left border-b">
                        Industry
                      </th>
                      <th className="px-2 py-1 text-right border-b">
                        Companies
                      </th>
                      <th className="px-2 py-1 text-right border-b">
                        Total Output
                      </th>
                      <th className="px-2 py-1 text-right border-b">
                        Avg Output
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {perf.industries.map((ind) => (
                      <tr
                        key={ind.industry}
                        className="odd:bg-white even:bg-gray-50"
                      >
                        <td className="px-2 py-1 border-b">
                          {ind.industry}
                        </td>
                        <td className="px-2 py-1 text-right border-b">
                          {ind.numCompanies}
                        </td>
                        <td className="px-2 py-1 text-right border-b">
                          {ind.totalOutput.toFixed(1)}
                        </td>
                        <td className="px-2 py-1 text-right border-b">
                          {ind.averageOutput === null
                            ? '—'
                            : ind.averageOutput.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top companies list */}
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Top companies</h3>
              {perf.topCompanies.length === 0 ? (
                <p className="text-xs text-gray-600">
                  No companies with performance this year.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left border-b">
                          Company
                        </th>
                        <th className="px-2 py-1 text-left border-b">
                          Industry
                        </th>
                        <th className="px-2 py-1 text-right border-b">
                          Output
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {perf.topCompanies.map((c) => (
                        <tr
                          key={c.companyId}
                          className="odd:bg-white even:bg-gray-50"
                        >
                          <td className="px-2 py-1 border-b">
                            <Link
                              href={`/company/${c.companyId}`}
                              className="text-blue-600 hover:underline"
                            >
                              {c.name}
                            </Link>
                          </td>
                          <td className="px-2 py-1 border-b">
                            {c.industry}
                          </td>
                          <td className="px-2 py-1 text-right border-b">
                            {c.outputScore.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Existing political history below */}
      {data.offices.length === 0 ? (
        <p>No political offices defined for this country.</p>
      ) : (
        data.offices.map((office) => (
          <section key={office.id} className="space-y-2">
            <h2 className="text-xl font-semibold">{office.name}</h2>
            <p className="text-sm text-gray-600">
              Level: {office.level} · Term length: {office.termLength} years ·
              Prestige: {office.prestige}
            </p>

            <div className="mt-2">
              <h3 className="font-semibold">Current office holder</h3>
              {office.currentTerm ? (
                <p>
                  {office.currentTerm.personName} (since year{' '}
                  {office.currentTerm.startYear})
                </p>
              ) : (
                <p>No current office holder.</p>
              )}
            </div>

            <div className="mt-3">
              <h3 className="font-semibold">Past terms</h3>
              {office.pastTerms.length === 0 ? (
                <p className="text-sm text-gray-600">No past terms yet.</p>
              ) : (
                <ul className="list-disc ml-6 text-sm">
                  {office.pastTerms.map((t) => (
                    <li key={t.id}>
                      {t.personName} — {t.startYear}
                      {t.endYear != null ? `–${t.endYear}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
