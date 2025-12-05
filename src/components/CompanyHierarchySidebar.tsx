'use client';

import { useEffect, useState } from 'react';

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

type ApiResponse = {
  company: CompanyInfo;
  hierarchy: HierarchyRole[];
};

type Props = {
  companyId: number;
};

export function CompanyHierarchySidebar({ companyId }: Props) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHierarchy() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/company/${companyId}/hierarchy`);
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
          setError(e.message ?? 'Failed to load hierarchy');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchHierarchy();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return (
    <aside className="w-full max-w-xs border-l border-gray-200 bg-gray-50/80 px-4 py-4 md:px-5 md:py-5 sticky top-0 h-screen overflow-y-auto">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
        Company Hierarchy
      </h2>

      {data && (
        <p className="text-xs text-gray-500 mb-3">
          {data.company.name} ·{' '}
          <span className="font-medium">{data.company.industry}</span>
        </p>
      )}

      {loading && (
        <p className="text-xs text-gray-500 italic">Loading hierarchy…</p>
      )}

      {error && !loading && (
        <p className="text-xs text-red-500">Error: {error}</p>
      )}

      {!loading && !error && data && (
        <ul className="space-y-1.5">
          {data.hierarchy.map((slot) => (
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
                    Int {slot.person.intelligence} · Lead {slot.person.leadership} ·
                    Disc {slot.person.discipline} · Cha {slot.person.charisma}
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-xs italic text-gray-400">
                  Vacant — will be filled next sim year if candidates are available.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
