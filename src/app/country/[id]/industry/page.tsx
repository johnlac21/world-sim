'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { Panel } from '@/components/ui/Panel';

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

type CompanyPerformance = {
  year: number;
  talentScore: number;
  leadershipScore: number;
  reliabilityScore: number;
  outputScore: number;
};

type IndustryCompany = {
  id: number;
  name: string;
  industry: string;
  countryId: number;
  hierarchy: HierarchyRole[];
  performance: CompanyPerformance | null;
};

type IndustryAggregate = {
  year: number;
  numCompanies: number;
  totalOutputScore: number;
  averageOutputScore: number | null;
};

type IndustryBlock = {
  industry: string;
  aggregate: IndustryAggregate;
  companies: IndustryCompany[];
};

type ApiResponse = {
  country: {
    id: number;
    name: string;
  };
  world: {
    id: number;
    name: string;
    currentYear: number;
  };
  industries: IndustryBlock[];
};

const INDUSTRY_LABELS: Record<string, string> = {
  TECH: 'Tech',
  FINANCE: 'Finance',
  RESEARCH: 'Research',
};

export default function CountryIndustryPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/country/${id}/industry`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) {
          setData(json);
          const firstIndustry = json.industries[0]?.industry ?? null;
          setSelectedIndustry(firstIndustry);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message ?? 'Failed to load industry structure');
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

  if (loading) {
    return <main className="px-3 py-4 md:px-4">Loading industry structure…</main>;
  }

  if (error || !data) {
    return (
      <main className="px-3 py-4 md:px-4 space-y-3">
        <p className="text-red-600">
          Failed to load industry structure
          {error ? `: ${error}` : '.'}
        </p>
        <Link href={`/country/${id}`} className="text-blue-600 underline">
          ← Back to country
        </Link>
      </main>
    );
  }

  const currentIndustryBlock =
    selectedIndustry != null
      ? data.industries.find((blk) => blk.industry === selectedIndustry) ?? null
      : null;

  const currentLabel =
    currentIndustryBlock &&
    (INDUSTRY_LABELS[currentIndustryBlock.industry] ?? currentIndustryBlock.industry);

  return (
    <main className="px-3 py-4 md:px-4 md:py-6 space-y-6">
      <SectionHeader
        title={`${data.country.name} — Industry Structure`}
        eyebrow="Country industries"
        description={`World: ${data.world.name} · Year ${data.world.currentYear}`}
        backHref={`/country/${id}`}
        backLabel="Back to country"
      >
        <p className="mt-1 text-xs text-gray-500">
          View all companies and their leadership ladders for each industry in this
          country, plus a v0 performance score.
        </p>
      </SectionHeader>

      <section className="grid gap-4 md:grid-cols-[240px,1fr]">
        {/* LEFT: industry tabs */}
        <Panel title="Industries" padding="sm">
          {data.industries.length === 0 ? (
            <p className="text-xs text-gray-600">
              No industries available for this country.
            </p>
          ) : (
            <div className="flex md:flex-col gap-2">
              {data.industries.map((blk) => {
                const code = blk.industry;
                const label = INDUSTRY_LABELS[code] ?? code;
                const isActive = selectedIndustry === code;

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelectedIndustry(code)}
                    className={[
                      'rounded-md border px-3 py-1.5 text-sm text-left transition',
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {label}
                    <span className="ml-1 text-xs text-gray-400">
                      ({blk.companies.length})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        {/* RIGHT: companies + hierarchies */}
        <div className="space-y-4">
          {currentIndustryBlock == null ? (
            <Panel title="No data">
              <p className="text-sm text-gray-600">
                No industries available for this country.
              </p>
            </Panel>
          ) : (
            <>
              {/* Aggregate summary */}
              <Panel
                title={currentLabel ?? 'Industry overview'}
                subtitle={`Year ${currentIndustryBlock.aggregate.year}`}
                padding="sm"
              >
                <div className="text-xs text-gray-700 space-y-0.5">
                  <p>
                    Companies with performance:{' '}
                    <span className="font-medium">
                      {currentIndustryBlock.aggregate.numCompanies}
                    </span>
                  </p>
                  <p>
                    Total output:{' '}
                    <span className="font-mono">
                      {currentIndustryBlock.aggregate.totalOutputScore.toFixed(1)}
                    </span>
                  </p>
                  <p>
                    Avg output per company:{' '}
                    <span className="font-mono">
                      {currentIndustryBlock.aggregate.averageOutputScore != null
                        ? currentIndustryBlock.aggregate.averageOutputScore.toFixed(1)
                        : 'N/A'}
                    </span>
                  </p>
                </div>
              </Panel>

              {currentIndustryBlock.companies.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No companies in this industry for this country yet.
                </p>
              ) : (
                currentIndustryBlock.companies.map((company) => (
                  <section
                    key={company.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    {/* TOP ROW: company name + performance summary */}
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <div>
                        <h2 className="text-sm font-semibold">
                          <Link
                            href={`/company/${company.id}`}
                            className="text-blue-700 hover:underline"
                          >
                            {company.name}
                          </Link>
                        </h2>
                        <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                          {INDUSTRY_LABELS[company.industry] ?? company.industry}
                        </p>
                      </div>

                      {company.performance ? (
                        <div className="text-right text-xs text-gray-700">
                          <p className="font-semibold">
                            Output {company.performance.year}:{' '}
                            {company.performance.outputScore.toFixed(1)}
                          </p>
                          <p className="text-[11px] text-gray-600">
                            Talent {company.performance.talentScore.toFixed(1)} · Lead{' '}
                            {company.performance.leadershipScore.toFixed(1)} · Rel{' '}
                            {company.performance.reliabilityScore.toFixed(1)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-500 italic">
                          No performance computed yet for this year (run Sim 1 Year).
                        </p>
                      )}
                    </div>

                    {/* BOTTOM: hierarchy */}
                    <p className="mt-1 text-[11px] text-gray-500">
                      Hierarchy from President (rank 0) down to Worker.
                    </p>

                    <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {company.hierarchy.map((slot) => (
                        <li
                          key={slot.roleId}
                          className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
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
                                <Link
                                  href={`/person/${slot.person.id}`}
                                  className="hover:underline"
                                >
                                  {slot.person.name}
                                </Link>
                                <span className="ml-1 text-[10px] text-gray-500">
                                  ({slot.person.age})
                                </span>
                              </p>
                              <p className="mt-0.5 text-[11px] text-gray-600">
                                Int {slot.person.intelligence} · Lead {slot.person.leadership}{' '}
                                · Disc {slot.person.discipline} · Cha {slot.person.charisma}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-1 text-xs italic text-gray-400">
                              Vacant — filled by yearly sim if candidates are available.
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))
              )}

            </>
          )}
        </div>
      </section>
    </main>
  );
}
