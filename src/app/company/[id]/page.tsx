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
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const json = (await res.json()) as CompanyHierarchyPayload;
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? 'Failed to load company hierarchy');
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

  const { company, hierarchy } = data;

  return (
    <main className="flex flex-col md:flex-row">
      {/* MAIN CONTENT */}
      <section className="flex-1 p-4 space-y-4 md:p-6">
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

        <section className="mt-4 space-y-2">
          <h2 className="text-lg font-semibold">Company Overview</h2>
          <p className="text-sm text-gray-600">
            This is a placeholder for company details (employees, performance,
            etc.). The right-hand sidebar shows the current role hierarchy.
          </p>
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
