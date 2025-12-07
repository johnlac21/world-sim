'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PersonSearchFitBadge = 'EXEC' | 'MANAGER' | 'WORKER';

type PersonSearchRow = {
  id: number;
  name: string;
  age: number;
  countryId: number | null;
  countryName: string | null;
  currentCompanyName: string | null;
  currentCompanyIndustry: string | null;
  employmentStatus: 'EMPLOYED' | 'UNEMPLOYED' | 'STUDENT' | 'OTHER';
  intelligence: number;
  leadership: number;
  charisma: number;
  potentialOverall: number;
  prestige: number;
  execFit: number;
  managerFit: number;
  workerFit: number;
  primaryBadge: PersonSearchFitBadge;
};

type PeopleSearchResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  results: PersonSearchRow[];
};

export type TalentSearchModalProps = {
  worldId: number;
  defaultCountryId?: number;
  defaultIndustry?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectPerson?: (person: PersonSearchRow) => void;
  selectLabel?: string;
};

const EMPLOYMENT_OPTIONS = [
  { value: 'ANY', label: 'Any' },
  { value: 'EMPLOYED', label: 'Employed' },
  { value: 'UNEMPLOYED', label: 'Unemployed' },
  { value: 'STUDENT', label: 'Students (University)' },
];

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Any industry' },
  { value: 'TECH', label: 'TECH' },
  { value: 'FINANCE', label: 'FINANCE' },
  { value: 'RESEARCH', label: 'RESEARCH' },
];

export function TalentSearchModal({
  worldId,
  defaultCountryId,
  defaultIndustry,
  isOpen,
  onClose,
  onSelectPerson,
  selectLabel = 'Select',
}: TalentSearchModalProps) {
  const [countryId, setCountryId] = useState<number | ''>(
    defaultCountryId ?? '',
  );
  const [minAge, setMinAge] = useState<string>('20');
  const [maxAge, setMaxAge] = useState<string>('60');
  const [employmentStatus, setEmploymentStatus] = useState<string>('ANY');
  const [minIntel, setMinIntel] = useState<string>('50');
  const [minLead, setMinLead] = useState<string>('50');
  const [industry, setIndustry] = useState<string>(defaultIndustry ?? '');

  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<PeopleSearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset filters when opening
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setError(null);
    }
  }, [isOpen]);

  const fetchPage = async (nextPage: number) => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('worldId', String(worldId));
      params.set('page', String(nextPage));
      params.set('pageSize', '25');

      if (countryId !== '') params.set('countryId', String(countryId));
      if (minAge.trim() !== '') params.set('minAge', minAge.trim());
      if (maxAge.trim() !== '') params.set('maxAge', maxAge.trim());
      if (employmentStatus !== 'ANY')
        params.set('employmentStatus', employmentStatus);

      if (minIntel.trim() !== '') {
        params.set('minIntelligence', minIntel.trim());
      }
      if (minLead.trim() !== '') {
        params.set('minLeadership', minLead.trim());
      }
      if (industry && industry !== '') {
        params.set('industry', industry);
      }

      const res = await fetch(`/api/people/search?${params.toString()}`);
      const json = (await res.json()) as PeopleSearchResponse & {
        error?: string;
      };

      if (!res.ok || (json as any).error) {
        throw new Error((json as any).error || 'Failed to load people');
      }

      setData(json);
      setPage(nextPage);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  const runSearch = () => fetchPage(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Talent Search</h3>
            <p className="text-xs text-gray-500">
              Filter and scout people by age, stats, and industry experience.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Filters */}
          <aside className="w-64 border-r p-3 space-y-3 bg-gray-50">
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                value={countryId === '' ? '' : String(countryId)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') setCountryId('');
                  else setCountryId(Number(v) || '');
                }}
              >
                <option value="">All countries</option>
                {defaultCountryId && (
                  <option value={defaultCountryId}>Controlled country</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-gray-700">
                Age range
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  className="w-1/2 rounded border border-gray-300 px-1 py-0.5 text-xs"
                  placeholder="Min"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                />
                <input
                  type="number"
                  className="w-1/2 rounded border border-gray-300 px-1 py-0.5 text-xs"
                  placeholder="Max"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                Employment
              </label>
              <select
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
              >
                {EMPLOYMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-gray-700">
                Min Intelligence / Leadership
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  className="w-1/2 rounded border border-gray-300 px-1 py-0.5 text-xs"
                  placeholder="Int"
                  value={minIntel}
                  onChange={(e) => setMinIntel(e.target.value)}
                />
                <input
                  type="number"
                  className="w-1/2 rounded border border-gray-300 px-1 py-0.5 text-xs"
                  placeholder="Lead"
                  value={minLead}
                  onChange={(e) => setMinLead(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                Industry experience
              </label>
              <select
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="mt-2 w-full rounded bg-blue-600 text-white text-xs font-medium py-1.5 hover:bg-blue-700 disabled:opacity-60"
              onClick={runSearch}
              disabled={loading}
            >
              {loading ? 'Searching…' : 'Search'}
            </button>

            {error && (
              <p className="mt-2 text-[11px] text-red-600">{error}</p>
            )}
          </aside>

          {/* Results */}
          <section className="flex-1 p-3 flex flex-col overflow-hidden">
            {loading && !data && (
              <p className="text-sm text-gray-600">Loading people…</p>
            )}

            {!loading && data && data.results.length === 0 && (
              <p className="text-sm text-gray-600">
                No people matched your filters.
              </p>
            )}

            {data && data.results.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-2 text-xs text-gray-600">
                  <span>
                    {data.total} results · Page {data.page} of{' '}
                    {data.totalPages}
                  </span>
                  <div className="space-x-1">
                    <button
                      className="px-2 py-1 border rounded text-[11px] bg-white hover:bg-gray-50 disabled:opacity-50"
                      disabled={page <= 1 || loading}
                      onClick={() => fetchPage(page - 1)}
                    >
                      Prev
                    </button>
                    <button
                      className="px-2 py-1 border rounded text-[11px] bg-white hover:bg-gray-50 disabled:opacity-50"
                      disabled={page >= data.totalPages || loading}
                      onClick={() => fetchPage(page + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto border rounded">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left">Country</th>
                        <th className="px-2 py-1 text-left">Current</th>
                        <th className="px-2 py-1 text-right">INT</th>
                        <th className="px-2 py-1 text-right">LEAD</th>
                        <th className="px-2 py-1 text-right">CHAR</th>
                        <th className="px-2 py-1 text-right">POT</th>
                        <th className="px-2 py-1 text-right">Fit</th>
                        {onSelectPerson && (
                          <th className="px-2 py-1 text-right">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.results.map((p) => (
                        <tr
                          key={p.id}
                          className="odd:bg-white even:bg-gray-50 border-b last:border-0"
                        >
                          <td className="px-2 py-1">
                            <Link
                              href={`/person/${p.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {p.name}
                            </Link>
                            <span className="ml-1 text-[10px] text-gray-500">
                              ({p.age})
                            </span>
                          </td>
                          <td className="px-2 py-1 text-gray-700">
                            {p.countryName ?? '—'}
                          </td>
                          <td className="px-2 py-1">
                            {p.currentCompanyName ? (
                              <span className="text-gray-700">
                                {p.currentCompanyName}
                                {p.currentCompanyIndustry && (
                                  <span className="ml-1 text-[10px] text-gray-500">
                                    ({p.currentCompanyIndustry})
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                {p.employmentStatus === 'STUDENT'
                                  ? 'Student'
                                  : 'Unemployed'}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1 text-right font-mono">
                            {p.intelligence}
                          </td>
                          <td className="px-2 py-1 text-right font-mono">
                            {p.leadership}
                          </td>
                          <td className="px-2 py-1 text-right font-mono">
                            {p.charisma}
                          </td>
                          <td className="px-2 py-1 text-right font-mono">
                            {p.potentialOverall}
                          </td>
                          <td className="px-2 py-1 text-right">
                            <span
                              className={
                                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ' +
                                (p.primaryBadge === 'EXEC'
                                  ? 'bg-purple-100 text-purple-700'
                                  : p.primaryBadge === 'MANAGER'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700')
                              }
                            >
                              {p.primaryBadge}
                            </span>
                          </td>
                          {onSelectPerson && (
                            <td className="px-2 py-1 text-right">
                              <button
                                className="px-2 py-1 border rounded text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700"
                                onClick={() => onSelectPerson(p)}
                              >
                                {selectLabel}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
