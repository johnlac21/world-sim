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
  worldId: number;
};

type LatestPerformance = {
  year: number;
  talentScore: number;
  leadershipScore: number;
  reliabilityScore: number;
  outputScore: number;
} | null;

type CompanyHierarchyPayload = {
  company: CompanyInfo;
  hierarchy: HierarchyRole[];
  latestPerformance: LatestPerformance;
};

export default function CompanyPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<CompanyHierarchyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/company/${id}/hierarchy`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error || `Hierarchy request failed (${res.status})`,
          );
        }

        const json = (await res.json()) as CompanyHierarchyPayload;
        setData(json);
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

  if (error || !data || (data as any).error) {
    return (
      <main className="p-4 space-y-2">
        <p>Company not found or failed to load.</p>
        <Link href="/" className="text-blue-600 underline">
          ← Back to world
        </Link>
      </main>
    );
  }

  const { company, hierarchy, latestPerformance } = data;

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
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Company Overview</h2>
          <p className="text-sm text-gray-600">
            This page shows the company&apos;s current leadership hierarchy
            in the sidebar and its yearly performance below.
          </p>
        </section>

        {/* PERFORMANCE (CURRENT YEAR) PANEL */}
        <section className="border border-gray-200 rounded-lg bg-gray-50 p-4 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Performance (Current Year)</h2>

          {latestPerformance === null ? (
            <p className="text-sm text-gray-600">
              No performance data yet — simulate a year to generate company
              output.
            </p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">
                  Performance — Year {latestPerformance.year}
                </p>
                <p className="mt-1 text-sm">
                  Output Score:{' '}
                  <span className="font-semibold">
                    {latestPerformance.outputScore.toFixed(1)}
                  </span>
                </p>
              </div>

              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium">Breakdown:</p>
                <p>
                  Talent:{' '}
                  <span className="font-mono">
                    {latestPerformance.talentScore.toFixed(1)}
                  </span>
                </p>
                <p>
                  Leadership:{' '}
                  <span className="font-mono">
                    {latestPerformance.leadershipScore.toFixed(1)}
                  </span>
                </p>
                <p>
                  Reliability:{' '}
                  <span className="font-mono">
                    {latestPerformance.reliabilityScore.toFixed(1)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* View in standings */}
          <div className="pt-2 border-t border-gray-200 mt-2">
            <Link
              href={`/world/${company.worldId}/standings`}
              className="text-sm text-blue-600 hover:underline"
            >
              View Country &amp; World Rankings →
            </Link>
          </div>
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
                    <p className="mt-0.5 text[11px] text-gray-600">
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
