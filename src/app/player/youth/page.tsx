// src/app/player/youth/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type EducationLevel =
  | 'Primary'
  | 'Secondary'
  | 'University'
  | 'OutOfSchool'
  | 'NotInSchool';

type YouthProspect = {
  id: number;
  name: string;
  age: number;
  potentialOverall: number;
  developmentStyle: string | null;
  peakAge: number | null;
  educationLevel: EducationLevel;
  educationLabel: string;
  prospectScore: number;
  prospectGrade: 'A' | 'B' | 'C' | 'D';

  // NEW: university admission info
  isEligibleForUniversityThisYear: boolean;
  chosenForUniversityNextYear: boolean;
  justEnrolledThisYear: boolean;
};

type PlayerYouthResponse = {
  worldId: number;
  countryId: number;
  youthMinAge: number;
  youthMaxAge: number;

  // NEW: admissions metadata
  currentYear: number;
  universitySlotsPerYear: number;
  chosenCount: number;

  prospects: YouthProspect[];
};

export default function YouthPipelinePage() {
  const [data, setData] = useState<PlayerYouthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/player/youth');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setData(null);
      setError('Failed to load youth pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When data arrives, hydrate selection from server-side choices
  useEffect(() => {
    if (!data || (data as any).error) return;
    const initial = new Set(
      data.prospects
        .filter((p) => p.chosenForUniversityNextYear)
        .map((p) => p.id),
    );
    setSelectedIds(initial);
  }, [data]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/player/youth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personIds: Array.from(selectedIds) }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Failed to save university admissions');
      } else {
        // Reload to reflect any server-side capping/validation
        await load();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save university admissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="p-4">Loading youth pipeline…</main>;
  }

  if (!data || (data as any).error) {
    return (
      <main className="p-4 space-y-3">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Youth Pipeline</h1>
          <p className="text-sm text-gray-600">
            No controlled country or youth data found.
          </p>
        </header>
        <Link href="/player" className="text-blue-600 text-sm hover:underline">
          ← Back to player overview
        </Link>
      </main>
    );
  }

  const {
    prospects,
    youthMinAge,
    youthMaxAge,
    universitySlotsPerYear,
    currentYear,
  } = data;

  const selectedCount = selectedIds.size;
  const remainingSlots =
    universitySlotsPerYear > 0
      ? Math.max(0, universitySlotsPerYear - selectedCount)
      : 0;

  return (
    <main className="p-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Youth Pipeline</h1>
        <p className="text-sm text-gray-600">
          Teenagers and young adults in your country ({youthMinAge}–{youthMaxAge}{' '}
          years), sorted by long-term potential.
        </p>

        <nav className="mt-2 flex items-center gap-3 text-sm">
          <Link
            href="/player"
            className="px-2 py-1 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100"
          >
            Overview
          </Link>
          <span className="px-2 py-1 rounded bg-blue-600 text-white">
            Youth Pipeline
          </span>
        </nav>
      </header>

      {prospects.length === 0 ? (
        <section>
          <p className="text-sm text-gray-600">
            You currently have no youth in this age range. Simulate a few more
            years to grow your talent pool.
          </p>
        </section>
      ) : (
        <section className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Prospects</h2>
              <p className="text-xs text-gray-500">
                {prospects.length} youth in pipeline
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 text-xs">
              <div className="text-gray-600">
                University admissions for next year (start {currentYear + 1}):
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {universitySlotsPerYear > 0 ? (
                  <>
                    <span>
                      Selected{' '}
                      <span className="font-semibold">
                        {selectedCount} / {universitySlotsPerYear}
                      </span>{' '}
                      eligible 18-year-olds
                    </span>
                    {remainingSlots === 0 && (
                      <span className="text-[11px] text-orange-600">
                        You&apos;ve reached your slot cap for this year.
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500">
                    No universities in your country yet.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {error && (
                  <span className="text-[11px] text-red-600">{error}</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || universitySlotsPerYear === 0}
                  className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : 'Save admissions'}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-200">
              <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
                <tr>
                  <th className="px-2 py-1 text-left border-b">Name</th>
                  <th className="px-2 py-1 text-right border-b">Age</th>
                  <th className="px-2 py-1 text-right border-b">
                    Potential OVR
                  </th>
                  <th className="px-2 py-1 text-left border-b">Education</th>
                  <th className="px-2 py-1 text-left border-b">University</th>
                  <th className="px-2 py-1 text-right border-b">
                    Prospect Grade
                  </th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => (
                  <tr
                    key={p.id}
                    className="odd:bg-white even:bg-gray-50 border-b last:border-0"
                  >
                    <td className="px-2 py-1 align-top">
                      <Link
                        href={`/person/${p.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-2 py-1 text-right align-top">
                      {p.age}
                    </td>
                    <td className="px-2 py-1 text-right align-top">
                      {p.potentialOverall}
                    </td>
                    <td className="px-2 py-1 align-top">
                      {p.educationLabel}
                    </td>
                    <td className="px-2 py-1 align-top">
                      {p.educationLevel === 'University' ? (
                        <span className="text-xs text-green-700 font-medium">
                          Enrolled
                          {p.justEnrolledThisYear && (
                            <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-green-100">
                              New this year
                            </span>
                          )}
                        </span>
                      ) : p.isEligibleForUniversityThisYear ? (
                        <label className="inline-flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            className="h-3 w-3"
                            checked={selectedIds.has(p.id)}
                            onChange={() => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                const isSelected = next.has(p.id);

                                if (isSelected) {
                                  next.delete(p.id);
                                  return next;
                                }

                                // Enforce cap client-side (server will also enforce)
                                if (
                                  universitySlotsPerYear > 0 &&
                                  next.size >= universitySlotsPerYear
                                ) {
                                  return next;
                                }

                                next.add(p.id);
                                return next;
                              });
                            }}
                          />
                          <span>Eligible this year</span>
                        </label>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-1 text-right align-top">
                      <span className="font-semibold">{p.prospectGrade}</span>{' '}
                      <span className="text-gray-500">
                        ({p.prospectScore}/100)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-gray-500">
            Prospect grade combines potential, cognitive stats, leadership, and
            personality into a single 0–100 score. Use university admissions to
            invest in your best 18-year-olds each year.
          </p>
        </section>
      )}
    </main>
  );
}
