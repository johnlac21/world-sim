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
};

type PlayerYouthResponse = {
  worldId: number;
  countryId: number;
  youthMinAge: number;
  youthMaxAge: number;
  prospects: YouthProspect[];
};

export default function YouthPipelinePage() {
  const [data, setData] = useState<PlayerYouthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/player/youth');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const { prospects, youthMinAge, youthMaxAge } = data;

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
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Prospects</h2>
            <p className="text-xs text-gray-500">
              {prospects.length} youth in pipeline
            </p>
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
            personality into a single 0–100 score.
          </p>
        </section>
      )}
    </main>
  );
}
