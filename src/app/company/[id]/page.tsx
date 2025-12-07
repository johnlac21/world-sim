'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type HierarchyPerson = {
  id: number;
  name: string;
  age: number;
  countryId: number | null;
  intelligence: number;
  leadership: number;
  discipline: number;
  charisma: number;
};

type HierarchyRole = {
  roleId: number;
  roleName: string;
  rank: number;
  occupied: boolean;
  person: HierarchyPerson | null;
};

type CompanyInfo = {
  id: number;
  name: string;
  industry: string;
  countryId: number;
};

type CompanyHierarchyPayload = {
  company: CompanyInfo;
  hierarchy: HierarchyRole[];
};

// ---- Performance types ----

type PerformanceRow = {
  year: number;
  talentScore: number;
  leadershipScore: number;
  reliabilityScore: number;
  outputScore: number;
};

type CompanyPerformancePayload = {
  company: CompanyInfo;
  currentYear: number;
  currentPerformance: PerformanceRow | null;
  history: PerformanceRow[];
};

export default function CompanyPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [hierarchyData, setHierarchyData] =
    useState<CompanyHierarchyPayload | null>(null);
  const [performanceData, setPerformanceData] =
    useState<CompanyPerformancePayload | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const [hierarchyRes, perfRes] = await Promise.all([
          fetch(`/api/company/${id}/hierarchy`),
          fetch(`/api/company/${id}`),
        ]);

        if (!hierarchyRes.ok) {
          const body = await hierarchyRes.json().catch(() => ({}));
          throw new Error(
            body.error ||
              `Hierarchy request failed (${hierarchyRes.status})`,
          );
        }

        if (!perfRes.ok) {
          const body = await perfRes.json().catch(() => ({}));
          throw new Error(
            body.error || `Performance request failed (${perfRes.status})`,
          );
        }

        const hierarchyJson =
          (await hierarchyRes.json()) as CompanyHierarchyPayload;
        const perfJson =
          (await perfRes.json()) as CompanyPerformancePayload;

        setHierarchyData(hierarchyJson);
        setPerformanceData(perfJson);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.message ??
            'Failed to load company hierarchy / performance',
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return <main className="p-4">Loading company…</main>;
  }

  if (
    error ||
    !hierarchyData ||
    (hierarchyData as any).error ||
    !performanceData ||
    (performanceData as any).error
  ) {
    return (
      <main className="p-4 space-y-2">
        <p>Company not found or failed to load.</p>
        <Link href="/" className="text-blue-600 underline">
          ← Back to world
        </Link>
      </main>
    );
  }

  const { company, hierarchy } = hierarchyData;
  const {
    currentYear,
    currentPerformance,
    history,
  } = performanceData;

  return (
    <main className="flex flex-col md:flex-row">
      {/* MAIN CONTENT */}
      <section className="flex-1 p-4 space-y-6 md:p-6">
        <header className="space-y-1">
          <Link href="/" className="text-blue-600 underline">
            ← Back to world
          </Link>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-sm text-gray-600">
            Industry:{' '}
            <span className="font-medium">{company.industry}</span>
          </p>
          <p className="text-xs text-gray-500">
            World year: {currentYear}
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Company Overview</h2>
          <p className="text-sm text-gray-600">
            This page shows the company&apos;s current leadership hierarchy
            in the sidebar and its simulated yearly performance below.
          </p>
        </section>

        {/* PERFORMANCE PANEL */}
        <section className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Performance</h2>

          {history.length === 0 ? (
            <p className="text-sm text-gray-600">
              No performance data yet — simulate a year to see results.
            </p>
          ) : (
            <>
              {/* Current-year summary */}
              {currentPerformance ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Year {currentPerformance.year} performance:
                    <span className="ml-1 text-base font-semibold">
                      {currentPerformance.outputScore.toFixed(1)}
                    </span>
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
                    <div>
                      <div className="font-semibold">Talent</div>
                      <div>{currentPerformance.talentScore.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Leadership</div>
                      <div>
                        {currentPerformance.leadershipScore.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Reliability</div>
                      <div>
                        {currentPerformance.reliabilityScore.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  This company has historical performance but no record for
                  year {currentYear} yet.
                </p>
              )}

              {/* History table */}
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-2">History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left border-b">
                          Year
                        </th>
                        <th className="px-2 py-1 text-right border-b">
                          Output
                        </th>
                        <th className="px-2 py-1 text-right border-b">
                          Talent
                        </th>
                        <th className="px-2 py-1 text-right border-b">
                          Leadership
                        </th>
                        <th className="px-2 py-1 text-right border-b">
                          Reliability
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((row) => (
                        <tr
                          key={row.year}
                          className="odd:bg-white even:bg-gray-50"
                        >
                          <td className="px-2 py-1 border-b">{row.year}</td>
                          <td className="px-2 py-1 text-right border-b">
                            {row.outputScore.toFixed(1)}
                          </td>
                          <td className="px-2 py-1 text-right border-b">
                            {row.talentScore.toFixed(1)}
                          </td>
                          <td className="px-2 py-1 text-right border-b">
                            {row.leadershipScore.toFixed(1)}
                          </td>
                          <td className="px-2 py-1 text-right border-b">
                            {row.reliabilityScore.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </section>

      {/* SIDEBAR: HIERARCHY */}
      <aside className="w-full max-w-xs border-t border-gray-200 bg-gray-50/80 px-4 py-4 md:border-l md:border-t-0 md:px-5 md:py-5 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
          Company Hierarchy
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Roles from President down to Worker, maintained by the yearly
          promotion &amp; hiring logic.
        </p>

        {hierarchy.length === 0 ? (
          <p className="text-xs text-gray-500 italic">
            No hierarchy roles defined for this company&apos;s industry yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {hierarchy.map((slot) => (
              <li
                key={slot.roleId}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-800">
                    {slot.roleName}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase">
                    Rank {slot.rank}
                  </span>
                </div>

                {slot.occupied && slot.person ? (
                  <div className="mt-1">
                    <p className="text-xs font-medium text-gray-800">
                      {slot.person.name}
                      <span className="ml-1 text-[10px] text-gray-500">
                        ({slot.person.age})
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-600">
                      Int {slot.person.intelligence} · Lead{' '}
                      {slot.person.leadership} · Disc{' '}
                      {slot.person.discipline} · Cha {slot.person.charisma}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-xs italic text-gray-400">
                    Vacant — will be filled next sim year if candidates are
                    available.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </main>
  );
}
